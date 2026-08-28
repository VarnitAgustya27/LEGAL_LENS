from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
from datetime import datetime
from app.database.session import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    case_number = Column(String, index=True, nullable=False)
    pdf_path = Column(String, nullable=False)
    summary = Column(JSON, default=dict)
    generated_by = Column(String, nullable=False)
    status = Column(String, default="COMPLETED")
    created_at = Column(DateTime, default=datetime.utcnow)
