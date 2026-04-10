"""
Saga Orchestrator - Enrollment Service
Implementa el Patrón Saga con flujo de compensación para garantizar 
consistencia en transacciones distribuidas.

Flujo de Pasos:
  Paso 1 → Validar cupos y prerrequisitos (Course Service)
  Paso 2 → Crear Enrollment(PENDING)
  Paso 3 → Crear PaymentCommitment
  Paso 4 → Confirmar Enrollment(ENROLLED)

Compensación (rollback) en orden inverso:
  Si falla Paso 4 → cancelar PaymentCommitment + cancelar Enrollment
  Si falla Paso 3 → cancelar Enrollment
  Si falla Paso 2 → sin acción (nada fue escrito)
"""
import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app import crud

logger = logging.getLogger(__name__)


class EnrollmentSagaOrchestrator:

    async def execute(self, db: Session, student_id: int, course_id: int, course_data: dict):
        """
        Ejecuta el proceso de inscripción completo con compensación automática.
        Retorna la inscripción confirmada con su compromiso de pago.
        """
        enrollment_id = None
        payment_id = None
        credits = course_data.get("credits", 3)  # Créditos de la materia (por defecto 3)

        # ──── PASO 2: Crear Enrollment en estado PENDING ─────────────────────
        try:
            logger.info(f"[SAGA] Paso 2: Creando Enrollment PENDING - student={student_id}, course={course_id}")
            enrollment = crud.create_enrollment_pending(db, student_id, course_id)
            enrollment_id = enrollment.id
            logger.info(f"[SAGA] Paso 2: OK → enrollment_id={enrollment_id}")
        except Exception as exc:
            logger.error(f"[SAGA] Paso 2 FALLÓ: {exc}")
            raise HTTPException(status_code=500, detail=f"Error creando inscripción: {exc}")

        # ──── PASO 3: Crear PaymentCommitment ────────────────────────────────
        try:
            logger.info(f"[SAGA] Paso 3: Generando Compromiso de Pago - {credits} créditos")
            payment = crud.create_payment_commitment(db, enrollment_id, credits)
            payment_id = payment.id
            logger.info(f"[SAGA] Paso 3: OK → payment_id={payment_id}, amount={payment.amount}")
        except Exception as exc:
            logger.error(f"[SAGA] Paso 3 FALLÓ → compensando Paso 2 (borrar enrollment_id={enrollment_id})")
            self._compensate_enrollment(db, enrollment_id)
            raise HTTPException(status_code=500, detail=f"Error generando compromiso de pago: {exc}")

        # ──── PASO 4: Confirmar Enrollment como ENROLLED ─────────────────────
        try:
            logger.info(f"[SAGA] Paso 4: Confirmando Enrollment → ENROLLED")
            confirmed = crud.confirm_enrollment(db, enrollment_id)
            logger.info(f"[SAGA] Paso 4: OK → Saga completada exitosamente ✅")
            return confirmed
        except Exception as exc:
            logger.error(f"[SAGA] Paso 4 FALLÓ → compensando Pasos 3 y 2")
            self._compensate_payment(db, payment_id)
            self._compensate_enrollment(db, enrollment_id)
            raise HTTPException(status_code=500, detail=f"Error confirmando inscripción: {exc}")

    def _compensate_enrollment(self, db: Session, enrollment_id: int):
        """Compensación: borra la inscripción creada"""
        if enrollment_id:
            try:
                crud.cancel_enrollment(db, enrollment_id)
                logger.info(f"[SAGA][COMPENSACIÓN] ✅ Enrollment {enrollment_id} eliminado")
            except Exception as exc:
                logger.error(f"[SAGA][COMPENSACIÓN] ❌ Error eliminando enrollment {enrollment_id}: {exc}")

    def _compensate_payment(self, db: Session, payment_id: int):
        """Compensación: borra el compromiso de pago creado"""
        if payment_id:
            try:
                crud.cancel_payment_commitment(db, payment_id)
                logger.info(f"[SAGA][COMPENSACIÓN] ✅ PaymentCommitment {payment_id} eliminado")
            except Exception as exc:
                logger.error(f"[SAGA][COMPENSACIÓN] ❌ Error eliminando payment {payment_id}: {exc}")
