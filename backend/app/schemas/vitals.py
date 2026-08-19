from pydantic import BaseModel
from datetime import datetime


class VitalCreate(BaseModel):
    patient_id: int
    spo2: float
    temperature: float
    pulse_rate: int


class VitalResponse(VitalCreate):
    id: int
    recorded_at: datetime

    class Config:
        from_attributes = True