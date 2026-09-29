from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class RegionRisk(BaseModel):
    region_id: str
    region_name: str
    state: str
    lat: float
    lon: float
    risk_level: str  # LOW, MODERATE, HIGH, CRITICAL
    bust_probability: float
    confidence_score: float
    historical_hit_rate: float
    dominant_synoptic: Optional[str] = None
    affected_lead_days: List[int]


class RegionRiskMapResponse(BaseModel):
    regions: List[RegionRisk]
    generated_at: datetime
    forecast_run_id: Optional[str] = None
    geojson: dict


class RegionHistoryResponse(BaseModel):
    region_id: str
    region_name: str
    bust_rate: float
    avg_lead_time_at_detection: float
    total_events: int
    verified_events: int
    hit_rate: float
    false_alarm_rate: float
    events: List[dict]
    monthly_climatology: List[dict]
