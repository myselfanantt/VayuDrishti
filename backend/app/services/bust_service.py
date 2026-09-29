"""
BustService — Orchestrates the full ML pipeline for bust detection.
"""

import uuid
import numpy as np
import torch
from datetime import datetime
from typing import List, Dict, Optional, Tuple
import structlog

from app.ml.model_registry import model_registry
from app.ml.confidence_scorer import ConfidenceScorer
from app.ml.shap_explainer import SHAPExplainer
from app.ml.region_classifier import RegionRiskClassifier
from app.ml.synoptic_detector import SynopticEventDetector
from app.ml.data_loader import NWPDataLoader
from app.utils.synthetic_data import LATS, LONS

logger = structlog.get_logger(__name__)


class BustService:
    """
    Orchestrates: data loading -> feature extraction -> ML inference 
    -> confidence scoring -> SHAP explainability -> region classification
    """

    def __init__(self):
        self.data_loader = NWPDataLoader(demo_mode=True)
        self.region_classifier = RegionRiskClassifier()
        self.synoptic_detector = SynopticEventDetector()
        self._scorer: Optional[ConfidenceScorer] = None
        self._explainer: Optional[SHAPExplainer] = None

    def _get_scorer(self) -> ConfidenceScorer:
        if self._scorer is None:
            model = model_registry.get_model()
            self._scorer = ConfidenceScorer(model, n_mc_passes=10)
        return self._scorer

    def _get_explainer(self) -> SHAPExplainer:
        if self._explainer is None:
            model = model_registry.get_model()
            background = model_registry.get_background_samples()
            self._explainer = SHAPExplainer(model, background)
        return self._explainer

    def run_inference(self, run_id: str, init_time: datetime) -> Dict:
        """
        Run full bust detection pipeline for a forecast run.

        Returns:
            result dict with bust detections, region risks, synoptic regime
        """
        logger.info("Starting bust detection inference", run_id=run_id)

        # Load feature data
        features = self.data_loader.load_forecast_run(run_id, init_time=init_time)
        # features: [T, H, W, F]

        # Downsample for CPU inference
        T, H, W, F = features.shape
        features_ds = features[:, ::4, ::4, :]  # [T, H//4, W//4, F]

        # Synoptic regime detection
        synoptic_result = self.synoptic_detector.detect(
            features_ds, LATS[::4], LONS[::4], init_time
        )
        regime = synoptic_result["regime"]

        # Model inference with confidence scoring
        x_tensor = torch.FloatTensor(features_ds).unsqueeze(0)  # [1, T, H, W, F]
        scorer = self._get_scorer()
        scores = scorer.score(x_tensor, LATS[::4], LONS[::4])

        bust_prob = scores["bust_probability"][0]      # [T, H, W]
        confidence = scores["confidence_score"][0]     # [T, H, W]
        unc_low = scores["uncertainty_low"][0]         # [T, H, W]
        unc_high = scores["uncertainty_high"][0]       # [T, H, W]
        severity_map = scores["severity_map"][0]       # [T, H, W]

        # Region risk classification
        region_risks = self.region_classifier.classify(
            bust_prob, LATS[::4], LONS[::4], lead_day=0, synoptic_regime=regime
        )

        # Select top bust detections (high-probability cells)
        bust_detections = self._extract_top_detections(
            run_id=run_id,
            bust_prob=bust_prob,
            confidence=confidence,
            unc_low=unc_low,
            unc_high=unc_high,
            severity_map=severity_map,
            regime=regime,
        )

        # Generate confidence grid for map visualization
        confidence_grid = self._build_confidence_grid(
            run_id=run_id,
            bust_prob=bust_prob,
            confidence=confidence,
            unc_low=unc_low,
            unc_high=unc_high,
        )

        logger.info(
            "Bust detection complete",
            run_id=run_id,
            n_detections=len(bust_detections),
            regime=regime,
        )

        return {
            "run_id": run_id,
            "bust_detections": bust_detections,
            "region_risks": region_risks,
            "confidence_grid": confidence_grid,
            "synoptic_regime": synoptic_result,
            "generated_at": datetime.utcnow().isoformat(),
        }

    def _extract_top_detections(
        self,
        run_id: str,
        bust_prob: np.ndarray,
        confidence: np.ndarray,
        unc_low: np.ndarray,
        unc_high: np.ndarray,
        severity_map: np.ndarray,
        regime: str,
        top_k: int = 50,
    ) -> List[Dict]:
        """Extract top-k high-bust-probability grid cells."""
        from app.ml.region_classifier import INDIA_REGIONS

        T, H, W = bust_prob.shape
        detections = []

        for t in range(T):
            # Find top-k cells by bust probability
            flat_prob = bust_prob[t].ravel()
            top_indices = np.argsort(flat_prob)[-top_k:][::-1]

            for flat_idx in top_indices:
                lat_idx = flat_idx // W
                lon_idx = flat_idx % W

                prob = float(bust_prob[t, lat_idx, lon_idx])
                if prob < 0.3:
                    continue

                lat = float(LATS[::4][lat_idx]) if lat_idx < len(LATS[::4]) else 20.0
                lon = float(LONS[::4][lon_idx]) if lon_idx < len(LONS[::4]) else 80.0

                # Find nearest region
                from app.ml.region_classifier import INDIA_REGIONS
                dists = [
                    abs(r["lat"] - lat) + abs(r["lon"] - lon) for r in INDIA_REGIONS
                ]
                nearest_region = INDIA_REGIONS[int(np.argmin(dists))]

                detections.append({
                    "id": str(uuid.uuid4()),
                    "run_id": run_id,
                    "region_id": nearest_region["region_id"],
                    "region_name": nearest_region["region_name"],
                    "lat": round(lat, 2),
                    "lon": round(lon, 2),
                    "lead_day": t + 1,
                    "bust_probability": round(prob, 4),
                    "confidence_score": round(float(confidence[t, lat_idx, lon_idx]), 4),
                    "uncertainty_low": round(float(unc_low[t, lat_idx, lon_idx]), 4),
                    "uncertainty_high": round(float(unc_high[t, lat_idx, lon_idx]), 4),
                    "severity": str(severity_map[t, lat_idx, lon_idx]),
                    "synoptic_regime": regime,
                    "is_verified": False,
                    "created_at": datetime.utcnow().isoformat(),
                })

        # Deduplicate by region+lead_day
        seen = set()
        unique_detections = []
        for d in sorted(detections, key=lambda x: -x["bust_probability"]):
            key = (d["region_id"], d["lead_day"])
            if key not in seen:
                seen.add(key)
                unique_detections.append(d)

        return unique_detections[:100]

    def _build_confidence_grid(
        self,
        run_id: str,
        bust_prob: np.ndarray,
        confidence: np.ndarray,
        unc_low: np.ndarray,
        unc_high: np.ndarray,
        lead_day: int = 0,
    ) -> Dict:
        """Build GeoJSON-compatible confidence grid for map visualization."""
        from app.ml.region_classifier import INDIA_REGIONS
        T, H, W = bust_prob.shape
        lats_ds = LATS[::4]
        lons_ds = LONS[::4]

        features = []
        for h in range(0, H, 2):
            for w in range(0, W, 2):
                prob = float(bust_prob[lead_day, h, w])
                conf = float(confidence[lead_day, h, w])
                u_low = float(unc_low[lead_day, h, w])
                u_high = float(unc_high[lead_day, h, w])

                lat = float(lats_ds[h]) if h < len(lats_ds) else 20.0
                lon = float(lons_ds[w]) if w < len(lons_ds) else 80.0

                # Match nearest India region
                nearest = min(INDIA_REGIONS, key=lambda r: (r["lat"] - lat) ** 2 + (r["lon"] - lon) ** 2)
                hist_bias = round(float(0.3 + 0.3 * np.abs(np.sin(lat * 0.15 + lon * 0.1))), 2)

                features.append({
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [lon, lat]},
                    "properties": {
                        "bust_probability": round(prob, 3),
                        "confidence_score": round(conf, 3),
                        "uncertainty_low": round(u_low, 3),
                        "uncertainty_high": round(u_high, 3),
                        "historical_bias": hist_bias,
                        "lead_day": lead_day + 1,
                        "region_name": nearest["region_name"],
                        "region_id": nearest["region_id"],
                        "bust_id": f"bust_{nearest['region_id'].lower()}_d{lead_day + 1}",
                        "color": self._prob_to_color(prob),
                    },
                })

        return {
            "type": "FeatureCollection",
            "features": features,
            "run_id": run_id,
            "lead_day": lead_day + 1,
            "generated_at": datetime.utcnow().isoformat(),
        }

    def _prob_to_color(self, prob: float) -> str:
        if prob >= 0.75:
            return "#EA4335"
        elif prob >= 0.55:
            return "#FF6D00"
        elif prob >= 0.35:
            return "#FBBC04"
        else:
            return "#34A853"

    def explain_bust(self, bust_id: str, run_id: str, lat: float, lon: float,
                     lead_day: int, synoptic_regime: str) -> Dict:
        """Generate SHAP explanation for a bust detection."""
        from app.utils.synthetic_data import LATS, LONS

        init_time = datetime.utcnow()
        features = self.data_loader.load_forecast_run(run_id, init_time=init_time)
        features_ds = features[:, ::4, ::4, :]

        # Find grid indices for requested lat/lon
        lats_ds = LATS[::4]
        lons_ds = LONS[::4]
        lat_idx = int(np.argmin(np.abs(lats_ds - lat)))
        lon_idx = int(np.argmin(np.abs(lons_ds - lon)))

        explainer = self._get_explainer()
        x = features_ds[np.newaxis, ...]  # [1, T, H, W, F]
        shap_result = explainer.explain(x, lat_idx, lon_idx, lead_day - 1)
        narrative = explainer.generate_narrative(shap_result, synoptic_regime, "")
        return {"shap_values": shap_result, "narrative": narrative}


bust_service = BustService()
