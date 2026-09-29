"""
ModelRegistry — Manages loading, caching, and training of ML model weights.
If weights don't exist on startup, trains a fast version on synthetic data.
"""

import os
import torch
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import Optional, Tuple
import structlog

from app.ml.bust_transformer import ForecastBustTransformer
from app.config import settings

logger = structlog.get_logger(__name__)


class ModelRegistry:
    """Singleton registry for loaded model weights."""

    _instance: Optional["ModelRegistry"] = None
    _model: Optional[ForecastBustTransformer] = None
    _background_samples: Optional[np.ndarray] = None

    def __new__(cls) -> "ModelRegistry":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def get_model(self) -> ForecastBustTransformer:
        """Get model, loading or training if necessary."""
        if self._model is None:
            self._model = self._load_or_train()
        return self._model

    def get_background_samples(self) -> np.ndarray:
        """Get SHAP background samples."""
        if self._background_samples is None:
            self._background_samples = self._generate_background()
        return self._background_samples

    def _load_or_train(self) -> ForecastBustTransformer:
        weights_path = Path(settings.model_weights_path)

        model = ForecastBustTransformer(
            d_model=64,
            nhead=2,
            num_layers=1,
            in_channels=settings.n_features,
            lead_days=settings.lead_days,
            patch_size=8,
            dropout=0.1,
        )

        if weights_path.exists():
            logger.info("Loading model weights", path=str(weights_path))
            try:
                state = torch.load(weights_path, map_location="cpu", weights_only=True)
                model.load_state_dict(state, strict=False)
                logger.info("Model weights loaded successfully")
            except Exception as e:
                logger.warning("Failed to load weights, training from scratch", error=str(e))
                model = self._quick_train(model)
        else:
            logger.info("No weights found, training on synthetic data (< 60s)")
            model = self._quick_train(model)

        model.eval()
        return model

    def _quick_train(self, model: ForecastBustTransformer) -> ForecastBustTransformer:
        """Quick training on synthetic data for demo purposes."""
        from app.utils.synthetic_data import SyntheticWeatherGenerator
        from datetime import datetime as dt

        logger.info("Starting quick training on synthetic data...")
        generator = SyntheticWeatherGenerator(seed=42)

        # Generate small training set (4 samples to stay fast on CPU)
        n_train = 4
        H_train = 32  # Downsampled grid for fast training
        W_train = 40

        X_list = []
        y_list = []

        for i in range(n_train):
            init_time = dt(2023, 7, i + 1)
            features = generator.generate_forecast_run(init_time)  # [T, H, W, F]

            # Downsample spatially
            features_ds = features[:, ::4, ::4, :]  # [T, H//4, W//4, F]
            T, H, W, F = features_ds.shape

            # Create synthetic labels: bust where vorticity > 1.0
            labels = (features_ds[..., 2] > 0.8).astype(np.float32)  # [T, H, W]

            X_list.append(features_ds)
            y_list.append(labels)

        X = np.stack(X_list, axis=0)  # [B, T, H, W, F]
        y = np.stack(y_list, axis=0)  # [B, T, H, W]

        X_tensor = torch.FloatTensor(X)
        y_tensor = torch.FloatTensor(y)

        # Use smaller model for demo
        model_small = ForecastBustTransformer(
            d_model=64,
            nhead=2,
            num_layers=1,
            in_channels=settings.n_features,
            lead_days=settings.lead_days,
            patch_size=8,  # Larger patches = fewer tokens = faster
            dropout=0.1,
        )

        optimizer = torch.optim.Adam(model_small.parameters(), lr=1e-3)

        # Focal loss (handles class imbalance)
        def focal_loss(pred, target, gamma=2.0, alpha=0.25):
            bce = torch.nn.functional.binary_cross_entropy(pred, target, reduction="none")
            p_t = target * pred + (1 - target) * (1 - pred)
            alpha_t = target * alpha + (1 - target) * (1 - alpha)
            loss = alpha_t * ((1 - p_t) ** gamma) * bce
            return loss.mean()

        model_small.train()
        start_time = datetime.now()
        n_epochs = 5

        logger.info("Training for quick epochs", n_epochs=n_epochs)
        for epoch in range(n_epochs):
            optimizer.zero_grad()
            pred = model_small(X_tensor)  # [B, T, H, W]

            # Match target spatial size to prediction
            H_pred, W_pred = pred.shape[2], pred.shape[3]
            y_resized = torch.nn.functional.interpolate(
                y_tensor.unsqueeze(1).view(-1, 1, y_tensor.shape[2], y_tensor.shape[3]),
                size=(H_pred, W_pred),
                mode="nearest",
            ).squeeze(1).view(y_tensor.shape[0], y_tensor.shape[1], H_pred, W_pred)

            loss = focal_loss(pred, y_resized)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model_small.parameters(), 1.0)
            optimizer.step()

            elapsed = (datetime.now() - start_time).total_seconds()
            logger.info(f"Epoch {epoch+1}/{n_epochs}, Loss: {loss.item():.4f}, Time: {elapsed:.1f}s")

        # Save weights
        weights_path = Path(settings.model_weights_path)
        weights_path.parent.mkdir(parents=True, exist_ok=True)
        torch.save(model_small.state_dict(), weights_path)
        logger.info("Model weights saved", path=str(weights_path))

        return model_small

    def _generate_background(self) -> np.ndarray:
        """Generate SHAP background samples."""
        from app.utils.synthetic_data import SyntheticWeatherGenerator
        from datetime import datetime as dt

        generator = SyntheticWeatherGenerator(seed=99)
        samples = []
        for i in range(min(settings.shap_background_samples, 20)):  # 20 for speed
            init_time = dt(2023, 1 + (i % 12), 1)
            features = generator.generate_forecast_run(init_time)
            features_ds = features[:, ::4, ::4, :]  # downsample
            samples.append(features_ds)

        return np.stack(samples, axis=0).astype(np.float32)

    def reload_model(self) -> None:
        """Force reload model from disk."""
        self._model = None
        self._model = self._load_or_train()


model_registry = ModelRegistry()
