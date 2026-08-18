from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base


class Bed(Base):
    __tablename__ = "beds"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    bed_number = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default="AVAILABLE")