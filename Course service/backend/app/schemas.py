from typing import List, Optional
from pydantic import BaseModel

# --- Course Base ---
class CourseBase(BaseModel):
    name: str
    description: Optional[str] = None
    credits: int
    schedule: Optional[str] = None
    teacher_id: Optional[int] = None
    academic_program: Optional[str] = None  # Programa al que se oferta la materia
    is_offered: bool = False

# --- Course Creation ---
class CourseCreate(CourseBase):
    pass

# --- Course Update ---
class CourseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    credits: Optional[int] = None
    schedule: Optional[str] = None
    teacher_id: Optional[int] = None
    academic_program: Optional[str] = None
    is_offered: Optional[bool] = None

# --- Course Prerequisite ---
class PrerequisiteCreate(BaseModel):
    prerequisite_id: int

# --- Response Models ---
class CourseResponseSimple(CourseBase):
    id: int
    
    class Config:
        from_attributes = True

class CourseResponseDetail(CourseResponseSimple):
    teacher_name: Optional[str] = None
    prerequisites: List[CourseResponseSimple] = []

    class Config:
        from_attributes = True
