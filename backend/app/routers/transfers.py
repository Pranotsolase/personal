from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, BankAccount, Transfer, Transaction
from app.schemas import TransferCreate, TransferResponse
from app.auth import get_current_user

router = APIRouter(prefix="/transfers", tags=["Internal Bank Transfers"])

@router.get("/", response_model=List[TransferResponse])
def get_transfers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transfers = db.query(Transfer).filter(
        Transfer.user_id == current_user.id
    ).order_by(Transfer.transfer_date.desc(), Transfer.id.desc()).all()
    
    results = []
    for tr in transfers:
        results.append(TransferResponse(
            id=tr.id,
            from_account_id=tr.from_account_id,
            to_account_id=tr.to_account_id,
            from_account_name=tr.from_account.name if tr.from_account else "Unknown",
            to_account_name=tr.to_account.name if tr.to_account else "Unknown",
            amount=tr.amount,
            transfer_date=tr.transfer_date,
            reference_number=tr.reference_number,
            description=tr.description,
            created_at=tr.created_at
        ))
    return results

@router.post("/", response_model=TransferResponse)
def create_internal_transfer(
    transfer_in: TransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from_acc = db.query(BankAccount).filter(
        BankAccount.id == transfer_in.from_account_id,
        BankAccount.user_id == current_user.id
    ).first()
    to_acc = db.query(BankAccount).filter(
        BankAccount.id == transfer_in.to_account_id,
        BankAccount.user_id == current_user.id
    ).first()
    
    if not from_acc or not to_acc:
        raise HTTPException(status_code=404, detail="One or both bank accounts not found")
    
    amount = float(transfer_in.amount)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Transfer amount must be greater than zero")

    if round(from_acc.current_balance - amount, 2) < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient balance in {from_acc.name}. Available balance is ₹{from_acc.current_balance:,.2f}. Account balance cannot go negative."
        )
    
    # Create Transfer record
    transfer = Transfer(
        user_id=current_user.id,
        from_account_id=from_acc.id,
        to_account_id=to_acc.id,
        amount=amount,
        transfer_date=transfer_in.transfer_date,
        reference_number=transfer_in.reference_number,
        description=transfer_in.description or f"Transfer from {from_acc.name} to {to_acc.name}"
    )
    db.add(transfer)
    db.flush()

    # Deduct from source, add to destination
    from_acc.current_balance = round(from_acc.current_balance - amount, 2)
    to_acc.current_balance = round(to_acc.current_balance + amount, 2)
    db.add(from_acc)
    db.add(to_acc)

    # Create linked transactions in ledger
    txn_out = Transaction(
        user_id=current_user.id,
        transaction_type="TRANSFER_OUT",
        amount=amount,
        bank_account_id=from_acc.id,
        transfer_id=transfer.id,
        transaction_date=transfer.transfer_date,
        payment_method="NET_BANKING",
        reference_number=transfer.reference_number,
        description=f"Transfer to {to_acc.name}",
        notes=transfer.description
    )
    txn_in = Transaction(
        user_id=current_user.id,
        transaction_type="TRANSFER_IN",
        amount=amount,
        bank_account_id=to_acc.id,
        transfer_id=transfer.id,
        transaction_date=transfer.transfer_date,
        payment_method="NET_BANKING",
        reference_number=transfer.reference_number,
        description=f"Transfer from {from_acc.name}",
        notes=transfer.description
    )
    db.add_all([txn_out, txn_in])
    db.commit()
    db.refresh(transfer)

    return TransferResponse(
        id=transfer.id,
        from_account_id=transfer.from_account_id,
        to_account_id=transfer.to_account_id,
        from_account_name=from_acc.name,
        to_account_name=to_acc.name,
        amount=transfer.amount,
        transfer_date=transfer.transfer_date,
        reference_number=transfer.reference_number,
        description=transfer.description,
        created_at=transfer.created_at
    )

@router.delete("/{transfer_id}")
def delete_transfer(
    transfer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transfer = db.query(Transfer).filter(
        Transfer.id == transfer_id,
        Transfer.user_id == current_user.id
    ).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    # Reverse balances
    from_acc = db.query(BankAccount).filter(BankAccount.id == transfer.from_account_id).first()
    to_acc = db.query(BankAccount).filter(BankAccount.id == transfer.to_account_id).first()
    
    if from_acc:
        from_acc.current_balance = round(from_acc.current_balance + transfer.amount, 2)
        db.add(from_acc)
    if to_acc:
        to_acc.current_balance = round(to_acc.current_balance - transfer.amount, 2)
        db.add(to_acc)
    
    # Delete associated transactions
    db.query(Transaction).filter(
        Transaction.transfer_id == transfer.id,
        Transaction.user_id == current_user.id
    ).delete()
    
    db.delete(transfer)
    db.commit()
    return {"message": "Transfer reversed and deleted successfully"}
