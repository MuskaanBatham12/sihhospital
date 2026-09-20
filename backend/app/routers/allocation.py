from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.patient import Patient
from app.models.user import User
from app.models.allocation import Allocation
from app.models.hospital import Hospital
from app.models.bed import Bed
from app.models.room import Room
from app.models.resource import Resource

from app.schemas.allocation import (
    AllocationCreate,
    AllocationResponse,
    AllocationRequest,
    HospitalRanking
)

from app.auth.roles import require_role, require_roles
from app.services.allocation_service import rank_hospitals
from app.auth.dependencies import get_current_user, get_optional_current_user


router = APIRouter(
    prefix="/allocation",
    tags=["Hospital Allocation"]
)


# ==========================================================
# RANK AVAILABLE HOSPITALS
# ==========================================================

@router.post(
    "/rank",
    response_model=list[HospitalRanking]
)
def rank_available_hospitals(
    request: AllocationRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_current_user)
):

    patient = db.query(Patient).filter(
        Patient.id == request.patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    hospitals = rank_hospitals(
        db=db,
        patient_latitude=request.latitude,
        patient_longitude=request.longitude,
        severity=request.severity,
        required_resource=request.required_resource
    )

    if not hospitals:
        raise HTTPException(
            status_code=404,
            detail="No suitable hospitals found"
        )

    return hospitals


# ==========================================================
# GET ALL ALLOCATIONS
# ==========================================================

@router.get("/")
def get_allocations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    query = db.query(Allocation)

    # Patient → only their own allocations
    if current_user.role == "patient":

        patient = db.query(Patient).filter(
            Patient.user_id == current_user.id
        ).first()

        if not patient:
            return []

        query = query.filter(
            Allocation.patient_id == patient.id
        )

    # Hospital staff → only their hospital's allocations
    elif current_user.role == "hospital_staff":

        query = query.filter(
            Allocation.hospital_id == current_user.hospital_id
        )

    # Admin → all allocations

    return query.order_by(
        Allocation.allocated_at.desc()
    ).all()


# ==========================================================
# GET SINGLE ALLOCATION
# ==========================================================

@router.get("/{allocation_id}")
def get_allocation(
    allocation_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    allocation = db.query(Allocation).filter(
        Allocation.id == allocation_id
    ).first()

    if not allocation:
        raise HTTPException(
            status_code=404,
            detail="Allocation not found"
        )

    # Patient → only their own allocation
    if current_user.role == "patient":

        patient = db.query(Patient).filter(
            Patient.user_id == current_user.id
        ).first()

        if not patient or allocation.patient_id != patient.id:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own allocation"
            )

    # Hospital staff → only their hospital
    elif current_user.role == "hospital_staff":

        if allocation.hospital_id != current_user.hospital_id:
            raise HTTPException(
                status_code=403,
                detail="You can only view allocations for your hospital"
            )

    return allocation


# ==========================================================
# UPDATE ALLOCATION STATUS
# ==========================================================

@router.put("/{allocation_id}/status")
def update_allocation_status(
    allocation_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(["admin", "hospital_staff"]))
):

    allocation = db.query(Allocation).filter(
        Allocation.id == allocation_id
    ).first()

    if not allocation:
        raise HTTPException(
            status_code=404,
            detail="Allocation not found"
        )

    # Hospital staff can only manage their hospital's allocations
    if current_user.role == "hospital_staff":

        if allocation.hospital_id != current_user.hospital_id:
            raise HTTPException(
                status_code=403,
                detail="You can only manage allocations for your hospital"
            )

    allowed_statuses = [
        "ALLOCATED",
        "COMPLETED",
        "CANCELLED",
        "RESOLVED"
    ]

    status = status.upper()

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Allowed values: {allowed_statuses}"
        )

    # ------------------------------------------------------
    # RELEASE BED WHEN ALLOCATION ENDS
    # ------------------------------------------------------

    if status in ["COMPLETED", "CANCELLED", "RESOLVED"]:

        hospital = db.query(Hospital).filter(
        Hospital.id == allocation.hospital_id
    ).first()

    if not hospital:
        raise HTTPException(
            status_code=404,
            detail="Hospital not found"
        )

    if allocation.bed_id:

            bed = db.query(Bed).filter(
                Bed.id == allocation.bed_id
            ).first()

            if bed and bed.status == "OCCUPIED":

                bed.status = "AVAILABLE"
                hospital.available_beds += 1

    if allocation.resource_type in ["OXYGEN", "VENTILATOR"]:

            resource = db.query(Resource).filter(
                Resource.hospital_id == allocation.hospital_id,
                Resource.resource_type == allocation.resource_type).first()

            if resource:
                resource.available_quantity += 1

                if allocation.resource_type == "OXYGEN":
                    hospital.oxygen_available += 1

                elif allocation.resource_type == "VENTILATOR":
                    hospital.ventilators += 1

    allocation.status = status

    db.commit()
    db.refresh(allocation)

    return {
        "message": "Allocation status updated successfully",
        "allocation_id": allocation.id,
        "status": allocation.status,
        "bed_released": (
            allocation.bed_id is not None
            and status in ["COMPLETED", "CANCELLED", "RESOLVED"]
        )
    }


# ==========================================================
# MANUAL ALLOCATION
# ==========================================================

@router.post("/", response_model=AllocationResponse)
def create_allocation(
    allocation_data: AllocationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):

    patient = db.query(Patient).filter(
        Patient.id == allocation_data.patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    hospital = db.query(Hospital).filter(
        Hospital.id == allocation_data.hospital_id
    ).first()

    if not hospital:
        raise HTTPException(
            status_code=404,
            detail="Hospital not found"
        )

    bed = None

    if allocation_data.bed_id is not None:

        bed = db.query(Bed).filter(
            Bed.id == allocation_data.bed_id
        ).first()

        if not bed:
            raise HTTPException(
                status_code=404,
                detail="Bed not found"
            )

        if bed.status != "AVAILABLE":
            raise HTTPException(
                status_code=400,
                detail="Selected bed is not available"
            )

        bed.status = "OCCUPIED"

    allocation = Allocation(
    patient_id=allocation_data.patient_id,
    hospital_id=allocation_data.hospital_id,
    bed_id=allocation_data.bed_id,
    status="ALLOCATED",
    reason=allocation_data.reason
)

    db.add(allocation)

    if hospital.available_beds > 0:
        hospital.available_beds -= 1

    db.commit()
    db.refresh(allocation)

    return allocation


# ==========================================================
# AUTOMATIC ALLOCATION
# ==========================================================

@router.post("/auto")
def automatic_allocation(
    request: AllocationRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_current_user)
):
    print("🔥 NEW ALLOCATION CODE IS RUNNING")

    # ------------------------------------------------------
    # FIND PATIENT
    # ------------------------------------------------------

    patient = db.query(Patient).filter(
        Patient.id == request.patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    # ------------------------------------------------------
    # PATIENT OWNERSHIP CHECK
    # ------------------------------------------------------

    if (
        current_user.role == "patient"
        and patient.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only request allocation for yourself"
        )

    # ------------------------------------------------------
    # CHECK EXISTING ALLOCATION
    # ------------------------------------------------------

    existing_allocation = db.query(Allocation).filter(
        Allocation.patient_id == patient.id,
        Allocation.status == "ALLOCATED"
    ).first()

    if existing_allocation:

        return {
            "message": "Patient is already allocated",
            "allocation_id": existing_allocation.id,
            "patient_id": existing_allocation.patient_id,
            "hospital_id": existing_allocation.hospital_id,
            "bed_id": existing_allocation.bed_id,
            "status": existing_allocation.status
        }

    # ------------------------------------------------------
    # RANK HOSPITALS
    # ------------------------------------------------------

    ranked_hospitals = rank_hospitals(
        db=db,
        patient_latitude=request.latitude,
        patient_longitude=request.longitude,
        severity=request.severity,
        required_resource=request.required_resource
    )

    if not ranked_hospitals:

        raise HTTPException(
            status_code=404,
            detail="No suitable hospitals found"
        )

    # ------------------------------------------------------
    # SELECT A HOSPITAL WITH ACTUAL RESOURCE AVAILABILITY
    # ------------------------------------------------------

    selected_hospital = None
    hospital = None
    available_bed = None

    # ======================================================
    # BED RESOURCE
    # ======================================================

    if request.required_resource in [
        "ICU_BED",
        "EMERGENCY_BED",
        "GENERAL_BED"
    ]:

        for ranked_hospital in ranked_hospitals:

            hospital_candidate = db.query(Hospital).filter(
                Hospital.id == ranked_hospital["hospital_id"]
            ).first()

            if not hospital_candidate:
                continue

            # Start bed query for this hospital
            bed_query = (
                db.query(Bed)
                .join(Room, Bed.room_id == Room.id)
                .filter(
                    Room.hospital_id == hospital_candidate.id,
                    Bed.status == "AVAILABLE"
                )
            )

            # Match requested bed type
            if request.required_resource == "ICU_BED":

                bed_query = bed_query.filter(
                    Room.room_type == "ICU"
                )

            elif request.required_resource == "EMERGENCY_BED":

                bed_query = bed_query.filter(
                    Room.room_type == "EMERGENCY"
                )

            elif request.required_resource == "GENERAL_BED":

                bed_query = bed_query.filter(
                    Room.room_type == "GENERAL"
                )

            candidate_bed = bed_query.first()

            # If this hospital has the required bed,
            # select it.
            if candidate_bed:

                selected_hospital = ranked_hospital
                hospital = hospital_candidate
                available_bed = candidate_bed

                break

        # No hospital in ranking has the requested bed
        if not hospital or not available_bed:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"No suitable available "
                    f"{request.required_resource} found "
                    f"in any ranked hospital"
                )
            )

        # --------------------------------------------------
        # OCCUPY BED
        # --------------------------------------------------

        available_bed.status = "OCCUPIED"

        # Keep hospital summary synchronized
        if hospital.available_beds > 0:
            hospital.available_beds -= 1

        # Keep resources table synchronized
        resource = db.query(Resource).filter(
            Resource.hospital_id == hospital.id,
            Resource.resource_type == request.required_resource).first()

        if resource and resource.available_quantity > 0:
            resource.available_quantity -= 1

    # ======================================================
    # OXYGEN / VENTILATOR
    # ======================================================

    elif request.required_resource in [
        "OXYGEN",
        "VENTILATOR"
    ]:

        for ranked_hospital in ranked_hospitals:

            hospital_candidate = db.query(Hospital).filter(
                Hospital.id == ranked_hospital["hospital_id"]
            ).first()

            if not hospital_candidate:
                continue

            resource = db.query(Resource).filter(
                Resource.hospital_id == hospital_candidate.id,
                Resource.resource_type == request.required_resource
            ).first()

            if not resource:
                continue

            if resource.available_quantity <= 0:
                continue

            # Found a hospital with the requested resource
            selected_hospital = ranked_hospital
            hospital = hospital_candidate

            break

        if not hospital:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"No {request.required_resource} "
                    f"available in any ranked hospital"
                )
            )

        # --------------------------------------------------
        # RESERVE ONE RESOURCE
        # --------------------------------------------------

        resource.available_quantity -= 1

        # Keep hospital summary fields synchronized
        if request.required_resource == "OXYGEN":

            if hospital.oxygen_available > 0:
                hospital.oxygen_available -= 1

        elif request.required_resource == "VENTILATOR":

            if hospital.ventilators > 0:
                hospital.ventilators -= 1

    # ======================================================
    # INVALID RESOURCE
    # ======================================================

    else:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid required_resource: "
                f"{request.required_resource}"
            )
        )

    # ======================================================
    # CREATE ALLOCATION RECORD
    # ======================================================

    allocation = Allocation(
        patient_id=patient.id,
        hospital_id=hospital.id,
        bed_id=available_bed.id if available_bed else None,
        resource_type=request.required_resource,
        status="ALLOCATED",
        reason=(
            f"Automatically allocated based on hospital "
            f"score {selected_hospital['final_score']}. "
            f"Required resource: "
            f"{request.required_resource}."
        )
    )

    db.add(allocation)

    db.commit()
    db.refresh(allocation)

    # ------------------------------------------------------
    # PREPARE BED INFORMATION
    # ------------------------------------------------------

    allocated_bed = None

    if available_bed:

        allocated_bed = {
            "bed_id": available_bed.id,
            "bed_number": available_bed.bed_number
        }

    # ------------------------------------------------------
    # FINAL RESPONSE
    # ------------------------------------------------------

    return {
        "message": "Patient allocated successfully",
        "allocation_id": allocation.id,
        "patient_id": patient.id,
        "hospital": selected_hospital,
        "allocated_bed": allocated_bed
    }