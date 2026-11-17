import io
import csv
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.database import get_db
from app.models import User, Transaction, BankAccount, Person, Category, Transfer, UpcomingDue
from app.schemas import TransactionCreate, TransactionUpdate, TransactionResponse
from app.auth import get_current_user
from app.services.balance_service import apply_transaction_effect, revert_transaction_effect

router = APIRouter(prefix="/transactions", tags=["Transactions"])

def serialize_transaction(t: Transaction) -> dict:
    return {
        "id": t.id,
        "transaction_type": t.transaction_type,
        "amount": t.amount,
        "bank_account_id": t.bank_account_id,
        "bank_account_name": t.bank_account.name if t.bank_account else None,
        "bank_account_color": t.bank_account.color if t.bank_account else None,
        "person_id": t.person_id,
        "person_name": t.person.name if t.person else None,
        "category_id": t.category_id,
        "category_name": t.category.name if t.category else None,
        "category_color": t.category.color if t.category else None,
        "category_icon": t.category.icon if t.category else None,
        "transfer_id": t.transfer_id,
        "transaction_date": t.transaction_date,
        "payment_method": t.payment_method,
        "reference_number": t.reference_number,
        "description": t.description,
        "notes": t.notes,
        "is_refund": t.is_refund,
        "created_at": t.created_at,
        "updated_at": t.updated_at
    }

@router.get("/", response_model=List[TransactionResponse])
def get_transactions(
    search: Optional[str] = None,
    transaction_type: Optional[str] = None,
    bank_account_id: Optional[int] = None,
    category_id: Optional[int] = None,
    person_id: Optional[int] = None,
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    sort_by: Optional[str] = Query("date", pattern="^(date|amount)$"),
    sort_order: Optional[str] = Query("desc", pattern="^(asc|desc)$"),
    limit: Optional[int] = 200,
    offset: Optional[int] = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type.upper())
    if bank_account_id:
        query = query.filter(Transaction.bank_account_id == bank_account_id)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if person_id:
        query = query.filter(Transaction.person_id == person_id)
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    
    if search:
        search_filter = f"%{search}%"
        query = query.outerjoin(Person, Transaction.person_id == Person.id)\
                     .outerjoin(Category, Transaction.category_id == Category.id)\
                     .filter(
                         or_(
                             Transaction.description.ilike(search_filter),
                             Transaction.reference_number.ilike(search_filter),
                             Transaction.notes.ilike(search_filter),
                             Person.name.ilike(search_filter),
                             Category.name.ilike(search_filter)
                         )
                     )

    # Sorting
    if sort_by == "amount":
        query = query.order_by(desc(Transaction.amount) if sort_order == "desc" else asc(Transaction.amount))
    else:
        query = query.order_by(
            desc(Transaction.transaction_date) if sort_order == "desc" else asc(Transaction.transaction_date),
            desc(Transaction.id) if sort_order == "desc" else asc(Transaction.id)
        )

    txns = query.offset(offset).limit(limit).all()
    return [serialize_transaction(t) for t in txns]

@router.post("/", response_model=TransactionResponse)
def create_transaction(
    txn_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txn_type = txn_in.transaction_type.upper()
    if txn_type not in ("INCOME", "EXPENSE"):
        raise HTTPException(status_code=400, detail="transaction_type must be INCOME or EXPENSE")
    
    bank = db.query(BankAccount).filter(
        BankAccount.id == txn_in.bank_account_id,
        BankAccount.user_id == current_user.id
    ).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Bank account not found")

    person_id = txn_in.person_id
    if not person_id and txn_in.person_name and txn_in.person_name.strip():
        name_clean = txn_in.person_name.strip()
        person = db.query(Person).filter(
            Person.user_id == current_user.id,
            Person.name.ilike(name_clean)
        ).first()
        if not person:
            person = Person(user_id=current_user.id, name=name_clean)
            db.add(person)
            db.flush()
        person_id = person.id

    txn = Transaction(
        user_id=current_user.id,
        transaction_type=txn_type,
        amount=txn_in.amount,
        bank_account_id=bank.id,
        person_id=person_id,
        category_id=txn_in.category_id,
        transaction_date=txn_in.transaction_date,
        payment_method=txn_in.payment_method or "UPI",
        reference_number=txn_in.reference_number,
        description=txn_in.description,
        notes=txn_in.notes,
        is_refund=txn_in.is_refund or False
    )
    db.add(txn)
    
    # Automatically update bank account balance
    apply_transaction_effect(db, bank, txn_type, txn_in.amount)

    db.commit()
    db.refresh(txn)
    return serialize_transaction(txn)

@router.get("/{txn_id}", response_model=TransactionResponse)
def get_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txn = db.query(Transaction).filter(
        Transaction.id == txn_id,
        Transaction.user_id == current_user.id
    ).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return serialize_transaction(txn)

@router.put("/{txn_id}", response_model=TransactionResponse)
def update_transaction(
    txn_id: int,
    txn_in: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txn = db.query(Transaction).filter(
        Transaction.id == txn_id,
        Transaction.user_id == current_user.id
    ).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Prevent direct edit of internal transfers via transaction endpoint
    if txn.transfer_id:
        raise HTTPException(status_code=400, detail="Internal transfers must be edited or deleted via the Transfer module")

    old_bank = txn.bank_account
    old_amount = txn.amount
    old_type = txn.transaction_type

    # Revert previous effect from old bank account
    revert_transaction_effect(db, old_bank, old_type, old_amount)

    # Determine target bank
    target_bank_id = txn_in.bank_account_id or txn.bank_account_id
    target_bank = db.query(BankAccount).filter(
        BankAccount.id == target_bank_id,
        BankAccount.user_id == current_user.id
    ).first()
    if not target_bank:
        raise HTTPException(status_code=404, detail="Target bank account not found")

    new_amount = txn_in.amount if txn_in.amount is not None else old_amount

    # Apply update fields
    if txn_in.amount is not None:
        txn.amount = txn_in.amount
    if txn_in.bank_account_id is not None:
        txn.bank_account_id = txn_in.bank_account_id
    if txn_in.person_id is not None:
        txn.person_id = txn_in.person_id
    if txn_in.category_id is not None:
        txn.category_id = txn_in.category_id
    if txn_in.transaction_date is not None:
        txn.transaction_date = txn_in.transaction_date
    if txn_in.payment_method is not None:
        txn.payment_method = txn_in.payment_method
    if txn_in.reference_number is not None:
        txn.reference_number = txn_in.reference_number
    if txn_in.description is not None:
        txn.description = txn_in.description
    if txn_in.notes is not None:
        txn.notes = txn_in.notes
    if txn_in.is_refund is not None:
        txn.is_refund = txn_in.is_refund

    # Apply new effect to target bank account
    apply_transaction_effect(db, target_bank, old_type, new_amount)

    db.commit()
    db.refresh(txn)
    return serialize_transaction(txn)

@router.delete("/{txn_id}")
def delete_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txn = db.query(Transaction).filter(
        Transaction.id == txn_id,
        Transaction.user_id == current_user.id
    ).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # If it's an internal transfer, automatically reverse and remove the transfer and its linked records
    if txn.transfer_id:
        transfer = db.query(Transfer).filter(
            Transfer.id == txn.transfer_id,
            Transfer.user_id == current_user.id
        ).first()
        if transfer:
            from_acc = db.query(BankAccount).filter(BankAccount.id == transfer.from_account_id).first()
            to_acc = db.query(BankAccount).filter(BankAccount.id == transfer.to_account_id).first()
            if from_acc:
                from_acc.current_balance = round(from_acc.current_balance + transfer.amount, 2)
            if to_acc:
                to_acc.current_balance = round(to_acc.current_balance - transfer.amount, 2)
            db.query(Transaction).filter(
                Transaction.transfer_id == transfer.id,
                Transaction.user_id == current_user.id
            ).delete()
            db.delete(transfer)
            db.commit()
            return {"message": "Internal transfer and linked transactions deleted and balances reversed successfully"}

    # If linked to an upcoming due settlement, reset the due back to pending
    due = db.query(UpcomingDue).filter(
        UpcomingDue.settled_transaction_id == txn.id,
        UpcomingDue.user_id == current_user.id
    ).first()
    if due:
        due.amount_received = max(0.0, round((due.amount_received or 0.0) - txn.amount, 2))
        due.status = "PARTIAL" if due.amount_received > 0 else "PENDING"
        due.settled_bank_id = None
        due.settled_transaction_id = None
        due.received_date = None

    bank = txn.bank_account
    if bank:
        revert_transaction_effect(db, bank, txn.transaction_type, txn.amount)
    
    db.delete(txn)
    db.commit()
    return {"message": "Transaction deleted and balance restored successfully"}

@router.get("/export/csv")
def export_transactions_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txns = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.transaction_date.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Transaction ID", "Date", "Type", "Amount (INR)", "Bank Account",
        "Category", "Person/Contact", "Payment Method", "Reference Number",
        "Description", "Notes", "Refund"
    ])
    
    for t in txns:
        writer.writerow([
            t.id,
            t.transaction_date.strftime("%d-%m-%Y"),
            t.transaction_type,
            f"{t.amount:.2f}",
            t.bank_account.name if t.bank_account else "",
            t.category.name if t.category else "",
            t.person.name if t.person else "",
            t.payment_method,
            t.reference_number or "",
            t.description or "",
            t.notes or "",
            "Yes" if t.is_refund else "No"
        ])
    
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=transactions_{datetime.date.today()}.csv"}
    )
