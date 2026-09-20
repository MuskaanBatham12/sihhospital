from typing import Optional
from pydantic import BaseModel


class HospitalBase(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    contact: str
    type: str
    state: Optional[str] = "Uttar Pradesh"
    city: Optional[str] = "Lucknow"
    emergency_available: Optional[int] = 1

    total_beds: int = 0
    available_beds: int = 0
    icu_beds: int = 0
    available_icu: Optional[int] = 0
    emergency_beds: int = 0
    oxygen_beds: Optional[int] = 0
    oxygen_available: int = 0
    available_oxygen: Optional[int] = 0
    ventilators: int = 0
    available_ventilators: Optional[int] = 0
    current_load: float = 0.0
    specialties: Optional[str] = "General, Emergency"


class HospitalCreate(HospitalBase):
    pass


class HospitalResponse(HospitalBase):
    id: int
    hospital_id: Optional[int] = None
    hospital_name: Optional[str] = None
    distance_km: Optional[float] = None
    match: Optional[float] = None

    class Config:
        from_attributes = True