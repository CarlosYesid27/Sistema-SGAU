from sqlalchemy.orm import Session
from app.models import Enrollment, PaymentCommitment
from datetime import datetime, timedelta

# ─── Enrollment CRUD ──────────────────────────────────────────────────────────

def get_enrollments_by_student(db: Session, student_id: int):
    return db.query(Enrollment).filter(Enrollment.student_id == student_id).all()

def get_enrollments_by_course(db: Session, course_id: int):
    return db.query(Enrollment).filter(Enrollment.course_id == course_id).all()

def count_active_enrollments(db: Session, course_id: int):
    return db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.status.in_(["PENDING", "ENROLLED"])
    ).count()

def get_student_enrollment_in_course(db: Session, student_id: int, course_id: int):
    return db.query(Enrollment).filter(
        Enrollment.student_id == student_id,
        Enrollment.course_id == course_id
    ).first()

def create_enrollment_pending(db: Session, student_id: int, course_id: int) -> Enrollment:
    """Crea inscripción en estado PENDING (Paso 1 del Saga)"""
    db_enrollment = Enrollment(
        student_id=student_id,
        course_id=course_id,
        status="PENDING"
    )
    db.add(db_enrollment)
    db.commit()
    db.refresh(db_enrollment)
    return db_enrollment

def confirm_enrollment(db: Session, enrollment_id: int) -> Enrollment:
    """Confirma la inscripción de PENDING → ENROLLED (Paso 4 del Saga)"""
    db_enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if db_enrollment:
        db_enrollment.status = "ENROLLED"
        db.commit()
        db.refresh(db_enrollment)
    return db_enrollment

def cancel_enrollment(db: Session, enrollment_id: int):
    """Compensación: elimina el Enrollment si el Saga falla"""
    db_enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if db_enrollment:
        db.delete(db_enrollment)
        db.commit()

def update_enrollment_status(db: Session, enrollment_id: int, status: str):
    db_enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if db_enrollment:
        db_enrollment.status = status
        db.commit()
        db.refresh(db_enrollment)
    return db_enrollment

def has_passed_course(db: Session, student_id: int, course_id: int) -> bool:
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == student_id,
        Enrollment.course_id == course_id,
        Enrollment.status == "PASSED"
    ).first()
    return enrollment is not None

# ─── PaymentCommitment CRUD ───────────────────────────────────────────────────

PAYMENT_AMOUNT_PER_CREDIT = 125_000  # $125,000 COP por crédito

def create_payment_commitment(db: Session, enrollment_id: int, credits: int) -> PaymentCommitment:
    """Genera el compromiso de pago (Paso 3 del Saga)"""
    amount = credits * PAYMENT_AMOUNT_PER_CREDIT
    due_date = datetime.utcnow() + timedelta(days=15)

    payment = PaymentCommitment(
        enrollment_id=enrollment_id,
        amount=amount,
        due_date=due_date,
        status="PENDING_PAYMENT"
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

def cancel_payment_commitment(db: Session, payment_id: int):
    """Compensación: elimina el PaymentCommitment si el Saga falla"""
    payment = db.query(PaymentCommitment).filter(PaymentCommitment.id == payment_id).first()
    if payment:
        db.delete(payment)
        db.commit()

def get_payment_by_enrollment(db: Session, enrollment_id: int):
    return db.query(PaymentCommitment).filter(PaymentCommitment.enrollment_id == enrollment_id).first()

def get_payments_by_student(db: Session, student_id: int):
    """Obtiene todos los compromisos de pago del estudiante a través de sus inscripciones"""
    enrollments = db.query(Enrollment).filter(
        Enrollment.student_id == student_id
    ).all()
    enrollment_ids = [e.id for e in enrollments]
    return db.query(PaymentCommitment).filter(
        PaymentCommitment.enrollment_id.in_(enrollment_ids)
    ).all()

def update_payment_status(db: Session, payment_id: int, status: str):
    payment = db.query(PaymentCommitment).filter(PaymentCommitment.id == payment_id).first()
    if payment:
        payment.status = status
        db.commit()
        db.refresh(payment)
    return payment
