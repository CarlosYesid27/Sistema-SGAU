from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, schemas, models
from app.database import get_db
from app.security import get_current_user, TokenPayload, require_roles

router = APIRouter(
    prefix="/students",
    tags=["Students"],
)

@router.get("/me/history", response_model=schemas.AcademicRecordResponse)
async def get_my_history(
    _current_user: TokenPayload = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Estudiantes pueden ver su propia historia"""
    if _current_user.role != 'estudiante':
        raise HTTPException(status_code=403, detail="Solo estudiantes pueden acceder a esto")
        
    # Usamos _current_user.sub que mapea al user id
    student_id = int(_current_user.sub)
    return crud.get_record(db, student_id=student_id)

@router.get("/{student_id}/history", response_model=schemas.AcademicRecordResponse)
async def get_student_history(
    student_id: int,
    _current_user: TokenPayload = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Profesores o Admin pueden ver historial de estudiantes específicos"""
    if _current_user.role == 'estudiante' and int(_current_user.sub) != student_id:
         raise HTTPException(status_code=403, detail="No puedes ver notas de otros")
         
    return crud.get_record(db, student_id=student_id)

import os
import httpx

COURSE_SERVICE_URL = os.getenv("COURSE_SERVICE_URL", "http://course_backend:8000")

def _get_system_token() -> str:
    import jwt
    from datetime import datetime, timedelta
    SECRET_KEY = os.getenv("SECRET_KEY", "sgau-super-secret-jwt-key-min-32-chars-for-production-use")
    payload = {
        "sub": 0,
        "email": "system@sgau.internal",
        "role": "admin",
        "exp": datetime.utcnow() + timedelta(minutes=5),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

@router.post("/history", response_model=schemas.AcademicRecordResponse, status_code=status.HTTP_201_CREATED)
async def add_history_entry(
    entry: schemas.AcademicHistoryCreate,
    _current_user: TokenPayload = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    """Llamado internamente (M2M) desde Grades Service o por un admin"""
    # Fetch course details if not provided
    if entry.course_name is None or entry.credits is None:
        url = f"{COURSE_SERVICE_URL}/courses/{entry.course_id}"
        headers = {"Authorization": f"Bearer {_get_system_token()}"}
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                course_data = resp.json()
                entry.course_name = entry.course_name or course_data.get("name", "Desconocido")
                entry.credits = entry.credits or course_data.get("credits", 0)
            else:
                entry.course_name = entry.course_name or "Desconocido"
                entry.credits = entry.credits or 0

    return crud.add_history_entry(db, entry=entry)
