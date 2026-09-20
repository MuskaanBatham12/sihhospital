import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Load backend/.env as well as root .env
backend_env_path = Path(__file__).resolve().parent.parent / ".env"
if backend_env_path.exists():
    load_dotenv(dotenv_path=backend_env_path)
else:
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./hospital.db"

try:
    if DATABASE_URL.startswith("sqlite"):
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            pass
except Exception as e:
    print(f"Database notice: Primary connection ({DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else 'local'}) not reachable ({e}). Using local SQLite database.")
    DATABASE_URL = "sqlite:///./hospital_fallback.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()