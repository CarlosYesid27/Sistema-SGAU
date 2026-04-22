import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import reports

app = FastAPI(
    title="SGAU Reporting Service",
    description="Motor de informes académicos y financieros. Genera reportes en PDF y CSV.",
    version="1.0.0"
)

frontend_url = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reports.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Reporting Service"}
