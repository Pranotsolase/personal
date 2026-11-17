import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models import User, BankAccount, Category, Person, Transaction, Transfer, Budget
from app.auth import get_password_hash

DEFAULT_EXPENSE_CATEGORIES = [
    {"name": "Food & Dining", "icon": "Utensils", "color": "#ef4444"},
    {"name": "Groceries", "icon": "ShoppingCart", "color": "#f97316"},
    {"name": "Shopping", "icon": "ShoppingBag", "color": "#ec4899"},
    {"name": "Transportation", "icon": "Bus", "color": "#3b82f6"},
    {"name": "Fuel", "icon": "Fuel", "color": "#eab308"},
    {"name": "Electricity", "icon": "Zap", "color": "#8b5cf6"},
    {"name": "Internet & Mobile", "icon": "Wifi", "color": "#06b6d4"},
    {"name": "Rent", "icon": "Home", "color": "#6366f1"},
    {"name": "Medical", "icon": "HeartPulse", "color": "#14b8a6"},
    {"name": "Entertainment", "icon": "Film", "color": "#a855f7"},
    {"name": "Education", "icon": "GraduationCap", "color": "#3b82f6"},
    {"name": "Travel", "icon": "Plane", "color": "#0ea5e9"},
    {"name": "EMIs & Loans", "icon": "CreditCard", "color": "#dc2626"},
    {"name": "Personal", "icon": "User", "color": "#64748b"},
    {"name": "Other", "icon": "MoreHorizontal", "color": "#94a3b8"},
]

DEFAULT_INCOME_CATEGORIES = [
    {"name": "Salary", "icon": "Briefcase", "color": "#10b981"},
    {"name": "Freelancing", "icon": "Laptop", "color": "#059669"},
    {"name": "Business Income", "icon": "TrendingUp", "color": "#16a34a"},
    {"name": "Investments", "icon": "PieChart", "color": "#0d9488"},
    {"name": "Interest", "icon": "Percent", "color": "#0284c7"},
    {"name": "Refunds", "icon": "RotateCcw", "color": "#6366f1"},
    {"name": "Gifts", "icon": "Gift", "color": "#d946ef"},
    {"name": "Borrowed Money", "icon": "Handshake", "color": "#e11d48"},
    {"name": "Other", "icon": "MoreHorizontal", "color": "#94a3b8"},
]

def init_user_default_categories(user_id: int, db: Session):
    for cat in DEFAULT_EXPENSE_CATEGORIES:
        exists = db.query(Category).filter(Category.user_id == user_id, Category.name == cat["name"], Category.type == "EXPENSE").first()
        if not exists:
            db.add(Category(
                user_id=user_id,
                name=cat["name"],
                type="EXPENSE",
                icon=cat["icon"],
                color=cat["color"],
                is_system=True
            ))
    for cat in DEFAULT_INCOME_CATEGORIES:
        exists = db.query(Category).filter(Category.user_id == user_id, Category.name == cat["name"], Category.type == "INCOME").first()
        if not exists:
            db.add(Category(
                user_id=user_id,
                name=cat["name"],
                type="INCOME",
                icon=cat["icon"],
                color=cat["color"],
                is_system=True
            ))
    db.commit()

def seed_demo_data(db: Session, with_transactions: bool = False):
    admin_user = db.query(User).filter(
        or_(
            User.email == "admin",
            User.email == "admin@example.com"
        )
    ).first()
    if not admin_user:
        admin_user = User(
            email="admin",
            full_name="Admin",
            hashed_password=get_password_hash("admin"),
            currency="INR"
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
    else:
        admin_user.email = "admin"
        admin_user.full_name = "Admin"
        admin_user.hashed_password = get_password_hash("admin")
        db.commit()

    init_user_default_categories(admin_user.id, db)
    return admin_user

    # Categories lookup
    cat_salary = db.query(Category).filter(Category.user_id == user.id, Category.name == "Salary").first()
    cat_freelance = db.query(Category).filter(Category.user_id == user.id, Category.name == "Freelancing").first()
    cat_food = db.query(Category).filter(Category.user_id == user.id, Category.name == "Food & Dining").first()
    cat_groceries = db.query(Category).filter(Category.user_id == user.id, Category.name == "Groceries").first()
    cat_rent = db.query(Category).filter(Category.user_id == user.id, Category.name == "Rent").first()
    cat_electricity = db.query(Category).filter(Category.user_id == user.id, Category.name == "Electricity").first()
    cat_shopping = db.query(Category).filter(Category.user_id == user.id, Category.name == "Shopping").first()
    cat_transport = db.query(Category).filter(Category.user_id == user.id, Category.name == "Transportation").first()

    today = datetime.date.today()

    # Initial transactions:
    # 1. Salary credited to HDFC
    t1 = Transaction(
        user_id=user.id,
        transaction_type="INCOME",
        amount=85000.0,
        bank_account_id=hdfc.id,
        person_id=None,
        category_id=cat_salary.id if cat_salary else None,
        transaction_date=today - datetime.timedelta(days=12),
        payment_method="NET_BANKING",
        reference_number="SALARY/CORP/NOV26",
        description="Monthly Salary Credit",
        notes="Nov Salary"
    )
    hdfc.current_balance += 85000.0

    # 2. Sent rent to landlord
    t2 = Transaction(
        user_id=user.id,
        transaction_type="EXPENSE",
        amount=22000.0,
        bank_account_id=hdfc.id,
        person_id=landlord.id,
        category_id=cat_rent.id if cat_rent else None,
        transaction_date=today - datetime.timedelta(days=10),
        payment_method="NET_BANKING",
        reference_number="RENT/NOV/HDFC44",
        description="Apartment Rent Payment",
        notes="Nov Rent paid to landlord"
    )
    hdfc.current_balance -= 22000.0

    # 3. Sent ₹5,000 to Rahul
    t3 = Transaction(
        user_id=user.id,
        transaction_type="EXPENSE",
        amount=5000.0,
        bank_account_id=hdfc.id,
        person_id=rahul.id,
        category_id=cat_food.id if cat_food else None,
        transaction_date=today - datetime.timedelta(days=7),
        payment_method="UPI",
        reference_number="UPI/6128491823/rahul",
        description="Sent ₹5,000 to Rahul for group trip",
        notes="Weekend trip split"
    )
    hdfc.current_balance -= 5000.0

    # 4. Paid ₹2,000 to Electricity Department
    t4 = Transaction(
        user_id=user.id,
        transaction_type="EXPENSE",
        amount=2000.0,
        bank_account_id=hdfc.id,
        person_id=elec_dept.id,
        category_id=cat_electricity.id if cat_electricity else None,
        transaction_date=today - datetime.timedelta(days=6),
        payment_method="UPI",
        reference_number="EBILL/99281311",
        description="Paid ₹2,000 to Electricity Department",
        notes="Electricity Bill for October"
    )
    hdfc.current_balance -= 2000.0

    # 5. Received ₹10,000 from Rahul
    t5 = Transaction(
        user_id=user.id,
        transaction_type="INCOME",
        amount=10000.0,
        bank_account_id=sbi.id,
        person_id=rahul.id,
        category_id=cat_salary.id if cat_salary else None,
        transaction_date=today - datetime.timedelta(days=4),
        payment_method="UPI",
        reference_number="UPI/771239102/settle",
        description="Received ₹10,000 from Rahul",
        notes="Settlement of previous loan"
    )
    sbi.current_balance += 10000.0

    # 6. Groceries paid from cash
    t6 = Transaction(
        user_id=user.id,
        transaction_type="EXPENSE",
        amount=2450.0,
        bank_account_id=cash.id,
        person_id=grocery_store.id,
        category_id=cat_groceries.id if cat_groceries else None,
        transaction_date=today - datetime.timedelta(days=3),
        payment_method="CASH",
        description="Weekly grocery supplies",
        notes="Vegetables, fruits & dairy"
    )
    cash.current_balance -= 2450.0

    # 7. Shopping on Credit/Debit Card
    t7 = Transaction(
        user_id=user.id,
        transaction_type="EXPENSE",
        amount=6500.0,
        bank_account_id=hdfc.id,
        person_id=None,
        category_id=cat_shopping.id if cat_shopping else None,
        transaction_date=today - datetime.timedelta(days=2),
        payment_method="DEBIT_CARD",
        reference_number="POS/MYNTRA/8912",
        description="Online clothing purchase",
        notes="Winter clothes"
    )
    hdfc.current_balance -= 6500.0

    # 8. Freelance income into ICICI
    t8 = Transaction(
        user_id=user.id,
        transaction_type="INCOME",
        amount=25000.0,
        bank_account_id=icici.id,
        person_id=amit.id,
        category_id=cat_freelance.id if cat_freelance else None,
        transaction_date=today - datetime.timedelta(days=1),
        payment_method="NET_BANKING",
        reference_number="NEFT/FREELANCE/002",
        description="Frontend consulting milestone payment",
        notes="UI design delivery"
    )
    icici.current_balance += 25000.0

    # 9. Internal transfer: ₹10,000 from SBI to HDFC
    transfer_amount = 10000.0
    transfer = Transfer(
        user_id=user.id,
        from_account_id=sbi.id,
        to_account_id=hdfc.id,
        amount=transfer_amount,
        transfer_date=today - datetime.timedelta(days=2),
        reference_number="IMPS/TRANSFER/901",
        description="Transfer from SBI to HDFC for savings rebalance"
    )
    db.add(transfer)
    db.flush()

    sbi.current_balance -= transfer_amount
    hdfc.current_balance += transfer_amount

    txn_out = Transaction(
        user_id=user.id,
        transaction_type="TRANSFER_OUT",
        amount=transfer_amount,
        bank_account_id=sbi.id,
        transfer_id=transfer.id,
        transaction_date=transfer.transfer_date,
        payment_method="NET_BANKING",
        reference_number="IMPS/TRANSFER/901",
        description="Transfer to HDFC Salary Account"
    )
    txn_in = Transaction(
        user_id=user.id,
        transaction_type="TRANSFER_IN",
        amount=transfer_amount,
        bank_account_id=hdfc.id,
        transfer_id=transfer.id,
        transaction_date=transfer.transfer_date,
        payment_method="NET_BANKING",
        reference_number="IMPS/TRANSFER/901",
        description="Transfer from SBI Savings"
    )
    db.add_all([t1, t2, t3, t4, t5, t6, t7, t8, txn_out, txn_in])

    # Monthly Budgets
    b_overall = Budget(
        user_id=user.id,
        category_id=None,
        month=today.month,
        year=today.year,
        amount=50000.0
    )
    b_food = Budget(
        user_id=user.id,
        category_id=cat_food.id if cat_food else None,
        month=today.month,
        year=today.year,
        amount=10000.0
    )
    b_groceries = Budget(
        user_id=user.id,
        category_id=cat_groceries.id if cat_groceries else None,
        month=today.month,
        year=today.year,
        amount=8000.0
    )
    b_shopping = Budget(
        user_id=user.id,
        category_id=cat_shopping.id if cat_shopping else None,
        month=today.month,
        year=today.year,
        amount=8000.0
    )
    db.add_all([b_overall, b_food, b_groceries, b_shopping])

    db.commit()
    return user
