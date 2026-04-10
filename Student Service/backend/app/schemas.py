from typing import List, Optional
from pydantic import BaseModel

# --- Academic History ---
class AcademicHistoryBase(BaseModel):
    course_id: int
    course_name: Optional[str] = None
    term_name: Optional[str] = None
    final_grade: float
    credits: Optional[int] = None
    passed: bool

class AcademicHistoryCreate(AcademicHistoryBase):
    student_id: int

class AcademicHistoryResponse(AcademicHistoryBase):
    id: int
    student_id: int

    class Config:
        from_attributes = True

# --- Academic Record ---
class AcademicRecordBase(BaseModel):
    student_id: int
    academic_status: str

class AcademicRecordUpdate(BaseModel):
    academic_status: Optional[str] = None

class AcademicRecordResponse(AcademicRecordBase):
    total_credits_earned: int
    cumulative_gpa: float
    history: List[AcademicHistoryResponse] = []

    class Config:
        from_attributes = True
