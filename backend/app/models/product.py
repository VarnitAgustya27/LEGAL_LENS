from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from datetime import datetime
from app.database.session import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    brand = Column(String, nullable=True)
    category = Column(String, default="Packaged Food")
    barcode = Column(String, index=True, nullable=True)
    is_imported = Column(Boolean, default=False)
    declared_net_quantity = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
