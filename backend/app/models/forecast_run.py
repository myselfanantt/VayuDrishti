from sqlalchemy import Column, String, DateTime, Float, Integer, Text, JSON, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from app.database import Base


class ModelType(str, enum.Enum):
    GFS = "GFS"
    NCUM = "NCUM"
    NGFS = "NGFS"
    ERA5 = "ERA5"
    ECMWF = "ECMWF"


class ForecastRun(Base):
    __tablename__ = "forecast_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(String(64), unique=True, nullable=False, index=True)
    model_name = Column(String(32), nullable=False)
    init_time = Column(DateTime(timezone=True), nullable=False, index=True)
    domain = Column(String(32), default="INDIA")
    resolution = Column(Float, default=0.25)
    lead_days = Column(Integer, default=10)
    status = Column(String(16), default="pending")  # pending, complete, failed
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self) -> str:
        return f"<ForecastRun {self.run_id} @ {self.init_time}>"
