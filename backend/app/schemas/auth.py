from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    email: str
    full_name: str
    role: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "INSPECTOR"
    badge_number: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    badge_number: Optional[str] = None
    department: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
