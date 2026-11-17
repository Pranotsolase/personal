import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract
from app.database import get_db
from app.models import User, Budget, Category, Transaction
from app.schemas import BudgetCreate, BudgetUpdate, BudgetResponse
from app.auth import get_current_user

router = APIRouter(prefix="/budgets", tags=["Budget Management"])

def calculate_budget_progress(b: Budget, db: Session) -> dict:
    # Query expenses for the user in this budget month and year
    query = db.query(Transaction).filter(
        Transaction.user_id == b.user_id,
        Transaction.transaction_type == "EXPENSE",
        extract("month", Transaction.transaction_date) == b.month,
        extract("year", Transaction.transaction_date) == b.year
    )
    if b.category_id:
        query = query.filter(Transaction.category_id == b.category_id)
    
    txns = query.all()
    spent = round(sum(t.amount for t in txns), 2)
    amount = round(float(b.amount), 2)
    remaining = round(amount - spent, 2)
    percentage = round((spent / amount * 100), 1) if amount > 0 else 0.0

    return {
        "id": b.id,
        "category_id": b.category_id,
        "category_name": b.category.name if b.category else "Overall Monthly Budget",
        "category_color": b.category.color if b.category else "#4f46e5",
        "month": b.month,
        "year": b.year,
        "amount": amount,
        "spent": spent,
        "remaining": remaining,
        "percentage": percentage,
        "is_warning": 80.0 <= percentage < 100.0,
        "is_exceeded": percentage >= 100.0
    }

@router.get("/", response_model=List[BudgetResponse])
def get_budgets(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_month = month or datetime.date.today().month
    target_year = year or datetime.date.today().year

    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == target_month,
        Budget.year == target_year
    ).order_by(Budget.category_id.asc().nullsfirst()).all()

    return [calculate_budget_progress(b, db) for b in budgets]

@router.post("/", response_model=BudgetResponse)
def set_or_update_budget(
    budget_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category_id == budget_in.category_id,
        Budget.month == budget_in.month,
        Budget.year == budget_in.year
    ).first()

    if existing:
        existing.amount = budget_in.amount
        db.commit()
        db.refresh(existing)
        return calculate_budget_progress(existing, db)
    
    budget = Budget(
        user_id=current_user.id,
        category_id=budget_in.category_id,
        month=budget_in.month,
        year=budget_in.year,
        amount=budget_in.amount
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return calculate_budget_progress(budget, db)

@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    db.delete(budget)
    db.commit()
    return {"message": "Budget deleted successfully"}
