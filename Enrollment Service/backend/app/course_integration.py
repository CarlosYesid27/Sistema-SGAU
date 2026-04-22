import os
import httpx
import jwt
import asyncio
from datetime import datetime, timedelta
from fastapi import HTTPException

COURSE_SERVICE_URL = os.getenv("COURSE_SERVICE_URL", "http://course_backend:8001")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"

def create_internal_token(sub: str = "0") -> str:
    """Genera un token sintético con rol admin para sistemas internos."""
    expire = datetime.utcnow() + timedelta(minutes=5)
    to_encode = {
        "sub": sub,
        "email": "system@sgau.internal",
        "role": "admin",
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_course_details(course_id: int):
    """Obtiene los detalles de una materia desde Course Service, incluyendo sus prerrequisitos."""
    token = create_internal_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{COURSE_SERVICE_URL}/courses/{course_id}", headers=headers, timeout=5.0)
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Materia no ofertada o no encontrada.")
            if response.status_code != 200:
                raise HTTPException(status_code=502, detail="Error de comunicación con el catálogo de materias.")
                
            return response.json()
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"No se pudo conectar a Course Service: {exc}")

async def get_multiple_course_details(course_ids: list[int]):
    """Obtiene los detalles de múltiples materias simultáneamente."""
    if not course_ids:
        return []
    
    tasks = [get_course_details(cid) for cid in set(course_ids)]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    valid_courses = []
    for r in results:
        if not isinstance(r, Exception):
            valid_courses.append(r)
    return valid_courses
