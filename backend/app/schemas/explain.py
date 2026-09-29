from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class SHAPFeature(BaseModel):
    feature: str
    shap_value: float
    direction: str  # positive, negative
    magnitude: float
    description: str


class SimilarEvent(BaseModel):
    date: datetime
    event: str
    event_type: str
    bust_mae: float
    region: str
    similarity_score: float


class SHAPResult(BaseModel):
    bust_id: str
    top_drivers: List[SHAPFeature]
    base_value: float
    predicted_value: float
    feature_values: dict


class ExplainResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    bust_id: str
    run_id: str
    region_name: str
    lead_day: int
    bust_probability: float
    confidence_score: float
    shap_values: SHAPResult
    narrative: str
    similar_events: List[SimilarEvent]
    calibration_note: str
    generated_at: datetime
