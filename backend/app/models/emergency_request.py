from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from app.database import Base


class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    severity = Column(String(50), nullable=False)
    required_resource = Column(String(100), nullable=True)

    status = Column(String(50), nullable=False, default="PENDING")
    recommended_hospital_id = Column(
        Integer,
        ForeignKey("hospitals.id"),
        nullable=True
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )
