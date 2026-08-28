from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class InspectionImage(Base):
    __tablename__ = "inspection_images"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    image_type = Column(String, default="FRONT")
    
    original_path = Column(String, nullable=False)
    preprocessed_path = Column(String, nullable=True)
    evidence_path = Column(String, nullable=True)
    
    quality_status = Column(String, default="GOOD")
    quality_score = Column(Float, default=1.0)
    quality_metrics = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    inspection = relationship("Inspection", back_populates="images")
