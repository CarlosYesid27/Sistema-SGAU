from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.database import Base


class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)
    enrollment_id = Column(Integer, unique=True, index=True, nullable=False)
    student_id = Column(Integer, index=True, nullable=False)
    course_id = Column(Integer, index=True, nullable=False)

    # Notas (escala colombiana 0.0 - 5.0)
    partial1 = Column(Float, nullable=True)    # Primer parcial   — 30%
    partial2 = Column(Float, nullable=True)    # Segundo parcial  — 30%
    final_exam = Column(Float, nullable=True)  # Examen final     — 40%

    # Calculados automáticamente
    average = Column(Float, nullable=True)     # Promedio ponderado
    status = Column(String, default="IN_PROGRESS", nullable=False)
    # IN_PROGRESS — notas incompletas
    # PASSED      — promedio >= 3.0
    # FAILED      — promedio < 3.0

    graded_by = Column(Integer, nullable=True)  # ID del docente que registró

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
