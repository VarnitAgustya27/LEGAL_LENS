from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class Declaration(Base):
    __tablename__ = "declarations"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    
    field = Column(String, index=True, nullable=False)
    label = Column(String, nullable=False)
    value = Column(Text, nullable=True)
    raw_text = Column(Text, nullable=True)
    confidence = Column(Float, default=0.0)
    
    source = Column(String, default="AI")  # AI, HUMAN_CORRECTED, HUMAN_VERIFIED
    is_verified = Column(Boolean, default=False)
    verified_by = Column(String, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    
    status = Column(String, default="PASS")
    reason = Column(Text, nullable=True)
    
    bbox = Column(JSON, nullable=True)
    image_id = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    inspection = relationship("Inspection", back_populates="declarations")
