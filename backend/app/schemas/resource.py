from pydantic import BaseModel


class ResourceCreate(BaseModel):
    hospital_id: int
    resource_type: str
    total_quantity: int = 0
    available_quantity: int = 0


class ResourceResponse(ResourceCreate):
    id: int

    class Config:
        from_attributes = True