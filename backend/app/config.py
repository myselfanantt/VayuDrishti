from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Optional
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        protected_namespaces=("settings_",),
    )

    # Application
    app_name: str = "VayuDrishti - Forecast Bust Detector"
    app_version: str = "1.0.0"
    environment: str = "development"
    log_level: str = "INFO"
    debug: bool = False

    # Database
    database_url: str = "postgresql+asyncpg://ncmrwf:ncmrwf_secure_2026@localhost:5432/forecast_busts"
    sync_database_url: str = "postgresql://ncmrwf:ncmrwf_secure_2026@localhost:5432/forecast_busts"
    db_pool_size: int = 10
    db_max_overflow: int = 20

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_cache_ttl: int = 900  # 15 minutes

    # Security
    secret_key: str = "vayudrishti_dev_secret_key_change_in_production"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    # Mapbox
    mapbox_token: str = "pk.demo"

    # ML Configuration
    model_weights_path: str = "/app/models/bust_transformer_v1.pt"
    mc_dropout_passes: int = 30
    shap_background_samples: int = 100
    seed_on_startup: bool = True

    # India domain grid configuration
    lat_min: float = 5.0
    lat_max: float = 38.0
    lon_min: float = 65.0
    lon_max: float = 100.0
    grid_resolution: float = 0.25
    lead_days: int = 10
    n_features: int = 12


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
