from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class Violation(Base):
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    rule_code = Column(String, index=True, nullable=False)
    field = Column(String, nullable=False)
    
    status = Column(String, default="FAIL")
    severity = Column(String, default="HIGH")
    message = Column(Text, nullable=False)
    expected = Column(Text, nullable=True)
    detected = Column(Text, nullable=True)
    statutory_reference = Column(String, nullable=True)
    confidence = Column(Float, default=0.0)
    
    evidence_image_id = Column(String, nullable=True)
    evidence_bbox = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    inspection = relationship("Inspection", back_populates="violations")
