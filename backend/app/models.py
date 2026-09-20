from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    transactions = relationship("Transaction", back_populates="customer", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="customer", cascade="all, delete-orphan")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # 'credit_sale', 'payment'
    amount = Column(Float, nullable=False)
    items_note = Column(String(500), nullable=True)
    credit_days = Column(Integer, default=0)
    txn_date = Column(Date, default=date.today, index=True)
    due_date = Column(Date, nullable=True, index=True)
    amount_settled = Column(Float, default=0.0)
    status = Column(String(50), default="open")  # 'paid', 'due_soon', 'overdue', 'open'
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="transactions")
    # Payment allocations where this txn is the payment
    sale_allocations = relationship("PaymentAllocation", foreign_keys="[PaymentAllocation.payment_id]", back_populates="payment_txn")
    # Payment allocations where this txn is the credit sale being settled
    settlement_records = relationship("PaymentAllocation", foreign_keys="[PaymentAllocation.sale_id]", back_populates="sale_txn")

class PaymentAllocation(Base):
    __tablename__ = "payment_allocations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    payment_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    sale_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    allocated_amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    payment_txn = relationship("Transaction", foreign_keys=[payment_id], back_populates="sale_allocations")
    sale_txn = relationship("Transaction", foreign_keys=[sale_id], back_populates="settlement_records")

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True)
    message = Column(Text, nullable=False)
    channel = Column(String(50), default="whatsapp")
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="reminders")
