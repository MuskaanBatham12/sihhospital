from app.models.hospital import Hospital
from app.algorithms.allocation import calculate_hospital_score


def hospital_has_resource(hospital, required_resource):
    if not required_resource:
        return hospital.available_beds > 0

    resource = required_resource.upper()

    if resource == "ICU_BED":
        return hospital.icu_beds > 0

    if resource == "EMERGENCY_BED":
        return hospital.emergency_beds > 0

    if resource == "GENERAL_BED":
        return hospital.available_beds > 0

    if resource == "OXYGEN":
        return hospital.oxygen_available > 0

    if resource == "VENTILATOR":
        return hospital.ventilators > 0

    return False

def rank_hospitals(
    db,
    patient_latitude,
    patient_longitude,
    severity,
    required_resource=None
):
    hospitals = db.query(Hospital).all()

    ranked_hospitals = []

    for hospital in hospitals:

        # Step 1: Filter hospitals based on required resource
        if not hospital_has_resource(
            hospital,
            required_resource
        ):
            continue

        # Step 2: Calculate hospital score
        score = calculate_hospital_score(
            hospital,
            patient_latitude,
            patient_longitude,
            severity
        )

        # Step 3: Add explanation
        score["selection_reason"] = (
            f"Selected based on resource availability, "
            f"emergency severity, distance, and hospital load. "
            f"Required resource: "
            f"{required_resource or 'GENERAL_BED'}."
        )

        ranked_hospitals.append(score)

    # Highest score first
    ranked_hospitals.sort(
        key=lambda x: x["final_score"],
        reverse=True
    )

    return ranked_hospitals