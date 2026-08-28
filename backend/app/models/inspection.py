from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String, unique=True, index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    inspector_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    status = Column(String, default="REVIEW")  # COMPLIANT, NON_COMPLIANT, REVIEW
    score = Column(Float, default=0.0)
    readability_score = Column(Float, default=0.0)
    
    inspection_type = Column(String, default="RETAIL_LABEL")
    location = Column(String, default="New Delhi, Delhi")
    retailer_name = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    
    total_checks = Column(Integer, default=0)
    passed_checks = Column(Integer, default=0)
    failed_checks = Column(Integer, default=0)
    warning_checks = Column(Integer, default=0)
    review_checks = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product")
    inspector = relationship("User")
    images = relationship("InspectionImage", back_populates="inspection", cascade="all, delete-orphan")
    declarations = relationship("Declaration", back_populates="inspection", cascade="all, delete-orphan")
    violations = relationship("Violation", back_populates="inspection", cascade="all, delete-orphan")
