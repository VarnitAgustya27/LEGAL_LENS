from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.models.legal_document import LegalDocument
from app.models.rule import Rule
from app.models.rule_document_reference import RuleDocumentReference
from app.schemas.legal_document import RuleSourceOut
from app.schemas.rule import RuleDetailOut, RuleOut

router = APIRouter(prefix="/rules", tags=["Legal Rules"])

@router.get("", response_model=List[RuleOut])
def get_rules(
    q: Optional[str] = None,
    field: Optional[str] = None,
    category: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
):
    query = db.query(Rule)
    if active_only:
        query = query.filter(Rule.is_active == True)
    if q:
        search_term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Rule.code.ilike(search_term),
                Rule.name.ilike(search_term),
                Rule.field.ilike(search_term),
                Rule.description.ilike(search_term),
            )
        )
    if field:
        query = query.filter(Rule.field == field)

    rules = query.all()
    if category:
        category_value = category.strip().upper()
        rules = [
            rule
            for rule in rules
            if category_value in {str(value).upper() for value in (rule.category_applicability or [])}
            or "ALL" in {str(value).upper() for value in (rule.category_applicability or [])}
        ]
    return rules


def get_rule_or_404(rule_id: int, db: Session) -> Rule:
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


@router.get("/{rule_id}", response_model=RuleDetailOut)
def get_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = get_rule_or_404(rule_id, db)
    verified_source_count = (
        db.query(RuleDocumentReference)
        .join(LegalDocument, LegalDocument.id == RuleDocumentReference.document_id)
        .filter(
            RuleDocumentReference.rule_id == rule.id,
            LegalDocument.verification_status == "VERIFIED",
        )
        .count()
    )
    return {
        "id": rule.id,
        "code": rule.code,
        "name": rule.name,
        "field": rule.field,
        "statutory_reference": rule.statutory_reference,
        "category_applicability": rule.category_applicability or [],
        "is_mandatory": rule.is_mandatory,
        "severity": rule.severity,
        "validation_type": rule.validation_type,
        "description": rule.description,
        "rule_version": rule.rule_version,
        "is_active": rule.is_active,
        "source_summary": {
            "verified_source_count": verified_source_count,
            "status": "VERIFIED" if verified_source_count else "NO_VERIFIED_SOURCE",
        },
    }


@router.get("/{rule_id}/sources", response_model=List[RuleSourceOut])
def get_rule_sources(rule_id: int, db: Session = Depends(get_db)):
    get_rule_or_404(rule_id, db)
    references = (
        db.query(RuleDocumentReference)
        .join(LegalDocument, LegalDocument.id == RuleDocumentReference.document_id)
        .filter(
            RuleDocumentReference.rule_id == rule_id,
            LegalDocument.verification_status == "VERIFIED",
        )
        .order_by(LegalDocument.title.asc())
        .all()
    )
    return [
        {
            "reference_id": reference.id,
            "relationship_type": reference.relationship_type,
            "source_locator": reference.source_locator,
            "citation_text": reference.citation_text,
            "document": {
                "id": reference.document.id,
                "document_code": reference.document.document_code,
                "title": reference.document.title,
                "document_type": reference.document.document_type,
                "issuing_authority": reference.document.issuing_authority,
                "official_url": reference.document.official_url,
                "effective_from": reference.document.effective_from,
                "effective_until": reference.document.effective_until,
                "verification_status": reference.document.verification_status,
            },
        }
        for reference in references
    ]
