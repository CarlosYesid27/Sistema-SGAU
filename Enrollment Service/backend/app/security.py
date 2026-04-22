import os
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"

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

        user_id = int(user_id_raw)
        return TokenPayload(sub=user_id, email=email, role=role, exp=exp)

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def get_current_user(credentials = Depends(security)):
    token = credentials.credentials
    return verify_token(token)
