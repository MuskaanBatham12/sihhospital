from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.emergency_request import EmergencyRequest
from app.models.patient import Patient
from app.auth.dependencies import get_current_user
from app.services.allocation_service import rank_hospitals
from app.auth.roles import require_roles
from app.models.hospital import Hospital

from app.schemas.emergency_request import (
    EmergencyRequestCreate,
    EmergencyRequestResponse
)


router = APIRouter(
    prefix="/emergency",
    tags=["Emergency Requests"]
)


@router.post(
    "/request",
    response_model=EmergencyRequestResponse
)
def create_emergency_request(
    request: EmergencyRequestCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    patient = db.query(Patient).filter(
        Patient.id == request.patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    # Patient can only create emergency requests for themselves
    if (
        current_user.role == "patient"
        and patient.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only create emergency requests for yourself"
        )

    # Find suitable hospitals
    ranked_hospitals = rank_hospitals(
        db=db,
        patient_latitude=request.latitude,
        patient_longitude=request.longitude,
        severity=request.severity,
        required_resource=request.required_resource
    )

    recommended_hospital_id = None

    if ranked_hospitals:
        recommended_hospital_id = ranked_hospitals[0]["hospital_id"]

    emergency_request = EmergencyRequest(
        patient_id=request.patient_id,
        latitude=request.latitude,
        longitude=request.longitude,
        severity=request.severity,
        required_resource=request.required_resource,
        status="PENDING",
        recommended_hospital_id=recommended_hospital_id
    )

    db.add(emergency_request)
    db.commit()
    db.refresh(emergency_request)

    return emergency_request


@router.get("/{request_id}", response_model=EmergencyRequestResponse)
def get_emergency_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    emergency_request = db.query(EmergencyRequest).filter(
        EmergencyRequest.id == request_id
    ).first()

    if not emergency_request:
        raise HTTPException(
            status_code=404,
            detail="Emergency request not found"
        )

    # Patient can only view their own emergency request
    if current_user.role == "patient":
        patient = db.query(Patient).filter(
            Patient.id == emergency_request.patient_id
        ).first()

        if not patient or patient.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own emergency requests"
            )

    # Hospital staff can only view emergencies
    # recommended to their hospital
    elif current_user.role == "hospital_staff":

        if emergency_request.recommended_hospital_id != current_user.hospital_id:
            raise HTTPException(
                status_code=403,
                detail="You can only view emergencies assigned to your hospital"
            )

    # Admin can view any emergency request

    return emergency_request

@router.get("/hospital/my-emergencies")
def get_my_hospital_emergencies(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "hospital_staff":
        raise HTTPException(
            status_code=403,
            detail="Only hospital staff can access this endpoint"
        )

    if not current_user.hospital_id:
        raise HTTPException(
            status_code=400,
            detail="Hospital is not assigned to this staff account"
        )

    emergencies = db.query(EmergencyRequest).filter(
        EmergencyRequest.recommended_hospital_id == current_user.hospital_id
    ).order_by(
        EmergencyRequest.created_at.desc()
    ).all()

    return emergencies


@router.put("/{request_id}/status")
def update_emergency_status(
    request_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(["admin", "hospital_staff"]))
):
    emergency_request = db.query(EmergencyRequest).filter(
        EmergencyRequest.id == request_id
    ).first()

    if not emergency_request:
        raise HTTPException(
            status_code=404,
            detail="Emergency request not found"
        )

    # Allowed emergency states
    allowed_statuses = [
        "PENDING",
        "ACCEPTED",
        "IN_PROGRESS",
        "RESOLVED"
    ]

    status = status.upper()

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Allowed values: {allowed_statuses}"
        )

    # Hospital staff can only update emergencies
    # assigned to their hospital
    if current_user.role == "hospital_staff":

        if emergency_request.recommended_hospital_id != current_user.hospital_id:
            raise HTTPException(
                status_code=403,
                detail="You can only update emergencies assigned to your hospital"
            )

    emergency_request.status = status

    db.commit()
    db.refresh(emergency_request)

    return {
        "message": "Emergency status updated successfully",
        "request_id": emergency_request.id,
        "status": emergency_request.status
    }