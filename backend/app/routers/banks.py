from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import User, BankAccount, Transaction
from app.schemas import BankAccountCreate, BankAccountUpdate, BankAccountResponse, TransactionResponse
from app.auth import get_current_user
from app.services.balance_service import recalculate_account_balance

router = APIRouter(prefix="/banks", tags=["Bank Management"])

@router.get("/", response_model=List[BankAccountResponse])
def get_bank_accounts(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(BankAccount).filter(BankAccount.user_id == current_user.id)
    if active_only:
        query = query.filter(BankAccount.is_active == True)
    return query.order_by(BankAccount.id.asc()).all()

@router.get("/summary")
def get_banks_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    accounts = db.query(BankAccount).filter(
        BankAccount.user_id == current_user.id,
        BankAccount.is_active == True
    ).all()
    
    total_balance = sum(acc.current_balance for acc in accounts)
    total_opening = sum(acc.opening_balance for acc in accounts)
    
    return {
        "total_balance": round(total_balance, 2),
        "total_opening_balance": round(total_opening, 2),
        "account_count": len(accounts),
        "accounts": [
            {
                "id": acc.id,
                "name": acc.name,
                "account_type": acc.account_type,
                "current_balance": acc.current_balance,
                "color": acc.color,
                "percentage_of_total": round((acc.current_balance / total_balance * 100), 1) if total_balance > 0 else 0
            }
            for acc in accounts
        ]
    }

@router.get("/cash-wallet", response_model=Optional[BankAccountResponse])
def get_cash_wallet(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account = db.query(BankAccount).filter(
        BankAccount.user_id == current_user.id,
        BankAccount.account_type == "CASH",
        BankAccount.is_active == True
    ).order_by(BankAccount.id.asc()).first()
    return account

@router.post("/", response_model=BankAccountResponse)
def create_bank_account(
    account_in: BankAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_bal = account_in.current_balance if account_in.current_balance is not None else account_in.opening_balance
    holder = (
        account_in.account_holder_name.strip()
        if account_in.account_holder_name and account_in.account_holder_name.strip()
        else (current_user.full_name or "Cash in Hand")
    )
    account = BankAccount(
        user_id=current_user.id,
        name=account_in.name,
        account_holder_name=holder,
        account_type=account_in.account_type,
        account_number_masked=account_in.account_number_masked,
        ifsc_code=account_in.ifsc_code,
        opening_balance=account_in.opening_balance,
        current_balance=current_bal,
        color=account_in.color or ("#059669" if account_in.account_type == "CASH" else "#3b82f6"),
        notes=account_in.notes,
        is_active=account_in.is_active if account_in.is_active is not None else True
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account

@router.get("/{account_id}", response_model=BankAccountResponse)
def get_bank_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account = db.query(BankAccount).filter(
        BankAccount.id == account_id,
        BankAccount.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    return account

@router.put("/{account_id}", response_model=BankAccountResponse)
def update_bank_account(
    account_id: int,
    account_in: BankAccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account = db.query(BankAccount).filter(
        BankAccount.id == account_id,
        BankAccount.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    
    update_data = account_in.model_dump(exclude_unset=True)

    # Handle direct current_balance modification (e.g. for Cash Wallet or manual adjustment)
    if "current_balance" in update_data and update_data["current_balance"] is not None:
        new_balance = float(update_data["current_balance"])
        if new_balance < 0:
            raise HTTPException(status_code=400, detail="Balance cannot be negative")
        
        txns = db.query(Transaction).filter(Transaction.bank_account_id == account.id).all()
        net_txns = sum(
            float(t.amount) if t.transaction_type in ("INCOME", "TRANSFER_IN") else -float(t.amount)
            for t in txns
        )
        # Ensure opening balance is set so recalculations yield the exact new balance
        account.opening_balance = max(0.0, round(new_balance - net_txns, 2))
        account.current_balance = round(new_balance, 2)
        del update_data["current_balance"]
        if "opening_balance" in update_data:
            del update_data["opening_balance"]
    elif "opening_balance" in update_data and update_data["opening_balance"] is not None:
        account.opening_balance = float(update_data["opening_balance"])
        del update_data["opening_balance"]
        recalculate_account_balance(db, account.id)

    for field, value in update_data.items():
        setattr(account, field, value)
    
    db.commit()
    db.refresh(account)
    return account

@router.put("/{account_id}/balance", response_model=BankAccountResponse)
def update_direct_balance(
    account_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account = db.query(BankAccount).filter(
        BankAccount.id == account_id,
        BankAccount.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    
    if "balance" not in payload or payload["balance"] is None:
        raise HTTPException(status_code=400, detail="Missing balance in request body")
    
    new_balance = float(payload["balance"])
    if new_balance < 0:
        raise HTTPException(status_code=400, detail="Balance cannot be negative")
    
    txns = db.query(Transaction).filter(Transaction.bank_account_id == account.id).all()
    net_txns = sum(
        float(t.amount) if t.transaction_type in ("INCOME", "TRANSFER_IN") else -float(t.amount)
        for t in txns
    )
    account.opening_balance = max(0.0, round(new_balance - net_txns, 2))
    account.current_balance = round(new_balance, 2)
    db.commit()
    db.refresh(account)
    return account

@router.delete("/{account_id}")
def delete_bank_account(
    account_id: int,
    hard_delete: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account = db.query(BankAccount).filter(
        BankAccount.id == account_id,
        BankAccount.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    
    if hard_delete:
        db.delete(account)
    else:
        account.is_active = False
    
    db.commit()
    return {"message": "Bank account permanently deleted from database"}

@router.post("/{account_id}/recalculate")
def recalculate_balance(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account = db.query(BankAccount).filter(
        BankAccount.id == account_id,
        BankAccount.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    
    new_bal = recalculate_account_balance(db, account_id)
    return {"message": "Balance recalculated successfully", "current_balance": new_bal}

@router.get("/{account_id}/transactions")
def get_bank_account_transactions(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account = db.query(BankAccount).filter(
        BankAccount.id == account_id,
        BankAccount.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    
    txns = db.query(Transaction).filter(
        Transaction.bank_account_id == account_id,
        Transaction.user_id == current_user.id
    ).order_by(Transaction.transaction_date.desc(), Transaction.id.desc()).all()
    
    results = []
    for t in txns:
        results.append({
            "id": t.id,
            "transaction_type": t.transaction_type,
            "amount": t.amount,
            "bank_account_id": t.bank_account_id,
            "bank_account_name": account.name,
            "person_id": t.person_id,
            "person_name": t.person.name if t.person else None,
            "category_id": t.category_id,
            "category_name": t.category.name if t.category else None,
            "category_color": t.category.color if t.category else None,
            "transaction_date": t.transaction_date,
            "payment_method": t.payment_method,
            "reference_number": t.reference_number,
            "description": t.description,
            "notes": t.notes,
            "is_refund": t.is_refund,
            "created_at": t.created_at
        })
    return results
