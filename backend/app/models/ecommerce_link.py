from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON
from datetime import datetime
from app.database.session import Base

class EcommerceLink(Base):
    __tablename__ = "ecommerce_links"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String, unique=True, index=True, nullable=True)
    url = Column(String, nullable=False, index=True)
    platform = Column(String, default="Generic", index=True)
    product_name = Column(String, nullable=True)
    brand = Column(String, nullable=True)
    category = Column(String, default="Packaged Food")
    seller_name = Column(String, nullable=True)

    scraped_text_details = Column(JSON, default={})
    product_images = Column(JSON, default=[])
    downloaded_image_paths = Column(JSON, default=[])

    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=True)
    declarations = Column(JSON, default=[])
    violations = Column(JSON, default=[])
    score = Column(Float, default=0.0)
    status = Column(String, default="PENDING", index=True)

    error_message = Column(Text, nullable=True)
    uploaded_by = Column(String, default="Inspector")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
