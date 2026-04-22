from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas
from app.database import get_db
from app.security import get_current_user, TokenPayload
from app.course_integration import get_course_details, get_multiple_course_details
from app.saga import EnrollmentSagaOrchestrator

router = APIRouter(
    prefix="/enrollments",
    tags=["Enrollments"],
)

# ─── Dependencias de Rol ──────────────────────────────────────────────────────

async def verify_student(current_user: TokenPayload = Depends(get_current_user)):
    if current_user.role != "estudiante":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo estudiantes pueden gestionar sus inscripciones.")
    return current_user

async def verify_staff(current_user: TokenPayload = Depends(get_current_user)):
    if current_user.role not in ["docente", "admin"]:
        raise HTTPException(status_code=403, detail="Acceso denegado. Se requiere rol de docente o administrador.")
    return current_user

# ─── Cupos Disponibles ────────────────────────────────────────────────────────

MAX_SLOTS = 20

@router.get("/slots", response_model=dict)
async def get_slots(
    _current_user: TokenPayload = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retorna los cupos disponibles para todas las materias con inscripciones activas.
    Formato: { "course_id": cupos_disponibles }
    """
    from app.models import Enrollment
    from sqlalchemy import func

    rows = (
        db.query(Enrollment.course_id, func.count(Enrollment.id).label("total"))
        .filter(Enrollment.status.in_(["PENDING", "ENROLLED"]))
        .group_by(Enrollment.course_id)
        .all()
    )
    return {str(row.course_id): MAX_SLOTS - row.total for row in rows}


# ─── Inscripción (Orquestada por el Saga) ─────────────────────────────────────

@router.post("/course/{course_id}", response_model=schemas.EnrollmentResponse, status_code=status.HTTP_201_CREATED)
async def enroll_in_course(
    course_id: int,
    current_user: TokenPayload = Depends(verify_student),
    db: Session = Depends(get_db)
):
    """Inscribe a un estudiante usando el Patrón Saga con compensación automática."""
    student_id = int(current_user.sub)

    # ── Paso 1 (Pre-Saga): Validaciones de negocio ───────────────────────────
    # 1a. Verificar si ya está inscrito o aprobado
    existing = crud.get_student_enrollment_in_course(db, student_id, course_id)
    if existing:
        if existing.status in ["ENROLLED", "PENDING"]:
            raise HTTPException(status_code=400, detail="Ya te encuentras matriculado en esta materia.")
        if existing.status == "PASSED":
            raise HTTPException(status_code=400, detail="Ya tienes esta materia aprobada.")

    # 1b. Verificar cupos (Max 20)
    active_count = crud.count_active_enrollments(db, course_id)
    if active_count >= 20:
        raise HTTPException(status_code=422, detail="No hay cupos disponibles. El límite de 20 estudiantes se ha alcanzado.")

    # 1c. Validar prerrequisitos vía Course Service (M2M)
    course_data = await get_course_details(course_id)
    prereqs = course_data.get("prerequisites", [])
    for prereq in prereqs:
        req_id = prereq.get("id")
        req_name = prereq.get("name")
        if not crud.has_passed_course(db, student_id, req_id):
            raise HTTPException(
                status_code=400,
                detail=f"Inscripción bloqueada. No cumples el prerrequisito: '{req_name}' (Debe estar PASSED)."
            )

    # 1d. Validar cruce de horarios
    new_schedule = course_data.get("schedule")
    if new_schedule and new_schedule.strip() and new_schedule.strip().lower() != "por definir":
        active_enrollments = [e for e in crud.get_enrollments_by_student(db, student_id) if e.status in ["PENDING", "ENROLLED"]]
        enrolled_course_ids = [e.course_id for e in active_enrollments]
        
        if enrolled_course_ids:
            enrolled_courses_data = await get_multiple_course_details(enrolled_course_ids)
            for e_course in enrolled_courses_data:
                e_schedule = e_course.get("schedule")
                if e_schedule and e_schedule.strip() == new_schedule.strip():
                    raise HTTPException(
                        status_code=400,
                        detail=f"No puedes inscribirte en esta materia porque su horario se cruza con otra materia inscrita ('{e_course.get('name')}')."
                    )

    # ── Pasos 2-4: Ejecutar el Saga ───────────────────────────────────────────
    saga = EnrollmentSagaOrchestrator()
    enrollment = await saga.execute(db, student_id, course_id, course_data)
    return enrollment


# ─── Mis Inscripciones ────────────────────────────────────────────────────────

@router.get("/me", response_model=List[schemas.EnrollmentResponse])
async def my_enrollments(
    current_user: TokenPayload = Depends(verify_student),
    db: Session = Depends(get_db)
):
    """Ver mis materias matriculadas (historial completo con pago embebido)."""
    student_id = int(current_user.sub)
    return crud.get_enrollments_by_student(db, student_id)


@router.get("/me/payments", response_model=List[schemas.PaymentCommitmentResponse])
async def my_payments(
    current_user: TokenPayload = Depends(verify_student),
    db: Session = Depends(get_db)
):
    """Ver todos mis compromisos de pago pendientes."""
    student_id = int(current_user.sub)
    return crud.get_payments_by_student(db, student_id)

@router.patch("/me/{enrollment_id}/cancel", response_model=schemas.EnrollmentResponse)
async def cancel_my_enrollment(
    enrollment_id: int,
    current_user: TokenPayload = Depends(verify_student),
    db: Session = Depends(get_db)
):
    """Permite al estudiante cancelar voluntariamente una inscripción activa."""
    student_id = int(current_user.sub)
    updated = crud.cancel_student_course(db, enrollment_id, student_id)
    if not updated:
        raise HTTPException(status_code=400, detail="No se pudo cancelar la materia. Verifica que estés inscrito.")
    return updated


# ─── Endpoints Staff/Admin ────────────────────────────────────────────────────

@router.get("/course/{course_id}", response_model=List[schemas.EnrollmentResponse])
async def list_course_students(
    course_id: int,
    current_user: TokenPayload = Depends(verify_staff),
    db: Session = Depends(get_db)
):
    """Lista todos los registros de inscripción de un curso (Para docentes y admins)."""
    return crud.get_enrollments_by_course(db, course_id)

@router.patch("/payments/{payment_id}/status")
async def update_payment_commitment_status(
    payment_id: int,
    status_update: dict,
    _current_user: TokenPayload = Depends(verify_staff), # Asumimos token M2M generado por admin
    db: Session = Depends(get_db)
):
    """Actualiza el estado de un compromiso de pago (Llamado via M2M desde Payment Service)."""
    new_status = status_update.get("status")
    if new_status not in ["PAID", "CANCELLED", "PENDING_PAYMENT"]:
        raise HTTPException(status_code=400, detail="Estado de pago inválido.")
        
    payment = crud.update_payment_status(db, payment_id, new_status)
    if not payment:
        raise HTTPException(status_code=404, detail="Compromiso de pago no encontrado.")
        
    # Si se pagó exitosamente, enroll the student
    if new_status == "PAID":
        crud.update_enrollment_status(db, payment.enrollment_id, "ENROLLED")
        
    return payment

@router.put("/{enrollment_id}/status", response_model=schemas.EnrollmentResponse)
async def update_status(
    enrollment_id: int,
    status_update: schemas.EnrollmentStatusUpdate,
    _current_user: TokenPayload = Depends(verify_staff),
    db: Session = Depends(get_db)
):
    """Actualiza el estado de una inscripción (PASSED/FAILED/ENROLLED)."""
    if status_update.status not in ["ENROLLED", "PASSED", "FAILED"]:
        raise HTTPException(status_code=400, detail="Estado inválido.")

    updated = crud.update_enrollment_status(db, enrollment_id, status_update.status)
    if not updated:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada.")
    return updated


@router.patch("/{enrollment_id}/status", response_model=schemas.EnrollmentResponse)
async def patch_status(
    enrollment_id: int,
    status_update: schemas.EnrollmentStatusUpdate,
    _current_user: TokenPayload = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualiza el estado de una inscripción. Usado internamente por el Grades Service (M2M)."""
    allowed = ["ENROLLED", "PASSED", "FAILED", "PENDING"]
    if status_update.status not in allowed:
        raise HTTPException(status_code=400, detail="Estado inválido.")
    updated = crud.update_enrollment_status(db, enrollment_id, status_update.status)
    if not updated:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada.")
    return updated
