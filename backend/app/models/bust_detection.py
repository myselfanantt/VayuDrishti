from sqlalchemy import Column, String, DateTime, Float, Integer, ForeignKey, JSON, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base


class BustDetection(Base):
    __tablename__ = "bust_detections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(String(64), ForeignKey("forecast_runs.run_id"), nullable=False, index=True)
    region_id = Column(String(64), nullable=False, index=True)
    region_name = Column(String(128))
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    lead_day = Column(Integer, nullable=False)
    bust_probability = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False)
    uncertainty_low = Column(Float)
    uncertainty_high = Column(Float)
    severity = Column(String(16))  # LOW, MODERATE, HIGH, CRITICAL
    synoptic_regime = Column(String(64))
    shap_values = Column(JSON)
    narrative = Column(Text)
    similar_events = Column(JSON)
    is_verified = Column(Boolean, default=False)
    actual_bust = Column(Boolean)
    verification_mae = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    def __repr__(self) -> str:
        return f"<BustDetection run={self.run_id} region={self.region_name} prob={self.bust_probability:.2f}>"
