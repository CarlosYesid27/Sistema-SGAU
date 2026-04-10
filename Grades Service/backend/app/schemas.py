from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# ─── Create ───────────────────────────────────────────────────────────────────

class GradeCreate(BaseModel):
    enrollment_id: int
    student_id: int
    course_id: int


# ─── Update (por el docente) ──────────────────────────────────────────────────

class GradeUpdate(BaseModel):
    partial1: Optional[float] = Field(None, ge=0.0, le=5.0)
    partial2: Optional[float] = Field(None, ge=0.0, le=5.0)
    final_exam: Optional[float] = Field(None, ge=0.0, le=5.0)
    graded_by: Optional[int] = None


# ─── Response ─────────────────────────────────────────────────────────────────

class GradeResponse(BaseModel):
    id: int
    enrollment_id: int
    student_id: int
    course_id: int
    partial1: Optional[float] = None
    partial2: Optional[float] = None
    final_exam: Optional[float] = None
    average: Optional[float] = None
    status: str
    graded_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
