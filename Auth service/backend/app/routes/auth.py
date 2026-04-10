from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app import crud
from app.schemas import UserRegister, UserLogin, TokenResponse, UserResponse, UserManageUpdate, UserProfileCombined
from app.security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user, TokenPayload, check_admin
from app import user_sync
import asyncio

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user split: Identity in Auth, Profile in User Service
    """
    # 1. Crear identidad en este servicio
    user = crud.create_user(db, user_data)
    
    # 2. Sincronizar perfil completo con User Service (bloqueante para asegurar consistencia inicial)
    # Pasamos el objeto completo user_data que tiene los campos biográficos y el ID generado
    await user_sync.sync_create_user(user_data, user.id) 
    
    return user

@router.post("/login", response_model=TokenResponse)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login user and get JWT token (Identity Only)
    """
    # Authenticate user
    user = crud.authenticate_user(db, user_credentials.email, user_credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role,
        expires_delta=access_token_expires
    )
    
    # Note: frontend will call /me to get name and other details
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role
    )

@router.get("/users", response_model=list[UserProfileCombined])
async def list_users(
    _current_user: TokenPayload = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List users with combined profile information (requires admin)"""
    users = crud.get_users(db)
    result = []
    for user in users:
        profile = await user_sync.get_user_profile(user.id)
        
        # Combinar datos de forma segura
        user_data = UserResponse.model_validate(user).model_dump()
        if profile:
            user_data.update(profile)
            
        result.append(UserProfileCombined(**user_data))
    return result

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserManageUpdate,
    _current_user: TokenPayload = Depends(check_admin),
    db: Session = Depends(get_db)
):
    """Update user identity (Auth) and profile (User Service)"""
    db_user = crud.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Actualizar identidad local
    updated = crud.update_user(db, db_user, user_data)
    
    # Sincronizar cambios de perfil con User Service
    profile_updates = user_data.model_dump(exclude_unset=True)
    asyncio.create_task(user_sync.sync_update_user(user_id, profile_updates))
    
    return updated

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    _current_user: TokenPayload = Depends(check_admin),
    db: Session = Depends(get_db)
):
    """Delete user from both services"""
    db_user = crud.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    crud.delete_user(db, db_user)
    asyncio.create_task(user_sync.sync_delete_user(user_id))
    return None

@router.get("/me", response_model=UserProfileCombined)
async def get_current_user_info(
    current_user: TokenPayload = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user information combined from Auth and User Service
    """
    user = crud.get_user_by_id(db, current_user.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Obtener datos de perfil biográficos desde el otro microservicio
    profile = await user_sync.get_user_profile(user.id)
    
    # Combinar los datos: identidad local + perfil remoto
    # Nota: El email y role vienen de ambas partes, pero Auth es la fuente de verdad para identidad
    user_data = UserResponse.model_validate(user).model_dump()
    if profile:
        user_data.update(profile)
    
    return UserProfileCombined(**user_data)

@router.get("/verify-token")
async def verify_token(current_user: TokenPayload = Depends(get_current_user)):
    """
    Verify if the provided JWT token is valid
    
    Returns user information if token is valid
    """
    return {
        "status": "valid",
        "user_id": current_user.sub,
        "email": current_user.email,
        "role": current_user.role
    }

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "Auth Service is running"}
