import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    currency = Column(String(10), default="INR")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    bank_accounts = relationship("BankAccount", back_populates="user", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    people = relationship("Person", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    transfers = relationship("Transfer", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    upcoming_dues = relationship("UpcomingDue", back_populates="user", cascade="all, delete-orphan")


class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    account_holder_name = Column(String(100), nullable=False)
    account_type = Column(String(50), default="SAVINGS")  # SAVINGS, CURRENT, CASH, WALLET, OTHER
    account_number_masked = Column(String(50), nullable=True)
    ifsc_code = Column(String(20), nullable=True)
    opening_balance = Column(Float, default=0.0, nullable=False)
    current_balance = Column(Float, default=0.0, nullable=False)
    color = Column(String(30), default="#3b82f6")
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="bank_accounts")
    transactions = relationship("Transaction", back_populates="bank_account", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)  # INCOME, EXPENSE
    icon = Column(String(50), default="Tag")
    color = Column(String(30), default="#6b7280")
    is_system = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")
    budgets = relationship("Budget", back_populates="category", cascade="all, delete-orphan")


class Person(Base):
    __tablename__ = "people"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=True)
    email = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="people")
    transactions = relationship("Transaction", back_populates="person")
    upcoming_dues = relationship("UpcomingDue", back_populates="person")


class Transfer(Base):
    __tablename__ = "transfers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    from_account_id = Column(Integer, ForeignKey("bank_accounts.id", ondelete="CASCADE"), nullable=False)
    to_account_id = Column(Integer, ForeignKey("bank_accounts.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    transfer_date = Column(Date, nullable=False, default=datetime.date.today)
    reference_number = Column(String(100), nullable=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="transfers")
    from_account = relationship("BankAccount", foreign_keys=[from_account_id])
    to_account = relationship("BankAccount", foreign_keys=[to_account_id])
    transactions = relationship("Transaction", back_populates="transfer", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_type = Column(String(30), nullable=False, index=True)  # INCOME, EXPENSE, TRANSFER_IN, TRANSFER_OUT
    amount = Column(Float, nullable=False)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    person_id = Column(Integer, ForeignKey("people.id", ondelete="SET NULL"), nullable=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    transfer_id = Column(Integer, ForeignKey("transfers.id", ondelete="CASCADE"), nullable=True, index=True)
    
    transaction_date = Column(Date, nullable=False, default=datetime.date.today, index=True)
    payment_method = Column(String(50), default="UPI")  # UPI, NET_BANKING, DEBIT_CARD, CREDIT_CARD, CASH, CHEQUE, OTHER
    reference_number = Column(String(100), nullable=True)
    description = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    is_refund = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="transactions")
    bank_account = relationship("BankAccount", back_populates="transactions")
    person = relationship("Person", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    transfer = relationship("Transfer", back_populates="transactions")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=True)  # Null if overall budget
    month = Column(Integer, nullable=False)  # 1 - 12
    year = Column(Integer, nullable=False)   # e.g., 2026
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")


class UpcomingDue(Base):
    __tablename__ = "upcoming_dues"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    person_id = Column(Integer, ForeignKey("people.id", ondelete="SET NULL"), nullable=True, index=True)
    person_name = Column(String(100), nullable=False)
    due_type = Column(String(20), default="RECEIVABLE", index=True)  # RECEIVABLE or PAYABLE
    amount = Column(Float, nullable=False)
    amount_received = Column(Float, default=0.0, nullable=False)
    due_date = Column(Date, nullable=False, default=datetime.date.today, index=True)
    description = Column(String(255), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(30), default="PENDING", index=True)  # PENDING, PARTIAL, RECEIVED, CANCELLED
    notes = Column(Text, nullable=True)
    received_date = Column(Date, nullable=True)
    settled_bank_id = Column(Integer, ForeignKey("bank_accounts.id", ondelete="SET NULL"), nullable=True)
    settled_transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="upcoming_dues")
    person = relationship("Person", back_populates="upcoming_dues")
    category = relationship("Category")
    settled_bank = relationship("BankAccount")
    settled_transaction = relationship("Transaction")

