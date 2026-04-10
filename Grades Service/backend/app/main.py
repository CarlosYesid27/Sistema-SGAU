"""
main.py — Grades Service
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import grades

# Crear tablas al arrancar
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SGAU — Grades Service",
    description="Microservicio de calificaciones. Registra notas y calcula promedios.",
    version="1.0.0",
)

# CORS
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(grades.router)


@app.get("/")
def root():
    return {"service": "Grades Service", "status": "running"}
