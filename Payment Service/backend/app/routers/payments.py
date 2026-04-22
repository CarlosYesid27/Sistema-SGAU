from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx
import os
import logging

from app import crud, schemas, models
from app.database import get_db
from app.security import get_current_user, TokenPayload

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)

# Llave privada oficial de Producción de MercadoPago
MERCADOPAGO_ACCESS_TOKEN = os.getenv("MERCADOPAGO_ACCESS_TOKEN", "TU_TOKEN_MERCADOPAGO")
ENROLLMENT_SERVICE_URL = os.getenv("ENROLLMENT_SERVICE_URL", "http://enrollment_backend:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

async def verify_student(current_user: TokenPayload = Depends(get_current_user)):
    if current_user.role != "estudiante":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo estudiantes.")
    return current_user

@router.post("/checkout", response_model=schemas.CheckoutResponse)
async def checkout(
    request: schemas.CheckoutRequest,
    current_user: TokenPayload = Depends(verify_student),
    db: Session = Depends(get_db)
):
    student_id = int(current_user.sub)
    
    # Creamos un registro pendiente
    txn = crud.create_pending_transaction(
        db=db, 
        student_id=student_id, 
        payment_commitment_id=request.payment_commitment_id,
        amount=request.amount,
        course_name=request.course_name
    )
    
    # Contactar MercadoPago para generar Preferencia (Checkout Pro)
    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {MERCADOPAGO_ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }
        mp_title = f"Pago de materia: {request.course_name}" if request.course_name else "Pago de matrícula/aportes universitarios SGAU"
        payload = {
            "items": [
                {
                    "title": mp_title,
                    "quantity": 1,
                    "unit_price": float(request.amount),
                    "currency_id": "COP"
                }
            ],
            "external_reference": str(txn.id)
        }
        
        mp_res = await client.post(
            "https://api.mercadopago.com/checkout/preferences",
            json=payload,
            headers=headers
        )
        
        if mp_res.status_code not in [200, 201]:
            logger.error("MercadoPago error: %s", mp_res.text)
            raise HTTPException(status_code=500, detail=f"Error MercadoPago: {mp_res.text}")
            
        init_point = mp_res.json().get("init_point")
    
    return schemas.CheckoutResponse(
        transaction_id=txn.id,
        init_point=init_point
    )

@router.post("/verify/{payment_commitment_id}", response_model=schemas.TransactionResponse)
async def verify_payment(
    payment_commitment_id: int,
    current_user: TokenPayload = Depends(verify_student),
    db: Session = Depends(get_db)
):
    """
    Busca la transacción pendiente local, y consulta en MercadoPago por `external_reference`
    para ver si el estado cambió a aprobado.
    """
    student_id = int(current_user.sub)
    
    # Buscamos TODAS las transacciones locales para ese compromiso.
    transactions = db.query(models.Transaction).filter(
        models.Transaction.payment_commitment_id == payment_commitment_id,
        models.Transaction.student_id == student_id,
        models.Transaction.status.in_(["PENDING", "APPROVED"])
    ).order_by(models.Transaction.id.desc()).all()
    
    if not transactions:
        raise HTTPException(status_code=404, detail="No hay una transacción registrada para verificar. Intenta pagar primero.")
    
    mp_status = None
    payment_id = None
    applied_txn = None

    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {MERCADOPAGO_ACCESS_TOKEN}"}
        
        # Recorremos nuestras transacciones locales de la más nueva a la más vieja
        # buscando cuál fue la que efectivamente se pagó en MercadoPago
        for txn in transactions:
            try:
                mp_res = await client.get(
                    f"https://api.mercadopago.com/v1/payments/search?external_reference={txn.id}",
                    headers=headers
                )
                if mp_res.status_code == 200:
                    results = mp_res.json().get("results", [])
                    if len(results) > 0:
                        latest_payment = sorted(results, key=lambda x: x["date_created"], reverse=True)[0]
                        mp_status = latest_payment.get("status")
                        payment_id = str(latest_payment.get("id"))
                        applied_txn = txn
                        if mp_status == "approved":
                            break # Encontramos la ganadora
            except Exception:
                continue

    # Si no encontramos nada en MP pero en nuestra DB ya hay una APPROVED, la usamos
    if not applied_txn:
        applied_txn = next((t for t in transactions if t.status == "APPROVED"), None)
        if applied_txn:
            mp_status = "approved"
            payment_id = applied_txn.wompi_transaction_id
        else:
            raise HTTPException(status_code=400, detail="Aún no hay ningún pago registrado en MercadoPago para esta referencia.")
    
    txn = applied_txn
            
    if mp_status == "approved":
        # Solo actualizamos si estaba PENDING
        if txn.status == "PENDING":
            crud.update_transaction_status(db, txn.id, "APPROVED", payment_id)
        
        # Notificar al Enrollment Service (Reintento seguro con token compatible)
        from app.security import create_access_token
        # Enrollment Service requiere 'sub' (int) y 'email' (str)
        m2m_token = create_access_token(data={
            "sub": 0, 
            "email": "system@sgau.local", 
            "role": "admin"
        })
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            headers_m2m = {"Authorization": f"Bearer {m2m_token}"}
            payload_m2m = {"status": "PAID"}
            try:
                enr_res = await client.patch(
                    f"{ENROLLMENT_SERVICE_URL}/enrollments/payments/{txn.payment_commitment_id}/status",
                    json=payload_m2m,
                    headers=headers_m2m
                )
                if enr_res.status_code not in [200, 204]:
                    logger.warning("Enrollment update failed: %s %s", enr_res.status_code, enr_res.text)
                else:
                    logger.info("Enrollment updated for commitment %s", txn.payment_commitment_id)
            except Exception as e:
                logger.error("Enrollment connection error: %s", str(e))
            
    elif mp_status in ["rejected", "cancelled", "refunded"]:
        crud.update_transaction_status(db, txn.id, "DECLINED", payment_id)
        
    return crud.get_transaction(db, txn.id)
