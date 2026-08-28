import os
from pathlib import Path
from typing import List, Union
from dotenv import load_dotenv
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Ensure .env is explicitly loaded from backend directory
backend_dir = Path(__file__).resolve().parent.parent
env_path = backend_dir / ".env"
load_dotenv(env_path, override=True)
load_dotenv(override=False)

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(env_path), extra="allow")

    PROJECT_NAME: str = "Legal-Lens — Legal Metrology Compliance Assistant"
    API_V1_STR: str = "/api"
    APP_ENV: str = "development"
    SECRET_KEY: str = "legallens-secret-super-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DATABASE_URL: str = "sqlite:///./legallens.db"
    STORAGE_PATH: str = "./uploads"
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "*"]

    # OCRWebService Configuration
    OCR_WEB_SERVICE_USER: str = ""
    OCR_WEB_SERVICE_LICENSE_CODE: str = ""
    OCR_WEB_SERVICE_URL: str = "https://www.ocrwebservice.com/restservices/processDocument"

    # Supabase Configuration
    SUPABASE_URL: str = "https://snxwxahlotngsllqmvyj.supabase.co"
    SUPABASE_ANON_KEY: str = "sb_publishable_YUcFQBnkkTH1_HNSvRZ9ug_yOIkCl_3"
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

settings = Settings()
