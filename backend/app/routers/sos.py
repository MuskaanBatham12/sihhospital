from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.patient import Patient
from app.models.hospital import Hospital
from app.models.allocation import Allocation
from app.models.bed import Bed
from app.models.room import Room
from app.models.resource import Resource
from app.models.emergency_request import EmergencyRequest
from app.models.vital_reading import VitalReading
from app.services.emergency_service import calculate_emergency_severity

from app.auth.dependencies import get_current_user
from app.services.allocation_service import rank_hospitals

router = APIRouter(
    prefix="/sos",
    tags=["SOS"]
)


@router.post("/")
def emergency_sos(
    patient_id: int,
    latitude: float,
    longitude: float,
    severity: str,
    required_resource: str = "GENERAL_BED",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # -----------------------------
    # 1. Check patient
    # -----------------------------
    patient = db.query(Patient).filter(
        Patient.id == patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

        # Patient can only trigger SOS for themselves
    if (
        current_user.role == "patient"
        and patient.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only trigger SOS for yourself"
        )

    # Check whether patient already has an active allocation
    existing_allocation = db.query(Allocation).filter(
        Allocation.patient_id == patient.id,
        Allocation.status == "ALLOCATED"
    ).first()

    if existing_allocation:
        raise HTTPException(
            status_code=400,
            detail="Patient already has an active allocation"
        )

        # Get patient's latest vital reading
    latest_vital = db.query(VitalReading).filter(
        VitalReading.patient_id == patient.id
    ).order_by(
        VitalReading.recorded_at.desc()
    ).first()

    if latest_vital:
        assessment = calculate_emergency_severity(
            spo2=latest_vital.spo2,
            temperature=latest_vital.temperature,
            pulse_rate=latest_vital.pulse_rate
        )

        severity = assessment["severity"]
        severity_reasons = assessment["reasons"]
    else:
        severity_reasons = [
            "No recent vital readings available"
        ]

    # -----------------------------
    # 2. Rank hospitals
    # -----------------------------
    ranked_hospitals = rank_hospitals(
        db=db,
        patient_latitude=latitude,
        patient_longitude=longitude,
        severity=severity,
        required_resource=required_resource
    )
    

    if not ranked_hospitals:
        raise HTTPException(
            status_code=404,
            detail="No suitable hospitals available"
        )

        # -----------------------------
    # 3. Find the best hospital with
    #    an actually available resource
    # -----------------------------
    hospital = None
    available_bed = None
    selected_ranking = None

    for ranking in ranked_hospitals:

        candidate_hospital = db.query(Hospital).filter(
            Hospital.id == ranking["hospital_id"]
        ).first()

        if not candidate_hospital:
            continue

        # -----------------------------
        # Check bed availability
        # -----------------------------
        if required_resource in [
            "ICU_BED",
            "EMERGENCY_BED",
            "GENERAL_BED"
        ]:

            bed_query = (
                db.query(Bed)
                .join(Room, Bed.room_id == Room.id)
                .filter(
                    Room.hospital_id == candidate_hospital.id,
                    Bed.status == "AVAILABLE"
                )
            )

            if required_resource == "ICU_BED":
                bed_query = bed_query.filter(
                    Room.room_type == "ICU"
                )

            elif required_resource == "EMERGENCY_BED":
                bed_query = bed_query.filter(
                    Room.room_type == "EMERGENCY"
                )

            elif required_resource == "GENERAL_BED":
                bed_query = bed_query.filter(
                    Room.room_type == "GENERAL"
                )

            candidate_bed = bed_query.first()

            if candidate_bed:
                hospital = candidate_hospital
                available_bed = candidate_bed
                selected_ranking = ranking
                break

        # -----------------------------
        # Check oxygen / ventilator
        # -----------------------------
        elif required_resource in [
            "OXYGEN",
            "VENTILATOR"
        ]:

            resource = db.query(Resource).filter(
                Resource.hospital_id == candidate_hospital.id,
                Resource.resource_type == required_resource
            ).first()

            if resource and resource.available_quantity > 0:
                hospital = candidate_hospital
                selected_ranking = ranking
                break

    # -----------------------------
    # No hospital has actual resource
    # -----------------------------
    if not hospital:
        raise HTTPException(
            status_code=400,
            detail="No suitable hospital has the required available resource"
        )

# -----------------------------
# 4. Allocate selected resource
# -----------------------------

    if available_bed:

        available_bed.status = "OCCUPIED"

    if hospital.available_beds > 0:
        hospital.available_beds -= 1

    resource = db.query(Resource).filter(
        Resource.hospital_id == hospital.id,
        Resource.resource_type == required_resource
    ).first()

    if resource and resource.available_quantity > 0:
        resource.available_quantity -= 1

    elif required_resource in [
        "OXYGEN",
        "VENTILATOR"
    ]:

        resource = db.query(Resource).filter(
            Resource.hospital_id == hospital.id,
            Resource.resource_type == required_resource
        ).first()

        if not resource:
            raise HTTPException(
                status_code=404,
                detail=f"{required_resource} resource not found"
            )

        resource.available_quantity -= 1

        if required_resource == "OXYGEN":
            if hospital.oxygen_available > 0:
                hospital.oxygen_available -= 1

        elif required_resource == "VENTILATOR":
            if hospital.ventilators > 0:
                hospital.ventilators -= 1

    # -----------------------------
    # 6. Create allocation
    # -----------------------------
    allocation = Allocation(
        patient_id=patient_id,
        hospital_id=hospital.id,
        bed_id=available_bed.id if available_bed else None,
        status="ALLOCATED",
        reason=(
            f"Emergency SOS allocation. "
            f"Severity: {severity}. "
            f"Required resource: "
            f"{required_resource or 'GENERAL_BED'}."
        )
    )

    db.add(allocation)

    # -----------------------------
    # 7. Create emergency request
    # -----------------------------
    emergency_request = EmergencyRequest(
        patient_id=patient_id,
        latitude=latitude,
        longitude=longitude,
        severity=severity,
        required_resource=required_resource,
        status="ACCEPTED",
        recommended_hospital_id=hospital.id
    )

    db.add(emergency_request)

    db.commit()

    db.refresh(allocation)
    db.refresh(emergency_request)

    # -----------------------------
    # 8. Prepare bed response
    # -----------------------------
    allocated_bed = None

    if available_bed:
        allocated_bed = {
            "bed_id": available_bed.id,
            "bed_number": available_bed.bed_number
        }

    # -----------------------------
    # 9. Return SOS result
    # -----------------------------
    return {
        "message": "SOS processed successfully",

        "emergency_request_id": emergency_request.id,

        "emergency_details": {
            "patient_id": patient_id,
            "severity": severity,
            "severity_reasons": severity_reasons,
            "required_resource": required_resource,
            "location": {
                "latitude": latitude,
                "longitude": longitude
            }
        },

        "recommendation": {
            "hospital": selected_ranking,
            "reason": (
                "This hospital was ranked highest based on "
                "resource availability, emergency severity, "
                "distance, and current hospital load."
            )
        },

        "allocation": {
            "allocation_id": allocation.id,
            "hospital_id": allocation.hospital_id,
            "bed_id": allocation.bed_id,
            "status": allocation.status,
            "allocated_bed": allocated_bed
        },

        "alternatives": ranked_hospitals[1:4]
    }