from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from datetime import datetime
from app.database.session import Base

class Rule(Base):
    __tablename__ = "rules"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    field = Column(String, index=True, nullable=False)
    statutory_reference = Column(String, nullable=False)
    category_applicability = Column(JSON, default=list)
    is_mandatory = Column(Boolean, default=True)
    severity = Column(String, default="HIGH")
    validation_type = Column(String, default="FORMAT")
    description = Column(Text, nullable=True)
    rule_version = Column(String, default="2026.1")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
