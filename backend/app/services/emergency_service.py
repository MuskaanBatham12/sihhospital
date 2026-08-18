def calculate_emergency_severity(
    spo2: float | None = None,
    temperature: float | None = None,
    pulse_rate: float | None = None
):
    severity_score = 0
    reasons = []

    # SpO2
    if spo2 is not None:
        if spo2 < 85:
            severity_score += 4
            reasons.append("Critically low SpO2")
        elif spo2 < 90:
            severity_score += 3
            reasons.append("Very low SpO2")
        elif spo2 < 94:
            severity_score += 2
            reasons.append("Low SpO2")
        else:
            reasons.append("SpO2 is within normal range")

    # Temperature
    if temperature is not None:
        if temperature >= 40:
            severity_score += 3
            reasons.append("Extremely high temperature")
        elif temperature >= 39:
            severity_score += 2
            reasons.append("High temperature")
        elif temperature < 35:
            severity_score += 3
            reasons.append("Abnormally low temperature")
        else:
            reasons.append("Temperature is within normal range")

    # Pulse rate
    if pulse_rate is not None:
        if pulse_rate > 130 or pulse_rate < 40:
            severity_score += 3
            reasons.append("Critically abnormal pulse rate")
        elif pulse_rate > 110 or pulse_rate < 50:
            severity_score += 2
            reasons.append("Abnormal pulse rate")
        else:
            reasons.append("Pulse rate is within normal range")

    # Determine severity
    if severity_score >= 7:
        severity = "CRITICAL"
    elif severity_score >= 5:
        severity = "HIGH"
    elif severity_score >= 2:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    return {
        "severity": severity,
        "severity_score": severity_score,
        "reasons": reasons
    }