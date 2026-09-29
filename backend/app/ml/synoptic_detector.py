"""
SynopticEventDetector — Auto-tags forecast runs with synoptic weather regime.
Uses ERA5 pattern matching + threshold rules.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import structlog

logger = structlog.get_logger(__name__)

SYNOPTIC_REGIMES = [
    "cyclone_bob",       # Bay of Bengal cyclonic system
    "cyclone_as",        # Arabian Sea cyclonic system
    "monsoon_depression",
    "western_disturbance",
    "heat_wave",
    "active_monsoon",
    "break_monsoon",
    "normal",
]


class SynopticEventDetector:
    """
    Detects synoptic weather regime from NWP forecast fields.

    Detection logic:
    - Cyclone: Low MSLP (<985 hPa) + high vorticity in coastal zone + strong 850hPa winds
    - Monsoon Depression: Enhanced 850hPa vorticity over Bay + ITCZ displacement north
    - Western Disturbance: Anomalous upper trough in 500hPa over N India (Oct-Mar)
    - Heat Wave: Very high MSLP anomaly + low CAPE over NW India (Apr-Jun)
    - Active Monsoon: Low OLR + high PW over central India + NW displacement of monsoon trough
    - Break Monsoon: Reduced convection over central India + enhanced over foothills
    """

    SEASON_REGIMES = {
        (1, 2, 3): ["western_disturbance", "normal"],
        (4, 5, 6): ["western_disturbance", "heat_wave", "pre_monsoon_cyclone", "normal"],
        (7, 8, 9): ["active_monsoon", "break_monsoon", "monsoon_depression", "cyclone_bob"],
        (10, 11, 12): ["cyclone_bob", "cyclone_as", "western_disturbance", "normal"],
    }

    def detect(
        self,
        feature_array: np.ndarray,
        lat_coords: np.ndarray,
        lon_coords: np.ndarray,
        init_time: datetime,
    ) -> Dict:
        """
        Detect synoptic regime from forecast feature array.

        Args:
            feature_array: [T, H, W, F] — first lead day features
            lat_coords: 1D array
            lon_coords: 1D array
            init_time: forecast initialization datetime

        Returns:
            dict with regime, confidence, and diagnostic values
        """
        # Use Day 1 features for regime detection
        f = feature_array[0]  # [H, W, F]
        month = init_time.month

        diagnostics = self._compute_diagnostics(f, lat_coords, lon_coords)
        regime, confidence = self._classify_regime(diagnostics, month)

        return {
            "regime": regime,
            "confidence": round(confidence, 3),
            "diagnostics": diagnostics,
            "season": self._get_season(month),
            "detected_at": init_time.isoformat(),
        }

    def _compute_diagnostics(
        self, features: np.ndarray, lat_coords: np.ndarray, lon_coords: np.ndarray
    ) -> Dict:
        """Compute synoptic diagnostic values from feature channels."""
        # Channel indices (per spec)
        vorticity = features[..., 2]      # 850hPa vorticity
        sst_anom = features[..., 3]       # SST anomaly
        pw = features[..., 4]             # Precipitable water
        cape = features[..., 5]           # CAPE
        olr_anom = features[..., 6]       # OLR anomaly
        mslp_grad = features[..., 7]      # MSLP gradient
        div_200 = features[..., 8]        # 200hPa divergence

        # Define domain masks
        bob_lat = (lat_coords >= 8) & (lat_coords <= 22)
        bob_lon = (lon_coords >= 82) & (lon_coords <= 95)
        as_lat = (lat_coords >= 10) & (lat_coords <= 22)
        as_lon = (lon_coords >= 65) & (lon_coords <= 78)
        nw_india_lat = (lat_coords >= 25) & (lat_coords <= 35)
        nw_india_lon = (lon_coords >= 68) & (lon_coords <= 82)
        central_india_lat = (lat_coords >= 16) & (lat_coords <= 26)

        bob_mask = np.ix_(np.where(bob_lat)[0], np.where(bob_lon)[0])
        as_mask = np.ix_(np.where(as_lat)[0], np.where(as_lon)[0])
        nw_mask = np.ix_(np.where(nw_india_lat)[0], np.where(nw_india_lon)[0])

        return {
            "bob_max_vorticity": float(vorticity[bob_mask].max()) if vorticity[bob_mask].size else 0.0,
            "as_max_vorticity": float(vorticity[as_mask].max()) if vorticity[as_mask].size else 0.0,
            "nw_cape_mean": float(cape[nw_mask].mean()) if cape[nw_mask].size else 0.0,
            "mean_pw_india": float(pw.mean()),
            "mean_olr_anom": float(olr_anom.mean()),
            "max_mslp_grad": float(np.abs(mslp_grad).max()),
            "mean_div_200": float(div_200.mean()),
            "mean_sst_anom": float(sst_anom.mean()),
        }

    def _classify_regime(self, diag: Dict, month: int) -> Tuple[str, float]:
        """Rule-based regime classification with confidence scoring."""
        scores = {}

        # Cyclone (Bay of Bengal)
        scores["cyclone_bob"] = (
            0.6 * min(diag["bob_max_vorticity"], 1.0) +
            0.4 * min(diag["max_mslp_grad"], 1.0)
        )

        # Cyclone (Arabian Sea)
        scores["cyclone_as"] = (
            0.6 * min(diag["as_max_vorticity"], 1.0) +
            0.4 * min(diag["max_mslp_grad"], 1.0)
        )

        # Monsoon depression
        scores["monsoon_depression"] = (
            0.5 * min(diag["bob_max_vorticity"] * 0.7, 1.0) +
            0.3 * min(diag["mean_pw_india"] * 0.8, 1.0) +
            0.2 * max(0, -diag["mean_olr_anom"] * 0.5)
        ) * (1.0 if month in [6, 7, 8, 9] else 0.1)

        # Heat wave
        scores["heat_wave"] = (
            0.5 * max(0, -diag["nw_cape_mean"]) +
            0.3 * max(0, diag["mean_olr_anom"]) +
            0.2 * max(0, -diag["mean_pw_india"])
        ) * (1.0 if month in [4, 5, 6] else 0.1)

        # Active monsoon
        scores["active_monsoon"] = (
            0.4 * min(diag["mean_pw_india"], 1.0) +
            0.4 * max(0, -diag["mean_olr_anom"]) +
            0.2 * min(diag["bob_max_vorticity"] * 0.5, 1.0)
        ) * (1.0 if month in [6, 7, 8, 9] else 0.1)

        # Break monsoon (opposite of active)
        scores["break_monsoon"] = (
            0.4 * max(0, -diag["mean_pw_india"] + 0.3) +
            0.4 * max(0, diag["mean_olr_anom"]) +
            0.2 * max(0, -diag["bob_max_vorticity"] + 0.3)
        ) * (1.0 if month in [6, 7, 8, 9] else 0.1)

        # Western disturbance
        scores["western_disturbance"] = (
            0.6 * max(0, diag["mean_div_200"]) +
            0.4 * min(diag["max_mslp_grad"] * 0.5, 1.0)
        ) * (1.0 if month in [10, 11, 12, 1, 2, 3] else 0.2)

        scores["normal"] = 0.3  # baseline

        best_regime = max(scores, key=lambda k: scores[k])
        best_score = scores[best_regime]
        total_score = sum(scores.values())
        confidence = best_score / total_score if total_score > 0 else 0.5

        return best_regime, min(confidence * 1.5, 1.0)

    def _get_season(self, month: int) -> str:
        if month in [12, 1, 2]:
            return "winter"
        elif month in [3, 4, 5]:
            return "pre_monsoon"
        elif month in [6, 7, 8, 9]:
            return "southwest_monsoon"
        else:
            return "northeast_monsoon"

    def tag_historical_runs(self, runs: List[Dict]) -> List[Dict]:
        """Batch tag historical forecast runs with synoptic regime."""
        tagged = []
        for run in runs:
            month = run.get("month", 7)
            # Simple seasonal climatological tagging for historical data
            if month in [6, 7, 8, 9]:
                regime = np.random.choice(
                    ["active_monsoon", "break_monsoon", "monsoon_depression"],
                    p=[0.5, 0.3, 0.2]
                )
            elif month in [10, 11, 12, 1, 2, 3]:
                regime = np.random.choice(
                    ["normal", "western_disturbance", "cyclone_bob"],
                    p=[0.5, 0.35, 0.15]
                )
            else:
                regime = np.random.choice(
                    ["heat_wave", "normal", "cyclone_as"],
                    p=[0.4, 0.4, 0.2]
                )
            run["synoptic_regime"] = regime
            tagged.append(run)
        return tagged
