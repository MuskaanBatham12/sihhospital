from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from app.database import Base


class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    bed_id = Column(Integer, ForeignKey("beds.id"), nullable=True)

    resource_type = Column(String, nullable=True)

    status = Column(String(50), nullable=False, default="PENDING")
    reason = Column(String(500), nullable=True)
    allocated_at = Column(DateTime, nullable=True)