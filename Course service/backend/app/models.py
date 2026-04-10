from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    credits = Column(Integer, nullable=False)
    schedule = Column(String(100), nullable=True)
    teacher_id = Column(Integer, nullable=True) # Referencia al User Service
    academic_program = Column(String(100), nullable=True)  # Programa al que pertenece la materia
    
    # Self-referential many-to-many relationship for prerequisites
    prerequisites = relationship(
        "Course",
        secondary="course_prerequisites",
        primaryjoin="Course.id==CoursePrerequisite.course_id",
        secondaryjoin="Course.id==CoursePrerequisite.prerequisite_id",
        backref="is_prerequisite_for"
    )

class CoursePrerequisite(Base):
    __tablename__ = "course_prerequisites"
    
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)
    prerequisite_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)
