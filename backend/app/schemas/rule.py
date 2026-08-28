from pydantic import BaseModel
from typing import Optional, List

class RuleOut(BaseModel):
    id: int
    code: str
    name: str
    field: str
    statutory_reference: str
    category_applicability: List[str]
    is_mandatory: bool
    severity: str
    validation_type: str
    description: Optional[str] = None
    rule_version: str
    is_active: bool

    class Config:
        from_attributes = True
