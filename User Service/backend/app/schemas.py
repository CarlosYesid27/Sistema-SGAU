from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserRole(str, Enum):
    admin = "admin"
    docente = "docente"
    estudiante = "estudiante"


class DocumentType(str, Enum):
    cc = "C.C"
    ti = "T.I"


class UserBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    document_type: DocumentType
    document_number: str
    role: UserRole
    academic_program: Optional[str] = None  # Solo requerido para estudiantes


class UserCreate(UserBase):
    id: Optional[int] = None


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    document_type: Optional[DocumentType] = None
    document_number: Optional[str] = None
    role: Optional[UserRole] = None
    academic_program: Optional[str] = None


class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True
