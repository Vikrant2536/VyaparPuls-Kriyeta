import os
from datetime import date, datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.app.database import get_db, Base, engine
from backend.app.models import Customer, Transaction, Reminder
from backend.app.schemas import (
    ParseRequest, ParseResult, TransactionCreate, PaymentCreate,
    CustomerOut, CustomerUpdate, TransactionOut, LedgerOut, DashboardSummary,
    CashFlowResponse, ReminderRequest, ReminderResponse
)
from backend.app.parser import parse_hinglish_entry
from backend.app.services import (
    allocate_payment_fifo, compute_transaction_status, get_customer_summary,
    get_customer_ledger, get_dashboard_summary, get_cashflow_forecast,
    generate_reminder_payload
)
from backend.app.seed import seed_database

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VyaparPulse API",
    description="Smart Supermarket Ledger API for HACK IT BROS '26",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

@app.post("/api/seed")
def trigger_seed():
    """Reset and seed the database with realistic demo data."""
    seed_database()
    return {"message": "Database successfully seeded with ~40 customers and ~250 transactions."}

@app.post("/api/transactions/parse", response_model=ParseResult)
def parse_transaction(payload: ParseRequest, db: Session = Depends(get_db)):
    """
    Parse Hinglish voice or text entry into structured transaction fields.
    Does NOT save to database. Performs sub-millisecond fuzzy customer matching.
    """
    customers = db.query(Customer.id, Customer.name, Customer.phone).all()
    customer_list = [{"id": c.id, "name": c.name, "phone": c.phone} for c in customers]
    
    parsed = parse_hinglish_entry(payload.text, existing_customers=customer_list)
    return ParseResult(**parsed)

@app.post("/api/transactions", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    """
    Save a confirmed transaction entry. If customer doesn't exist, create customer with mobile number.
    If it's a payment, automatically triggers FIFO allocation.
    """
    customer_id = payload.customer_id
    txn_date = payload.txn_date or date.today()

    # Find or create customer
    if customer_id:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        if payload.customer_phone and payload.customer_phone.strip():
            customer.phone = payload.customer_phone.strip()
            db.commit()
    else:
        # Check if customer already exists by exact or clean name
        clean_name = payload.customer_name.strip()
        customer = db.query(Customer).filter(Customer.name.ilike(f"%{clean_name}%")).first()
        if not customer:
            phone = payload.customer_phone.strip() if (payload.customer_phone and payload.customer_phone.strip()) else "+91 98000 00000"
            customer = Customer(name=clean_name, phone=phone)
            db.add(customer)
            db.commit()
            db.refresh(customer)
        else:
            if payload.customer_phone and payload.customer_phone.strip():
                customer.phone = payload.customer_phone.strip()
                db.commit()
        customer_id = customer.id

    if payload.type == "credit_sale":
        due_date = txn_date + timedelta(days=payload.credit_days)
        new_txn = Transaction(
            customer_id=customer_id,
            type="credit_sale",
            amount=payload.amount,
            items_note=payload.items_note,
            credit_days=payload.credit_days,
            txn_date=txn_date,
            due_date=due_date,
            amount_settled=0.0,
            status=compute_transaction_status(Transaction(
                type="credit_sale",
                amount=payload.amount,
                amount_settled=0.0,
                due_date=due_date
            ), today=txn_date)
        )
        db.add(new_txn)
        db.commit()
        db.refresh(new_txn)

        remaining = new_txn.amount - new_txn.amount_settled
        return TransactionOut(
            id=new_txn.id,
            customer_id=customer.id,
            customer_name=customer.name,
            type=new_txn.type,
            amount=new_txn.amount,
            items_note=new_txn.items_note,
            credit_days=new_txn.credit_days,
            txn_date=new_txn.txn_date,
            due_date=new_txn.due_date,
            amount_settled=new_txn.amount_settled,
            remaining_amount=remaining,
            status=new_txn.status,
            created_at=new_txn.created_at
        )

    elif payload.type == "payment":
        # Create payment record
        payment_txn = Transaction(
            customer_id=customer_id,
            type="payment",
            amount=payload.amount,
            items_note=payload.items_note or "Payment Received",
            credit_days=0,
            txn_date=txn_date,
            due_date=None,
            amount_settled=payload.amount,
            status="paid"
        )
        db.add(payment_txn)
        db.commit()
        db.refresh(payment_txn)

        # Allocate FIFO against open credit sales
        allocate_payment_fifo(db, customer_id, payload.amount, payment_txn.id)

        return TransactionOut(
            id=payment_txn.id,
            customer_id=customer.id,
            customer_name=customer.name,
            type=payment_txn.type,
            amount=payment_txn.amount,
            items_note=payment_txn.items_note,
            credit_days=0,
            txn_date=payment_txn.txn_date,
            due_date=None,
            amount_settled=payment_txn.amount,
            remaining_amount=0.0,
            status="paid",
            created_at=payment_txn.created_at
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid transaction type")

@app.post("/api/payments", response_model=TransactionOut)
def record_payment(payload: PaymentCreate, db: Session = Depends(get_db)):
    """Record a payment and allocate FIFO against oldest open bills."""
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    txn_date = payload.txn_date or date.today()
    payment_txn = Transaction(
        customer_id=payload.customer_id,
        type="payment",
        amount=payload.amount,
        items_note=payload.payment_note or "Payment Received",
        credit_days=0,
        txn_date=txn_date,
        due_date=None,
        amount_settled=payload.amount,
        status="paid"
    )
    db.add(payment_txn)
    db.commit()
    db.refresh(payment_txn)

    allocate_payment_fifo(db, payload.customer_id, payload.amount, payment_txn.id)

    return TransactionOut(
        id=payment_txn.id,
        customer_id=customer.id,
        customer_name=customer.name,
        type=payment_txn.type,
        amount=payment_txn.amount,
        items_note=payment_txn.items_note,
        credit_days=0,
        txn_date=payment_txn.txn_date,
        due_date=None,
        amount_settled=payment_txn.amount,
        remaining_amount=0.0,
        status="paid",
        created_at=payment_txn.created_at
    )

@app.get("/api/customers", response_model=List[CustomerOut])
def list_customers(q: Optional[str] = None, db: Session = Depends(get_db)):
    """List all customers with balance, status, and reliability score."""
    query = db.query(Customer)
    if q:
        query = query.filter(Customer.name.ilike(f"%{q}%"))
    
    customers = query.order_by(Customer.name.asc()).all()
    results = [get_customer_summary(db, c) for c in customers]
    return results

@app.get("/api/customers/{customer_id}/ledger", response_model=LedgerOut)
def get_ledger(customer_id: int, db: Session = Depends(get_db)):
    """Get per-customer running balance and chronological timeline."""
    try:
        return get_customer_ledger(db, customer_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.patch("/api/customers/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: int, payload: CustomerUpdate, db: Session = Depends(get_db)):
    """Update customer details such as mobile number or name."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if payload.name is not None and payload.name.strip():
        customer.name = payload.name.strip()
    if payload.phone is not None and payload.phone.strip():
        customer.phone = payload.phone.strip()
    db.commit()
    db.refresh(customer)
    return get_customer_summary(db, customer)

@app.get("/api/dashboard/summary", response_model=DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db)):
    """Get total receivables, due this week, overdue amounts, and today's insight."""
    return get_dashboard_summary(db)

@app.get("/api/insights/cashflow", response_model=CashFlowResponse)
def cashflow_insights(days: int = Query(default=7, ge=1, le=30), db: Session = Depends(get_db)):
    """Get daily expected cash inflow forecast for next N days."""
    return get_cashflow_forecast(db, days=days)

@app.post("/api/reminders/generate", response_model=ReminderResponse)
def generate_reminder(payload: ReminderRequest, db: Session = Depends(get_db)):
    """Generate professional WhatsApp reminder message and 1-click wa.me link."""
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    cust_summary = get_customer_summary(db, customer)
    amount_to_remind = cust_summary.balance

    target_due_date = None
    if payload.transaction_id:
        txn = db.query(Transaction).filter(Transaction.id == payload.transaction_id).first()
        if txn:
            target_due_date = txn.due_date

    message, wa_link = generate_reminder_payload(customer, amount_to_remind, target_due_date)

    # Save to reminders table
    rem = Reminder(
        customer_id=customer.id,
        transaction_id=payload.transaction_id,
        message=message,
        channel="whatsapp"
    )
    db.add(rem)
    db.commit()

    return ReminderResponse(
        customer_id=customer.id,
        customer_name=customer.name,
        phone=customer.phone,
        message=message,
        wa_link=wa_link
    )
