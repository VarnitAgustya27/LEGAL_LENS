from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel


class LegalDocumentListOut(BaseModel):
    id: int
    document_code: str
    title: str
    document_type: str
    issuing_authority: str
    official_url: str
    citation: Optional[str] = None
    published_on: Optional[date] = None
    effective_from: Optional[date] = None
    effective_until: Optional[date] = None
    verification_status: str
    supersedes_document_id: Optional[int] = None

    class Config:
        from_attributes = True


class LegalDocumentDetailOut(LegalDocumentListOut):
    storage_path: Optional[str] = None
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class RuleReferenceMetadataOut(BaseModel):
    relationship_type: str
    source_locator: Optional[str] = None
    citation_text: Optional[str] = None


class DocumentRuleOut(BaseModel):
    id: int
    code: str
    name: str
    field: str
    description: Optional[str] = None
    rule_version: str
    is_active: bool
    reference: RuleReferenceMetadataOut


class RuleSourceDocumentOut(BaseModel):
    id: int
    document_code: str
    title: str
    document_type: str
    issuing_authority: str
    official_url: str
    effective_from: Optional[date] = None
    effective_until: Optional[date] = None
    verification_status: str


class RuleSourceOut(BaseModel):
    reference_id: int
    relationship_type: str
    source_locator: Optional[str] = None
    citation_text: Optional[str] = None
    document: RuleSourceDocumentOut
