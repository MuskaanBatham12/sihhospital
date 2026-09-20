from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vital_reading import VitalReading
from app.models.patient import Patient


router = APIRouter(
    prefix="/hardware",
    tags=["Hardware & ESP32 Telemetry"]
)

# In-memory buffer for real-time telemetry from ESP32 sensors
latest_hardware_telemetry: Dict[str, Any] = {
    "device_id": "ESP32-VAIDYA-01",
    "status": "ONLINE_STANDBY",
    "heart_rate": 72,
    "spo2": 98.5,
    "temperature": 36.8,
    "last_received": datetime.utcnow().isoformat(),
    "is_hardware_connected": True
}


class ESP32TelemetryPayload(BaseModel):
    device_id: str = "ESP32-VAIDYA-01"
    patient_id: Optional[int] = 1
    heart_rate: float
    spo2: float
    temperature: float
    battery_level: Optional[float] = 100.0


@router.get("/status")
def get_hardware_status():
    """Returns the current ESP32 hardware device status and readiness."""
    return {
        "device_id": latest_hardware_telemetry["device_id"],
        "hardware_ready": True,
        "supported_sensors": ["MAX30102 (SpO2 / Heart Rate)", "MLX90614 (Infrared Temp)"],
        "status": latest_hardware_telemetry["status"],
        "last_reading": latest_hardware_telemetry
    }


@router.get("/vitals/latest")
def get_latest_hardware_vitals():
    """Fetches the latest live vitals streamed from the hardware sensor."""
    return latest_hardware_telemetry


@router.post("/vitals")
def receive_esp32_telemetry(payload: ESP32TelemetryPayload, db: Session = Depends(get_db)):
    """
    Ingests live telemetry packets from the ESP32 microcontroller over HTTP/WiFi.
    Saves readings to the database if patient_id exists.
    """
    global latest_hardware_telemetry

    latest_hardware_telemetry = {
        "device_id": payload.device_id,
        "status": "RECEIVING_STREAM",
        "heart_rate": payload.heart_rate,
        "spo2": payload.spo2,
        "temperature": payload.temperature,
        "battery_level": payload.battery_level,
        "last_received": datetime.utcnow().isoformat(),
        "is_hardware_connected": True
    }

    # If associated with a patient, save reading
    if payload.patient_id:
        patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
        if patient:
            reading = VitalReading(
                patient_id=patient.id,
                heart_rate=int(payload.heart_rate),
                spo2=float(payload.spo2),
                temperature=float(payload.temperature),
                blood_pressure="120/80"
            )
            db.add(reading)
            db.commit()
            db.refresh(reading)

    return {
        "status": "success",
        "message": "Telemetry received from ESP32",
        "timestamp": datetime.utcnow().isoformat()
    }
