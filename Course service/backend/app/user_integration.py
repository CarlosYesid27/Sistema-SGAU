import os
import httpx
import time
import jwt
from fastapi import HTTPException, status

USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://user_backend:8000")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")

def _get_auth_header() -> dict:
    """Genera un token JWT sintético para comunicación interna."""
    payload = {
        "sub": "0",
        "email": "system@sgau.internal",
        "role": "admin",
        "exp": int(time.time()) + 300
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}

async def verify_teacher(teacher_id: int):
    """
    Se comunica con el User Service para verificar que el usuario con el id dado 
    existe y tiene el rol 'docente'.
    """
    async with httpx.AsyncClient() as client:
        try:
            # Hacer petición GET al User Service con token interno
            headers = _get_auth_header()
            response = await client.get(f"{USER_SERVICE_URL}/users/{teacher_id}", headers=headers)
            
            if response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El docente con ID {teacher_id} no existe en el sistema."
                )
            elif response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error al comunicarse con el User Service."
                )
                
            user_data = response.json()
            if user_data.get("role") != "docente":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El usuario con ID {teacher_id} no tiene rol 'docente' (rol actual: {user_data.get('role')})."
                )
                
            return user_data
            
        except httpx.RequestError as exc:
            print(f"[ERROR] Error al solicitar información al User Service: {exc}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="El User Service no se encuentra disponible."
            )
