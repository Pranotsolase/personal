from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.database import get_db
from app.models import User, Transaction, Transfer, Budget, BankAccount, UpcomingDue
from app.schemas import UserCreate, UserResponse, Token, UserLogin
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.seed import init_user_default_categories, seed_demo_data

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        currency=user_in.currency or "INR"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize default categories
    init_user_default_categories(new_user.id, db)

    token = create_access_token(data={"sub": new_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    login_id = user_in.email.strip().lower()
    user = db.query(User).filter(
        or_(
            func.lower(User.email) == login_id,
            func.lower(User.full_name) == login_id
        )
    ).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is deactivated")

    token = create_access_token(data={"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

# Also support OAuth2 form login for Swagger docs
@router.post("/token", response_model=Token)
def login_swagger(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    login_id = form_data.username.strip().lower()
    user = db.query(User).filter(
        or_(
            func.lower(User.email) == login_id,
            func.lower(User.full_name) == login_id
        )
    ).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(data={"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/seed-demo", response_model=Token)
def seed_demo(db: Session = Depends(get_db)):
    user = seed_demo_data(db, with_transactions=False)
    token = create_access_token(data={"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/reset-zero", response_model=Token)
def reset_to_zero(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Delete transactions, transfers, budgets, upcoming dues, bank accounts, people for current user
    db.query(Transaction).filter(Transaction.user_id == current_user.id).delete()
    db.query(Transfer).filter(Transfer.user_id == current_user.id).delete()
    db.query(Budget).filter(Budget.user_id == current_user.id).delete()
    db.query(UpcomingDue).filter(UpcomingDue.user_id == current_user.id).delete()
    db.query(BankAccount).filter(BankAccount.user_id == current_user.id).delete()
    
    db.commit()
    token = create_access_token(data={"sub": current_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": current_user
    }
