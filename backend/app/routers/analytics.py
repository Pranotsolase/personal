import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.database import get_db
from app.models import User, BankAccount, Transaction, Person, Category, Budget, UpcomingDue
from app.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics & Reports"])

def get_date_range(filter_type: str, start_date: Optional[datetime.date] = None, end_date: Optional[datetime.date] = None):
    import calendar
    today = datetime.date.today()
    if filter_type == "today":
        return today, today
    elif filter_type == "yesterday":
        yest = today - datetime.timedelta(days=1)
        return yest, yest
    elif filter_type == "last_7_days":
        return today - datetime.timedelta(days=6), today
    elif filter_type == "last_30_days":
        return today - datetime.timedelta(days=29), today
    elif filter_type == "this_month":
        _, last_day = calendar.monthrange(today.year, today.month)
        return today.replace(day=1), today.replace(day=last_day)
    elif filter_type == "last_month":
        first_this_month = today.replace(day=1)
        last_day_prev = first_this_month - datetime.timedelta(days=1)
        first_day_prev = last_day_prev.replace(day=1)
        return first_day_prev, last_day_prev
    elif filter_type == "this_year":
        return datetime.date(today.year, 1, 1), datetime.date(today.year, 12, 31)
    elif filter_type == "all":
        return None, None
    elif filter_type == "custom" and start_date and end_date:
        return start_date, end_date
    return None, None

@router.get("/dashboard")
def get_dashboard_data(
    filter_type: str = Query("this_month", pattern="^(today|yesterday|last_7_days|last_30_days|this_month|last_month|this_year|custom|all)$"),
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = datetime.date.today()
    d_start, d_end = get_date_range(filter_type, start_date, end_date)

    # 1. Total Balance across all active bank accounts
    bank_accounts = db.query(BankAccount).filter(
        BankAccount.user_id == current_user.id,
        BankAccount.is_active == True
    ).all()
    total_balance = sum(acc.current_balance for acc in bank_accounts)

    # Base transaction query for the selected date range
    txn_query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if d_start:
        txn_query = txn_query.filter(Transaction.transaction_date >= d_start)
    if d_end:
        txn_query = txn_query.filter(Transaction.transaction_date <= d_end)
    
    txns = txn_query.all()

    income_txns = [t for t in txns if t.transaction_type == "INCOME"]
    expense_txns = [t for t in txns if t.transaction_type == "EXPENSE"]

    total_income = round(sum(t.amount for t in income_txns), 2)
    total_expenses = round(sum(t.amount for t in expense_txns), 2)
    total_savings = round(total_income - total_expenses, 2)
    savings_rate = round((total_savings / total_income * 100), 1) if total_income > 0 else 0.0

    # Current month spending vs last month spending
    curr_month_start = today.replace(day=1)
    prev_month_end = curr_month_start - datetime.timedelta(days=1)
    prev_month_start = prev_month_end.replace(day=1)

    curr_month_expenses = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_type == "EXPENSE",
        Transaction.transaction_date >= curr_month_start,
        Transaction.transaction_date <= today
    ).scalar()

    prev_month_expenses = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_type == "EXPENSE",
        Transaction.transaction_date >= prev_month_start,
        Transaction.transaction_date <= prev_month_end
    ).scalar()

    spending_change_pct = 0.0
    if prev_month_expenses > 0:
        spending_change_pct = round(((curr_month_expenses - prev_month_expenses) / prev_month_expenses) * 100, 1)

    # Category breakdown for expenses
    cat_expenses: Dict[str, Dict[str, Any]] = {}
    for t in expense_txns:
        cat_name = t.category.name if t.category else "Uncategorized"
        cat_color = t.category.color if t.category else "#94a3b8"
        if cat_name not in cat_expenses:
            cat_expenses[cat_name] = {"name": cat_name, "value": 0.0, "color": cat_color, "count": 0}
        cat_expenses[cat_name]["value"] = round(cat_expenses[cat_name]["value"] + t.amount, 2)
        cat_expenses[cat_name]["count"] += 1
    
    category_breakdown = sorted(list(cat_expenses.values()), key=lambda x: x["value"], reverse=True)
    highest_cat = category_breakdown[0]["name"] if category_breakdown else "None"
    highest_cat_amount = category_breakdown[0]["value"] if category_breakdown else 0.0

    # Account-wise balance distribution
    account_distribution = [
        {
            "id": acc.id,
            "name": acc.name,
            "balance": acc.current_balance,
            "color": acc.color,
            "percentage": round((acc.current_balance / total_balance * 100), 1) if total_balance > 0 else 0
        }
        for acc in bank_accounts
    ]

    # Daily spending trend in range (last 14 days or filtered period)
    trend_start = d_start or (today - datetime.timedelta(days=13))
    trend_end = d_end or today
    
    # Map out daily amounts
    daily_map = {}
    cur = trend_start
    while cur <= trend_end:
        daily_map[cur.strftime("%d %b")] = {"date": cur.strftime("%d %b"), "expense": 0.0, "income": 0.0}
        cur += datetime.timedelta(days=1)
    
    for t in txns:
        key = t.transaction_date.strftime("%d %b")
        if key in daily_map:
            if t.transaction_type == "EXPENSE":
                daily_map[key]["expense"] = round(daily_map[key]["expense"] + t.amount, 2)
            elif t.transaction_type == "INCOME":
                daily_map[key]["income"] = round(daily_map[key]["income"] + t.amount, 2)

    daily_spending_trend = list(daily_map.values())

    # Top people: who sent me most, whom I sent most
    people_sent = {}
    people_received = {}
    for t in txns:
        if t.person:
            p_name = t.person.name
            if t.transaction_type == "EXPENSE":
                people_sent[p_name] = round(people_sent.get(p_name, 0.0) + t.amount, 2)
            elif t.transaction_type == "INCOME":
                people_received[p_name] = round(people_received.get(p_name, 0.0) + t.amount, 2)

    sorted_sent = sorted(people_sent.items(), key=lambda x: x[1], reverse=True)
    sorted_received = sorted(people_received.items(), key=lambda x: x[1], reverse=True)

    top_receiver = sorted_sent[0][0] if sorted_sent else None
    top_receiver_amt = sorted_sent[0][1] if sorted_sent else 0.0
    top_sender = sorted_received[0][0] if sorted_received else None
    top_sender_amt = sorted_received[0][1] if sorted_received else 0.0

    # Budget alert status for overall budget
    overall_budget = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category_id.is_(None),
        Budget.month == today.month,
        Budget.year == today.year
    ).first()
    budget_info = None
    if overall_budget:
        spent = curr_month_expenses
        budget_amt = overall_budget.amount
        pct = round((spent / budget_amt * 100), 1) if budget_amt > 0 else 0.0
        budget_info = {
            "budget_amount": budget_amt,
            "spent": round(spent, 2),
            "remaining": round(budget_amt - spent, 2),
            "percentage": pct,
            "is_warning": 80.0 <= pct < 100.0,
            "is_exceeded": pct >= 100.0
        }

    # Upcoming & Pending receivables and payables
    pending_dues = db.query(UpcomingDue).filter(
        UpcomingDue.user_id == current_user.id,
        UpcomingDue.status.in_(["PENDING", "PARTIAL"])
    ).all()

    receivables = [d for d in pending_dues if getattr(d, "due_type", "RECEIVABLE") == "RECEIVABLE"]
    payables = [d for d in pending_dues if getattr(d, "due_type", "RECEIVABLE") == "PAYABLE"]

    pending_incoming_amount = round(sum(max(0.0, d.amount - (d.amount_received or 0.0)) for d in receivables), 2)
    pending_incoming_count = len(receivables)
    overdue_receivables = [d for d in receivables if d.due_date and d.due_date < today]
    overdue_incoming_amount = round(sum(max(0.0, d.amount - (d.amount_received or 0.0)) for d in overdue_receivables), 2)

    pending_payable_amount = round(sum(max(0.0, d.amount - (d.amount_received or 0.0)) for d in payables), 2)
    pending_payable_count = len(payables)
    overdue_payables = [d for d in payables if d.due_date and d.due_date < today]
    overdue_payable_amount = round(sum(max(0.0, d.amount - (d.amount_received or 0.0)) for d in overdue_payables), 2)

    # Generate smart financial insights
    insights = []
    if overdue_payables:
        first_op = overdue_payables[0]
        insights.append(f"⚠️ Overdue Payment: ₹{max(0.0, first_op.amount - (first_op.amount_received or 0.0)):,.2f} is overdue to transfer to {first_op.person_name}.")
    elif payables:
        insights.append(f"Pending Transfers: You have ₹{pending_payable_amount:,.2f} pending to transfer to {pending_payable_count} {'person' if pending_payable_count == 1 else 'people'}.")

    if overdue_receivables:
        first_overdue = overdue_receivables[0]
        insights.append(f"⚠️ Overdue Collection: ₹{max(0.0, first_overdue.amount - (first_overdue.amount_received or 0.0)):,.2f} is overdue from {first_overdue.person_name}.")
    elif receivables:
        insights.append(f"Upcoming Money: You have ₹{pending_incoming_amount:,.2f} pending to collect from {pending_incoming_count} {'person' if pending_incoming_count == 1 else 'people'}.")

    if highest_cat != "None" and highest_cat_amount > 0:
        insights.append(f"Your highest expense category is {highest_cat} (₹{highest_cat_amount:,.2f}).")
    if spending_change_pct > 0:
        insights.append(f"Your spending increased by {spending_change_pct}% compared to last month.")
    elif spending_change_pct < 0:
        insights.append(f"Great job! Your spending decreased by {abs(spending_change_pct)}% compared to last month.")
    if top_receiver:
        insights.append(f"You sent ₹{top_receiver_amt:,.2f} to {top_receiver}.")
    if top_sender:
        insights.append(f"You received ₹{top_sender_amt:,.2f} from {top_sender}.")
    if budget_info and budget_info["is_exceeded"]:
        insights.append(f"Alert: You have exceeded your monthly budget by ₹{abs(budget_info['remaining']):,.2f}!")
    elif budget_info and budget_info["is_warning"]:
        insights.append(f"Warning: You have reached {budget_info['percentage']}% of your monthly budget.")
    if not insights:
        insights.append("All account balances and transactions are initialized at ₹0.00. Ready to record your financial activities!")
        insights.append("Click '+ Money Received' to record income or '+ Money Sent' to record expenses.")

    return {
        "summary": {
            "total_balance": round(total_balance, 2),
            "total_income": total_income,
            "total_expenses": total_expenses,
            "total_savings": total_savings,
            "savings_rate": savings_rate,
            "bank_accounts_count": len(bank_accounts),
            "current_month_spending": round(curr_month_expenses, 2),
            "last_month_spending": round(prev_month_expenses, 2),
            "spending_change_percentage": spending_change_pct,
            "highest_expense_category": highest_cat,
            "highest_expense_amount": highest_cat_amount,
            "top_sender": top_sender,
            "top_sender_amount": top_sender_amt,
            "top_receiver": top_receiver,
            "top_receiver_amount": top_receiver_amt,
            "budget_status": budget_info,
            "pending_incoming_amount": pending_incoming_amount,
            "pending_incoming_count": pending_incoming_count,
            "overdue_incoming_amount": overdue_incoming_amount,
            "pending_payable_amount": pending_payable_amount,
            "pending_payable_count": pending_payable_count,
            "overdue_payable_amount": overdue_payable_amount,
        },
        "insights": insights,
        "charts": {
            "category_breakdown": category_breakdown,
            "account_distribution": account_distribution,
            "daily_spending_trend": daily_spending_trend
        }
    }

@router.get("/reports")
def get_detailed_reports(
    report_type: str = Query("monthly", pattern="^(daily|weekly|monthly|yearly|bank_wise|person_wise|category_wise|savings)$"),
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = datetime.date.today()
    target_year = year or today.year
    target_month = month or today.month

    if report_type == "monthly":
        # Month by month report for the target year
        monthly_data = []
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        for m_idx, m_name in enumerate(months, start=1):
            income = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
                Transaction.user_id == current_user.id,
                Transaction.transaction_type == "INCOME",
                extract("year", Transaction.transaction_date) == target_year,
                extract("month", Transaction.transaction_date) == m_idx
            ).scalar()

            expense = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
                Transaction.user_id == current_user.id,
                Transaction.transaction_type == "EXPENSE",
                extract("year", Transaction.transaction_date) == target_year,
                extract("month", Transaction.transaction_date) == m_idx
            ).scalar()

            savings = round(income - expense, 2)
            savings_pct = round((savings / income * 100), 1) if income > 0 else 0.0

            monthly_data.append({
                "month": m_name,
                "month_num": m_idx,
                "income": round(income, 2),
                "expense": round(expense, 2),
                "savings": savings,
                "savings_rate": savings_pct
            })
        return {"year": target_year, "data": monthly_data}

    elif report_type == "daily":
        # Daily breakdown for target month & year
        txns = db.query(Transaction).filter(
            Transaction.user_id == current_user.id,
            extract("year", Transaction.transaction_date) == target_year,
            extract("month", Transaction.transaction_date) == target_month
        ).order_by(Transaction.transaction_date.asc()).all()

        days_data = {}
        for t in txns:
            d_str = t.transaction_date.strftime("%d-%m-%Y")
            if d_str not in days_data:
                days_data[d_str] = {"date": d_str, "income": 0.0, "expense": 0.0, "net": 0.0}
            if t.transaction_type == "INCOME":
                days_data[d_str]["income"] = round(days_data[d_str]["income"] + t.amount, 2)
            elif t.transaction_type == "EXPENSE":
                days_data[d_str]["expense"] = round(days_data[d_str]["expense"] + t.amount, 2)
            days_data[d_str]["net"] = round(days_data[d_str]["income"] - days_data[d_str]["expense"], 2)
        
        return {"year": target_year, "month": target_month, "data": list(days_data.values())}

    elif report_type == "yearly":
        # Group by year
        records = db.query(
            extract("year", Transaction.transaction_date).label("yr"),
            Transaction.transaction_type,
            func.sum(Transaction.amount).label("total")
        ).filter(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type.in_(["INCOME", "EXPENSE"])
        ).group_by("yr", Transaction.transaction_type).order_by("yr").all()

        yearly_dict = {}
        for r in records:
            yr = int(r.yr)
            if yr not in yearly_dict:
                yearly_dict[yr] = {"year": yr, "income": 0.0, "expense": 0.0, "savings": 0.0}
            if r.transaction_type == "INCOME":
                yearly_dict[yr]["income"] = round(float(r.total), 2)
            elif r.transaction_type == "EXPENSE":
                yearly_dict[yr]["expense"] = round(float(r.total), 2)
            yearly_dict[yr]["savings"] = round(yearly_dict[yr]["income"] - yearly_dict[yr]["expense"], 2)

        return {"data": list(yearly_dict.values())}

    elif report_type == "bank_wise":
        banks = db.query(BankAccount).filter(BankAccount.user_id == current_user.id).all()
        bank_data = []
        for b in banks:
            income = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
                Transaction.bank_account_id == b.id,
                Transaction.transaction_type == "INCOME"
            ).scalar()
            expense = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
                Transaction.bank_account_id == b.id,
                Transaction.transaction_type == "EXPENSE"
            ).scalar()
            transfer_in = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
                Transaction.bank_account_id == b.id,
                Transaction.transaction_type == "TRANSFER_IN"
            ).scalar()
            transfer_out = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
                Transaction.bank_account_id == b.id,
                Transaction.transaction_type == "TRANSFER_OUT"
            ).scalar()
            bank_data.append({
                "bank_id": b.id,
                "name": b.name,
                "account_type": b.account_type,
                "color": b.color,
                "opening_balance": b.opening_balance,
                "current_balance": b.current_balance,
                "total_income": round(income, 2),
                "total_expense": round(expense, 2),
                "total_transfers_in": round(transfer_in, 2),
                "total_transfers_out": round(transfer_out, 2)
            })
        return {"data": bank_data}

    elif report_type == "person_wise":
        people = db.query(Person).filter(Person.user_id == current_user.id).all()
        person_data = []
        for p in people:
            sent = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
                Transaction.person_id == p.id,
                Transaction.transaction_type == "EXPENSE"
            ).scalar()
            received = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
                Transaction.person_id == p.id,
                Transaction.transaction_type == "INCOME"
            ).scalar()
            person_data.append({
                "person_id": p.id,
                "name": p.name,
                "phone": p.phone,
                "total_sent": round(sent, 2),
                "total_received": round(received, 2),
                "net_sent": round(sent - received, 2)
            })
        return {"data": sorted(person_data, key=lambda x: x["total_sent"] + x["total_received"], reverse=True)}

    elif report_type == "category_wise":
        cats = db.query(Category).filter(
            Category.user_id == current_user.id,
            Category.type == "EXPENSE"
        ).all()
        cat_data = []
        for c in cats:
            spent = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
                Transaction.category_id == c.id,
                Transaction.transaction_type == "EXPENSE"
            ).scalar()
            if spent > 0:
                cat_data.append({
                    "category_id": c.id,
                    "name": c.name,
                    "color": c.color,
                    "icon": c.icon,
                    "amount": round(spent, 2)
                })
        return {"data": sorted(cat_data, key=lambda x: x["amount"], reverse=True)}

    return {"message": "Invalid report type"}
