"""Regions risk API endpoints."""

from fastapi import APIRouter, HTTPException
from datetime import datetime
import structlog

from app.ml.region_classifier import RegionRiskClassifier, INDIA_REGIONS, HISTORICAL_HIT_RATES
from app.services.bust_service import bust_service
from app.services.forecast_service import forecast_service
from app.utils.synthetic_data import SyntheticWeatherGenerator

logger = structlog.get_logger(__name__)
router = APIRouter()
_classifier = RegionRiskClassifier()
_gen = SyntheticWeatherGenerator(seed=42)


@router.get("/risk-map")
async def get_risk_map(run_id: str = None):
    """Get current risk classification per region as GeoJSON."""
    import numpy as np, torch
    from app.ml.data_loader import NWPDataLoader
    from app.ml.model_registry import model_registry
    from app.ml.confidence_scorer import ConfidenceScorer
    from app.utils.synthetic_data import LATS, LONS

    try:
        init_time = datetime.utcnow()
        effective_run_id = run_id or f"GFS_{init_time.strftime('%Y%m%d')}_00Z"
        loader = NWPDataLoader(demo_mode=True)
        features = loader.load_forecast_run(effective_run_id, init_time=init_time)
        features_ds = features[:, ::4, ::4, :]

        x_tensor = torch.FloatTensor(features_ds).unsqueeze(0)
        model = model_registry.get_model()
        scorer = ConfidenceScorer(model, n_mc_passes=5)
        scores = scorer.score(x_tensor, LATS[::4], LONS[::4])
        bust_prob = scores["bust_probability"][0]  # [T, H, W]

        region_risks = _classifier.classify(bust_prob, LATS[::4], LONS[::4], synoptic_regime="active_monsoon")
        geojson = _classifier.build_risk_geojson(region_risks)

        return {
            "regions": region_risks,
            "generated_at": datetime.utcnow().isoformat(),
            "forecast_run_id": effective_run_id,
            "geojson": geojson,
        }
    except Exception as e:
        logger.error("Risk map failed", error=str(e))
        # Return demo risk map
        return _demo_risk_map()


def _demo_risk_map() -> dict:
    import numpy as np
    rng = np.random.default_rng(42)
    regions = []
    risk_levels = ["LOW", "LOW", "MODERATE", "MODERATE", "HIGH", "CRITICAL"]
    for r in INDIA_REGIONS:
        prob = float(rng.uniform(0.1, 0.95))
        risk = "CRITICAL" if prob > 0.75 else "HIGH" if prob > 0.55 else "MODERATE" if prob > 0.3 else "LOW"
        regions.append({
            **r,
            "risk_level": risk,
            "bust_probability": round(prob, 4),
            "confidence_score": round(float(rng.uniform(0.5, 0.9)), 4),
            "historical_hit_rate": HISTORICAL_HIT_RATES.get(r["region_id"], 0.6),
            "dominant_synoptic": "active_monsoon",
            "affected_lead_days": [1, 2, 3] if prob > 0.5 else [],
        })
    classifier = RegionRiskClassifier()
    geojson = classifier.build_risk_geojson(regions)
    return {"regions": regions, "generated_at": datetime.utcnow().isoformat(), "geojson": geojson}


@router.get("/{region_id}/history")
async def get_region_history(region_id: str):
    """Get historical bust statistics for a region."""
    import numpy as np
    region_meta = next((r for r in INDIA_REGIONS if r["region_id"] == region_id), None)
    if not region_meta:
        raise HTTPException(status_code=404, detail=f"Region {region_id} not found")

    busts = _gen.inject_bust_events(n_events=200)
    region_busts = [b for b in busts if b.get("region_id") == region_id]

    monthly = []
    for month in range(1, 13):
        month_busts = [b for b in region_busts if b.get("month") == month]
        monthly.append({
            "month": month,
            "bust_count": len(month_busts),
            "avg_probability": round(np.mean([b.get("bust_probability", 0) for b in month_busts]), 4) if month_busts else 0.0,
        })

    return {
        "region_id": region_id,
        "region_name": region_meta["region_name"],
        "bust_rate": round(len(region_busts) / max(len(busts), 1), 4),
        "avg_lead_time_at_detection": round(float(np.mean([b.get("lead_day", 3) for b in region_busts])), 2) if region_busts else 3.0,
        "total_events": len(region_busts),
        "verified_events": sum(1 for b in region_busts if b.get("is_verified")),
        "hit_rate": HISTORICAL_HIT_RATES.get(region_id, 0.60),
        "false_alarm_rate": round(1 - HISTORICAL_HIT_RATES.get(region_id, 0.60), 2),
        "events": region_busts[:20],
        "monthly_climatology": monthly,
    }
