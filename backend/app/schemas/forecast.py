from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid


class ForecastRunBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    run_id: str
    model_name: str
    init_time: datetime
    domain: str = "INDIA"
    resolution: float = 0.25
    lead_days: int = 10
    status: str = "pending"


class ForecastRunCreate(ForecastRunBase):
    pass


class ForecastRunResponse(ForecastRunBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None


class LeadTimeConfidence(BaseModel):
    lead_day: int
    mean_confidence: float
    uncertainty_low: float
    uncertainty_high: float
    bust_probability: float
    high_risk_cells: int


class GridCell(BaseModel):
    lat: float
    lon: float
    bust_probability: float
    confidence_score: float
    uncertainty_low: float
    uncertainty_high: float
    severity: str


class ConfidenceGrid(BaseModel):
    run_id: str
    lead_day: int
    grid_cells: List[GridCell]
    generated_at: datetime
    bounding_box: dict


class ForecastConfidenceResponse(BaseModel):
    run_id: str
    grid: ConfidenceGrid
    lead_times: List[LeadTimeConfidence]
    synoptic_regime: Optional[str] = None
    generated_at: datetime


class ForecastRunListResponse(BaseModel):
    runs: List[ForecastRunResponse]
    total: int
    page: int
    page_size: int
