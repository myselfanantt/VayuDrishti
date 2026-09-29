"""
FeatureEngineering — Computes anomaly features, normalizations, and
NWP-derived indices for the bust detection model.
"""

import numpy as np
from scipy.ndimage import gaussian_filter
from typing import Dict, Tuple, Optional
import structlog

logger = structlog.get_logger(__name__)

# Climatological means and stds (approximate for India domain)
CLIMATOLOGY = {
    "wind_850_mean": 5.0, "wind_850_std": 3.0,
    "z500_mean": 5800.0, "z500_std": 80.0,
    "vort_850_mean": 0.0, "vort_850_std": 2e-5,
    "sst_mean": 28.0, "sst_std": 1.5,
    "pw_mean": 40.0, "pw_std": 15.0,
    "cape_mean": 800.0, "cape_std": 600.0,
    "olr_mean": 220.0, "olr_std": 40.0,
    "mslp_mean": 1010.0, "mslp_std": 5.0,
    "div_200_mean": 0.0, "div_200_std": 1e-5,
    "rmse_clim_mean": 15.0, "rmse_clim_std": 8.0,
    "bias_mean": 0.0, "bias_std": 5.0,
}


class FeatureEngineering:
    """Computes normalized feature arrays from raw NWP fields."""

    def __init__(self, n_features: int = 12):
        self.n_features = n_features
        self.climatology = CLIMATOLOGY

    def compute_features(
        self,
        raw_fields: Dict[str, np.ndarray],
        historical_rmse: Optional[np.ndarray] = None,
        historical_bias: Optional[np.ndarray] = None,
        synoptic_regime: Optional[str] = None,
    ) -> np.ndarray:
        """
        Compute normalized feature array from raw NWP fields.

        Args:
            raw_fields: dict with keys matching NWP variable names
            historical_rmse: [H, W] climatological RMSE map
            historical_bias: [H, W] 30-day rolling bias map
            synoptic_regime: current regime string for one-hot encoding

        Returns:
            features: [H, W, 12] normalized feature array
        """
        H = list(raw_fields.values())[0].shape[0]
        W = list(raw_fields.values())[0].shape[1]

        features = np.zeros((H, W, self.n_features), dtype=np.float32)

        # 0: 850hPa wind speed anomaly
        if "wind_850" in raw_fields:
            features[..., 0] = self._normalize(
                raw_fields["wind_850"], "wind_850_mean", "wind_850_std"
            )

        # 1: 500hPa geopotential height anomaly
        if "z500" in raw_fields:
            features[..., 1] = self._normalize(
                raw_fields["z500"], "z500_mean", "z500_std"
            )

        # 2: 850hPa relative vorticity
        if "vort_850" in raw_fields:
            features[..., 2] = self._normalize(
                raw_fields["vort_850"], "vort_850_mean", "vort_850_std"
            ) * 1e5  # scale to reasonable range

        # 3: SST anomaly
        if "sst" in raw_fields:
            features[..., 3] = self._normalize(raw_fields["sst"], "sst_mean", "sst_std")

        # 4: Precipitable water
        if "pw" in raw_fields:
            features[..., 4] = self._normalize(raw_fields["pw"], "pw_mean", "pw_std")

        # 5: CAPE
        if "cape" in raw_fields:
            features[..., 5] = self._normalize(raw_fields["cape"], "cape_mean", "cape_std")

        # 6: OLR anomaly
        if "olr" in raw_fields:
            features[..., 6] = self._normalize(raw_fields["olr"], "olr_mean", "olr_std")

        # 7: MSLP gradient (finite difference magnitude)
        if "mslp" in raw_fields:
            mslp_norm = self._normalize(raw_fields["mslp"], "mslp_mean", "mslp_std")
            grad_y, grad_x = np.gradient(mslp_norm)
            features[..., 7] = np.sqrt(grad_x**2 + grad_y**2)

        # 8: 200hPa divergence
        if "div_200" in raw_fields:
            features[..., 8] = self._normalize(
                raw_fields["div_200"], "div_200_mean", "div_200_std"
            ) * 1e5

        # 9: Historical RMSE at this grid cell (climatological)
        if historical_rmse is not None:
            features[..., 9] = self._normalize(
                historical_rmse, "rmse_clim_mean", "rmse_clim_std"
            )
        else:
            features[..., 9] = 0.0

        # 10: Rolling 30-day model bias
        if historical_bias is not None:
            features[..., 10] = self._normalize(
                historical_bias, "bias_mean", "bias_std"
            )
        else:
            features[..., 10] = 0.0

        # 11: Synoptic regime encoding
        features[..., 11] = self._encode_regime(synoptic_regime, H, W)

        return features

    def _normalize(
        self, field: np.ndarray, mean_key: str, std_key: str
    ) -> np.ndarray:
        mean = self.climatology.get(mean_key, 0.0)
        std = self.climatology.get(std_key, 1.0)
        return (field - mean) / (std + 1e-8)

    def _encode_regime(
        self, regime: Optional[str], H: int, W: int
    ) -> np.ndarray:
        """Encode synoptic regime as a scalar field."""
        encoding_map = {
            "active_monsoon": 0.8,
            "monsoon_depression": 1.0,
            "break_monsoon": 0.3,
            "western_disturbance": 0.6,
            "heat_wave": 0.5,
            "cyclone_bob": 0.9,
            "cyclone_as": 0.85,
            "normal": 0.2,
        }
        val = encoding_map.get(regime or "normal", 0.2)
        return np.full((H, W), val, dtype=np.float32)

    def compute_anomaly_field(
        self, forecast: np.ndarray, climatology_mean: np.ndarray, climatology_std: np.ndarray
    ) -> np.ndarray:
        """Compute standardized anomaly from climatology."""
        return (forecast - climatology_mean) / (climatology_std + 1e-8)

    def apply_spatial_smoothing(
        self, field: np.ndarray, sigma: float = 2.0
    ) -> np.ndarray:
        """Apply Gaussian spatial smoothing."""
        return gaussian_filter(field, sigma=sigma)
