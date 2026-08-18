from sqlalchemy import Column, Integer, Float, String, ForeignKey
from app.database import Base


class PhysioResult(Base):
    __tablename__ = "physio_results"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(
        Integer,
        ForeignKey("physio_sessions.id"),
        nullable=False
    )

    repetitions = Column(Integer, default=0)
    posture_score = Column(Float, nullable=True)
    feedback = Column(String(1000), nullable=True)