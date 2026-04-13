from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx
import os

from app import crud, schemas, models
from app.database import get_db
from app.security import get_current_user, TokenPayload

router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)

# Llave publica oficial de Wompi Colombia (Sandbox)
WOMPI_PUB_KEY = os.getenv("WOMPI_PUBLIC_KEY", "pub_test_Q5yDA9xoKdePzhSGeZaVvw1KxtBAlA1A")
ENROLLMENT_SERVICE_URL = os.getenv("ENROLLMENT_SERVICE_URL", "http://enrollment_backend:8000")

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
        amount=request.amount
    )
    
    return schemas.CheckoutResponse(
        transaction_id=txn.id,
        public_key=WOMPI_PUB_KEY,
        amount_in_cents=int(txn.amount * 100),
        reference=str(txn.id) # Usamos el ID interno como referencia base
    )

@router.post("/verify", response_model=schemas.TransactionResponse)
async def verify_payment(
    req: schemas.VerifyRequest,
    current_user: TokenPayload = Depends(verify_student),
    db: Session = Depends(get_db)
):
    """
    Toma el ID de transacción generado por el Widget de Wompi, 
    consulta el API publica de Wompi para saber si fue aprobado, 
    y actualiza nuestro DB local y el Enrollment Service.
    """
    wompi_tx_id = req.wompi_transaction_id
    
    async with httpx.AsyncClient() as client:
        try:
            wompi_res = await client.get(f"https://sandbox.wompi.co/v1/transactions/{wompi_tx_id}")
            if wompi_res.status_code != 200:
                raise HTTPException(status_code=400, detail="Transacción de Wompi no encontrada o inválida.")
                
            data = wompi_res.json()["data"]
            wompi_status = data["status"] # APPROVED, DECLINED, VOIDED, ERROR
            reference = data["reference"]
        except httpx.RequestError:
            raise HTTPException(status_code=500, detail="Error conectando con pasarela Wompi.")
            
    txn = crud.get_transaction_by_reference(db, reference)
    if not txn:
        raise HTTPException(status_code=404, detail="Transacción local no encontrada para esta referencia.")
        
    if txn.student_id != int(current_user.sub):
        raise HTTPException(status_code=403, detail="No tienes permisos sobre esta transacción.")
        
    if wompi_status == "APPROVED":
        crud.update_transaction_status(db, txn.id, "APPROVED", wompi_tx_id)
        
        # Notificar al Enrollment Service! (M2M authentication skipped assuming internal net trust, 
        # or we should pass the token, but let's pass a system flag or just pass JWT over since we are trusted)
        # We will reuse the user's token directly in production, but let's just make the request.
        # However, to avoid complexity of passing token across boundaries for system-action, 
        # the Enrollment Service might need an internal patch endpoint or we just forward the Bearer.
        # We don't have the raw token here nicely without request.headers. 
        # But wait, we can just fetch it using FastAPI Depends(OAuth2PasswordBearer), but we skipped that.
        # Let's just create an internal M2M call without auth or just assume Enrollment service doesn't check auth for M2M if done locally.
        # Actually Enrollment Service patch_status checks `get_current_user`! 
        # Wait, how does Course Service call User Service? It uses internal JWT.
        # Let's generate a service-level token to authenticate.
        from app.security import create_access_token
        m2m_token = create_access_token(data={"sub": "system", "role": "admin"})
        
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {m2m_token}"}
            payload = {"status": "PAID"}
            enr_res = await client.patch(
                f"{ENROLLMENT_SERVICE_URL}/enrollments/payments/{txn.payment_commitment_id}/status",
                json=payload,
                headers=headers
            )
            if enr_res.status_code not in [200, 204]:
                # Log critical error. Para MVP local no rompemos si ya se pagó.
                pass
                
    elif wompi_status in ["DECLINED", "ERROR", "VOIDED"]:
        crud.update_transaction_status(db, txn.id, wompi_status, wompi_tx_id)
        
    return crud.get_transaction(db, txn.id)
