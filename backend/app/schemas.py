from datetime import date, datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict

class ParseRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw Hinglish text or transcribed voice entry")

class ParseResult(BaseModel):
    customer_name: str
    customer_phone: Optional[str] = None
    matched_customer_id: Optional[int] = None
    matched_customer_name: Optional[str] = None
    match_score: float = 0.0
    amount: float
    credit_days: int = 0
    items: Optional[str] = None
    type: str = "credit_sale"  # 'credit_sale' or 'payment'
    confidence: float = 1.0
    error: Optional[str] = None

class TransactionCreate(BaseModel):
    customer_id: Optional[int] = None
    customer_name: str
    customer_phone: Optional[str] = None
    type: str = "credit_sale"  # 'credit_sale' | 'payment'
    amount: float = Field(..., gt=0)
    items_note: Optional[str] = None
    credit_days: int = Field(default=0, ge=0)
    txn_date: Optional[date] = None

class PaymentCreate(BaseModel):
    customer_id: int
    amount: float = Field(..., gt=0)
    payment_note: Optional[str] = None
    txn_date: Optional[date] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    balance: float
    overdue_amount: float
    due_soon_amount: float
    status: str  # 'paid', 'due_soon', 'overdue', 'open'
    reliability_score: int  # 0 to 100
    reliability_tier: str   # 'High', 'Medium', 'At Risk'
    last_txn_date: Optional[date] = None
    created_at: datetime

class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    customer_name: Optional[str] = None
    type: str
    amount: float
    items_note: Optional[str] = None
    credit_days: int
    txn_date: date
    due_date: Optional[date] = None
    amount_settled: float
    remaining_amount: float
    status: str
    created_at: datetime

class LedgerOut(BaseModel):
    customer: CustomerOut
    running_balance: float
    timeline: List[TransactionOut]

class TodayInsight(BaseModel):
    headline: str
    action_text: str
    priority_customer_id: Optional[int] = None
    priority_customer_name: Optional[str] = None
    priority_customer_phone: Optional[str] = None
    priority_amount: Optional[float] = None
    wa_link: Optional[str] = None

class DashboardSummary(BaseModel):
    total_receivable: float
    due_this_week: float
    overdue_amount: float
    overdue_customers_count: int
    active_customers_count: int
    today_insight: TodayInsight

class CashFlowItem(BaseModel):
    date: str
    day_name: str
    expected_inflow: float
    customer_count: int
    customer_names: List[str]

class CashFlowResponse(BaseModel):
    days: int
    total_expected: float
    items: List[CashFlowItem]
    insight: str

class ReminderRequest(BaseModel):
    customer_id: int
    transaction_id: Optional[int] = None

class ReminderResponse(BaseModel):
    customer_id: int
    customer_name: str
    phone: str
    message: str
    wa_link: str
