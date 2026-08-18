from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from datetime import datetime, timezone

from app.database import Base


class VitalReading(Base):
    __tablename__ = "vital_readings"

    id = Column(Integer, primary_key=True, index=True)

    patient_id = Column(
        Integer,
        ForeignKey("patients.id"),
        nullable=False
    )

    spo2 = Column(Float, nullable=False)

    temperature = Column(Float, nullable=False)

    pulse_rate = Column(Integer, nullable=False)

    recorded_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )