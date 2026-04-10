from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# ─── Payment Commitment ──────────────────────────────────────────────────────

class PaymentCommitmentResponse(BaseModel):
    id: int
    enrollment_id: int
    amount: float
    due_date: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# ─── Enrollment ───────────────────────────────────────────────────────────────

class EnrollmentCreate(BaseModel):
    course_id: int

class EnrollmentResponse(BaseModel):
    id: int
    student_id: int
    course_id: int
    enrollment_date: datetime
    status: str
    payment: Optional[PaymentCommitmentResponse] = None

    class Config:
        from_attributes = True

class EnrollmentStatusUpdate(BaseModel):
    status: str
