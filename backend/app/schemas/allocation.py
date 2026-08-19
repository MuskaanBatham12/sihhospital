from pydantic import BaseModel


class AllocationRequest(BaseModel):
    patient_id: int
    latitude: float
    longitude: float
    severity: str
    required_resource: str | None = None


class HospitalRanking(BaseModel):
    hospital_id: int
    hospital_name: str
    distance_km: float
    resource_score: float
    emergency_score: float
    distance_score: float
    load_score: float
    final_score: float
    selection_reason: str

class AllocationCreate(BaseModel):
    patient_id: int
    hospital_id: int
    bed_id: int | None = None
    reason: str | None = None


class AllocationResponse(BaseModel):
    id: int
    patient_id: int
    hospital_id: int
    bed_id: int | None
    status: str
    reason: str | None

    class Config:
        from_attributes = True