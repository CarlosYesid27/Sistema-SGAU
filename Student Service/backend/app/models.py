from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class AcademicRecord(Base):
    __tablename__ = "academic_records"
    
    student_id = Column(Integer, primary_key=True, index=True) # Referencia al User Service
    total_credits_earned = Column(Integer, default=0, nullable=False)
    cumulative_gpa = Column(Float, default=0.0, nullable=False)
    academic_status = Column(String(50), default="ACTIVE", nullable=False) # ACTIVE, SUSPENDED, GRADUATED
    
    history = relationship("AcademicHistory", back_populates="record", cascade="all, delete-orphan")

class AcademicHistory(Base):
    __tablename__ = "academic_history"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("academic_records.student_id", ondelete="CASCADE"), index=True, nullable=False)
    course_id = Column(Integer, index=True, nullable=False)
    course_name = Column(String(200), nullable=False)
    term_name = Column(String(50), nullable=True)
    final_grade = Column(Float, nullable=False)
    credits = Column(Integer, nullable=False)
    passed = Column(Boolean, nullable=False)
    
    record = relationship("AcademicRecord", back_populates="history")
