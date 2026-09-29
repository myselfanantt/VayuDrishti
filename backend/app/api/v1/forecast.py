"""Forecast API endpoints."""

from fastapi import APIRouter, HTTPException, Query
from datetime import datetime
from typing import Optional
import structlog

from app.services.forecast_service import forecast_service
from app.services.bust_service import bust_service
from app.utils.synthetic_data import LATS, LONS

logger = structlog.get_logger(__name__)
router = APIRouter()


@router.get("/runs")
async def list_forecast_runs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    model: Optional[str] = None,
):
    """List all NWP model forecast runs (paginated)."""
    all_runs = forecast_service.get_recent_runs(n=200)
    if model:
        all_runs = [r for r in all_runs if r["model_name"] == model]

    total = len(all_runs)
    start = (page - 1) * page_size
    end = start + page_size
    runs = all_runs[start:end]

    return {"runs": runs, "total": total, "page": page, "page_size": page_size}


@router.get("/{run_id}/confidence")
async def get_run_confidence(run_id: str, lead_day: int = Query(1, ge=1, le=10)):
    """Get gridded confidence scores for a forecast run."""
    try:
        run_meta = forecast_service.get_run_by_id(run_id)
        init_time = datetime.fromisoformat(run_meta["init_time"].replace("Z", ""))

        # Run inference (or get from cache in production)
        result = bust_service.run_inference(run_id, init_time)

        import numpy as np
        import torch
        from app.ml.data_loader import NWPDataLoader

        loader = NWPDataLoader(demo_mode=True)
        features = loader.load_forecast_run(run_id, init_time=init_time)
        features_ds = features[:, ::4, ::4, :]
        x_tensor = torch.FloatTensor(features_ds).unsqueeze(0)

        from app.ml.model_registry import model_registry
        from app.ml.confidence_scorer import ConfidenceScorer
        model = model_registry.get_model()
        scorer = ConfidenceScorer(model, n_mc_passes=5)
        scores = scorer.score(x_tensor, LATS[::4], LONS[::4])

        bust_prob = scores["bust_probability"][0]  # [T, H, W]
        confidence = scores["confidence_score"][0]
        unc_low = scores["uncertainty_low"][0]
        unc_high = scores["uncertainty_high"][0]

        # Generate grid for specific lead day requested
        day_idx = max(0, min(9, lead_day - 1))
        grid = bust_service._build_confidence_grid(
            run_id=run_id,
            bust_prob=bust_prob,
            confidence=confidence,
            unc_low=unc_low,
            unc_high=unc_high,
            lead_day=day_idx,
        )

        T = bust_prob.shape[0]
        lead_times = []
        for t in range(T):
            lead_times.append({
                "lead_day": t + 1,
                "mean_confidence": round(float(confidence[t].mean()), 4),
                "uncertainty_low": round(float(unc_low[t].mean()), 4),
                "uncertainty_high": round(float(unc_high[t].mean()), 4),
                "bust_probability": round(float(bust_prob[t].mean()), 4),
                "high_risk_cells": int((bust_prob[t] > 0.55).sum()),
            })

        return {
            "run_id": run_id,
            "grid": grid,
            "lead_times": lead_times,
            "synoptic_regime": result.get("synoptic_regime", {}).get("regime"),
            "generated_at": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error("Confidence fetch failed", run_id=run_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")
