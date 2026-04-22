from sqlalchemy.orm import Session
from app import models

def get_transaction(db: Session, transaction_id: int):
    return db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()

def create_pending_transaction(db: Session, student_id: int, payment_commitment_id: int, amount: float, course_name: str = None):
    db_txn = models.Transaction(
        student_id=student_id,
        payment_commitment_id=payment_commitment_id,
        amount=amount,
        course_name=course_name,
        status="PENDING"
    )
    db.add(db_txn)
    db.commit()
    db.refresh(db_txn)
    return db_txn

def update_transaction_status(db: Session, transaction_id: int, status: str, wompi_tx_id: str = None):
    db_txn = get_transaction(db, transaction_id)
    if db_txn:
        db_txn.status = status
        if wompi_tx_id:
            db_txn.wompi_transaction_id = wompi_tx_id
        db.commit()
        db.refresh(db_txn)
    return db_txn
