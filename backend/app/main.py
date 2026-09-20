from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.models.user import User
from app.models.hospital import Hospital
from app.models.room import Room
from app.models.bed import Bed
from app.models.resource import Resource
from app.models.patient import Patient
from app.models.allocation import Allocation
from app.models.emergency_request import EmergencyRequest
from app.models.vital_reading import VitalReading
from app.models.physio_session import PhysioSession
from app.models.physio_result import PhysioResult

from app.routers.auth import router as auth_router
from app.routers.hospitals import router as hospital_router
from app.routers.rooms import router as room_router
from app.routers.beds import router as bed_router
from app.routers.resources import router as resource_router
from app.routers.patients import router as patient_router
from app.routers.allocation import router as allocation_router
from app.routers.sos import router as sos_router
from app.routers.vitals import router as vital_router
from app.routers.emergency_requests import router as emergency_router
from app.routers.hardware import router as hardware_router

app = FastAPI(
    title="VAIDYA AI — Virtual Hospital Allocation, Emergency Assistance & Telemetry",
    version="2.0.0",
    description="Main Healthcare Backend providing authentication, hospital resources, AI allocation, emergency dispatch and ESP32 hardware telemetry."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(hospital_router)
app.include_router(room_router)
app.include_router(bed_router)
app.include_router(resource_router)
app.include_router(patient_router)
app.include_router(allocation_router)
app.include_router(emergency_router)
app.include_router(sos_router)
app.include_router(vital_router)
app.include_router(hardware_router)


@app.get("/")
def root():
    return {
        "status": "running",
        "service": "VAIDYA AI Healthcare Backend",
        "version": "2.0.0"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected"
    }