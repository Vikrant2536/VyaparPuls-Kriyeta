from datetime import date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database import Base
from backend.app.models import Customer, Transaction, PaymentAllocation
from backend.app.services import allocate_payment_fifo, get_customer_summary

TEST_ENGINE = create_engine("sqlite:///:memory:")
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)

def setup_test_db():
    Base.metadata.drop_all(bind=TEST_ENGINE)
    Base.metadata.create_all(bind=TEST_ENGINE)
    return TestingSessionLocal()

def test_fifo_payment_settlement_single_sale():
    db = setup_test_db()
    today = date.today()

    cust = Customer(name="Ramesh Sharma", phone="+91 98000 11111")
    db.add(cust)
    db.commit()

    sale = Transaction(
        customer_id=cust.id,
        type="credit_sale",
        amount=2000.0,
        txn_date=today - timedelta(days=5),
        due_date=today + timedelta(days=2),
        amount_settled=0.0,
        status="open"
    )
    db.add(sale)
    db.commit()

    # Make partial payment of 1200
    payment = Transaction(
        customer_id=cust.id,
        type="payment",
        amount=1200.0,
        txn_date=today,
        amount_settled=1200.0,
        status="paid"
    )
    db.add(payment)
    db.commit()

    allocations = allocate_payment_fifo(db, cust.id, 1200.0, payment.id)

    db.refresh(sale)
    assert len(allocations) == 1
    assert sale.amount_settled == 1200.0
    assert sale.status != "paid"

    summary = get_customer_summary(db, cust)
    assert summary.balance == 800.0

def test_fifo_payment_settlement_multiple_sales():
    db = setup_test_db()
    today = date.today()

    cust = Customer(name="Anand Verma", phone="+91 98000 22222")
    db.add(cust)
    db.commit()

    # Sale 1: 1000.0 (older)
    sale1 = Transaction(
        customer_id=cust.id,
        type="credit_sale",
        amount=1000.0,
        txn_date=today - timedelta(days=10),
        due_date=today - timedelta(days=3),
        amount_settled=0.0,
        status="overdue"
    )
    # Sale 2: 1500.0 (newer)
    sale2 = Transaction(
        customer_id=cust.id,
        type="credit_sale",
        amount=1500.0,
        txn_date=today - timedelta(days=5),
        due_date=today + timedelta(days=5),
        amount_settled=0.0,
        status="open"
    )
    db.add_all([sale1, sale2])
    db.commit()

    # Payment: 1800.0 (Should completely settle sale1: 1000, and settle 800 on sale2)
    payment = Transaction(
        customer_id=cust.id,
        type="payment",
        amount=1800.0,
        txn_date=today,
        amount_settled=1800.0,
        status="paid"
    )
    db.add(payment)
    db.commit()

    allocations = allocate_payment_fifo(db, cust.id, 1800.0, payment.id)

    db.refresh(sale1)
    db.refresh(sale2)

    assert len(allocations) == 2
    assert sale1.amount_settled == 1000.0
    assert sale1.status == "paid"

    assert sale2.amount_settled == 800.0
    assert sale2.status != "paid"

    summary = get_customer_summary(db, cust)
    assert summary.balance == 700.0
