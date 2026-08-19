from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    room_number = Column(String(50), nullable=False)
    room_type = Column(String(50), nullable=False)
    total_beds = Column(Integer, default=0)