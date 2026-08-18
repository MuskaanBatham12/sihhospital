from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database import Base


class PhysioSession(Base):
    __tablename__ = "physio_sessions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    exercise_name = Column(String(100), nullable=False)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="COMPLETED")