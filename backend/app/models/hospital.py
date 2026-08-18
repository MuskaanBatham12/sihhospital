from sqlalchemy import Column, Integer, String, Float
from app.database import Base


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact = Column(String(20), nullable=False)
    type = Column(String(50), nullable=False)

    total_beds = Column(Integer, default=0)
    available_beds = Column(Integer, default=0)
    icu_beds = Column(Integer, default=0)
    emergency_beds = Column(Integer, default=0)

    oxygen_available = Column(Integer, default=0)
    ventilators = Column(Integer, default=0)
    current_load = Column(Float, default=0.0)