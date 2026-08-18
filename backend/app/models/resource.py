from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    resource_type = Column(String(100), nullable=False)
    total_quantity = Column(Integer, default=0)
    available_quantity = Column(Integer, default=0)