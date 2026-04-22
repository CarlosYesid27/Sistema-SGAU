from datetime import datetime, timedelta
import os
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

class TokenPayload(BaseModel):
    sub: int
    email: str
    role: str
    exp: int

def verify_token(token: str) -> TokenPayload:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_raw = payload.get("sub")
        email: str = payload.get("email")
        role: str = payload.get("role")
        exp: int = payload.get("exp")
        if user_id_raw is None or email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return TokenPayload(sub=int(user_id_raw), email=email, role=role, exp=exp)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def get_current_user(credentials=Depends(security)):
    return verify_token(credentials.credentials)

async def check_admin(current_user: TokenPayload = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requiere rol de administrador.")
    return current_user

def create_internal_token() -> str:
    """Token M2M para llamadas internas entre servicios."""
    payload = {
        "sub": "0",
        "email": "reporting@internal.sgau",
        "role": "admin",
        "exp": datetime.utcnow() + timedelta(minutes=5)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
