import random
from datetime import date, timedelta, datetime
from backend.app.database import SessionLocal, engine, Base
from backend.app.models import Customer, Transaction, PaymentAllocation, Reminder
from backend.app.services import allocate_payment_fifo, compute_transaction_status

INDIAN_CUSTOMERS = [
    ("Sharma Ji (Ramesh)", "+91 98231 44521"),
    ("Verma Ji (Anand)", "+91 98192 33412"),
    ("Gupta Ji (Suresh)", "+91 98334 55623"),
    ("Priya Mehta", "+91 98721 66712"),
    ("Rajesh Tiwari", "+91 98912 77834"),
    ("Santosh Yadav (Dairy)", "+91 98201 88945"),
    ("Balwinder Singh", "+91 98111 99056"),
    ("Nilesh Patel", "+91 98322 11267"),
    ("Amitabh Joshi", "+91 98450 22378"),
    ("Manoj Choudhary", "+91 98671 33489"),
    ("Sunita Agarwal", "+91 98902 44590"),
    ("Vikas Malhotra", "+91 98765 55601"),
    ("Deepak Chauhan", "+91 98213 66712"),
    ("Pooja Bhatia", "+91 98334 77823"),
    ("Harish Rawat", "+91 98455 88934"),
    ("Sunil Kothari", "+91 98676 99045"),
    ("Kavita Saxena", "+91 98987 11256"),
    ("Arun Mishra", "+91 98228 22367"),
    ("Dinesh Singhania", "+91 98199 33478"),
    ("Geeta Pandey", "+91 98310 44589"),
    ("Pankaj Deshmukh", "+91 98421 55690"),
    ("Rohit Bansal", "+91 98632 66701"),
    ("Anita Nair", "+91 98943 77812"),
    ("Vijay Aggarwal", "+91 98254 88923"),
    ("Karan Sethi", "+91 98165 99034"),
    ("Meenakshi Jain", "+91 98376 11245"),
    ("Sanjay Soni", "+91 98487 22356"),
    ("Ritu Mathur", "+91 98698 33467"),
    ("Alok Dubey", "+91 98909 44578"),
    ("Neeraj Srivastava", "+91 98210 55689"),
    ("Prakash Pillai", "+91 98321 66790"),
    ("Shweta Reddy", "+91 98432 77801"),
    ("Ashok Somani", "+91 98643 88912"),
    ("Bhavna Shah", "+91 98954 99023"),
    ("Gopal Hegde", "+91 98265 11234"),
    ("Kailash Mittal", "+91 98176 22345"),
    ("Rekha Goswami", "+91 98387 33456"),
    ("Mahesh Lodha", "+91 98498 44567"),
    ("Anurag Kashyap", "+91 98609 55678"),
    ("Kishore Lal (Chaiwala)", "+91 98910 66789")
]

ITEMS_LIST = [
    "Atta 10kg & Basmati Rice",
    "Mustard Oil 5L & Sugar 2kg",
    "Spices, Dal & Ghee",
    "Daily Dairy & Tea Packets",
    "Cleaning Supplies & Soaps",
    "Dry Fruits & Snacks",
    "Toothpaste & Shampoos",
    "Refined Oil & Poha",
    "General Monthly Ration",
    "Besan, Maida & Suji"
]

def seed_database():
    print("Dropping existing tables and recreating schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    today = date.today()
    random.seed(42)  # Deterministic seed for reproducible testing

    print(f"Creating {len(INDIAN_CUSTOMERS)} customers...")
    created_customers = []
    for name, phone in INDIAN_CUSTOMERS:
        days_ago = random.randint(30, 90)
        c = Customer(
            name=name,
            phone=phone,
            created_at=datetime.utcnow() - timedelta(days=days_ago)
        )
        db.add(c)
        created_customers.append(c)

    db.commit()
    for c in created_customers:
        db.refresh(c)

    print("Generating ~250 realistic transactions...")
    total_txns = 0

    # Ensure Verma Ji has a high overdue balance so the insight prompt matches ("call Verma ji first")
    verma = next(c for c in created_customers if "Verma" in c.name)
    sharma = next(c for c in created_customers if "Sharma" in c.name)

    # Specific overdue setup for Verma Ji
    v_sale1 = Transaction(
        customer_id=verma.id,
        type="credit_sale",
        amount=14000.0,
        items_note="Monthly Ration & Dry Fruits",
        credit_days=10,
        txn_date=today - timedelta(days=25),
        due_date=today - timedelta(days=15),
        amount_settled=0.0,
        status="overdue"
    )
    v_sale2 = Transaction(
        customer_id=verma.id,
        type="credit_sale",
        amount=10000.0,
        items_note="Cooking Oil Cans & Basmati",
        credit_days=7,
        txn_date=today - timedelta(days=18),
        due_date=today - timedelta(days=11),
        amount_settled=0.0,
        status="overdue"
    )
    db.add(v_sale1)
    db.add(v_sale2)
    total_txns += 2

    # Sharma Ji has an active open credit bill and historical paid bills
    s_past_sale = Transaction(
        customer_id=sharma.id,
        type="credit_sale",
        amount=3200.0,
        items_note="Atta, Sugar, Dal",
        credit_days=7,
        txn_date=today - timedelta(days=30),
        due_date=today - timedelta(days=23),
        amount_settled=3200.0,
        status="paid"
    )
    s_past_payment = Transaction(
        customer_id=sharma.id,
        type="payment",
        amount=3200.0,
        items_note="UPI Payment",
        credit_days=0,
        txn_date=today - timedelta(days=22),
        due_date=None,
        amount_settled=3200.0,
        status="paid"
    )
    db.add(s_past_sale)
    db.add(s_past_payment)
    db.commit()
    db.refresh(s_past_sale)
    db.refresh(s_past_payment)
    db.add(PaymentAllocation(payment_id=s_past_payment.id, sale_id=s_past_sale.id, allocated_amount=3200.0))
    total_txns += 2

    # Distribute ~245 more transactions across other customers
    for customer in created_customers:
        # 5 to 7 transactions per customer
        num_sales = random.randint(4, 7)
        for _ in range(num_sales):
            # Decide if past (settled), overdue, or upcoming due (next 7 days)
            scenario = random.choices(
                ["settled", "overdue", "due_soon_or_next_week", "cash_sale"], 
                weights=[0.50, 0.18, 0.22, 0.10]
            )[0]

            amount = float(random.choice([450, 800, 1200, 1650, 2400, 3100, 4500, 5200, 6800, 8500]))
            credit_days = random.choice([5, 7, 10, 14, 21])
            items = random.choice(ITEMS_LIST)

            if scenario == "settled":
                txn_days_ago = random.randint(15, 50)
                txn_date = today - timedelta(days=txn_days_ago)
                due_date = txn_date + timedelta(days=credit_days)
                
                sale = Transaction(
                    customer_id=customer.id,
                    type="credit_sale",
                    amount=amount,
                    items_note=items,
                    credit_days=credit_days,
                    txn_date=txn_date,
                    due_date=due_date,
                    amount_settled=amount,
                    status="paid"
                )
                db.add(sale)
                db.commit()
                db.refresh(sale)
                
                pay_date = due_date - timedelta(days=random.randint(0, 2))
                payment = Transaction(
                    customer_id=customer.id,
                    type="payment",
                    amount=amount,
                    items_note="Cash/UPI settlement",
                    credit_days=0,
                    txn_date=pay_date,
                    due_date=None,
                    amount_settled=amount,
                    status="paid"
                )
                db.add(payment)
                db.commit()
                db.refresh(payment)

                db.add(PaymentAllocation(payment_id=payment.id, sale_id=sale.id, allocated_amount=amount))
                total_txns += 2

            elif scenario == "overdue":
                txn_days_ago = random.randint(10, 30)
                txn_date = today - timedelta(days=txn_days_ago)
                due_date = today - timedelta(days=random.randint(1, 10))
                
                partial_paid = 0.0
                if random.random() < 0.3:
                    partial_paid = round(amount * 0.4, 2)

                sale = Transaction(
                    customer_id=customer.id,
                    type="credit_sale",
                    amount=amount,
                    items_note=items,
                    credit_days=credit_days,
                    txn_date=txn_date,
                    due_date=due_date,
                    amount_settled=partial_paid,
                    status="overdue"
                )
                db.add(sale)
                total_txns += 1

            elif scenario == "due_soon_or_next_week":
                # Due between today and today + 7 days
                due_in = random.randint(0, 7)
                due_date = today + timedelta(days=due_in)
                txn_date = due_date - timedelta(days=credit_days)
                status = "due_soon" if due_in <= 2 else "open"

                sale = Transaction(
                    customer_id=customer.id,
                    type="credit_sale",
                    amount=amount,
                    items_note=items,
                    credit_days=credit_days,
                    txn_date=txn_date,
                    due_date=due_date,
                    amount_settled=0.0,
                    status=status
                )
                db.add(sale)
                total_txns += 1

    db.commit()
    print(f"Seeding complete! Successfully created {len(created_customers)} customers and {total_txns} transactions.")
    db.close()

if __name__ == "__main__":
    seed_database()
