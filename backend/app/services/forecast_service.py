"""ForecastService — Fetch and parse NWP data."""

from datetime import datetime, timedelta
from typing import List, Optional
import structlog

from app.utils.synthetic_data import SyntheticWeatherGenerator

logger = structlog.get_logger(__name__)


class ForecastService:
    def __init__(self):
        self.generator = SyntheticWeatherGenerator(seed=42)

    def get_recent_runs(self, n: int = 20) -> List[dict]:
        """Get recent forecast run metadata."""
        runs = []
        now = datetime.utcnow()
        models = ["GFS", "NCUM", "NGFS"]
        for i in range(n):
            dt = now - timedelta(hours=i * 12)
            model = models[i % 3]
            cycle = "00Z" if dt.hour < 12 else "12Z"
            run_id = f"{model}_{dt.strftime('%Y%m%d')}_{cycle}"
            runs.append({
                "run_id": run_id,
                "model_name": model,
                "init_time": dt.isoformat(),
                "domain": "INDIA",
                "resolution": 0.25,
                "lead_days": 10,
                "status": "complete",
            })
        return runs

    def get_run_by_id(self, run_id: str) -> Optional[dict]:
        """Get a specific forecast run by ID."""
        runs = self.get_recent_runs(100)
        for r in runs:
            if r["run_id"] == run_id:
                return r
        # Create on-demand
        parts = run_id.split("_")
        return {
            "run_id": run_id,
            "model_name": parts[0] if parts else "GFS",
            "init_time": datetime.utcnow().isoformat(),
            "domain": "INDIA",
            "resolution": 0.25,
            "lead_days": 10,
            "status": "complete",
        }


forecast_service = ForecastService()
