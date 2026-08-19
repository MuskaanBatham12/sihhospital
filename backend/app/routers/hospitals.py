from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import SessionLocal
from app.models.hospital import Hospital
from app.schemas.hospital import HospitalCreate, HospitalResponse
from app.auth.dependencies import get_current_user
from app.auth.roles import require_role
from app.models.room import Room
from app.models.bed import Bed
from app.models.resource import Resource

router = APIRouter(
    prefix="/hospitals",
    tags=["Hospitals"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/",
    response_model=HospitalResponse
)
def create_hospital(
    hospital_data: HospitalCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin")
    )
):
    hospital = Hospital(
        **hospital_data.model_dump()
    )

    db.add(hospital)
    db.commit()
    db.refresh(hospital)

    return hospital


@router.get(
    "/",
    response_model=list[HospitalResponse]
)
def get_hospitals(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(Hospital).all()

@router.get("/my-hospital/dashboard")
def get_my_hospital_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "hospital_staff":
        raise HTTPException(
            status_code=403,
            detail="Only hospital staff can access this dashboard"
        )

    if not current_user.hospital_id:
        raise HTTPException(
            status_code=400,
            detail="Hospital is not assigned to this staff account"
        )

    hospital = db.query(Hospital).filter(
        Hospital.id == current_user.hospital_id
    ).first()

    if not hospital:
        raise HTTPException(
            status_code=404,
            detail="Hospital not found"
        )

    rooms = db.query(Room).filter(
        Room.hospital_id == hospital.id
    ).all()

    room_data = []

    for room in rooms:
        beds = db.query(Bed).filter(
            Bed.room_id == room.id
        ).all()

        room_data.append({
            "room_id": room.id,
            "room_number": room.room_number,
            "room_type": room.room_type,
            "total_beds": room.total_beds,
            "beds": [
                {
                    "bed_id": bed.id,
                    "bed_number": bed.bed_number,
                    "status": bed.status
                }
                for bed in beds
            ]
        })

    resources = db.query(Resource).filter(
        Resource.hospital_id == hospital.id
    ).all()

    return {
        "hospital": {
            "id": hospital.id,
            "name": hospital.name,
            "address": hospital.address,
            "contact": hospital.contact,
            "type": hospital.type,
            "current_load": hospital.current_load
        },
        "bed_summary": {
            "total_beds": hospital.total_beds,
            "available_beds": hospital.available_beds,
            "icu_beds": hospital.icu_beds,
            "emergency_beds": hospital.emergency_beds
        },
        "rooms": room_data,
        "resources": [
            {
                "id": resource.id,
                "resource_type": resource.resource_type,
                "total_quantity": resource.total_quantity,
                "available_quantity": resource.available_quantity
            }
            for resource in resources
        ]
    }

@router.get(
    "/{hospital_id}",
    response_model=HospitalResponse
)
def get_hospital(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    hospital = db.query(Hospital).filter(
        Hospital.id == hospital_id
    ).first()

    if not hospital:
        raise HTTPException(
            status_code=404,
            detail="Hospital not found"
        )

    return hospital

@router.put(
    "/{hospital_id}",
    response_model=HospitalResponse
)
def update_hospital(
    hospital_id: int,
    hospital_data: HospitalCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin")
    )
):
    hospital = db.query(Hospital).filter(
        Hospital.id == hospital_id
    ).first()

    if not hospital:
        raise HTTPException(
            status_code=404,
            detail="Hospital not found"
        )

    for key, value in hospital_data.model_dump().items():
        setattr(hospital, key, value)

    db.commit()
    db.refresh(hospital)

    return hospital


@router.delete("/{hospital_id}")
def delete_hospital(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin")
    )
):
    hospital = db.query(Hospital).filter(
        Hospital.id == hospital_id
    ).first()

    if not hospital:
        raise HTTPException(
            status_code=404,
            detail="Hospital not found"
        )

    db.delete(hospital)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
    raise HTTPException(
        status_code=400,
        detail="Cannot delete hospital because it has associated records"
    )

    return {
        "message": "Hospital deleted successfully"
    }