from sqlalchemy import Column, String, DateTime, Float, JSON, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base


class SynopticEvent(Base):
    __tablename__ = "synoptic_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String(64), nullable=False, index=True)
    name = Column(String(128))
    onset_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True))
    center_lat = Column(Float)
    center_lon = Column(Float)
    intensity = Column(String(32))  # weak, moderate, severe, very_severe
    affected_regions = Column(JSON)
    bust_mae_avg = Column(Float)
    description = Column(Text)
    is_synthetic = Column(Boolean, default=False)
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
