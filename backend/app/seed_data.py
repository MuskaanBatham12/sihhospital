"""
Seed database with realistic baseline hospital data across:
1. Uttar Pradesh
2. Delhi
3. Maharashtra
4. Telangana
5. Karnataka

Includes rooms, beds, and resources (Oxygen, Ventilators, ICU) for realistic demo testing.
"""
from app.database import SessionLocal, engine, Base
from app.models.hospital import Hospital
from app.models.room import Room
from app.models.bed import Bed
from app.models.resource import Resource
from app.models.user import User
from app.models.patient import Patient
from app.auth.security import hash_password

HOSPITALS_SEED = [
    # --- 1. UTTAR PRADESH ---
    {
        "name": "City Care Hospital & Trauma Center",
        "state": "Uttar Pradesh",
        "city": "Lucknow",
        "address": "Mahanagar, Lucknow, UP 226006",
        "latitude": 26.8720,
        "longitude": 80.9580,
        "contact": "+91 522 2345678",
        "type": "Multi-Speciality & Trauma",
        "emergency_available": 1,
        "total_beds": 120,
        "available_beds": 24,
        "icu_beds": 18,
        "available_icu": 6,
        "emergency_beds": 12,
        "oxygen_beds": 35,
        "oxygen_available": 20,
        "available_oxygen": 20,
        "ventilators": 12,
        "available_ventilators": 5,
        "current_load": 42.0,
        "specialties": "Cardiology, Emergency, Orthopedics, Trauma Care, Neurology"
    },
    {
        "name": "King George Medical University (KGMU)",
        "state": "Uttar Pradesh",
        "city": "Lucknow",
        "address": "Shah Mina Road, Chowk, Lucknow, UP 226003",
        "latitude": 26.8687,
        "longitude": 80.9168,
        "contact": "+91 522 2257450",
        "type": "Government Apex Super-Specialty",
        "emergency_available": 1,
        "total_beds": 450,
        "available_beds": 68,
        "icu_beds": 50,
        "available_icu": 14,
        "emergency_beds": 40,
        "oxygen_beds": 150,
        "oxygen_available": 45,
        "available_oxygen": 45,
        "ventilators": 40,
        "available_ventilators": 11,
        "current_load": 65.0,
        "specialties": "Trauma, Critical Care, Cardiology, Oncology, Neurosurgery"
    },
    {
        "name": "Regency Hospital",
        "state": "Uttar Pradesh",
        "city": "Kanpur",
        "address": "Sarvodaya Nagar, Kanpur, UP 208005",
        "latitude": 26.4789,
        "longitude": 80.3120,
        "contact": "+91 512 2295101",
        "type": "Super Specialty Hospital",
        "emergency_available": 1,
        "total_beds": 180,
        "available_beds": 32,
        "icu_beds": 25,
        "available_icu": 8,
        "emergency_beds": 15,
        "oxygen_beds": 60,
        "oxygen_available": 28,
        "available_oxygen": 28,
        "ventilators": 16,
        "available_ventilators": 6,
        "current_load": 54.0,
        "specialties": "Emergency, Cardiac Science, Nephrology, Pulmonology"
    },
    {
        "name": "Fortis Hospital Noida",
        "state": "Uttar Pradesh",
        "city": "Noida",
        "address": "B-22, Sector 62, Noida, UP 201301",
        "latitude": 28.6180,
        "longitude": 77.3730,
        "contact": "+91 120 4300222",
        "type": "Tertiary Care Hospital",
        "emergency_available": 1,
        "total_beds": 200,
        "available_beds": 38,
        "icu_beds": 30,
        "available_icu": 9,
        "emergency_beds": 20,
        "oxygen_beds": 70,
        "oxygen_available": 34,
        "available_oxygen": 34,
        "ventilators": 22,
        "available_ventilators": 8,
        "current_load": 48.0,
        "specialties": "Cardiology, Orthopaedics, Neurosciences, Emergency Medicine"
    },
    {
        "name": "Sir Sunderlal Hospital (BHU)",
        "state": "Uttar Pradesh",
        "city": "Varanasi",
        "address": "Banaras Hindu University, Varanasi, UP 221005",
        "latitude": 25.2750,
        "longitude": 82.9980,
        "contact": "+91 542 2369291",
        "type": "Multi-Speciality Medical Institute",
        "emergency_available": 1,
        "total_beds": 320,
        "available_beds": 42,
        "icu_beds": 35,
        "available_icu": 7,
        "emergency_beds": 25,
        "oxygen_beds": 100,
        "oxygen_available": 30,
        "available_oxygen": 30,
        "ventilators": 25,
        "available_ventilators": 6,
        "current_load": 72.0,
        "specialties": "Emergency, General Surgery, Cardiology, Pediatrics, Trauma"
    },

    # --- 2. DELHI ---
    {
        "name": "AIIMS New Delhi",
        "state": "Delhi",
        "city": "New Delhi",
        "address": "Sri Aurobindo Marg, Ansari Nagar, New Delhi 110029",
        "latitude": 28.5672,
        "longitude": 77.2100,
        "contact": "+91 11 26588500",
        "type": "Apex National Medical Institute",
        "emergency_available": 1,
        "total_beds": 600,
        "available_beds": 85,
        "icu_beds": 75,
        "available_icu": 18,
        "emergency_beds": 50,
        "oxygen_beds": 220,
        "oxygen_available": 70,
        "available_oxygen": 70,
        "ventilators": 55,
        "available_ventilators": 15,
        "current_load": 78.0,
        "specialties": "Emergency Medicine, Cardiac Trauma, Neuro ICU, Oncology, Transplant"
    },
    {
        "name": "Max Super Speciality Hospital Saket",
        "state": "Delhi",
        "city": "South Delhi",
        "address": "1, 2, Press Enclave Marg, Saket, New Delhi 110017",
        "latitude": 28.5280,
        "longitude": 77.2120,
        "contact": "+91 11 26515050",
        "type": "Super Speciality Tertiary",
        "emergency_available": 1,
        "total_beds": 280,
        "available_beds": 45,
        "icu_beds": 40,
        "available_icu": 12,
        "emergency_beds": 25,
        "oxygen_beds": 95,
        "oxygen_available": 40,
        "available_oxygen": 40,
        "ventilators": 28,
        "available_ventilators": 10,
        "current_load": 51.0,
        "specialties": "Cardiac Sciences, Critical Care, Neurosciences, Orthopaedics"
    },
    {
        "name": "Indraprastha Apollo Hospitals",
        "state": "Delhi",
        "city": "South East Delhi",
        "address": "Delhi-Mathura Road, Sarita Vihar, New Delhi 110076",
        "latitude": 28.5398,
        "longitude": 77.2910,
        "contact": "+91 11 71791090",
        "type": "Multi-Speciality Tertiary Care",
        "emergency_available": 1,
        "total_beds": 350,
        "available_beds": 58,
        "icu_beds": 45,
        "available_icu": 15,
        "emergency_beds": 30,
        "oxygen_beds": 120,
        "oxygen_available": 52,
        "available_oxygen": 52,
        "ventilators": 35,
        "available_ventilators": 12,
        "current_load": 46.0,
        "specialties": "Cardiology, Emergency, Liver Transplant, Oncology, Robotic Surgery"
    },
    {
        "name": "Manipal Hospital Dwarka",
        "state": "Delhi",
        "city": "Dwarka",
        "address": "Sector 6, Dwarka, New Delhi 110075",
        "latitude": 28.5920,
        "longitude": 77.0620,
        "contact": "+91 11 49674967",
        "type": "Quaternary Care Hospital",
        "emergency_available": 1,
        "total_beds": 220,
        "available_beds": 36,
        "icu_beds": 32,
        "available_icu": 9,
        "emergency_beds": 18,
        "oxygen_beds": 80,
        "oxygen_available": 33,
        "available_oxygen": 33,
        "ventilators": 20,
        "available_ventilators": 7,
        "current_load": 58.0,
        "specialties": "Critical Care, Emergency, Nephrology, Pulmonology, Gastro"
    },

    # --- 3. MAHARASHTRA ---
    {
        "name": "Lilavati Hospital and Research Centre",
        "state": "Maharashtra",
        "city": "Mumbai",
        "address": "A-791, Bandra Reclamation, Bandra West, Mumbai 400050",
        "latitude": 19.0515,
        "longitude": 72.8290,
        "contact": "+91 22 26751000",
        "type": "Premier Multi-Specialty",
        "emergency_available": 1,
        "total_beds": 240,
        "available_beds": 35,
        "icu_beds": 34,
        "available_icu": 10,
        "emergency_beds": 20,
        "oxygen_beds": 90,
        "oxygen_available": 38,
        "available_oxygen": 38,
        "ventilators": 26,
        "available_ventilators": 9,
        "current_load": 52.0,
        "specialties": "Cardiology, Intensive Care, Trauma, Neurology, Oncology"
    },
    {
        "name": "Kokilaben Dhirubhai Ambani Hospital",
        "state": "Maharashtra",
        "city": "Mumbai",
        "address": "Rao Saheb Achutrao Patwardhan Marg, Andheri West, Mumbai 400053",
        "latitude": 19.1310,
        "longitude": 72.8250,
        "contact": "+91 22 42696969",
        "type": "Quaternary Super Speciality",
        "emergency_available": 1,
        "total_beds": 380,
        "available_beds": 62,
        "icu_beds": 55,
        "available_icu": 16,
        "emergency_beds": 35,
        "oxygen_beds": 140,
        "oxygen_available": 58,
        "available_oxygen": 58,
        "ventilators": 40,
        "available_ventilators": 14,
        "current_load": 45.0,
        "specialties": "Emergency Trauma, Cardiac Care, Robotic Surgery, Neuro ICU"
    },
    {
        "name": "Ruby Hall Clinic",
        "state": "Maharashtra",
        "city": "Pune",
        "address": "40, Sassoon Road, Pune, Maharashtra 411001",
        "latitude": 18.5284,
        "longitude": 73.8740,
        "contact": "+91 20 66455100",
        "type": "Multi-Speciality Care",
        "emergency_available": 1,
        "total_beds": 260,
        "available_beds": 40,
        "icu_beds": 36,
        "available_icu": 11,
        "emergency_beds": 22,
        "oxygen_beds": 100,
        "oxygen_available": 42,
        "available_oxygen": 42,
        "ventilators": 24,
        "available_ventilators": 8,
        "current_load": 49.0,
        "specialties": "Critical Care, Cardiology, Trauma Unit, Oncology, Organ Transplant"
    },
    {
        "name": "AIIMS Nagpur",
        "state": "Maharashtra",
        "city": "Nagpur",
        "address": "Plot No 2, Sector 20, MIHAN, Nagpur, Maharashtra 441108",
        "latitude": 21.0450,
        "longitude": 79.0280,
        "contact": "+91 712 2982888",
        "type": "National Medical Institute",
        "emergency_available": 1,
        "total_beds": 300,
        "available_beds": 52,
        "icu_beds": 40,
        "available_icu": 13,
        "emergency_beds": 28,
        "oxygen_beds": 110,
        "oxygen_available": 46,
        "available_oxygen": 46,
        "ventilators": 30,
        "available_ventilators": 10,
        "current_load": 43.0,
        "specialties": "Emergency, Trauma, Cardiac ICU, Pulmonary Medicine, General Surgery"
    },

    # --- 4. TELANGANA ---
    {
        "name": "Apollo Hospitals Jubilee Hills",
        "state": "Telangana",
        "city": "Hyderabad",
        "address": "Road No 72, Film Nagar, Jubilee Hills, Hyderabad 500033",
        "latitude": 17.4168,
        "longitude": 78.4115,
        "contact": "+91 40 23607777",
        "type": "Super Speciality Tertiary Care",
        "emergency_available": 1,
        "total_beds": 350,
        "available_beds": 54,
        "icu_beds": 48,
        "available_icu": 15,
        "emergency_beds": 30,
        "oxygen_beds": 130,
        "oxygen_available": 55,
        "available_oxygen": 55,
        "ventilators": 35,
        "available_ventilators": 12,
        "current_load": 47.0,
        "specialties": "Emergency Trauma, Cardiology, Neurology, Critical Care, Ortho"
    },
    {
        "name": "Yashoda Hospitals Secunderabad",
        "state": "Telangana",
        "city": "Secunderabad",
        "address": "Alexander Road, Secunderabad, Telangana 500003",
        "latitude": 17.4399,
        "longitude": 78.4983,
        "contact": "+91 40 45674567",
        "type": "Multi-Super Specialty",
        "emergency_available": 1,
        "total_beds": 290,
        "available_beds": 46,
        "icu_beds": 38,
        "available_icu": 11,
        "emergency_beds": 24,
        "oxygen_beds": 105,
        "oxygen_available": 44,
        "available_oxygen": 44,
        "ventilators": 28,
        "available_ventilators": 9,
        "current_load": 53.0,
        "specialties": "Cardiology, Critical Care, Emergency Medicine, Pulmonology"
    },
    {
        "name": "KIMS Hospitals Gachibowli",
        "state": "Telangana",
        "city": "Hyderabad",
        "address": "Gachibowli Main Road, Hyderabad, Telangana 500032",
        "latitude": 17.4420,
        "longitude": 78.3580,
        "contact": "+91 40 44885000",
        "type": "Quaternary Care Hospital",
        "emergency_available": 1,
        "total_beds": 240,
        "available_beds": 38,
        "icu_beds": 30,
        "available_icu": 8,
        "emergency_beds": 18,
        "oxygen_beds": 90,
        "oxygen_available": 36,
        "available_oxygen": 36,
        "ventilators": 22,
        "available_ventilators": 7,
        "current_load": 56.0,
        "specialties": "Trauma, Neuro ICU, Cardiac Sciences, Nephrology, Gastroenterology"
    },

    # --- 5. KARNATAKA ---
    {
        "name": "Manipal Hospital Old Airport Road",
        "state": "Karnataka",
        "city": "Bengaluru",
        "address": "98, HAL Old Airport Rd, Kodihalli, Bengaluru, Karnataka 560017",
        "latitude": 12.9592,
        "longitude": 77.6534,
        "contact": "+91 80 25024444",
        "type": "Quaternary Multi-Speciality",
        "emergency_available": 1,
        "total_beds": 360,
        "available_beds": 58,
        "icu_beds": 52,
        "available_icu": 16,
        "emergency_beds": 32,
        "oxygen_beds": 140,
        "oxygen_available": 60,
        "available_oxygen": 60,
        "ventilators": 38,
        "available_ventilators": 13,
        "current_load": 44.0,
        "specialties": "Emergency & Trauma, Cardiology, Intensive Care, Neurosciences"
    },
    {
        "name": "Fortis Hospital Bannerghatta Road",
        "state": "Karnataka",
        "city": "Bengaluru",
        "address": "154/9, Bannerghatta Main Rd, Opposite IIMB, Bengaluru 560076",
        "latitude": 12.8984,
        "longitude": 77.5996,
        "contact": "+91 80 66214444",
        "type": "Super Speciality Tertiary Care",
        "emergency_available": 1,
        "total_beds": 275,
        "available_beds": 42,
        "icu_beds": 36,
        "available_icu": 10,
        "emergency_beds": 22,
        "oxygen_beds": 100,
        "oxygen_available": 41,
        "available_oxygen": 41,
        "ventilators": 25,
        "available_ventilators": 8,
        "current_load": 50.0,
        "specialties": "Cardiac Sciences, Trauma Care, Orthopedics, Critical Care"
    },
    {
        "name": "Narayana Health City",
        "state": "Karnataka",
        "city": "Bengaluru",
        "address": "258/A, Bommasandra Industrial Area, Anekal Taluk, Bengaluru 560099",
        "latitude": 12.8210,
        "longitude": 77.6890,
        "contact": "+91 80 71222222",
        "type": "Apex Cardiac & Multi-Specialty",
        "emergency_available": 1,
        "total_beds": 500,
        "available_beds": 75,
        "icu_beds": 65,
        "available_icu": 20,
        "emergency_beds": 45,
        "oxygen_beds": 190,
        "oxygen_available": 72,
        "available_oxygen": 72,
        "ventilators": 48,
        "available_ventilators": 16,
        "current_load": 41.0,
        "specialties": "Pediatric & Adult Cardiology, Trauma ICU, Organ Transplant, Oncology"
    },
    {
        "name": "Apollo BGS Hospitals",
        "state": "Karnataka",
        "city": "Mysuru",
        "address": "Adhichunchanagiri Road, Kuvempunagar, Mysuru, Karnataka 570023",
        "latitude": 12.2965,
        "longitude": 76.6270,
        "contact": "+91 821 2568888",
        "type": "Super Speciality Hospital",
        "emergency_available": 1,
        "total_beds": 190,
        "available_beds": 31,
        "icu_beds": 26,
        "available_icu": 7,
        "emergency_beds": 16,
        "oxygen_beds": 75,
        "oxygen_available": 30,
        "available_oxygen": 30,
        "ventilators": 18,
        "available_ventilators": 6,
        "current_load": 55.0,
        "specialties": "Emergency Medicine, Cardiology, Neurology, General Surgery"
    }
]


def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("Seeding hospitals across UP, Delhi, Maharashtra, Telangana, Karnataka...")
        for data in HOSPITALS_SEED:
            hospital = Hospital(**data)
            db.add(hospital)
            db.flush()

            # Add standard rooms
            icu_room = Room(hospital_id=hospital.id, room_number="ICU-101", room_type="ICU", total_beds=hospital.icu_beds)
            em_room = Room(hospital_id=hospital.id, room_number="EM-201", room_type="EMERGENCY", total_beds=hospital.emergency_beds)
            gen_room = Room(hospital_id=hospital.id, room_number="GEN-301", room_type="GENERAL", total_beds=max(1, hospital.total_beds - hospital.icu_beds - hospital.emergency_beds))
            
            db.add_all([icu_room, em_room, gen_room])
            db.flush()

            # Add sample beds
            for i in range(1, min(6, (hospital.available_icu or 4) + 1)):
                db.add(Bed(room_id=icu_room.id, bed_number=f"ICU-BED-{i:02d}", status="AVAILABLE"))
            for i in range(1, min(6, hospital.emergency_beds + 1)):
                db.add(Bed(room_id=em_room.id, bed_number=f"EM-BED-{i:02d}", status="AVAILABLE"))
            for i in range(1, min(10, hospital.available_beds + 1)):
                db.add(Bed(room_id=gen_room.id, bed_number=f"GEN-BED-{i:02d}", status="AVAILABLE"))

            # Add resources
            db.add(Resource(hospital_id=hospital.id, resource_type="ICU_BED", total_quantity=hospital.icu_beds, available_quantity=hospital.available_icu or hospital.icu_beds))
            db.add(Resource(hospital_id=hospital.id, resource_type="EMERGENCY_BED", total_quantity=hospital.emergency_beds, available_quantity=hospital.emergency_beds))
            db.add(Resource(hospital_id=hospital.id, resource_type="GENERAL_BED", total_quantity=hospital.total_beds, available_quantity=hospital.available_beds))
            db.add(Resource(hospital_id=hospital.id, resource_type="OXYGEN", total_quantity=hospital.oxygen_beds or hospital.oxygen_available, available_quantity=hospital.available_oxygen or hospital.oxygen_available))
            db.add(Resource(hospital_id=hospital.id, resource_type="VENTILATOR", total_quantity=hospital.ventilators, available_quantity=hospital.available_ventilators or hospital.ventilators))

        # Ensure demo patient exists
        demo_user = User(
            name="Dr. Muskaan Batham",
            email="muskaan@vaidya.ai",
            password_hash=hash_password("password123"),
            role="patient"
        )
        db.add(demo_user)
        db.flush()

        demo_patient = Patient(
            user_id=demo_user.id,
            gender="Female",
            blood_group="O+",
            emergency_contact="+91 9876543210"
        )
        db.add(demo_patient)

        db.commit()
        print(f"Successfully seeded {len(HOSPITALS_SEED)} hospitals across 5 states!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
