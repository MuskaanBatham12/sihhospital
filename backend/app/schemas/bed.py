from pydantic import BaseModel


class BedCreate(BaseModel):
    room_id: int
    bed_number: str
    status: str = "AVAILABLE"


class BedResponse(BedCreate):
    id: int

    class Config:
        from_attributes = True