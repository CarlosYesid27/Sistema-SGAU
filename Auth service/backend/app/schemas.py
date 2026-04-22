from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class UserRegister(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    phone: Optional[str] = None
    document_type: str = "C.C"
    document_number: str = Field(..., min_length=3, max_length=30)
    role: str = "estudiante"
    academic_program: Optional[str] = None  # Requerido cuando role=estudiante


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    role: str


class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    is_active: int

    class Config:
        from_attributes = True



class UserProfileCombined(UserResponse):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    document_type: Optional[str] = None
    document_number: Optional[str] = None
    academic_program: Optional[str] = None


class UserManageUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    document_type: Optional[str] = None
    document_number: Optional[str] = None
    role: Optional[str] = None
    academic_program: Optional[str] = None


class TokenPayload(BaseModel):
    sub: int
    email: str
    role: str
    exp: int
