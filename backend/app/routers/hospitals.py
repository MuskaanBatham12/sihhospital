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


from typing import Optional
from app.algorithms.allocation import calculate_distance


@router.get(
    "/",
    response_model=list[HospitalResponse]
)
def get_hospitals(
    state: Optional[str] = None,
    city: Optional[str] = None,
    search: Optional[str] = None,
    emergency_only: Optional[bool] = False,
    icu_only: Optional[bool] = False,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    sort_by: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Hospital)

    if state and state.lower() != "all":
        query = query.filter(Hospital.state.ilike(f"%{state}%"))

    if city and city.lower() != "all":
        query = query.filter(Hospital.city.ilike(f"%{city}%"))

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Hospital.name.ilike(search_term))
            | (Hospital.type.ilike(search_term))
            | (Hospital.city.ilike(search_term))
            | (Hospital.specialties.ilike(search_term))
        )

    if emergency_only:
        query = query.filter(Hospital.emergency_available == 1)

    if icu_only:
        query = query.filter((Hospital.icu_beds > 0) | (Hospital.available_icu > 0))

    hospitals = query.all()

    results = []
    for h in hospitals:
        resp = HospitalResponse.model_validate(h)
        resp.hospital_id = h.id
        resp.hospital_name = h.name
        
        # Calculate distance if user lat/lng provided
        if lat is not None and lng is not None:
            dist = calculate_distance(lat, lng, h.latitude, h.longitude)
            resp.distance_km = round(dist, 1)
        else:
            resp.distance_km = None

        # Calculate heuristic match score
        res_score = min(100, ((h.available_beds + h.icu_beds + h.oxygen_available) / max(1, h.total_beds + h.icu_beds + h.oxygen_available)) * 100)
        load_score = max(0, 100 - h.current_load)
        resp.match = round(0.6 * res_score + 0.4 * load_score, 1)
        results.append(resp)

    # Sorting
    if sort_by == "nearest" and lat is not None and lng is not None:
        results.sort(key=lambda x: x.distance_km if x.distance_km is not None else 99999)
    elif sort_by == "beds":
        results.sort(key=lambda x: x.available_beds, reverse=True)
    elif sort_by == "load":
        results.sort(key=lambda x: x.current_load)
    elif sort_by == "match":
        results.sort(key=lambda x: x.match or 0, reverse=True)

    return results


@router.get(
    "/nearby",
    response_model=list[HospitalResponse]
)
def get_nearby_hospitals(
    lat: float,
    lng: float,
    radius: Optional[float] = 100.0,
    limit: Optional[int] = 50,
    db: Session = Depends(get_db)
):
    hospitals = db.query(Hospital).all()
    results = []

    for h in hospitals:
        dist = calculate_distance(lat, lng, h.latitude, h.longitude)
        if radius is None or dist <= radius:
            resp = HospitalResponse.model_validate(h)
            resp.hospital_id = h.id
            resp.hospital_name = h.name
            resp.distance_km = round(dist, 1)
            
            res_score = min(100, ((h.available_beds + h.icu_beds + h.oxygen_available) / max(1, h.total_beds + h.icu_beds + h.oxygen_available)) * 100)
            load_score = max(0, 100 - h.current_load)
            dist_score = 100 if dist <= 5 else (80 if dist <= 10 else (60 if dist <= 20 else (40 if dist <= 50 else 20)))
            resp.match = round(0.4 * res_score + 0.3 * dist_score + 0.3 * load_score, 1)
            results.append((dist, resp))

    results.sort(key=lambda item: item[0])
    return [item[1] for item in results[:limit]]


@router.get("/{hospital_id}/availability")
@router.get("/{hospital_id}/resources")
def get_hospital_availability(
    hospital_id: int,
    db: Session = Depends(get_db)
):
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    rooms = db.query(Room).filter(Room.hospital_id == hospital.id).all()
    resources = db.query(Resource).filter(Resource.hospital_id == hospital.id).all()

    # Determine status
    if hospital.available_beds > 10:
        status = "Available"
    elif hospital.available_beds > 0:
        status = "Limited"
    else:
        status = "Full"

    return {
        "hospital_id": hospital.id,
        "hospital_name": hospital.name,
        "state": hospital.state,
        "city": hospital.city,
        "address": hospital.address,
        "contact": hospital.contact,
        "type": hospital.type,
        "status": status,
        "emergency_available": bool(hospital.emergency_available),
        "total_beds": hospital.total_beds,
        "available_beds": hospital.available_beds,
        "icu_beds": hospital.icu_beds,
        "available_icu": hospital.available_icu or hospital.icu_beds,
        "emergency_beds": hospital.emergency_beds,
        "oxygen_beds": hospital.oxygen_beds or hospital.oxygen_available,
        "available_oxygen": hospital.available_oxygen or hospital.oxygen_available,
        "ventilators": hospital.ventilators,
        "available_ventilators": hospital.available_ventilators or hospital.ventilators,
        "current_load": hospital.current_load,
        "specialties": [s.strip() for s in (hospital.specialties or "").split(",") if s.strip()],
        "resources": [
            {
                "resource_type": r.resource_type,
                "total_quantity": r.total_quantity,
                "available_quantity": r.available_quantity
            }
            for r in resources
        ],
        "rooms_count": len(rooms)
    }

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