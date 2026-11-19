from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any
import datetime

# --- Auth Schemas ---
class UserBase(BaseModel):
    email: str
    full_name: str
    currency: Optional[str] = "INR"

class UserCreate(UserBase):
    password: str = Field(..., min_length=1)

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None


# --- Bank Account Schemas ---
class BankAccountBase(BaseModel):
    name: str
    account_holder_name: Optional[str] = "Self"
    account_type: str = "SAVINGS"
    account_number_masked: Optional[str] = None
    ifsc_code: Optional[str] = None
    opening_balance: float = Field(0.0, ge=0.0, description="Opening balance cannot be negative")
    color: Optional[str] = "#3b82f6"
    notes: Optional[str] = None
    is_active: Optional[bool] = True

class BankAccountCreate(BankAccountBase):
    current_balance: Optional[float] = Field(None, ge=0.0, description="Current balance cannot be negative")

class BankAccountUpdate(BaseModel):
    name: Optional[str] = None
    account_holder_name: Optional[str] = None
    account_type: Optional[str] = None
    account_number_masked: Optional[str] = None
    ifsc_code: Optional[str] = None
    opening_balance: Optional[float] = Field(None, ge=0.0, description="Opening balance cannot be negative")
    current_balance: Optional[float] = Field(None, ge=0.0, description="Current balance cannot be negative")
    color: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class BankAccountResponse(BankAccountBase):
    id: int
    current_balance: float
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


# --- Category Schemas ---
class CategoryBase(BaseModel):
    name: str
    type: str  # INCOME or EXPENSE
    icon: Optional[str] = "Tag"
    color: Optional[str] = "#6b7280"

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    is_system: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# --- Person Schemas ---
class PersonBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None

class PersonCreate(PersonBase):
    pass

class PersonUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None

class PersonResponse(PersonBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime
    total_sent: Optional[float] = 0.0
    total_received: Optional[float] = 0.0
    net_sent: Optional[float] = 0.0
    outstanding: Optional[float] = 0.0

    class Config:
        from_attributes = True


# --- Transfer Schemas ---
class TransferCreate(BaseModel):
    from_account_id: int
    to_account_id: int
    amount: float = Field(..., gt=0, description="Transfer amount must be positive")
    transfer_date: datetime.date = Field(default_factory=datetime.date.today)
    reference_number: Optional[str] = None
    description: Optional[str] = "Internal Bank Transfer"

    @field_validator("to_account_id")
    def accounts_must_differ(cls, v, info):
        if "from_account_id" in info.data and v == info.data["from_account_id"]:
            raise ValueError("From and To bank accounts must be different")
        return v

class TransferResponse(BaseModel):
    id: int
    from_account_id: int
    to_account_id: int
    from_account_name: Optional[str] = None
    to_account_name: Optional[str] = None
    amount: float
    transfer_date: datetime.date
    reference_number: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# --- Transaction Schemas ---
class TransactionCreate(BaseModel):
    transaction_type: str  # INCOME, EXPENSE
    amount: float = Field(..., gt=0, description="Amount must be greater than zero")
    bank_account_id: int
    person_id: Optional[int] = None
    person_name: Optional[str] = None  # helper for auto-creating a person if needed
    category_id: Optional[int] = None
    transaction_date: datetime.date = Field(default_factory=datetime.date.today)
    payment_method: Optional[str] = "UPI"
    reference_number: Optional[str] = None
    description: str
    notes: Optional[str] = None
    is_refund: Optional[bool] = False

class TransactionUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    bank_account_id: Optional[int] = None
    person_id: Optional[int] = None
    category_id: Optional[int] = None
    transaction_date: Optional[datetime.date] = None
    payment_method: Optional[str] = None
    reference_number: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    is_refund: Optional[bool] = None

class TransactionResponse(BaseModel):
    id: int
    transaction_type: str
    amount: float
    bank_account_id: int
    bank_account_name: Optional[str] = None
    bank_account_color: Optional[str] = None
    person_id: Optional[int] = None
    person_name: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    category_color: Optional[str] = None
    category_icon: Optional[str] = None
    transfer_id: Optional[int] = None
    transaction_date: datetime.date
    payment_method: str
    reference_number: Optional[str] = None
    description: str
    notes: Optional[str] = None
    is_refund: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


# --- Budget Schemas ---
class BudgetCreate(BaseModel):
    category_id: Optional[int] = None  # None indicates overall monthly budget
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000, le=2100)
    amount: float = Field(..., gt=0)

class BudgetUpdate(BaseModel):
    amount: float = Field(..., gt=0)

class BudgetResponse(BaseModel):
    id: int
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    category_color: Optional[str] = None
    month: int
    year: int
    amount: float
    spent: float = 0.0
    remaining: float = 0.0
    percentage: float = 0.0
    is_warning: bool = False
    is_exceeded: bool = False

    class Config:
        from_attributes = True


# --- Dashboard & Analytics Schemas ---
class DashboardOverview(BaseModel):
    total_balance: float
    total_income: float
    total_expenses: float
    total_savings: float
    savings_rate: float
    bank_accounts_count: int
    current_month_spending: float
    last_month_spending: float
    spending_change_percentage: float
    highest_expense_category: Optional[str] = None
    highest_expense_amount: float = 0.0
    top_sender: Optional[str] = None
    top_sender_amount: float = 0.0
    top_receiver: Optional[str] = None
    top_receiver_amount: float = 0.0
    budget_status: Optional[Dict[str, Any]] = None


# --- Upcoming Due Schemas ---
class UpcomingDueBase(BaseModel):
    person_name: str
    due_type: str = "RECEIVABLE"  # "RECEIVABLE" or "PAYABLE"
    amount: float = Field(..., gt=0)
    due_date: Optional[datetime.date] = None
    description: Optional[str] = None
    person_id: Optional[int] = None
    category_id: Optional[int] = None
    notes: Optional[str] = None

class UpcomingDueCreate(UpcomingDueBase):
    pass

class UpcomingDueUpdate(BaseModel):
    person_name: Optional[str] = None
    due_type: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    due_date: Optional[datetime.date] = None
    description: Optional[str] = None
    person_id: Optional[int] = None
    category_id: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class UpcomingDueSettle(BaseModel):
    bank_account_id: int
    amount: Optional[float] = Field(None, gt=0)
    received_date: Optional[datetime.date] = None
    payment_method: Optional[str] = "UPI"
    notes: Optional[str] = None

class UpcomingDueResponse(UpcomingDueBase):
    id: int
    due_type: str = "RECEIVABLE"
    amount_received: float = 0.0
    status: str
    received_date: Optional[datetime.date] = None
    settled_bank_id: Optional[int] = None
    settled_bank_name: Optional[str] = None
    settled_transaction_id: Optional[int] = None
    category_name: Optional[str] = None
    is_overdue: bool = False
    remaining_amount: float = 0.0
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class UpcomingDueSummary(BaseModel):
    total_pending_amount: float = 0.0
    total_pending_count: int = 0
    overdue_amount: float = 0.0
    overdue_count: int = 0
    received_this_month_amount: float = 0.0
    received_this_month_count: int = 0
    total_payable_amount: float = 0.0
    total_payable_count: int = 0
    overdue_payable_amount: float = 0.0
    overdue_payable_count: int = 0
    paid_this_month_amount: float = 0.0
    paid_this_month_count: int = 0

