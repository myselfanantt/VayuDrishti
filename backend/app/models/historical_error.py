from sqlalchemy import Column, String, DateTime, Float, Integer, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base


class HistoricalError(Base):
    __tablename__ = "historical_errors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(String(64), nullable=False, index=True)
    model_name = Column(String(32), nullable=False)
    valid_time = Column(DateTime(timezone=True), nullable=False, index=True)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    variable = Column(String(32), nullable=False)
    lead_day = Column(Integer, nullable=False)
    mae = Column(Float)
    rmse = Column(Float)
    bias = Column(Float)
    region_id = Column(String(64))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_hist_errors_lat_lon_time", "lat", "lon", "valid_time"),
        Index("ix_hist_errors_region_lead", "region_id", "lead_day"),
    )
