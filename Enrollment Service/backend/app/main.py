from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import enrollments
from app.database import engine, Base

# Configuración inicial de Base de Datos SQLite
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SGAU V2 - Enrollment Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(enrollments.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Enrollment Service"}
