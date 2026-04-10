from sqlalchemy.orm import Session
from app.models import User
from app.schemas import UserRegister, UserManageUpdate
from app.security import hash_password, verify_password
from fastapi import HTTPException, status

def get_user_by_email(db: Session, email: str) -> User | None:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first()

def get_users(db: Session) -> list[User]:
    """Get all users"""
    return db.query(User).order_by(User.id.desc()).all()

def create_user(db: Session, user_register: UserRegister) -> User:
    """Create a new user (identity only)"""
    # Check if user already exists
    existing_user = get_user_by_email(db, user_register.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = hash_password(user_register.password)
    
    # Create user identity
    db_user = User(
        email=user_register.email,
        hashed_password=hashed_password,
        role=user_register.role
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Authenticate user by email and password"""
    user = get_user_by_email(db, email)
    
    if not user:
        return None
    
    if not verify_password(password, user.hashed_password):
        return None
    
    if not user.is_active:
        return None
    
    return user

def update_user(db: Session, db_user: User, user_data: UserManageUpdate) -> User:
    """Update user identity information (only fields present in User model)"""
    update_data = user_data.model_dump(exclude_unset=True)
    # Solo actualizar campos que existen en el modelo User (identidad)
    identity_fields = ["email", "role", "is_active"]
    for field, value in update_data.items():
        if field in identity_fields:
            setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, db_user: User) -> None:
    """Delete user permanently"""
    db.delete(db_user)
    db.commit()
