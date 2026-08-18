from pydantic import BaseModel


class HospitalBase(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    contact: str
    type: str
    total_beds: int = 0
    available_beds: int = 0
    icu_beds: int = 0
    emergency_beds: int = 0
    oxygen_available: int = 0
    ventilators: int = 0
    current_load: float = 0.0


class HospitalCreate(HospitalBase):
    pass


class HospitalResponse(HospitalBase):
    id: int

    class Config:
        from_attributes = True