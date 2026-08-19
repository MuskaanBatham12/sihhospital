from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.resource import Resource
from app.models.hospital import Hospital
from app.schemas.resource import ResourceCreate, ResourceResponse
from app.auth.dependencies import get_current_user
from app.auth.roles import require_role, require_roles

router = APIRouter(
    prefix="/resources",
    tags=["Resources"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/",
    response_model=ResourceResponse
)
def create_resource(
    resource_data: ResourceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    hospital = db.query(Hospital).filter(
        Hospital.id == resource_data.hospital_id
    ).first()

    if not hospital:
        raise HTTPException(
            status_code=404,
            detail="Hospital not found"
        )

    resource = Resource(
        **resource_data.model_dump()
    )

    db.add(resource)
    db.commit()
    db.refresh(resource)

    return resource


@router.get(
    "/",
    response_model=list[ResourceResponse]
)
def get_resources(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(Resource).all()


@router.get(
    "/{resource_id}",
    response_model=ResourceResponse
)
def get_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    resource = db.query(Resource).filter(
        Resource.id == resource_id
    ).first()

    if not resource:
        raise HTTPException(
            status_code=404,
            detail="Resource not found"
        )

    return resource

@router.put("/{resource_id}/availability")
def update_resource_availability(
    resource_id: int,
    available_quantity: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(["admin", "hospital_staff"])
    )
):
    resource = db.query(Resource).filter(
        Resource.id == resource_id
    ).first()

    if not resource:
        raise HTTPException(
            status_code=404,
            detail="Resource not found"
        )

    # Hospital staff can only modify their own hospital's resources
    if (
        current_user.role == "hospital_staff"
        and resource.hospital_id != current_user.hospital_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only manage resources of your hospital"
        )

    if available_quantity < 0:
        raise HTTPException(
            status_code=400,
            detail="Available quantity cannot be negative"
        )

    if available_quantity > resource.total_quantity:
        raise HTTPException(
            status_code=400,
            detail="Available quantity cannot exceed total quantity"
        )

    resource.available_quantity = available_quantity

    db.commit()
    db.refresh(resource)

    return {
        "message": "Resource availability updated successfully",
        "resource_id": resource.id,
        "resource_type": resource.resource_type,
        "available_quantity": resource.available_quantity
    }
