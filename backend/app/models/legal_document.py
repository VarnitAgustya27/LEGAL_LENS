from datetime import datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.session import Base


class LegalDocument(Base):
    __tablename__ = "legal_documents"

    id = Column(Integer, primary_key=True, index=True)
    document_code = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    document_type = Column(String, nullable=False)
    issuing_authority = Column(String, nullable=False)
    official_url = Column(String, nullable=False)
    storage_path = Column(String, nullable=True)
    citation = Column(Text, nullable=True)
    published_on = Column(Date, nullable=True)
    effective_from = Column(Date, nullable=True)
    effective_until = Column(Date, nullable=True)
    verification_status = Column(String, default="DRAFT", nullable=False)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(String, nullable=True)
    supersedes_document_id = Column(Integer, ForeignKey("legal_documents.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    supersedes_document = relationship(
        "LegalDocument",
        remote_side=[id],
        foreign_keys=[supersedes_document_id],
        backref="superseded_by_documents",
    )
    rule_references = relationship("RuleDocumentReference", back_populates="document")
