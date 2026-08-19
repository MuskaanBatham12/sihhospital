from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import PatientCreate, PatientResponse
from app.auth.dependencies import get_current_user
from app.auth.roles import require_role


router = APIRouter(
    prefix="/patients",
    tags=["Patients"]
)


@router.post(
    "/",
    response_model=PatientResponse
)
def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    user = db.query(User).filter(
        User.id == patient_data.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user.role != "patient":
        raise HTTPException(
            status_code=400,
            detail="User must have patient role"
        )

    existing_patient = db.query(Patient).filter(
        Patient.user_id == patient_data.user_id
    ).first()

    if existing_patient:
        raise HTTPException(
            status_code=400,
            detail="Patient profile already exists"
        )

    # Patient can create only their own profile
    if (
        current_user.role == "patient"
        and current_user.id != patient_data.user_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only create your own patient profile"
        )

    patient = Patient(
        **patient_data.model_dump()
    )

    db.add(patient)
    db.commit()
    db.refresh(patient)

    return patient


@router.get(
    "/",
    response_model=list[PatientResponse]
)
def get_patients(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    return db.query(Patient).all()


@router.get(
    "/{patient_id}",
    response_model=PatientResponse
)
def get_patient(
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

    # Admin can view any patient
    if current_user.role == "admin":
        return patient

    # Patient can view only their own profile
    if (
        current_user.role == "patient"
        and patient.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only access your own patient profile"
        )

    # Hospital staff currently cannot access patient profiles
    if current_user.role == "hospital_staff":
        raise HTTPException(
            status_code=403,
            detail="Hospital staff cannot access patient profiles"
        )

    return patient