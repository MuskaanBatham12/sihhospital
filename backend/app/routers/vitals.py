from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vital_reading import VitalReading
from app.models.patient import Patient
from app.schemas.vitals import VitalCreate, VitalResponse
from app.auth.dependencies import get_current_user
from app.services.emergency_service import calculate_emergency_severity


router = APIRouter(
    prefix="/vitals",
    tags=["Vitals"]
)


@router.post(
    "/",
    response_model=VitalResponse
)
def create_vital_reading(
    vital_data: VitalCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    patient = db.query(Patient).filter(
        Patient.id == vital_data.patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    # Patient can only add vitals for themselves
    if (
        current_user.role == "patient"
        and patient.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only add vitals for yourself"
        )

    vital = VitalReading(
        **vital_data.model_dump()
    )

    db.add(vital)
    db.commit()
    db.refresh(vital)

    return vital


@router.get(
    "/{patient_id}",
    response_model=list[VitalResponse]
)
def get_patient_vitals(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    patient = db.query(Patient).filter(
        Patient.id == patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    # Patient can only view their own vitals
    if (
        current_user.role == "patient"
        and patient.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only access your own vitals"
        )

    # Hospital staff will be handled later
    if current_user.role == "hospital_staff":
        raise HTTPException(
            status_code=403,
            detail="Hospital staff cannot access vitals yet"
        )

    return db.query(VitalReading).filter(
        VitalReading.patient_id == patient_id
    ).order_by(
        VitalReading.recorded_at.desc()
    ).all()

@router.post("/assess/{patient_id}")
def assess_patient_emergency(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    patient = db.query(Patient).filter(
        Patient.id == patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    if (
        current_user.role == "patient"
        and patient.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only assess your own vitals"
        )

    latest_vital = db.query(VitalReading).filter(
        VitalReading.patient_id == patient_id
    ).order_by(
        VitalReading.recorded_at.desc()
    ).first()

    if not latest_vital:
        raise HTTPException(
            status_code=404,
            detail="No vital readings found for this patient"
        )

    assessment = calculate_emergency_severity(
        spo2=latest_vital.spo2,
        temperature=latest_vital.temperature,
        pulse_rate=latest_vital.pulse_rate
    )

    return {
        "patient_id": patient_id,
        "latest_vitals": {
            "spo2": latest_vital.spo2,
            "temperature": latest_vital.temperature,
            "pulse_rate": latest_vital.pulse_rate,
            "recorded_at": latest_vital.recorded_at
        },
        "assessment": assessment
    }