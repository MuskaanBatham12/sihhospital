from math import radians, sin, cos, sqrt, atan2


def calculate_distance(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float
):
    R = 6371

    lat1 = radians(lat1)
    lon1 = radians(lon1)
    lat2 = radians(lat2)
    lon2 = radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        sin(dlat / 2) ** 2
        + cos(lat1)
        * cos(lat2)
        * sin(dlon / 2) ** 2
    )

    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c


def calculate_resource_score(hospital):
    total_resources = (
        hospital.available_beds
        + hospital.icu_beds
        + hospital.emergency_beds
        + hospital.oxygen_available
        + hospital.ventilators
    )

    maximum_resources = (
        hospital.total_beds
        + hospital.icu_beds
        + hospital.emergency_beds
        + hospital.oxygen_available
        + hospital.ventilators
    )

    if maximum_resources == 0:
        return 0

    return min(
        (total_resources / maximum_resources) * 100,
        100
    )


def calculate_emergency_priority(severity: str):
    severity_scores = {
        "LOW": 25,
        "MEDIUM": 50,
        "HIGH": 75,
        "CRITICAL": 100
    }

    return severity_scores.get(
        severity.upper(),
        50
    )


def calculate_distance_score(distance):
    if distance <= 5:
        return 100
    elif distance <= 10:
        return 80
    elif distance <= 20:
        return 60
    elif distance <= 50:
        return 40
    else:
        return 20


def calculate_load_score(current_load):
    return max(
        0,
        100 - current_load
    )


def calculate_hospital_score(
    hospital,
    patient_latitude,
    patient_longitude,
    severity
):
    distance = calculate_distance(
        patient_latitude,
        patient_longitude,
        hospital.latitude,
        hospital.longitude
    )

    resource_score = calculate_resource_score(
        hospital
    )

    emergency_score = calculate_emergency_priority(
        severity
    )

    distance_score = calculate_distance_score(
        distance
    )

    load_score = calculate_load_score(
        hospital.current_load
    )

    final_score = (
        0.40 * resource_score
        + 0.30 * emergency_score
        + 0.20 * distance_score
        + 0.10 * load_score
    )

    return {
        "hospital_id": hospital.id,
        "hospital_name": hospital.name,
        "distance_km": round(distance, 2),
        "resource_score": round(resource_score, 2),
        "emergency_score": emergency_score,
        "distance_score": distance_score,
        "load_score": round(load_score, 2),
        "final_score": round(final_score, 2)
    }