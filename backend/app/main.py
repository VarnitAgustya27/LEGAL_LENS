import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database.init_db import init_database
from app.api.auth import router as auth_router
from app.api.inspections import router as inspections_router
from app.api.declarations import router as declarations_router
from app.api.rules import router as rules_router
from app.api.dashboard import router as dashboard_router
from app.api.reports import router as reports_router
from app.api.demo import router as demo_router
from app.api.products import router as products_router

# Initialize database tables and seed records
init_database()

# Ensure uploads directory exists
uploads_dir = os.path.abspath("./uploads")
os.makedirs(uploads_dir, exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="AI-Powered Legal Metrology Compliance Inspection Platform"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file uploads for direct image / evidence viewing
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(inspections_router, prefix=settings.API_V1_STR)
app.include_router(products_router, prefix=settings.API_V1_STR)
app.include_router(declarations_router, prefix=settings.API_V1_STR)
app.include_router(rules_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(demo_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "service": "Legal-Lens API",
        "status": "ONLINE",
        "version": "1.0.0",
        "legal_act": "The Legal Metrology (Packaged Commodities) Rules, 2011",
        "docs_url": "/docs"
    }

# Force reload

