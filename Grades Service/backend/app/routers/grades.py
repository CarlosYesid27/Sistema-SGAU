"""
grades.py — Router principal del Grades Service
Endpoints para registrar y consultar calificaciones.
"""
import os
import logging
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import GradeCreate, GradeUpdate, GradeResponse
from app.security import TokenPayload, get_current_user, require_roles
import app.crud as crud

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/grades", tags=["grades"])

ENROLLMENT_SERVICE_URL = os.getenv("ENROLLMENT_SERVICE_URL", "http://enrollment_backend:8000")
SECRET_KEY = os.getenv("SECRET_KEY", "sgau-super-secret-jwt-key-min-32-chars-for-production-use")


def _get_system_token() -> str:
    """Genera un token de servicio para comunicación interna (M2M)."""
    import jwt
    from datetime import datetime, timedelta
    payload = {
        "sub": 0,
        "email": "system@sgau.internal",
        "role": "admin",
        "exp": datetime.utcnow() + timedelta(minutes=5),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


STUDENT_SERVICE_URL = os.getenv("STUDENT_SERVICE_URL", "http://student_backend:8000")

async def _notify_enrollment_status(enrollment_id: int, new_status: str) -> None:
    """Notifica al Enrollment Service para actualizar el status de la inscripción."""
    url = f"{ENROLLMENT_SERVICE_URL}/enrollments/{enrollment_id}/status"
    headers = {"Authorization": f"Bearer {_get_system_token()}"}
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.patch(url, json={"status": new_status}, headers=headers)
            if resp.status_code not in (200, 204):
                logger.warning("No se pudo actualizar el estado de la inscripción %s: %s", enrollment_id, resp.text)
    except Exception as exc:
        logger.error("Error notificando al Enrollment Service: %s", exc)

async def _notify_student_service(grade) -> None:
    """Notifica al Student Service para guardar el registro histórico."""
    url = f"{STUDENT_SERVICE_URL}/students/history"
    headers = {"Authorization": f"Bearer {_get_system_token()}"}
    payload = {
        "student_id": grade.student_id,
        "course_id": grade.course_id,
        "final_grade": grade.average,
        "passed": grade.status == "PASSED"
    }
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code not in (200, 201):
                logger.warning("No se pudo agregar nota al historial del estudiante %s: %s", grade.student_id, resp.text)
    except Exception as exc:
        logger.error("Error notificando al Student Service: %s", exc)

# ─── Health ───────────────────────────────────────────────────────────────────

@router.get("/health")
def health():
    return {"status": "Grades Service is running"}


# ─── Crear registro de nota (uso interno / docente / admin) ───────────────────

@router.post("/", response_model=GradeResponse, status_code=status.HTTP_201_CREATED)
def create_grade(
    data: GradeCreate,
    db: Session = Depends(get_db),
    _current_user: TokenPayload = Depends(require_roles("admin", "docente")),
):
    """
    Crea un registro de nota vacío (IN_PROGRESS) para un estudiante en una materia.
    Se llama una vez cuando el docente abre el acta de calificaciones.
    """
    existing = crud.get_grade_by_enrollment(db, data.enrollment_id)
    if existing:
        raise HTTPException(status_code=409, detail="Ya existe un registro de nota para esta inscripción.")
    return crud.create_grade(db, data)


# ─── Notas del estudiante autenticado ─────────────────────────────────────────

@router.get("/me", response_model=list[GradeResponse])
def get_my_grades(
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(require_roles("estudiante")),
):
    """Retorna todas las calificaciones del estudiante autenticado."""
    return crud.get_grades_by_student(db, current_user.sub)


# ─── Notas de una materia (para docentes/admin) ───────────────────────────────

@router.get("/course/{course_id}", response_model=list[GradeResponse])
def get_grades_by_course(
    course_id: int,
    db: Session = Depends(get_db),
    _current_user: TokenPayload = Depends(require_roles("docente", "admin")),
):
    """Retorna todas las calificaciones de los estudiantes en una materia."""
    return crud.get_grades_by_course(db, course_id)


# ─── Actualizar nota (docente/admin) ──────────────────────────────────────────

@router.put("/{grade_id}", response_model=GradeResponse)
async def update_grade(
    grade_id: int,
    data: GradeUpdate,
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(require_roles("docente", "admin")),
):
    """
    Actualiza las notas parciales y/o el examen final de un estudiante.
    Cuando las tres notas estén completas, calcula el promedio y actualiza
    el estado de la inscripción en el Enrollment Service (PASSED/FAILED).
    """
    grade = crud.get_grade_by_id(db, grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Registro de nota no encontrado.")

    # Asignar quién registró si no viene en el payload
    if data.graded_by is None:
        data.graded_by = current_user.sub

    prev_status = grade.status
    updated = crud.update_grade(db, grade, data)

    # Notificar al Enrollment Service si el estado de aprobación cambió
    if updated.status != prev_status and updated.status in ("PASSED", "FAILED"):
        await _notify_enrollment_status(updated.enrollment_id, updated.status)
        await _notify_student_service(updated)

    return updated


# ─── Obtener nota por inscripción ─────────────────────────────────────────────

@router.get("/enrollment/{enrollment_id}", response_model=GradeResponse)
def get_grade_by_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user),
):
    """Obtiene el registro de nota de una inscripción específica."""
    grade = crud.get_grade_by_enrollment(db, enrollment_id)
    if not grade:
        raise HTTPException(status_code=404, detail="No hay registro de nota para esta inscripción.")
    # Los estudiantes solo pueden ver sus propias notas
    if current_user.role == "estudiante" and grade.student_id != current_user.sub:
        raise HTTPException(status_code=403, detail="No autorizado.")
    return grade
