import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .database import Base, engine
from .routers.users import router as users_router

load_dotenv()

app = FastAPI(title="User Service SGAU", version="0.1.0")

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS document_type VARCHAR(10)"))
        connection.execute(text("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS document_number VARCHAR(30)"))
        connection.execute(text("UPDATE users SET document_type = 'C.C' WHERE document_type IS NULL"))
        connection.execute(text("UPDATE users SET document_number = 'PENDIENTE' WHERE document_number IS NULL"))


@app.get("/")
def health():
    return {"message": "User Service SGAU activo"}


app.include_router(users_router)
