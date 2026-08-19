from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.room import Room
from app.models.hospital import Hospital
from app.schemas.room import RoomCreate, RoomResponse
from app.auth.dependencies import get_current_user
from app.auth.roles import require_role, require_roles

router = APIRouter(
    prefix="/rooms",
    tags=["Rooms"]
)


@router.post("/", response_model=RoomResponse)
def create_room(
    room_data: RoomCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(["admin", "hospital_staff"])
    )
):
    hospital = db.query(Hospital).filter(
        Hospital.id == room_data.hospital_id
    ).first()

    if not hospital:
        raise HTTPException(
            status_code=404,
            detail="Hospital not found"
        )

    if (
        current_user.role == "hospital_staff"
        and hospital.id != current_user.hospital_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only manage rooms of your hospital"
        )

    room = Room(**room_data.model_dump())

    db.add(room)

    try:
        db.commit()
        db.refresh(room)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Room number already exists in this hospital"
        )

    return room


@router.get(
    "/",
    response_model=list[RoomResponse]
)
def get_rooms(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(Room).all()


@router.get(
    "/{room_id}",
    response_model=RoomResponse
)
def get_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    room = db.query(Room).filter(
        Room.id == room_id
    ).first()

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Room not found"
        )

    return room