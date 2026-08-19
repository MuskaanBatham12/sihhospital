from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.database import Base



class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="patient")
    is_active = Column(Boolean, default=True)

    hospital_id = Column(
    Integer,
    ForeignKey("hospitals.id"),
    nullable=True
)