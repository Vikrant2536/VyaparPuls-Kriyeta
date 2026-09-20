from datetime import date, datetime, timedelta
import urllib.parse
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from backend.app.models import Customer, Transaction, PaymentAllocation, Reminder
from backend.app.schemas import (
    CustomerOut, TransactionOut, LedgerOut, DashboardSummary, 
    TodayInsight, CashFlowItem, CashFlowResponse, ReminderResponse
)
from backend.app.config import settings

def format_inr(number: float) -> str:
    """Format number in Indian numbering system e.g. 1,24,500."""
    n = int(round(number))
    s = str(abs(n))
    if len(s) <= 3:
        formatted = s
    else:
        last3 = s[-3:]
        rest = s[:-3]
        groups = []
        while len(rest) > 2:
            groups.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            groups.insert(0, rest)
        formatted = ",".join(groups) + "," + last3
    
    prefix = "-₹" if n < 0 else "₹"
    return f"{prefix}{formatted}"

def compute_transaction_status(txn: Transaction, today: Optional[date] = None) -> str:
    """Derive status: paid, overdue, due_soon, or open."""
    if today is None:
        today = date.today()

    if txn.type == "payment":
        return "paid"

    if txn.amount_settled >= (txn.amount - 0.01):
        return "paid"

    if txn.due_date is not None:
        if today > txn.due_date:
            return "overdue"
        elif today <= txn.due_date <= (today + timedelta(days=2)):
            return "due_soon"
        else:
            return "open"
    return "open"

def calculate_reliability_score(db: Session, customer_id: int) -> Tuple[int, str]:
    """
    Calculate customer reliability score (0-100) and tier based on repayment history.
    - Full on-time payments boost score
    - Overdue balances and delays reduce score
    """
    today = date.today()
    sales = db.query(Transaction).filter(
        Transaction.customer_id == customer_id,
        Transaction.type == "credit_sale"
    ).all()

    if not sales:
        return 85, "High"  # New customer with clean slate

    total_sales = len(sales)
    paid_sales = sum(1 for s in sales if s.amount_settled >= (s.amount - 0.01))
    overdue_sales = sum(1 for s in sales if s.amount_settled < s.amount and s.due_date and s.due_date < today)
    
    # Base score
    score = 70.0
    
    # Settlement ratio bonus (up to +25)
    settlement_ratio = paid_sales / total_sales
    score += (settlement_ratio * 25.0)

    # Overdue penalty (up to -40)
    overdue_ratio = overdue_sales / total_sales
    score -= (overdue_ratio * 40.0)

    final_score = int(max(10, min(99, round(score))))
    if final_score >= 80:
        tier = "High"
    elif final_score >= 50:
        tier = "Medium"
    else:
        tier = "At Risk"

    return final_score, tier

def get_customer_summary(db: Session, customer: Customer) -> CustomerOut:
    """Calculate running balance, overdue amount, and status for a customer."""
    today = date.today()
    txns = db.query(Transaction).filter(Transaction.customer_id == customer.id).all()

    # Outstanding balance is the sum of unsettled credit sales
    balance = sum(max(0.0, t.amount - t.amount_settled) for t in txns if t.type == "credit_sale")


    overdue_amount = 0.0
    due_soon_amount = 0.0
    has_overdue = False
    has_due_soon = False

    last_txn_date = None
    for t in txns:
        if last_txn_date is None or (t.txn_date and t.txn_date > last_txn_date):
            last_txn_date = t.txn_date

        if t.type == "credit_sale" and t.amount_settled < t.amount:
            remaining = t.amount - t.amount_settled
            if t.due_date:
                if today > t.due_date:
                    overdue_amount += remaining
                    has_overdue = True
                elif today <= t.due_date <= (today + timedelta(days=2)):
                    due_soon_amount += remaining
                    has_due_soon = True

    if balance <= 0.01:
        status = "paid"
    elif has_overdue:
        status = "overdue"
    elif has_due_soon:
        status = "due_soon"
    else:
        status = "open"

    rel_score, rel_tier = calculate_reliability_score(db, customer.id)

    return CustomerOut(
        id=customer.id,
        name=customer.name,
        phone=customer.phone,
        balance=round(balance, 2),
        overdue_amount=round(overdue_amount, 2),
        due_soon_amount=round(due_soon_amount, 2),
        status=status,
        reliability_score=rel_score,
        reliability_tier=rel_tier,
        last_txn_date=last_txn_date,
        created_at=customer.created_at
    )

def allocate_payment_fifo(db: Session, customer_id: int, payment_amount: float, payment_txn_id: int) -> List[PaymentAllocation]:
    """
    Allocate payment amount FIFO against customer's oldest open credit sales.
    Updates amount_settled and status for each affected transaction.
    """
    today = date.today()
    remaining_payment = payment_amount

    # Fetch open credit sales in chronological order
    open_sales = db.query(Transaction).filter(
        Transaction.customer_id == customer_id,
        Transaction.type == "credit_sale",
        Transaction.amount_settled < Transaction.amount
    ).order_by(Transaction.txn_date.asc(), Transaction.id.asc()).all()

    allocations = []

    for sale in open_sales:
        if remaining_payment <= 0.001:
            break

        remaining_on_sale = sale.amount - sale.amount_settled
        allocated = min(remaining_payment, remaining_on_sale)

        sale.amount_settled += allocated
        sale.status = compute_transaction_status(sale, today)

        allocation = PaymentAllocation(
            payment_id=payment_txn_id,
            sale_id=sale.id,
            allocated_amount=round(allocated, 2)
        )
        db.add(allocation)
        allocations.append(allocation)

        remaining_payment -= allocated

    db.commit()
    return allocations

def get_customer_ledger(db: Session, customer_id: int) -> LedgerOut:
    """Retrieve per-customer timeline and running balance."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise ValueError(f"Customer with id {customer_id} not found")

    customer_summary = get_customer_summary(db, customer)

    txns = db.query(Transaction).filter(
        Transaction.customer_id == customer_id
    ).order_by(Transaction.txn_date.desc(), Transaction.id.desc()).all()

    today = date.today()
    timeline = []
    for t in txns:
        remaining = max(0.0, t.amount - t.amount_settled) if t.type == "credit_sale" else 0.0
        status = compute_transaction_status(t, today)
        timeline.append(TransactionOut(
            id=t.id,
            customer_id=t.customer_id,
            customer_name=customer.name,
            type=t.type,
            amount=t.amount,
            items_note=t.items_note,
            credit_days=t.credit_days,
            txn_date=t.txn_date,
            due_date=t.due_date,
            amount_settled=t.amount_settled,
            remaining_amount=round(remaining, 2),
            status=status,
            created_at=t.created_at
        ))

    return LedgerOut(
        customer=customer_summary,
        running_balance=customer_summary.balance,
        timeline=timeline
    )

def get_cashflow_forecast(db: Session, days: int = 7) -> CashFlowResponse:
    """
    Project expected cash inflow for the next N days based on credit sale due dates.
    """
    today = date.today()
    day_map: Dict[str, Dict[str, Any]] = {}

    for i in range(days):
        target_date = today + timedelta(days=i)
        date_str = target_date.isoformat()
        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        day_name = "Today" if i == 0 else ("Tomorrow" if i == 1 else day_names[target_date.weekday()])
        
        day_map[date_str] = {
            "date": date_str,
            "day_name": day_name,
            "expected_inflow": 0.0,
            "customer_count": 0,
            "customers_set": set()
        }

    # Query all credit sales due in this window that are not fully settled
    end_date = today + timedelta(days=days - 1)
    sales = db.query(Transaction, Customer.name).join(
        Customer, Transaction.customer_id == Customer.id
    ).filter(
        Transaction.type == "credit_sale",
        Transaction.amount_settled < Transaction.amount,
        Transaction.due_date >= today,
        Transaction.due_date <= end_date
    ).all()

    total_expected = 0.0
    for txn, cust_name in sales:
        date_key = txn.due_date.isoformat()
        if date_key in day_map:
            remaining = txn.amount - txn.amount_settled
            day_map[date_key]["expected_inflow"] += remaining
            day_map[date_key]["customers_set"].add(cust_name)
            total_expected += remaining

    items = []
    for date_str, data in day_map.items():
        items.append(CashFlowItem(
            date=data["date"],
            day_name=data["day_name"],
            expected_inflow=round(data["expected_inflow"], 2),
            customer_count=len(data["customers_set"]),
            customer_names=sorted(list(data["customers_set"]))
        ))

    insight = f"{format_inr(total_expected)} expected in the next {days} days from {sum(item.customer_count for item in items)} scheduled payments."

    return CashFlowResponse(
        days=days,
        total_expected=round(total_expected, 2),
        items=items,
        insight=insight
    )

def get_dashboard_summary(db: Session) -> DashboardSummary:
    """Calculate core KPIs and actionable insights."""
    today = date.today()
    customers = db.query(Customer).all()
    
    total_receivable = 0.0
    overdue_amount = 0.0
    overdue_customers = []
    active_customers_count = 0

    for cust in customers:
        cust_summary = get_customer_summary(db, cust)
        if cust_summary.balance > 0.01:
            active_customers_count += 1
            total_receivable += cust_summary.balance
            if cust_summary.overdue_amount > 0.01:
                overdue_amount += cust_summary.overdue_amount
                overdue_customers.append((cust, cust_summary))

    # Calculate 7-day expected inflow
    cashflow_7 = get_cashflow_forecast(db, days=7)
    due_this_week = cashflow_7.total_expected

    # Determine priority customer to contact
    priority_customer_id = None
    priority_customer_name = None
    priority_customer_phone = None
    priority_amount = None
    wa_link = None
    action_text = "All accounts in good standing."

    if overdue_customers:
        # Sort by overdue amount descending
        overdue_customers.sort(key=lambda item: item[1].overdue_amount, reverse=True)
        top_cust, top_summary = overdue_customers[0]
        priority_customer_id = top_cust.id
        priority_customer_name = top_cust.name
        priority_customer_phone = top_cust.phone
        priority_amount = top_summary.overdue_amount
        
        msg, wa_url = generate_reminder_payload(top_cust, top_summary.overdue_amount)
        wa_link = wa_url
        action_text = f"Call {top_cust.name} first ({format_inr(top_summary.overdue_amount)} overdue)."
    elif due_this_week > 0:
        action_text = "Expect scheduled collections this week."

    headline = f"{format_inr(due_this_week)} expected in next 7 days; {format_inr(overdue_amount)} overdue from {len(overdue_customers)} customers."

    today_insight = TodayInsight(
        headline=headline,
        action_text=action_text,
        priority_customer_id=priority_customer_id,
        priority_customer_name=priority_customer_name,
        priority_customer_phone=priority_customer_phone,
        priority_amount=priority_amount,
        wa_link=wa_link
    )

    return DashboardSummary(
        total_receivable=round(total_receivable, 2),
        due_this_week=round(due_this_week, 2),
        overdue_amount=round(overdue_amount, 2),
        overdue_customers_count=len(overdue_customers),
        active_customers_count=active_customers_count,
        today_insight=today_insight
    )

def generate_reminder_payload(customer: Customer, amount: float, due_date: Optional[date] = None) -> Tuple[str, str]:
    """Generate professional Hinglish WhatsApp reminder message and wa.me link."""
    date_str = due_date.strftime("%d %b %Y") if due_date else "turant (immediate)"
    store = settings.STORE_NAME
    upi = settings.STORE_UPI_ID
    amt_str = format_inr(amount)

    message = (
        f"Namaste {customer.name} ji, 🙏\n\n"
        f"Yeh {store} se vinamra anurodh hai. "
        f"Aapka kul {amt_str} ka udhaar baaki hai (Due: {date_str}).\n\n"
        f"Kripya suvidhanusar dukan par aakar ya neeche diye gaye UPI par payment kar dein:\n"
        f"UPI ID: {upi}\n\n"
        f"Shubhkaamnayein, {store}"
    )

    clean_phone = "".join(ch for ch in customer.phone if ch.isdigit())
    if len(clean_phone) == 10:
        clean_phone = "91" + clean_phone
    
    encoded_text = urllib.parse.quote(message)
    wa_link = f"https://wa.me/{clean_phone}?text={encoded_text}"
    return message, wa_link
