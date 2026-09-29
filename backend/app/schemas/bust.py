from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid


class BustDetectionBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    run_id: str
    region_id: str
    region_name: Optional[str] = None
    lat: float
    lon: float
    lead_day: int
    bust_probability: float = Field(ge=0.0, le=1.0)
    confidence_score: float = Field(ge=0.0, le=1.0)
    uncertainty_low: Optional[float] = None
    uncertainty_high: Optional[float] = None
    severity: Optional[str] = None
    synoptic_regime: Optional[str] = None


class BustDetectionResponse(BustDetectionBase):
    id: uuid.UUID
    narrative: Optional[str] = None
    is_verified: bool = False
    actual_bust: Optional[bool] = None
    verification_mae: Optional[float] = None
    created_at: datetime


class BustStats(BaseModel):
    total_detections: int
    critical_count: int
    high_count: int
    moderate_count: int
    low_count: int
    avg_confidence: float
    date_range_start: Optional[datetime] = None
    date_range_end: Optional[datetime] = None
    top_affected_regions: List[dict]


class BustListResponse(BaseModel):
    busts: List[BustDetectionResponse]
    stats: BustStats
    total: int


class BustDetectRequest(BaseModel):
    run_id: str
    force_recompute: bool = False


class BustDetectResponse(BaseModel):
    task_id: str
    status: str = "pending"
    message: str


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str  # pending, running, complete, failed
    result: Optional[dict] = None
    error: Optional[str] = None
    progress: Optional[float] = None
