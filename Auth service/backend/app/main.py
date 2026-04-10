from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from sqlalchemy import text

from app.database import Base, engine
from app.routes import auth

load_dotenv()

# Create tables on startup
Base.metadata.create_all(bind=engine)

with engine.begin() as connection:
    connection.execute(text("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS document_type VARCHAR(10)"))
    connection.execute(text("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS document_number VARCHAR(30)"))
    connection.execute(text("UPDATE users SET document_type = 'C.C' WHERE document_type IS NULL"))
    connection.execute(text("UPDATE users SET document_number = 'PENDIENTE' WHERE document_number IS NULL"))

app = FastAPI(
    title="SGAU - Auth Service",
    description="Microservicio de autenticación y seguridad para el sistema universitario",
    version="1.0.0"
)

# CORS middleware
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
BACKEND_ORIGIN = os.getenv("USER_SERVICE_URL", "http://localhost:8000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, BACKEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)

@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {"message": "Auth Service SGAU activo"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )
