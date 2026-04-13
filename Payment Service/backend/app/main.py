from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.database import engine
from app import models
from app.routers import payments

# Crear tablas en bd (Desarrollo)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SGAU Payment Service")

frontend_url = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(payments.router)

@app.get("/")
def read_root():
    return {"message": "SGAU Payment Service API is running"}
