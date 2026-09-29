"""
SHAPExplainer — DeepSHAP-based feature attribution for bust detections.
Provides meteorological narratives and similar event retrieval.
"""

import numpy as np
import torch
from torch import Tensor
from typing import Dict, List, Optional, Tuple
import structlog

logger = structlog.get_logger(__name__)

FEATURE_NAMES = [
    "850hPa_wind_speed_anomaly",
    "500hPa_geopotential_height_anomaly",
    "850hPa_relative_vorticity",
    "sea_surface_temp_anomaly",
    "precipitable_water",
    "CAPE",
    "OLR_anomaly",
    "MSLP_gradient",
    "200hPa_divergence",
    "historical_RMSE",
    "model_bias_30d",
    "synoptic_regime_encoding",
]

FEATURE_DESCRIPTIONS = {
    "850hPa_wind_speed_anomaly": "Low-level wind speed departure from climatology",
    "500hPa_geopotential_height_anomaly": "Mid-tropospheric height anomaly indicating trough/ridge",
    "850hPa_relative_vorticity": "Low-level cyclonic rotation — proxy for monsoon depression strength",
    "sea_surface_temp_anomaly": "SST departure from seasonal mean — feeds oceanic convection",
    "precipitable_water": "Total column water vapor — moisture availability for precipitation",
    "CAPE": "Convective Available Potential Energy — atmospheric instability index",
    "OLR_anomaly": "Outgoing Longwave Radiation departure — cloud cover proxy",
    "MSLP_gradient": "Mean Sea Level Pressure gradient — low-level wind forcing",
    "200hPa_divergence": "Upper-level divergence — indicator of deep convection",
    "historical_RMSE": "Climatological model error at this grid cell",
    "model_bias_30d": "Rolling 30-day forecast bias — systematic model error",
    "synoptic_regime_encoding": "Current weather regime (monsoon/WD/cyclone) embedding",
}

SYNOPTIC_NARRATIVES = {
    "monsoon_depression": (
        "The active monsoon depression over the Bay of Bengal introduces strong low-level cyclonic "
        "vorticity and moisture convergence. Historical verification shows NWP models systematically "
        "underestimate rainfall intensity by 30-50% during depression phases, particularly over "
        "Odisha, West Bengal, and the eastern coast. The elevated CAPE combined with high precipitable "
        "water creates conditions where convective parameterization schemes fail."
    ),
    "western_disturbance": (
        "The embedded Western Disturbance in the mid-latitude westerlies drives orographic precipitation "
        "over the Himalayas and foothills. Models frequently mis-place the precipitation maximum by "
        "100-200 km eastward due to coarse terrain representation. The interaction with dry continental "
        "air masses creates sharp gradients that challenge numerical schemes."
    ),
    "cyclone": (
        "Cyclonic system intensity and track errors compound rapidly beyond Day 3. The spiral rainband "
        "structure produces precipitation concentrated in a narrow arc that NWP models spread over a "
        "broader area. SST anomalies fuel asymmetric intensification that current models underestimate "
        "by approximately 20% in maximum sustained winds."
    ),
    "heat_wave": (
        "Persistent anticyclonic anomaly over northwest India suppresses convection and traps heat. "
        "The model underestimates peak temperatures by 2-4°C due to insufficient soil moisture "
        "representation and boundary layer parameterization errors under calm, clear conditions."
    ),
    "active_monsoon": (
        "During active monsoon phases, the intertropical convergence zone shifts northward, intensifying "
        "moisture flux convergence. Large-scale organized convection produces widespread heavy rainfall "
        "events that models struggle to predict with temporal accuracy beyond 48 hours."
    ),
    "break_monsoon": (
        "Break monsoon conditions suppress rainfall over central India while enhancing it over the "
        "foothills and peninsular India. Models frequently fail to capture the sharp transition zone "
        "and the persistence of the break pattern beyond 5 days."
    ),
    "default": (
        "Elevated model forecast uncertainty detected for this region and lead time. The combination "
        "of atmospheric instability indicators and historical model error patterns suggests increased "
        "risk of forecast bust. Operational meteorologists should exercise additional caution when "
        "issuing advisories based on this forecast."
    ),
}


class SHAPExplainer:
    """
    DeepSHAP explainer for ForecastBustTransformer predictions.

    Computes feature attributions using gradient-based approximation
    (full DeepSHAP requires matched background samples).
    """

    def __init__(self, model, background_samples: np.ndarray):
        """
        Args:
            model: ForecastBustTransformer instance
            background_samples: [N, T, H, W, F] reference distribution (N~100)
        """
        self.model = model
        self.background = background_samples
        self.feature_names = FEATURE_NAMES
        self._explainer = None
        self._init_explainer()

    def _init_explainer(self) -> None:
        """Initialize SHAP explainer with background samples."""
        try:
            import shap
            # Use GradientExplainer as DeepSHAP approximation
            # We explain mean output across spatial dims for tractability
            background_tensor = torch.FloatTensor(self.background[:50])
            self._explainer = shap.GradientExplainer(
                model=self._model_wrapper,
                data=background_tensor,
            )
            logger.info("SHAP GradientExplainer initialized", n_background=len(self.background))
        except Exception as e:
            logger.warning("SHAP explainer init failed, using gradient fallback", error=str(e))
            self._explainer = None

    def _model_wrapper(self, x: Tensor) -> Tensor:
        """Wrapper that returns spatial mean bust probability per lead day."""
        self.model.eval()
        with torch.no_grad():
            out = self.model(x)  # [B, T, H, W]
            return out.mean(dim=[-1, -2])  # [B, T]

    def explain(
        self,
        x: np.ndarray,
        lat_idx: int,
        lon_idx: int,
        lead_day: int,
    ) -> Dict:
        """
        Compute SHAP values for a specific grid cell and lead day.

        Args:
            x: [1, T, H, W, F] input tensor (single sample)
            lat_idx: grid latitude index
            lon_idx: grid longitude index
            lead_day: 0-indexed lead day

        Returns:
            dict with top_drivers, shap_values, base_value, predicted_value
        """
        x_tensor = torch.FloatTensor(x)
        self.model.eval()

        if self._explainer is not None:
            try:
                return self._shap_gradient_explain(x_tensor, lead_day)
            except Exception as e:
                logger.warning("SHAP gradient explain failed, using integrated gradients", error=str(e))

        return self._integrated_gradients_explain(x_tensor, lat_idx, lon_idx, lead_day)

    def _shap_gradient_explain(self, x_tensor: Tensor, lead_day: int) -> Dict:
        """Use SHAP GradientExplainer."""
        import shap
        shap_values = self._explainer.shap_values(x_tensor)
        # shap_values: list of [1, T, H, W, F] per output
        # Take lead_day output, average over spatial dims
        if isinstance(shap_values, list):
            sv = shap_values[lead_day]  # [1, T, H, W, F]
        else:
            sv = shap_values[:, lead_day, ...]  # [1, H, W, F]

        mean_sv = sv.mean(axis=tuple(range(len(sv.shape) - 1)))  # [F]
        return self._format_shap_output(mean_sv, x_tensor, lead_day)

    def _integrated_gradients_explain(
        self, x_tensor: Tensor, lat_idx: int, lon_idx: int, lead_day: int
    ) -> Dict:
        """Integrated Gradients fallback for SHAP-style attribution."""
        n_steps = 50
        baseline = torch.zeros_like(x_tensor)

        # Interpolate from baseline to input
        alphas = torch.linspace(0, 1, n_steps)
        integrated_grads = torch.zeros(x_tensor.shape[-1])  # [F]

        self.model.eval()
        for alpha in alphas:
            interp = baseline + alpha * (x_tensor - baseline)
            interp.requires_grad_(True)

            out = self.model(interp)  # [B, T, H, W]
            target = out[0, lead_day, lat_idx, lon_idx]
            target.backward()

            if interp.grad is not None:
                # Average gradient over spatial dims for the target lead day
                grad = interp.grad[0, lead_day, lat_idx, lon_idx, :]  # [F]
                integrated_grads += grad.detach()

        # Scale by (input - baseline)
        delta = x_tensor[0, lead_day, lat_idx, lon_idx, :] - baseline[0, lead_day, lat_idx, lon_idx, :]
        attributions = (integrated_grads / n_steps) * delta
        attributions_np = attributions.cpu().numpy()

        return self._format_shap_output(attributions_np, x_tensor, lead_day)

    def _format_shap_output(
        self, attributions: np.ndarray, x_tensor: Tensor, lead_day: int
    ) -> Dict:
        """Format attributions into standardized SHAP output dict."""
        with torch.no_grad():
            predicted_value = self._model_wrapper(x_tensor)[0, lead_day].item()

        base_value = 0.5  # approximate base rate

        # Sort features by absolute attribution
        indices = np.argsort(np.abs(attributions))[::-1]

        top_drivers = []
        for i in indices[:8]:
            shap_val = float(attributions[i])
            top_drivers.append({
                "feature": self.feature_names[i],
                "shap_value": round(abs(shap_val), 4),
                "direction": "positive" if shap_val > 0 else "negative",
                "magnitude": round(abs(shap_val), 4),
                "description": FEATURE_DESCRIPTIONS.get(self.feature_names[i], ""),
            })

        return {
            "top_drivers": top_drivers,
            "base_value": round(base_value, 4),
            "predicted_value": round(predicted_value, 4),
            "feature_values": {
                name: float(x_tensor[0, lead_day].mean().item())
                for name in self.feature_names
            },
            "all_attributions": {
                self.feature_names[i]: round(float(attributions[i]), 4)
                for i in range(len(self.feature_names))
            },
        }

    def generate_narrative(
        self, shap_result: Dict, synoptic_regime: str, region_name: str
    ) -> str:
        """Generate a meteorological narrative from SHAP values."""
        top_feature = shap_result["top_drivers"][0]["feature"] if shap_result["top_drivers"] else ""
        prob = shap_result["predicted_value"]

        base_narrative = SYNOPTIC_NARRATIVES.get(
            synoptic_regime, SYNOPTIC_NARRATIVES["default"]
        )

        severity_desc = "critical" if prob > 0.75 else "high" if prob > 0.55 else "moderate"
        confidence_str = f"Bust probability: {prob:.1%}."

        feature_sentence = ""
        if shap_result["top_drivers"]:
            f1 = shap_result["top_drivers"][0]
            feature_sentence = (
                f" The dominant driver is {f1['feature'].replace('_', ' ')} "
                f"({f1['description'].lower()}), contributing "
                f"{'positively' if f1['direction'] == 'positive' else 'negatively'} "
                f"to the bust risk with an attribution of {f1['shap_value']:.3f}."
            )

        narrative = (
            f"[{severity_desc.upper()} BUST RISK — {region_name}] {confidence_str} "
            f"{base_narrative}{feature_sentence}"
        )
        return narrative

    def find_similar_events(
        self, synoptic_regime: str, bust_probability: float, historical_events: List[Dict]
    ) -> List[Dict]:
        """Retrieve similar historical bust events."""
        # Filter by regime and similar probability range
        similar = [
            e for e in historical_events
            if e.get("event_type") == synoptic_regime
            and abs(e.get("bust_probability", 0) - bust_probability) < 0.2
        ]
        # Sort by similarity score (combination of regime match + prob distance)
        for e in similar:
            prob_dist = abs(e.get("bust_probability", 0) - bust_probability)
            e["similarity_score"] = round(1.0 - prob_dist, 3)

        similar.sort(key=lambda x: x.get("similarity_score", 0), reverse=True)
        return similar[:5]
