from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.session import Base


class RuleDocumentReference(Base):
    __tablename__ = "rule_document_references"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("rules.id"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("legal_documents.id"), nullable=False, index=True)
    source_locator = Column(String, nullable=True)
    citation_text = Column(Text, nullable=True)
    relationship_type = Column(String, default="PRIMARY_SOURCE", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    rule = relationship("Rule")
    document = relationship("LegalDocument", back_populates="rule_references")
