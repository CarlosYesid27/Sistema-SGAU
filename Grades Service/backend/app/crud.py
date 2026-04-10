from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.models import Grade
from app.schemas import GradeCreate, GradeUpdate

# ─── Constantes ───────────────────────────────────────────────────────────────
PASS_THRESHOLD = 3.0   # Nota mínima de aprobación (escala colombiana)

# Pesos de las notas
W_PARTIAL1 = 0.30
W_PARTIAL2 = 0.30
W_FINAL    = 0.40


def _calculate_average(partial1, partial2, final_exam) -> Optional[float]:
    """Calcula el promedio ponderado si todas las notas están presentes."""
    if None in (partial1, partial2, final_exam):
        return None
    return round(partial1 * W_PARTIAL1 + partial2 * W_PARTIAL2 + final_exam * W_FINAL, 2)


def _resolve_status(average) -> str:
    if average is None:
        return "IN_PROGRESS"
    return "PASSED" if average >= PASS_THRESHOLD else "FAILED"


# ─── CRUD ─────────────────────────────────────────────────────────────────────

def create_grade(db: Session, data: GradeCreate) -> Grade:
    grade = Grade(
        enrollment_id=data.enrollment_id,
        student_id=data.student_id,
        course_id=data.course_id,
        status="IN_PROGRESS",
    )
    db.add(grade)
    db.commit()
    db.refresh(grade)
    return grade


def get_grade_by_id(db: Session, grade_id: int):
    return db.query(Grade).filter(Grade.id == grade_id).first()


def get_grade_by_enrollment(db: Session, enrollment_id: int):
    return db.query(Grade).filter(Grade.enrollment_id == enrollment_id).first()


def get_grades_by_student(db: Session, student_id: int):
    return db.query(Grade).filter(Grade.student_id == student_id).all()


def get_grades_by_course(db: Session, course_id: int):
    return db.query(Grade).filter(Grade.course_id == course_id).all()


def update_grade(db: Session, grade: Grade, data: GradeUpdate) -> Grade:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(grade, field, value)

    # Recalcular promedio
    avg = _calculate_average(grade.partial1, grade.partial2, grade.final_exam)
    grade.average = avg
    grade.status = _resolve_status(avg)
    grade.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(grade)
    return grade
