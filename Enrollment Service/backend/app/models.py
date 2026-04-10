from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, index=True, nullable=False)
    course_id = Column(Integer, index=True, nullable=False)
    enrollment_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="PENDING", nullable=False)  # PENDING, ENROLLED, PASSED, FAILED

    # Relación hacia el compromiso de pago
    payment = relationship("PaymentCommitment", back_populates="enrollment", uselist=False, cascade="all, delete-orphan")


class PaymentCommitment(Base):
    __tablename__ = "payment_commitments"

    id = Column(Integer, primary_key=True, index=True)
    enrollment_id = Column(Integer, ForeignKey("enrollments.id"), nullable=False, unique=True)
    amount = Column(Float, nullable=False)           # Monto en pesos colombianos
    due_date = Column(DateTime, nullable=False)      # Fecha límite de pago (15 días)
    status = Column(String, default="PENDING_PAYMENT", nullable=False)  # PENDING_PAYMENT, PAID, CANCELLED
    created_at = Column(DateTime, default=datetime.utcnow)

    enrollment = relationship("Enrollment", back_populates="payment")
