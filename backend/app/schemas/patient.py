from pydantic import BaseModel
from datetime import date


class PatientCreate(BaseModel):
    user_id: int
    date_of_birth: date | None = None
    gender: str | None = None
    blood_group: str | None = None
    medical_history: str | None = None
    emergency_contact: str | None = None


class PatientResponse(PatientCreate):
    id: int

    class Config:
        from_attributes = True