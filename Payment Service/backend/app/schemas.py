from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CheckoutRequest(BaseModel):
    payment_commitment_id: int
    amount: float

class CheckoutResponse(BaseModel):
    transaction_id: int
    public_key: str
    amount_in_cents: int
    reference: str
    currency: str = "COP"

class VerifyRequest(BaseModel):
    wompi_transaction_id: str

class TransactionResponse(BaseModel):
    id: int
    student_id: int
    payment_commitment_id: int
    amount: float
    status: str
    wompi_transaction_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
