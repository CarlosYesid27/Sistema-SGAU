"""
security.py — Grades Service
Validación de JWT y control de acceso por roles.
"""
import os
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

SECRET_KEY = os.getenv("SECRET_KEY", "sgau-super-secret-jwt-key-min-32-chars-for-production-use")
ALGORITHM = "HS256"

bearer_scheme = HTTPBearer()


class TokenPayload(BaseModel):
    sub: int
    email: str
    role: str
    exp: int


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> TokenPayload:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return TokenPayload(**payload)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")


def require_roles(*roles: str):
    """Dependencia que verifica que el usuario tenga uno de los roles indicados."""
    def _check(current_user: TokenPayload = Depends(get_current_user)) -> TokenPayload:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere rol: {', '.join(roles)}"
            )
        return current_user
    return _check
