from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.bed import Bed
from app.models.room import Room
from app.schemas.bed import BedCreate, BedResponse
from app.auth.dependencies import get_current_user
from app.auth.roles import require_role, require_roles

router = APIRouter(
    prefix="/beds",
    tags=["Beds"]
)


@router.post(
    "/",
    response_model=BedResponse
)
def create_bed(
    bed_data: BedCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(["admin", "hospital_staff"])
    )
):
    room = db.query(Room).filter(
        Room.id == bed_data.room_id
    ).first()

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Room not found"
        )

    if (
        current_user.role == "hospital_staff"
        and room.hospital_id != current_user.hospital_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only manage beds of your hospital"
        )

    bed = Bed(**bed_data.model_dump())

    db.add(bed)

    try:
        db.commit()
        db.refresh(bed)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Bed number already exists in this room"
        )

    return bed


@router.get(
    "/",
    response_model=list[BedResponse]
)
def get_beds(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(Bed).all()


@router.get(
    "/{bed_id}",
    response_model=BedResponse
)
def get_bed(
    bed_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    bed = db.query(Bed).filter(
        Bed.id == bed_id
    ).first()

    if not bed:
        raise HTTPException(
            status_code=404,
            detail="Bed not found"
        )

    return bed


@router.put("/{bed_id}/status")
def update_bed_status(
    bed_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(["admin", "hospital_staff"])
    )
):
    bed = db.query(Bed).filter(
        Bed.id == bed_id
    ).first()

    if not bed:
        raise HTTPException(
            status_code=404,
            detail="Bed not found"
        )

    room = db.query(Room).filter(
        Room.id == bed.room_id
    ).first()

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Room not found"
        )

    if (
        current_user.role == "hospital_staff"
        and room.hospital_id != current_user.hospital_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only manage beds of your hospital"
        )

    allowed_statuses = [
        "AVAILABLE",
        "OCCUPIED",
        "RESERVED",
        "MAINTENANCE"
    ]

    status = status.upper()

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid bed status"
        )

    bed.status = status

    db.commit()
    db.refresh(bed)

    return {
        "message": "Bed status updated successfully",
        "bed_id": bed.id,
        "bed_number": bed.bed_number,
        "status": bed.status
    }