from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CheckoutRequest(BaseModel):
    payment_commitment_id: int
    amount: float
    course_name: Optional[str] = None

class CheckoutResponse(BaseModel):
    transaction_id: int
    init_point: str

class VerifyRequest(BaseModel):
    transaction_id: str

class TransactionResponse(BaseModel):
    id: int
    student_id: int
    payment_commitment_id: int
    amount: float
    course_name: Optional[str] = None
    status: str
    wompi_transaction_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
