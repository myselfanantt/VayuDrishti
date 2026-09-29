"""
RegionRiskClassifier — Classifies India into dynamic risk zones per forecast run.
Uses k-means clustering on spatial bust probability fields.
"""

import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from typing import Dict, List, Tuple, Optional
import structlog

logger = structlog.get_logger(__name__)

# India district-level region definitions (representative centroids)
INDIA_REGIONS = [
    {"region_id": "OD", "region_name": "Odisha", "state": "Odisha", "lat": 20.9, "lon": 85.1},
    {"region_id": "WB", "region_name": "West Bengal", "state": "West Bengal", "lat": 22.9, "lon": 87.9},
    {"region_id": "KL", "region_name": "Kerala", "state": "Kerala", "lat": 10.8, "lon": 76.3},
    {"region_id": "MH_KONK", "region_name": "Konkan Maharashtra", "state": "Maharashtra", "lat": 17.3, "lon": 73.8},
    {"region_id": "UK", "region_name": "Uttarakhand", "state": "Uttarakhand", "lat": 30.1, "lon": 79.2},
    {"region_id": "HP", "region_name": "Himachal Pradesh", "state": "Himachal Pradesh", "lat": 31.8, "lon": 77.1},
    {"region_id": "RJ", "region_name": "Rajasthan", "state": "Rajasthan", "lat": 27.0, "lon": 74.2},
    {"region_id": "MP", "region_name": "Madhya Pradesh", "state": "Madhya Pradesh", "lat": 23.5, "lon": 78.0},
    {"region_id": "GJ", "region_name": "Gujarat", "state": "Gujarat", "lat": 22.3, "lon": 72.6},
    {"region_id": "TN", "region_name": "Tamil Nadu", "state": "Tamil Nadu", "lat": 11.1, "lon": 79.5},
    {"region_id": "AP", "region_name": "Andhra Pradesh", "state": "Andhra Pradesh", "lat": 15.9, "lon": 80.0},
    {"region_id": "TS", "region_name": "Telangana", "state": "Telangana", "lat": 17.4, "lon": 78.5},
    {"region_id": "CG", "region_name": "Chhattisgarh", "state": "Chhattisgarh", "lat": 21.3, "lon": 81.9},
    {"region_id": "JH", "region_name": "Jharkhand", "state": "Jharkhand", "lat": 23.6, "lon": 85.3},
    {"region_id": "UP", "region_name": "Uttar Pradesh", "state": "Uttar Pradesh", "lat": 26.8, "lon": 80.9},
    {"region_id": "PB", "region_name": "Punjab", "state": "Punjab", "lat": 31.2, "lon": 75.3},
    {"region_id": "HR", "region_name": "Haryana", "state": "Haryana", "lat": 29.1, "lon": 76.1},
    {"region_id": "DL", "region_name": "Delhi NCR", "state": "Delhi", "lat": 28.7, "lon": 77.1},
    {"region_id": "KA", "region_name": "Karnataka", "state": "Karnataka", "lat": 15.3, "lon": 75.7},
    {"region_id": "MH_VID", "region_name": "Vidarbha", "state": "Maharashtra", "lat": 21.1, "lon": 78.5},
    {"region_id": "NE_AS", "region_name": "Assam", "state": "Assam", "lat": 26.2, "lon": 92.9},
    {"region_id": "NE_MN", "region_name": "Manipur", "state": "Manipur", "lat": 24.8, "lon": 93.9},
    {"region_id": "AR", "region_name": "Arunachal Pradesh", "state": "Arunachal Pradesh", "lat": 28.2, "lon": 94.7},
    {"region_id": "AND", "region_name": "Andaman Islands", "state": "Andaman", "lat": 11.7, "lon": 92.7},
    {"region_id": "LKH", "region_name": "Lakshadweep", "state": "Lakshadweep", "lat": 10.6, "lon": 72.8},
]

HISTORICAL_HIT_RATES = {
    "OD": 0.73, "WB": 0.68, "KL": 0.71, "MH_KONK": 0.65, "UK": 0.61,
    "HP": 0.58, "RJ": 0.55, "MP": 0.62, "GJ": 0.59, "TN": 0.66,
    "AP": 0.67, "TS": 0.63, "CG": 0.64, "JH": 0.66, "UP": 0.57,
    "PB": 0.52, "HR": 0.54, "DL": 0.56, "KA": 0.64, "MH_VID": 0.61,
    "NE_AS": 0.69, "NE_MN": 0.67, "AR": 0.70, "AND": 0.74, "LKH": 0.72,
}


class RegionRiskClassifier:
    """
    Classifies India regions into dynamic risk zones using spatial
    bust probability clustering from the transformer output.
    """

    def __init__(self, n_clusters: int = 4, random_state: int = 42):
        self.n_clusters = n_clusters
        self.kmeans = KMeans(n_clusters=n_clusters, random_state=random_state, n_init=10)
        self.scaler = StandardScaler()
        self.regions = INDIA_REGIONS
        self._is_fitted = False

    def classify(
        self,
        bust_prob_map: np.ndarray,
        lat_coords: np.ndarray,
        lon_coords: np.ndarray,
        lead_day: int = 0,
        synoptic_regime: Optional[str] = None,
    ) -> List[Dict]:
        """
        Classify each region by extracting bust probability at region centroid.

        Args:
            bust_prob_map: [T, H, W] — bust probability for all lead days
            lat_coords: 1D lat array
            lon_coords: 1D lon array
            lead_day: which lead day to use for classification
            synoptic_regime: current weather regime

        Returns:
            List of region risk dicts
        """
        results = []

        for region in self.regions:
            # Find nearest grid cell to region centroid
            lat_idx = int(np.argmin(np.abs(lat_coords - region["lat"])))
            lon_idx = int(np.argmin(np.abs(lon_coords - region["lon"])))

            # Extract bust probability at this location (average over 3x3 neighborhood)
            lat_sl = slice(max(0, lat_idx - 1), min(len(lat_coords), lat_idx + 2))
            lon_sl = slice(max(0, lon_idx - 1), min(len(lon_coords), lon_idx + 2))
            prob = float(bust_prob_map[lead_day, lat_sl, lon_sl].mean())

            # Determine risk level
            risk_level = self._prob_to_risk(prob)

            # Find high-risk lead days (where prob > 0.5)
            cell_probs = bust_prob_map[:, lat_idx, lon_idx]
            affected_leads = [i + 1 for i, p in enumerate(cell_probs) if p > 0.5]

            # Confidence score (inverse of temporal variance)
            temporal_std = float(cell_probs.std())
            confidence = float(np.clip(1 - temporal_std * 2, 0, 1))

            results.append({
                "region_id": region["region_id"],
                "region_name": region["region_name"],
                "state": region["state"],
                "lat": region["lat"],
                "lon": region["lon"],
                "risk_level": risk_level,
                "bust_probability": round(prob, 4),
                "confidence_score": round(confidence, 4),
                "historical_hit_rate": HISTORICAL_HIT_RATES.get(region["region_id"], 0.60),
                "dominant_synoptic": synoptic_regime,
                "affected_lead_days": affected_leads,
            })

        return results

    def _prob_to_risk(self, prob: float) -> str:
        if prob >= 0.75:
            return "CRITICAL"
        elif prob >= 0.55:
            return "HIGH"
        elif prob >= 0.30:
            return "MODERATE"
        else:
            return "LOW"

    def build_risk_geojson(self, region_risks: List[Dict]) -> Dict:
        """Build GeoJSON FeatureCollection from region risk classifications."""
        features = []
        for r in region_risks:
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [r["lon"], r["lat"]],
                },
                "properties": {
                    "region_id": r["region_id"],
                    "region_name": r["region_name"],
                    "state": r["state"],
                    "risk_level": r["risk_level"],
                    "bust_probability": r["bust_probability"],
                    "confidence_score": r["confidence_score"],
                    "historical_hit_rate": r["historical_hit_rate"],
                    "affected_lead_days": r["affected_lead_days"],
                    "color": self._risk_to_color(r["risk_level"]),
                },
            }
            features.append(feature)
        return {"type": "FeatureCollection", "features": features}

    def _risk_to_color(self, risk_level: str) -> str:
        return {
            "LOW": "#34A853",
            "MODERATE": "#FBBC04",
            "HIGH": "#FF6D00",
            "CRITICAL": "#EA4335",
        }.get(risk_level, "#9AA0A6")

    def compute_cluster_statistics(
        self, bust_prob_map: np.ndarray
    ) -> Dict:
        """Cluster spatial bust probability field using k-means."""
        T, H, W = bust_prob_map.shape
        # Use max bust probability across lead days
        max_prob = bust_prob_map.max(axis=0)  # [H, W]
        flat = max_prob.ravel().reshape(-1, 1)

        scaled = self.scaler.fit_transform(flat)
        labels = self.kmeans.fit_predict(scaled)
        cluster_probs = [
            float(flat[labels == k].mean()) for k in range(self.n_clusters)
        ]

        return {
            "n_clusters": self.n_clusters,
            "cluster_probs": sorted(cluster_probs),
            "high_risk_fraction": float((max_prob > 0.55).mean()),
            "critical_fraction": float((max_prob > 0.75).mean()),
        }
