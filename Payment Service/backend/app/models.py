from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, index=True, nullable=False)
    payment_commitment_id = Column(Integer, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    course_name = Column(String(200), nullable=True)
    status = Column(String(50), default="PENDING", nullable=False) # PENDING, APPROVED, DECLINED, ERROR
    wompi_transaction_id = Column(String(100), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
