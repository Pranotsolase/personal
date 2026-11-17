from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import User, Person, Transaction
from app.schemas import PersonCreate, PersonUpdate, PersonResponse
from app.auth import get_current_user

router = APIRouter(prefix="/people", tags=["People & Contacts"])

def populate_person_metrics(person: Person, db: Session) -> dict:
    txns = db.query(Transaction).filter(
        Transaction.person_id == person.id,
        Transaction.user_id == person.user_id
    ).all()
    
    total_sent = sum(t.amount for t in txns if t.transaction_type == "EXPENSE")
    total_received = sum(t.amount for t in txns if t.transaction_type == "INCOME")
    net_sent = total_sent - total_received  # positive means you sent more than received
    
    return {
        "id": person.id,
        "name": person.name,
        "phone": person.phone,
        "email": person.email,
        "notes": person.notes,
        "created_at": person.created_at,
        "updated_at": person.updated_at,
        "total_sent": round(total_sent, 2),
        "total_received": round(total_received, 2),
        "net_sent": round(net_sent, 2),
        "outstanding": round(net_sent, 2),
        "transactions_count": len(txns)
    }

@router.get("/", response_model=List[PersonResponse])
def get_people(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Person).filter(Person.user_id == current_user.id)
    if search:
        query = query.filter(Person.name.ilike(f"%{search}%"))
    people = query.order_by(Person.name.asc()).all()
    
    return [populate_person_metrics(p, db) for p in people]

@router.post("/", response_model=PersonResponse)
def create_person(
    person_in: PersonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Person).filter(
        Person.user_id == current_user.id,
        Person.name.ilike(person_in.name.strip())
    ).first()
    if existing:
        return populate_person_metrics(existing, db)
    
    person = Person(
        user_id=current_user.id,
        name=person_in.name.strip(),
        phone=person_in.phone,
        email=person_in.email,
        notes=person_in.notes
    )
    db.add(person)
    db.commit()
    db.refresh(person)
    return populate_person_metrics(person, db)

@router.get("/{person_id}", response_model=PersonResponse)
def get_person(
    person_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    person = db.query(Person).filter(
        Person.id == person_id,
        Person.user_id == current_user.id
    ).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return populate_person_metrics(person, db)

@router.put("/{person_id}", response_model=PersonResponse)
def update_person(
    person_id: int,
    person_in: PersonUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    person = db.query(Person).filter(
        Person.id == person_id,
        Person.user_id == current_user.id
    ).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    update_data = person_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(person, field, value)
    
    db.commit()
    db.refresh(person)
    return populate_person_metrics(person, db)

@router.delete("/{person_id}")
def delete_person(
    person_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    person = db.query(Person).filter(
        Person.id == person_id,
        Person.user_id == current_user.id
    ).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    db.delete(person)
    db.commit()
    return {"message": "Person deleted successfully"}

@router.get("/{person_id}/transactions")
def get_person_transactions(
    person_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    person = db.query(Person).filter(
        Person.id == person_id,
        Person.user_id == current_user.id
    ).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    txns = db.query(Transaction).filter(
        Transaction.person_id == person_id,
        Transaction.user_id == current_user.id
    ).order_by(Transaction.transaction_date.desc(), Transaction.id.desc()).all()
    
    results = []
    for t in txns:
        results.append({
            "id": t.id,
            "transaction_type": t.transaction_type,
            "amount": t.amount,
            "bank_account_id": t.bank_account_id,
            "bank_account_name": t.bank_account.name if t.bank_account else None,
            "person_id": person.id,
            "person_name": person.name,
            "category_id": t.category_id,
            "category_name": t.category.name if t.category else None,
            "transaction_date": t.transaction_date,
            "payment_method": t.payment_method,
            "reference_number": t.reference_number,
            "description": t.description,
            "notes": t.notes,
            "is_refund": t.is_refund,
            "created_at": t.created_at
        })
    return {
        "person": populate_person_metrics(person, db),
        "transactions": results
    }
