from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.legal_document import LegalDocument
from app.models.rule import Rule
from app.models.rule_document_reference import RuleDocumentReference
from app.schemas.legal_document import DocumentRuleOut, LegalDocumentDetailOut, LegalDocumentListOut


router = APIRouter(prefix="/legal-documents", tags=["Legal Documents"])


def get_verified_document_or_404(document_id: int, db: Session) -> LegalDocument:
    document = (
        db.query(LegalDocument)
        .filter(
            LegalDocument.id == document_id,
            LegalDocument.verification_status == "VERIFIED",
        )
        .first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Verified legal document not found")
    return document


@router.get("", response_model=List[LegalDocumentListOut])
def list_legal_documents(
    q: Optional[str] = None,
    document_type: Optional[str] = None,
    verification_status: str = "VERIFIED",
    db: Session = Depends(get_db),
):
    if verification_status.upper() != "VERIFIED":
        raise HTTPException(
            status_code=400,
            detail="Only VERIFIED documents are available through this endpoint.",
        )

    query = db.query(LegalDocument).filter(LegalDocument.verification_status == "VERIFIED")
    if q:
        search_term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                LegalDocument.document_code.ilike(search_term),
                LegalDocument.title.ilike(search_term),
                LegalDocument.citation.ilike(search_term),
                LegalDocument.issuing_authority.ilike(search_term),
            )
        )
    if document_type:
        query = query.filter(LegalDocument.document_type == document_type)

    return query.order_by(LegalDocument.title.asc()).all()


@router.get("/{document_id}", response_model=LegalDocumentDetailOut)
def get_legal_document(document_id: int, db: Session = Depends(get_db)):
    return get_verified_document_or_404(document_id, db)


@router.get("/{document_id}/rules", response_model=List[DocumentRuleOut])
def get_document_rules(document_id: int, db: Session = Depends(get_db)):
    get_verified_document_or_404(document_id, db)
    references = (
        db.query(RuleDocumentReference)
        .join(Rule, Rule.id == RuleDocumentReference.rule_id)
        .filter(
            RuleDocumentReference.document_id == document_id,
            Rule.is_active == True,
        )
        .order_by(Rule.code.asc())
        .all()
    )
    return [
        {
            "id": reference.rule.id,
            "code": reference.rule.code,
            "name": reference.rule.name,
            "field": reference.rule.field,
            "description": reference.rule.description,
            "rule_version": reference.rule.rule_version,
            "is_active": reference.rule.is_active,
            "reference": {
                "relationship_type": reference.relationship_type,
                "source_locator": reference.source_locator,
                "citation_text": reference.citation_text,
            },
        }
        for reference in references
    ]
