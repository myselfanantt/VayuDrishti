"""
ConfidenceScorer — wraps ForecastBustTransformer with MC Dropout
and XGBoost ensemble for calibrated uncertainty quantification.
"""

import numpy as np
import torch
from torch import Tensor
from typing import Dict, List, Tuple, Optional
import structlog

from app.ml.bust_transformer import ForecastBustTransformer
from app.config import settings

logger = structlog.get_logger(__name__)


class ConfidenceScorer:
    """
    Wraps the transformer model with full uncertainty quantification.

    Pipeline:
      1. MC Dropout (N=30 passes) on transformer -> mean + std
      2. Ensemble with gradient-boosted lag-feature baseline (XGBoost stub)
      3. Isotonic regression calibration (fit on held-out data)
      4. Returns bust_probability, confidence_score, uncertainty_band
    """

    def __init__(
        self,
        model: ForecastBustTransformer,
        n_mc_passes: int = 30,
        calibration_alpha: float = 0.1,
        ensemble_weight: float = 0.2,
    ):
        self.model = model
        self.n_mc_passes = n_mc_passes
        self.calibration_alpha = calibration_alpha
        self.ensemble_weight = ensemble_weight
        self._calibration_params: Optional[Dict] = None

    def score(
        self,
        x: Tensor,
        lat_coords: np.ndarray,
        lon_coords: np.ndarray,
    ) -> Dict:
        """
        Full inference with uncertainty quantification.

        Args:
            x: [B, T, H, W, F] — input forecast tensor
            lat_coords: 1D lat array
            lon_coords: 1D lon array

        Returns:
            dict with keys:
              bust_probability: [B, T, H, W]
              confidence_score: [B, T, H, W]  (0=low confidence, 1=high)
              uncertainty_low: [B, T, H, W]   (10th percentile)
              uncertainty_high: [B, T, H, W]  (90th percentile)
              severity_map: [B, T, H, W]      (string labels)
        """
        logger.info("Running confidence scoring", mc_passes=self.n_mc_passes)

        # MC Dropout inference
        mean_prob, std_prob, all_preds = self.model.predict_with_uncertainty(
            x, n_passes=self.n_mc_passes
        )

        # Compute percentile uncertainty bounds
        all_preds_np = all_preds.cpu().numpy()  # [passes, B, T, H, W]
        unc_low = np.percentile(all_preds_np, 10, axis=0)
        unc_high = np.percentile(all_preds_np, 90, axis=0)

        # XGBoost baseline (lag-feature stub — uses spatial mean as proxy)
        xgb_prob = self._xgb_baseline(x)

        # Ensemble: weighted average
        mean_np = mean_prob.cpu().numpy()
        xgb_np = xgb_prob.cpu().numpy() if isinstance(xgb_prob, Tensor) else xgb_prob
        ensemble_prob = (1 - self.ensemble_weight) * mean_np + self.ensemble_weight * xgb_np

        # Confidence score: inverse of normalized uncertainty
        # Higher spread -> lower confidence
        uncertainty_range = unc_high - unc_low  # [0, 1]
        confidence = 1.0 - np.clip(uncertainty_range / 0.5, 0, 1)

        # Apply isotonic calibration if available
        if self._calibration_params is not None:
            ensemble_prob = self._apply_calibration(ensemble_prob)

        return {
            "bust_probability": ensemble_prob,
            "confidence_score": confidence,
            "uncertainty_low": unc_low,
            "uncertainty_high": unc_high,
            "std": std_prob.cpu().numpy(),
            "severity_map": self._classify_severity(ensemble_prob),
        }

    def _xgb_baseline(self, x: Tensor) -> np.ndarray:
        """
        XGBoost baseline using spatial lag features.
        In production, this would use a trained XGBoost model.
        For the prototype, we use a physics-informed heuristic.
        """
        # Extract key feature channels
        x_np = x.cpu().numpy()  # [B, T, H, W, F]

        # Feature channels (indices per spec):
        # 0: 850hPa wind speed anomaly
        # 2: 850hPa relative vorticity
        # 5: CAPE
        # 6: OLR anomaly

        vorticity = x_np[..., 2]    # [B, T, H, W]
        cape = x_np[..., 5]          # [B, T, H, W]
        olr_anom = x_np[..., 6]     # [B, T, H, W]
        model_bias = x_np[..., 10]  # [B, T, H, W]

        # Physics-motivated combination
        raw = (
            0.35 * np.clip(vorticity, 0, 1) +
            0.30 * np.clip(cape, 0, 1) +
            0.20 * np.abs(olr_anom) +
            0.15 * np.abs(model_bias)
        )

        return np.clip(raw, 0, 1)

    def _classify_severity(self, prob: np.ndarray) -> np.ndarray:
        """Classify bust probability into severity levels."""
        severity = np.empty(prob.shape, dtype=object)
        severity[prob < 0.3] = "LOW"
        severity[(prob >= 0.3) & (prob < 0.55)] = "MODERATE"
        severity[(prob >= 0.55) & (prob < 0.75)] = "HIGH"
        severity[prob >= 0.75] = "CRITICAL"
        return severity

    def _apply_calibration(self, prob: np.ndarray) -> np.ndarray:
        """Apply isotonic regression calibration."""
        # Placeholder: in production, use sklearn IsotonicRegression
        # fitted on validation data
        params = self._calibration_params
        a = params.get("slope", 0.9)
        b = params.get("intercept", 0.05)
        return np.clip(a * prob + b, 0, 1)

    def fit_calibration(
        self, predicted_probs: np.ndarray, actual_labels: np.ndarray
    ) -> None:
        """Fit isotonic regression calibration on validation data."""
        from sklearn.isotonic import IsotonicRegression
        ir = IsotonicRegression(out_of_bounds="clip")
        ir.fit(predicted_probs.ravel(), actual_labels.ravel())
        # Store calibration mapping
        self._calibration_params = {
            "calibrator": ir,
            "slope": float(np.polyfit(predicted_probs.ravel(), actual_labels.ravel(), 1)[0]),
            "intercept": float(np.polyfit(predicted_probs.ravel(), actual_labels.ravel(), 1)[1]),
        }
        logger.info("Calibration fitted on validation data")

    def compute_brier_score(
        self, predicted_probs: np.ndarray, actual_labels: np.ndarray
    ) -> float:
        """Compute Brier Score (lower is better)."""
        return float(np.mean((predicted_probs - actual_labels) ** 2))

    def reliability_diagram_data(
        self, predicted_probs: np.ndarray, actual_labels: np.ndarray, n_bins: int = 10
    ) -> List[Dict]:
        """Generate reliability diagram data (for frontend calibration chart)."""
        bins = np.linspace(0, 1, n_bins + 1)
        diagram = []
        for i in range(n_bins):
            mask = (predicted_probs >= bins[i]) & (predicted_probs < bins[i + 1])
            if mask.sum() > 0:
                mean_pred = predicted_probs[mask].mean()
                mean_obs = actual_labels[mask].mean()
                n = int(mask.sum())
            else:
                mean_pred = (bins[i] + bins[i + 1]) / 2
                mean_obs = 0.0
                n = 0
            diagram.append({
                "bin_center": float((bins[i] + bins[i + 1]) / 2),
                "mean_predicted": float(mean_pred),
                "mean_observed": float(mean_obs),
                "count": n,
            })
        return diagram
