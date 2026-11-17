from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Category
from app.schemas import CategoryCreate, CategoryResponse
from app.auth import get_current_user

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("/", response_model=List[CategoryResponse])
def get_categories(
    type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Category).filter(Category.user_id == current_user.id)
    if type:
        query = query.filter(Category.type == type.upper())
    return query.order_by(Category.name.asc()).all()

@router.post("/", response_model=CategoryResponse)
def create_category(
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Category).filter(
        Category.user_id == current_user.id,
        Category.name == cat_in.name,
        Category.type == cat_in.type.upper()
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category with this name and type already exists")
    
    category = Category(
        user_id=current_user.id,
        name=cat_in.name,
        type=cat_in.type.upper(),
        icon=cat_in.icon or "Tag",
        color=cat_in.color or "#6b7280",
        is_system=False
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.put("/{cat_id}", response_model=CategoryResponse)
def update_category(
    cat_id: int,
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    category = db.query(Category).filter(
        Category.id == cat_id,
        Category.user_id == current_user.id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    category.name = cat_in.name
    category.type = cat_in.type.upper()
    category.icon = cat_in.icon or category.icon
    category.color = cat_in.color or category.color
    
    db.commit()
    db.refresh(category)
    return category

@router.delete("/{cat_id}")
def delete_category(
    cat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    category = db.query(Category).filter(
        Category.id == cat_id,
        Category.user_id == current_user.id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(category)
    db.commit()
    return {"message": "Category deleted successfully"}
