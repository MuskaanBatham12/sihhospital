from pydantic import BaseModel


class RoomCreate(BaseModel):
    hospital_id: int
    room_number: str
    room_type: str
    total_beds: int = 0


class RoomResponse(RoomCreate):
    id: int

    class Config:
        from_attributes = True