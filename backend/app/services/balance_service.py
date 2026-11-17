from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import BankAccount, Transaction, Transfer

def recalculate_account_balance(db: Session, account_id: int):
    account = db.query(BankAccount).filter(BankAccount.id == account_id).first()
    if not account:
        return
    
    # Start with opening balance
    balance = float(account.opening_balance)
    
    transactions = db.query(Transaction).filter(
        Transaction.bank_account_id == account_id
    ).all()
    
    for txn in transactions:
        amt = float(txn.amount)
        if txn.transaction_type in ("INCOME", "TRANSFER_IN"):
            balance += amt
        elif txn.transaction_type in ("EXPENSE", "TRANSFER_OUT"):
            balance -= amt
            
    account.current_balance = round(balance, 2)
    db.add(account)
    db.commit()
    db.refresh(account)
    return account.current_balance

def apply_transaction_effect(db: Session, bank_account: BankAccount, txn_type: str, amount: float):
    amt = float(amount)
    if txn_type in ("EXPENSE", "TRANSFER_OUT"):
        new_balance = round(float(bank_account.current_balance) - amt, 2)
        if new_balance < 0:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient balance in {bank_account.name}. Available balance is ₹{bank_account.current_balance:,.2f}. Balance cannot go negative."
            )
        bank_account.current_balance = new_balance
    elif txn_type in ("INCOME", "TRANSFER_IN"):
        bank_account.current_balance = round(float(bank_account.current_balance) + amt, 2)
    db.add(bank_account)

def revert_transaction_effect(db: Session, bank_account: BankAccount, txn_type: str, amount: float):
    amt = float(amount)
    if txn_type in ("EXPENSE", "TRANSFER_OUT"):
        bank_account.current_balance = round(float(bank_account.current_balance) + amt, 2)
    elif txn_type in ("INCOME", "TRANSFER_IN"):
        new_balance = round(float(bank_account.current_balance) - amt, 2)
        if new_balance < 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete or alter transaction: would cause {bank_account.name} balance to go negative."
            )
        bank_account.current_balance = new_balance
    db.add(bank_account)
