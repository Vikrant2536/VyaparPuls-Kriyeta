from datetime import date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database import Base
from backend.app.models import Customer, Transaction
from backend.app.services import get_cashflow_forecast, get_dashboard_summary

TEST_ENGINE = create_engine("sqlite:///:memory:")
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)

def setup_test_db():
    Base.metadata.drop_all(bind=TEST_ENGINE)
    Base.metadata.create_all(bind=TEST_ENGINE)
    return TestingSessionLocal()

def test_cashflow_forecast_math():
    db = setup_test_db()
    today = date.today()

    cust1 = Customer(name="Customer A", phone="+91 90000 11111")
    cust2 = Customer(name="Customer B", phone="+91 90000 22222")
    db.add_all([cust1, cust2])
    db.commit()

    # Sale due today
    s1 = Transaction(
        customer_id=cust1.id,
        type="credit_sale",
        amount=1500.0,
        txn_date=today - timedelta(days=7),
        due_date=today,
        amount_settled=0.0,
        status="due_soon"
    )
    # Sale due in 3 days
    s2 = Transaction(
        customer_id=cust2.id,
        type="credit_sale",
        amount=2500.0,
        txn_date=today - timedelta(days=4),
        due_date=today + timedelta(days=3),
        amount_settled=500.0,  # 2000 remaining
        status="open"
    )
    # Sale due in 15 days (outside 7-day window)
    s3 = Transaction(
        customer_id=cust1.id,
        type="credit_sale",
        amount=5000.0,
        txn_date=today,
        due_date=today + timedelta(days=15),
        amount_settled=0.0,
        status="open"
    )
    db.add_all([s1, s2, s3])
    db.commit()

    forecast_7 = get_cashflow_forecast(db, days=7)
    assert forecast_7.days == 7
    # s1 remaining: 1500, s2 remaining: 2000 => 3500
    assert forecast_7.total_expected == 3500.0

    forecast_16 = get_cashflow_forecast(db, days=16)
    # Includes s1 (1500), s2 (2000), and s3 (5000) => 8500
    assert forecast_16.total_expected == 8500.0

def test_dashboard_summary_overdue_and_insights():
    db = setup_test_db()
    today = date.today()

    cust_overdue = Customer(name="Anand Verma", phone="+91 98111 22222")
    db.add(cust_overdue)
    db.commit()

    overdue_sale = Transaction(
        customer_id=cust_overdue.id,
        type="credit_sale",
        amount=12000.0,
        txn_date=today - timedelta(days=20),
        due_date=today - timedelta(days=10),
        amount_settled=2000.0,  # 10000 overdue
        status="overdue"
    )
    db.add(overdue_sale)
    db.commit()

    summary = get_dashboard_summary(db)
    assert summary.total_receivable == 10000.0
    assert summary.overdue_amount == 10000.0
    assert summary.overdue_customers_count == 1
    assert "Verma" in summary.today_insight.headline or "Verma" in summary.today_insight.action_text
    assert summary.today_insight.priority_customer_name == "Anand Verma"
    assert summary.today_insight.wa_link is not None
