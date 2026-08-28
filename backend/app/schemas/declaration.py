from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class DeclarationBase(BaseModel):
    field: str
    label: str
    value: Optional[str] = None
    raw_text: Optional[str] = None
    confidence: float = 0.0
    status: str = "PASS"
    reason: Optional[str] = None
    bbox: Optional[List[Any]] = None
    image_id: Optional[str] = None

class DeclarationCreate(DeclarationBase):
    pass

class DeclarationUpdate(BaseModel):
    value: Optional[str] = None
    is_verified: bool = True
    verified_by: Optional[str] = None

class DeclarationOut(DeclarationBase):
    id: int
    inspection_id: int
    source: str
    is_verified: bool
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
