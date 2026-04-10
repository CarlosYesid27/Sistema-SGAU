import os
import jwt
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

ALGORITHM = "HS256"
# La SECRET_KEY debe ser la misma que la del Auth Service
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")

security = HTTPBearer()

class TokenPayload(BaseModel):
    sub: int
    email: str
    role: str
    exp: int

def verify_token(token: str) -> TokenPayload:
    """
    Verifica la validez de un token JWT generado por el Auth Service.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_raw = payload.get("sub")
        email: str = payload.get("email")
        role: str = payload.get("role")
        exp: int = payload.get("exp")
        
        if user_id_raw is None or email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Token inválido: falta información de usuario"
            )
            
        return TokenPayload(sub=int(user_id_raw), email=email, role=role, exp=exp)
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="El token ha expirado"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Token inválido"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail=f"Error al validar token: {str(e)}"
        )

async def get_current_user(credentials = Depends(security)) -> TokenPayload:
    """
    Dependencia para proteger las rutas. Retorna el payload del token si es válido.
    """
    token = credentials.credentials
    return verify_token(token)

async def check_admin(current_user: TokenPayload = Depends(get_current_user)):
    """
    Verifica si el usuario actual tiene rol de administrador.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de administrador para realizar esta acción"
        )
    return current_user
