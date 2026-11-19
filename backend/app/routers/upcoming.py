import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import User, BankAccount, Person, Category, Transaction, UpcomingDue
from app.schemas import (
    UpcomingDueCreate,
    UpcomingDueUpdate,
    UpcomingDueSettle,
    UpcomingDueResponse,
    UpcomingDueSummary,
)
from app.auth import get_current_user

router = APIRouter(prefix="/upcoming", tags=["Upcoming & Pending Money"])


def format_due_response(due: UpcomingDue) -> UpcomingDueResponse:
    today = datetime.date.today()
    remaining = max(0.0, round(due.amount - (due.amount_received or 0.0), 2))
    is_overdue = (due.status in ["PENDING", "PARTIAL"]) and (due.due_date < today)
    due_type = getattr(due, "due_type", "RECEIVABLE") or "RECEIVABLE"
    
    return UpcomingDueResponse(
        id=due.id,
        person_name=due.person_name,
        due_type=due_type,
        amount=due.amount,
        amount_received=due.amount_received or 0.0,
        due_date=due.due_date,
        description=due.description,
        person_id=due.person_id,
        category_id=due.category_id,
        category_name=due.category.name if due.category else None,
        notes=due.notes,
        status=due.status,
        received_date=due.received_date,
        settled_bank_id=due.settled_bank_id,
        settled_bank_name=due.settled_bank.name if due.settled_bank else None,
        settled_transaction_id=due.settled_transaction_id,
        is_overdue=is_overdue,
        remaining_amount=remaining,
        created_at=due.created_at,
        updated_at=due.updated_at,
    )


@router.get("/", response_model=List[UpcomingDueResponse])
def get_upcoming_dues(
    status_filter: Optional[str] = Query(None, alias="status"),
    due_type_filter: Optional[str] = Query(None, alias="due_type"),
    is_overdue: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(UpcomingDue).filter(UpcomingDue.user_id == current_user.id)
    today = datetime.date.today()

    if due_type_filter and due_type_filter.upper() != "ALL":
        query = query.filter(UpcomingDue.due_type == due_type_filter.upper())

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(UpcomingDue.status == status_filter.upper())

    if is_overdue is True:
        query = query.filter(
            UpcomingDue.status.in_(["PENDING", "PARTIAL"]),
            UpcomingDue.due_date < today
        )
    elif is_overdue is False:
        query = query.filter(
            or_(
                UpcomingDue.status.in_(["RECEIVED", "PAID"]),
                UpcomingDue.due_date >= today
            )
        )

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                UpcomingDue.person_name.ilike(search_fmt),
                UpcomingDue.description.ilike(search_fmt),
                UpcomingDue.notes.ilike(search_fmt),
            )
        )

    dues = query.order_by(UpcomingDue.due_date.asc(), UpcomingDue.id.desc()).all()
    return [format_due_response(d) for d in dues]


@router.get("/summary", response_model=UpcomingDueSummary)
def get_upcoming_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = datetime.date.today()
    first_this_month = today.replace(day=1)

    all_dues = db.query(UpcomingDue).filter(UpcomingDue.user_id == current_user.id).all()

    total_pending_amount = 0.0
    total_pending_count = 0
    overdue_amount = 0.0
    overdue_count = 0
    received_this_month_amount = 0.0
    received_this_month_count = 0

    total_payable_amount = 0.0
    total_payable_count = 0
    overdue_payable_amount = 0.0
    overdue_payable_count = 0
    paid_this_month_amount = 0.0
    paid_this_month_count = 0

    for d in all_dues:
        rem = max(0.0, d.amount - (d.amount_received or 0.0))
        dtype = getattr(d, "due_type", "RECEIVABLE") or "RECEIVABLE"

        if dtype == "RECEIVABLE":
            if d.status in ["PENDING", "PARTIAL"]:
                total_pending_amount += rem
                total_pending_count += 1
                if d.due_date and d.due_date < today:
                    overdue_amount += rem
                    overdue_count += 1
            elif d.status in ["RECEIVED", "SETTLED"] or (d.amount_received and d.amount_received > 0):
                if d.received_date and d.received_date >= first_this_month:
                    received_this_month_amount += (d.amount_received or d.amount)
                    received_this_month_count += 1
        else:  # PAYABLE
            if d.status in ["PENDING", "PARTIAL"]:
                total_payable_amount += rem
                total_payable_count += 1
                if d.due_date and d.due_date < today:
                    overdue_payable_amount += rem
                    overdue_payable_count += 1
            elif d.status in ["RECEIVED", "PAID", "SETTLED"] or (d.amount_received and d.amount_received > 0):
                if d.received_date and d.received_date >= first_this_month:
                    paid_this_month_amount += (d.amount_received or d.amount)
                    paid_this_month_count += 1

    return UpcomingDueSummary(
        total_pending_amount=round(total_pending_amount, 2),
        total_pending_count=total_pending_count,
        overdue_amount=round(overdue_amount, 2),
        overdue_count=overdue_count,
        received_this_month_amount=round(received_this_month_amount, 2),
        received_this_month_count=received_this_month_count,
        total_payable_amount=round(total_payable_amount, 2),
        total_payable_count=total_payable_count,
        overdue_payable_amount=round(overdue_payable_amount, 2),
        overdue_payable_count=overdue_payable_count,
        paid_this_month_amount=round(paid_this_month_amount, 2),
        paid_this_month_count=paid_this_month_count,
    )


@router.post("/", response_model=UpcomingDueResponse)
def create_upcoming_due(
    due_in: UpcomingDueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if due_in.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    # Link or auto-create Person if not provided
    person_id = due_in.person_id
    if not person_id and due_in.person_name.strip():
        existing_p = db.query(Person).filter(
            Person.user_id == current_user.id,
            Person.name.ilike(due_in.person_name.strip())
        ).first()
        if existing_p:
            person_id = existing_p.id
        else:
            new_person = Person(
                user_id=current_user.id,
                name=due_in.person_name.strip()
            )
            db.add(new_person)
            db.flush()
            person_id = new_person.id

    due_type = (due_in.due_type or "RECEIVABLE").upper()
    default_desc = (
        f"Money to receive from {due_in.person_name}"
        if due_type == "RECEIVABLE"
        else f"Pending transfer to {due_in.person_name}"
    )

    due = UpcomingDue(
        user_id=current_user.id,
        person_id=person_id,
        person_name=due_in.person_name.strip(),
        due_type=due_type,
        amount=round(due_in.amount, 2),
        amount_received=0.0,
        due_date=due_in.due_date or datetime.date.today(),
        description=(due_in.description or default_desc).strip(),
        category_id=due_in.category_id,
        status="PENDING",
        notes=due_in.notes.strip() if due_in.notes else None,
    )
    db.add(due)
    db.commit()
    db.refresh(due)
    return format_due_response(due)
    db.add(due)
    db.commit()
    db.refresh(due)
    return format_due_response(due)


@router.put("/{due_id}", response_model=UpcomingDueResponse)
def update_upcoming_due(
    due_id: int,
    due_in: UpcomingDueUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    due = db.query(UpcomingDue).filter(
        UpcomingDue.id == due_id,
        UpcomingDue.user_id == current_user.id
    ).first()
    if not due:
        raise HTTPException(status_code=404, detail="Upcoming due record not found")

    if due_in.person_name is not None:
        due.person_name = due_in.person_name.strip()
    if due_in.due_type is not None:
        due.due_type = due_in.due_type.upper()
    if due_in.amount is not None:
        if due_in.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be greater than zero")
        due.amount = round(due_in.amount, 2)
        if due.amount_received >= due.amount:
            due.status = "PAID" if due.due_type == "PAYABLE" else "RECEIVED"
        elif due.amount_received > 0:
            due.status = "PARTIAL"
        else:
            due.status = "PENDING"
    if due_in.due_date is not None:
        due.due_date = due_in.due_date
    if due_in.description is not None:
        due.description = due_in.description.strip()
    if due_in.person_id is not None:
        due.person_id = due_in.person_id
    if due_in.category_id is not None:
        due.category_id = due_in.category_id
    if due_in.notes is not None:
        due.notes = due_in.notes.strip() if due_in.notes else None
    if due_in.status is not None:
        due.status = due_in.status.upper()

    db.commit()
    db.refresh(due)
    return format_due_response(due)


@router.delete("/{due_id}")
def delete_upcoming_due(
    due_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    due = db.query(UpcomingDue).filter(
        UpcomingDue.id == due_id,
        UpcomingDue.user_id == current_user.id
    ).first()
    if not due:
        raise HTTPException(status_code=404, detail="Upcoming due record not found")

    db.delete(due)
    db.commit()
    return {"message": "Upcoming due deleted successfully"}


@router.post("/{due_id}/settle", response_model=UpcomingDueResponse)
def settle_upcoming_due(
    due_id: int,
    settle_in: UpcomingDueSettle,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    due = db.query(UpcomingDue).filter(
        UpcomingDue.id == due_id,
        UpcomingDue.user_id == current_user.id
    ).first()
    if not due:
        raise HTTPException(status_code=404, detail="Upcoming due record not found")

    bank = db.query(BankAccount).filter(
        BankAccount.id == settle_in.bank_account_id,
        BankAccount.user_id == current_user.id
    ).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Selected bank account not found")

    rem = max(0.0, round(due.amount - (due.amount_received or 0.0), 2))
    settle_amt = round(settle_in.amount if (settle_in.amount and settle_in.amount > 0) else rem, 2)

    if settle_amt <= 0:
        raise HTTPException(status_code=400, detail="Settlement amount must be greater than zero")

    settle_date = settle_in.received_date or datetime.date.today()
    due_type = getattr(due, "due_type", "RECEIVABLE") or "RECEIVABLE"

    if due_type == "PAYABLE":
        # ⚠️ Check zero negative balance: bank balance cannot drop below 0
        if bank.current_balance - settle_amt < 0:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient balance in {bank.name}. Available: ₹{bank.current_balance:,.2f}. Balance cannot go negative."
            )

        # 1. Deduct amount from bank
        bank.current_balance = round(bank.current_balance - settle_amt, 2)

        # Category for payable
        cat_id = due.category_id
        if not cat_id:
            fallback_cat = db.query(Category).filter(
                Category.user_id == current_user.id,
                Category.type == "EXPENSE",
                Category.name.in_(["Repayments", "Transfers", "Other"])
            ).first()
            if fallback_cat:
                cat_id = fallback_cat.id

        # 2. Create outgoing EXPENSE transaction
        txn = Transaction(
            user_id=current_user.id,
            transaction_type="EXPENSE",
            amount=settle_amt,
            bank_account_id=bank.id,
            person_id=due.person_id,
            category_id=cat_id,
            transaction_date=settle_date,
            payment_method=settle_in.payment_method or "UPI",
            description=f"Paid to {due.person_name}: {due.description}",
            notes=settle_in.notes or f"Settlement of pending payable #{due.id}"
        )
        db.add(txn)
        db.flush()

        due.amount_received = round((due.amount_received or 0.0) + settle_amt, 2)
        due.received_date = settle_date
        due.settled_bank_id = bank.id
        due.settled_transaction_id = txn.id
        due.status = "PAID" if due.amount_received >= due.amount else "PARTIAL"

    else:
        # RECEIVABLE: Add to bank and create INCOME transaction
        bank.current_balance = round(bank.current_balance + settle_amt, 2)

        cat_id = due.category_id
        if not cat_id:
            fallback_cat = db.query(Category).filter(
                Category.user_id == current_user.id,
                Category.type == "INCOME",
                Category.name.in_(["Borrowed Money", "Refunds", "Other"])
            ).first()
            if fallback_cat:
                cat_id = fallback_cat.id

        # Create incoming transaction
        txn = Transaction(
            user_id=current_user.id,
            transaction_type="INCOME",
            amount=settle_amt,
            bank_account_id=bank.id,
            person_id=due.person_id,
            category_id=cat_id,
            transaction_date=settle_date,
            payment_method=settle_in.payment_method or "UPI",
            description=f"Received from {due.person_name}: {due.description}",
            notes=settle_in.notes or f"Settlement for pending due #{due.id}"
        )
        db.add(txn)
        db.flush()

        # Update upcoming due record
        due.amount_received = round((due.amount_received or 0.0) + settle_amt, 2)
        due.received_date = settle_date
        due.settled_bank_id = bank.id
        due.settled_transaction_id = txn.id
        due.status = "RECEIVED" if due.amount_received >= due.amount else "PARTIAL"

    db.commit()
    db.refresh(due)
    return format_due_response(due)
