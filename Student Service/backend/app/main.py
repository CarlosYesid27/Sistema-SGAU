from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import students
import logging

logging.basicConfig(level=logging.INFO)

# Crear tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Student Service",
    description="SGAU - Microservicio de Historial Académico y Kardex",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(students.router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Student Service"}
