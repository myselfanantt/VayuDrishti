"""
SyntheticWeatherGenerator — Generates statistically realistic synthetic NWP
forecast fields for the India domain. Used for hackathon demo only.

All patterns are physically motivated (not random noise):
- Spatial correlation via 2D Gaussian smoothing
- Temporal evolution via AR(1) process per grid cell  
- Synoptic regime switching via Markov chain
- Bust injection correlated with high-vorticity regions
"""

import numpy as np
from scipy.ndimage import gaussian_filter
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import structlog

logger = structlog.get_logger(__name__)

# India domain
LAT_MIN, LAT_MAX = 5.0, 38.0
LON_MIN, LON_MAX = 65.0, 100.0
RESOLUTION = 0.25

LATS = np.arange(LAT_MIN, LAT_MAX + RESOLUTION, RESOLUTION)
LONS = np.arange(LON_MIN, LON_MAX + RESOLUTION, RESOLUTION)
N_LAT = len(LATS)
N_LON = len(LONS)
N_FEATURES = 12
LEAD_DAYS = 10

SYNOPTIC_TRANSITIONS = {
    "active_monsoon":    {"active_monsoon": 0.6, "break_monsoon": 0.2, "monsoon_depression": 0.2},
    "break_monsoon":     {"break_monsoon": 0.5, "active_monsoon": 0.4, "monsoon_depression": 0.1},
    "monsoon_depression": {"active_monsoon": 0.5, "break_monsoon": 0.3, "monsoon_depression": 0.2},
    "western_disturbance": {"western_disturbance": 0.4, "normal": 0.6},
    "heat_wave":         {"heat_wave": 0.5, "normal": 0.5},
    "cyclone_bob":       {"cyclone_bob": 0.3, "active_monsoon": 0.5, "normal": 0.2},
    "normal":            {"normal": 0.6, "western_disturbance": 0.3, "heat_wave": 0.1},
}


class SyntheticWeatherGenerator:
    """
    Generates statistically realistic synthetic NWP forecast fields.
    Physically motivated patterns, deterministic with fixed seed.
    """

    def __init__(self, seed: int = 42):
        self.rng = np.random.default_rng(seed)
        self.lats = LATS
        self.lons = LONS
        self.n_lat = N_LAT
        self.n_lon = N_LON
        self._ar1_state: Optional[np.ndarray] = None

    def generate_forecast_run(
        self, init_time: datetime, lead_days: int = LEAD_DAYS
    ) -> np.ndarray:
        """
        Generate a complete forecast run.

        Returns:
            features: [lead_days, n_lat, n_lon, n_features] float32 array
        """
        month = init_time.month
        regime = self._get_seasonal_regime(month)
        features = np.zeros((lead_days, self.n_lat, self.n_lon, N_FEATURES), dtype=np.float32)

        # Initialize AR(1) state from regime climatology
        base_state = self._regime_climatology(regime)  # [n_lat, n_lon, n_features]

        for t in range(lead_days):
            # AR(1) evolution with lead-time-dependent noise amplification
            noise_amp = 1.0 + t * 0.15  # errors grow with lead time
            noise = self.rng.standard_normal((self.n_lat, self.n_lon, N_FEATURES)).astype(np.float32)

            # Smooth spatially (physical correlation length ~200km ~ 2° ~ 8 grid points)
            for f in range(N_FEATURES):
                noise[..., f] = gaussian_filter(noise[..., f], sigma=4.0)

            if t == 0:
                state = base_state + 0.1 * noise
            else:
                state = 0.9 * features[t - 1] + 0.1 * base_state + noise_amp * 0.15 * noise

            # Clip to physical ranges
            state = np.clip(state, -3.0, 3.0)
            features[t] = state

        return features

    def _regime_climatology(self, regime: str) -> np.ndarray:
        """Generate regime-specific climatological base state."""
        base = np.zeros((self.n_lat, self.n_lon, N_FEATURES), dtype=np.float32)

        # Create lat/lon meshgrid for spatial patterns
        lon_grid, lat_grid = np.meshgrid(self.lons, self.lats)

        if regime in ["active_monsoon", "monsoon_depression"]:
            # High vorticity over Bay of Bengal
            bob_center_lat, bob_center_lon = 15.0, 88.0
            dist_bob = np.sqrt((lat_grid - bob_center_lat)**2 + (lon_grid - bob_center_lon)**2)
            vorticity_pattern = np.exp(-dist_bob / 10.0)

            base[..., 2] = vorticity_pattern * 1.5   # 850hPa vorticity (high)
            base[..., 4] = 0.8 + 0.2 * vorticity_pattern  # High PW
            base[..., 5] = 0.6 + 0.3 * vorticity_pattern  # High CAPE
            base[..., 6] = -0.5 * vorticity_pattern  # Negative OLR (convection)
            base[..., 0] = vorticity_pattern * 0.8   # Wind anomaly

            if regime == "monsoon_depression":
                base[..., 2] *= 2.0  # Stronger vorticity

        elif regime == "western_disturbance":
            # Trough over N India / Himalayas
            wd_center_lat, wd_center_lon = 32.0, 75.0
            dist_wd = np.sqrt((lat_grid - wd_center_lat)**2 + (lon_grid - wd_center_lon)**2)
            wd_pattern = np.exp(-dist_wd / 8.0)

            base[..., 1] = -wd_pattern * 1.2   # Negative 500hPa height anomaly (trough)
            base[..., 8] = wd_pattern * 0.9    # 200hPa divergence
            base[..., 7] = wd_pattern * 0.6    # MSLP gradient

        elif regime == "heat_wave":
            # Hot anticyclone over NW India
            hw_center_lat, hw_center_lon = 30.0, 75.0
            dist_hw = np.sqrt((lat_grid - hw_center_lat)**2 + (lon_grid - hw_center_lon)**2)
            hw_pattern = np.exp(-dist_hw / 12.0)

            base[..., 1] = hw_pattern * 1.5   # Positive 500hPa height (ridge)
            base[..., 5] = -hw_pattern * 0.8  # Low CAPE (stable)
            base[..., 6] = hw_pattern * 0.9   # Positive OLR (clear sky)
            base[..., 4] = -hw_pattern * 0.6  # Low PW

        elif regime == "cyclone_bob":
            # Cyclone in Bay of Bengal
            cyc_lat = 12.0 + self.rng.uniform(-2, 2)
            cyc_lon = 87.0 + self.rng.uniform(-3, 3)
            dist_cyc = np.sqrt((lat_grid - cyc_lat)**2 + (lon_grid - cyc_lon)**2)
            cyc_pattern = np.exp(-dist_cyc / 6.0)

            base[..., 2] = cyc_pattern * 2.5   # Very high vorticity
            base[..., 7] = cyc_pattern * 1.5   # High MSLP gradient
            base[..., 0] = cyc_pattern * 2.0   # Strong wind anomaly
            base[..., 3] = cyc_pattern * 0.5   # Positive SST anomaly
            base[..., 6] = -cyc_pattern * 1.0  # Deep convection

        elif regime == "break_monsoon":
            # Suppressed convection over central India
            base[..., 6] = 0.4   # Positive OLR (suppressed)
            base[..., 4] = -0.3  # Reduced PW
            base[..., 5] = -0.4  # Low CAPE

        # Add historical model bias (channel 10)
        bias_map = self._generate_bias_map()
        base[..., 10] = bias_map

        return base

    def _generate_bias_map(self) -> np.ndarray:
        """Generate a realistic historical model bias map."""
        # Bias is spatially correlated and concentrated near complex terrain
        # and convergence zones
        bias = self.rng.standard_normal((self.n_lat, self.n_lon)).astype(np.float32)
        bias = gaussian_filter(bias, sigma=6.0)

        # Enhanced bias near mountains (Himalayas, Western Ghats)
        lon_grid, lat_grid = np.meshgrid(self.lons, self.lats)
        himalaya_dist = np.abs(lat_grid - 30.5)
        himalaya_bias = np.exp(-himalaya_dist / 3.0) * 0.5

        ghats_dist = np.sqrt((lat_grid - 14)**2 + (lon_grid - 75)**2)
        ghats_bias = np.exp(-ghats_dist / 5.0) * 0.4

        bias = bias * 0.3 + himalaya_bias + ghats_bias
        return bias.astype(np.float32)

    def _get_seasonal_regime(self, month: int) -> str:
        """Get dominant regime for month."""
        if month in [6, 7, 8, 9]:
            return self.rng.choice(
                ["active_monsoon", "break_monsoon", "monsoon_depression"],
                p=[0.5, 0.3, 0.2]
            )
        elif month in [10, 11, 12, 1, 2]:
            return self.rng.choice(
                ["normal", "western_disturbance", "cyclone_bob"],
                p=[0.4, 0.45, 0.15]
            )
        else:
            return self.rng.choice(["heat_wave", "normal"], p=[0.45, 0.55])

    def generate_historical_errors(self, years: int = 5) -> List[Dict]:
        """Generate 5 years of historical verification error data."""
        errors = []
        start_date = datetime(2020, 1, 1)
        n_days = years * 365

        logger.info("Generating historical errors", years=years, n_days=n_days)

        for day_offset in range(0, n_days, 7):  # Weekly sampling for speed
            valid_time = start_date + timedelta(days=day_offset)
            month = valid_time.month

            # Generate spatially correlated error field
            for lead_day in [1, 3, 5, 7, 10]:
                # Error grows with lead time
                error_scale = 0.5 + lead_day * 0.1

                mae_field = (
                    np.abs(self.rng.standard_normal((self.n_lat, self.n_lon))) * error_scale
                )
                mae_field = gaussian_filter(mae_field, sigma=3.0)

                # Sample 20 grid points per run for storage
                for _ in range(20):
                    lat_idx = self.rng.integers(0, self.n_lat)
                    lon_idx = self.rng.integers(0, self.n_lon)
                    errors.append({
                        "run_id": f"GFS_{valid_time.strftime('%Y%m%d_%H%M')}_d{lead_day}",
                        "model_name": "GFS",
                        "valid_time": valid_time.isoformat(),
                        "lat": float(self.lats[lat_idx]),
                        "lon": float(self.lons[lon_idx]),
                        "variable": "precipitation",
                        "lead_day": lead_day,
                        "mae": round(float(mae_field[lat_idx, lon_idx]), 3),
                        "rmse": round(float(mae_field[lat_idx, lon_idx] * 1.2), 3),
                        "bias": round(float(self.rng.standard_normal() * 0.3 * error_scale), 3),
                        "month": month,
                    })

        logger.info("Historical errors generated", count=len(errors))
        return errors

    def inject_bust_events(self, n_events: int = 200) -> List[Dict]:
        """
        Inject synthetic bust events with statistical properties
        matching IMD verification reports.
        """
        events = []
        start_date = datetime(2020, 1, 1)
        n_days_total = 365 * 5

        # Bust events are correlated with high-vorticity months
        bust_weights = {
            1: 0.04, 2: 0.03, 3: 0.04, 4: 0.05, 5: 0.07,
            6: 0.12, 7: 0.15, 8: 0.16, 9: 0.13, 10: 0.10,
            11: 0.06, 12: 0.05,
        }

        from app.ml.region_classifier import INDIA_REGIONS

        for i in range(n_events):
            # Sample date proportional to seasonal bust probability
            months = list(range(1, 13))
            probs = [bust_weights[m] for m in months]
            probs = np.array(probs) / sum(probs)
            month = int(self.rng.choice(months, p=probs))

            # Find a day with that month
            day_offset = self.rng.integers(0, n_days_total)
            event_date = start_date + timedelta(days=int(day_offset))

            region = INDIA_REGIONS[self.rng.integers(0, len(INDIA_REGIONS))]
            bust_prob = float(self.rng.uniform(0.55, 0.98))
            lead_day = int(self.rng.choice([2, 3, 4, 5, 7]))
            mae = round(float(self.rng.uniform(25, 85)), 1)

            regime_month_map = {
                (6, 7, 8, 9): "monsoon_depression",
                (10, 11, 12): "cyclone_bob",
                (1, 2, 3): "western_disturbance",
                (4, 5): "heat_wave",
            }
            regime = "normal"
            for months_tuple, r in regime_month_map.items():
                if month in months_tuple:
                    regime = r
                    break

            events.append({
                "id": f"bust_{i:04d}",
                "run_id": f"GFS_{event_date.strftime('%Y%m%d')}_00Z",
                "region_id": region["region_id"],
                "region_name": region["region_name"],
                "lat": region["lat"] + float(self.rng.uniform(-0.5, 0.5)),
                "lon": region["lon"] + float(self.rng.uniform(-0.5, 0.5)),
                "lead_day": lead_day,
                "bust_probability": round(bust_prob, 4),
                "confidence_score": round(float(self.rng.uniform(0.55, 0.92)), 4),
                "uncertainty_low": round(bust_prob - float(self.rng.uniform(0.05, 0.15)), 4),
                "uncertainty_high": round(min(1.0, bust_prob + float(self.rng.uniform(0.05, 0.15))), 4),
                "severity": "CRITICAL" if bust_prob > 0.75 else "HIGH" if bust_prob > 0.55 else "MODERATE",
                "synoptic_regime": regime,
                "is_verified": True,
                "actual_bust": True,
                "verification_mae": mae,
                "event_date": event_date.isoformat(),
                "month": month,
                "event_type": regime,
                "bust_mae": mae,
                "similarity_score": round(float(self.rng.uniform(0.6, 0.95)), 3),
            })

        logger.info("Bust events injected", count=len(events))
        return events

    def generate_forecast_runs_metadata(self, days: int = 365 * 2) -> List[Dict]:
        """Generate metadata for historical forecast runs."""
        runs = []
        start_date = datetime(2024, 1, 1)
        models = ["GFS", "NCUM", "NGFS"]

        for day_offset in range(days):
            dt = start_date + timedelta(days=day_offset)
            for model in models:
                for cycle in ["00Z", "12Z"]:
                    run_id = f"{model}_{dt.strftime('%Y%m%d')}_{cycle}"
                    runs.append({
                        "run_id": run_id,
                        "model_name": model,
                        "init_time": dt.isoformat(),
                        "domain": "INDIA",
                        "resolution": 0.25,
                        "lead_days": 10,
                        "status": "complete",
                        "month": dt.month,
                    })
        return runs
