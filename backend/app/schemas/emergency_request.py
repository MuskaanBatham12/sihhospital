from pydantic import BaseModel


class EmergencyRequestCreate(BaseModel):
    patient_id: int
    latitude: float
    longitude: float
    severity: str
    required_resource: str | None = None


class EmergencyRequestResponse(BaseModel):
    id: int
    patient_id: int
    latitude: float
    longitude: float
    severity: str
    required_resource: str | None
    status: str
    recommended_hospital_id: int | None

    class Config:
        from_attributes = True