"""AlertService — Threshold checking and notifications for bust alerts."""

import json
from datetime import datetime
from typing import List, Dict, Optional
import structlog

logger = structlog.get_logger(__name__)


class AlertService:
    def __init__(self, redis):
        self.redis = redis
        self._active_alerts: List[Dict] = []

    async def check_and_fire_alerts(
        self, bust_detections: List[Dict], subscriptions: List[Dict]
    ) -> List[Dict]:
        """Check bust detections against subscriptions and fire alerts."""
        fired = []
        for detection in bust_detections:
            for sub in subscriptions:
                if (
                    sub["region_id"] in [detection["region_id"], "*"]
                    and detection["bust_probability"] >= sub["threshold"]
                    and sub.get("is_active", True)
                ):
                    alert = {
                        "type": "bust_alert",
                        "alert_id": f"alert_{datetime.utcnow().timestamp()}",
                        "region_id": detection["region_id"],
                        "region_name": detection["region_name"],
                        "bust_probability": detection["bust_probability"],
                        "confidence_score": detection["confidence_score"],
                        "severity": detection["severity"],
                        "lead_day": detection["lead_day"],
                        "synoptic_regime": detection.get("synoptic_regime", "unknown"),
                        "triggered_at": datetime.utcnow().isoformat(),
                        "subscription_id": sub.get("id", ""),
                    }
                    fired.append(alert)
                    await self._broadcast_alert(alert)
        return fired

    async def _broadcast_alert(self, alert: Dict) -> None:
        """Broadcast alert to WebSocket subscribers via Redis pub/sub."""
        try:
            await self.redis.publish("bust_alerts", json.dumps(alert, default=str))
            logger.info(
                "Alert broadcast",
                region=alert["region_name"],
                prob=alert["bust_probability"],
            )
        except Exception as e:
            logger.error("Alert broadcast failed", error=str(e))

    async def get_live_alerts(self, limit: int = 20) -> List[Dict]:
        """Get recent live alerts from Redis."""
        try:
            raw = await self.redis.lrange("recent_alerts", 0, limit - 1)
            return [json.loads(r) for r in raw]
        except Exception:
            return []

    async def store_alert(self, alert: Dict) -> None:
        """Store alert in Redis list for history."""
        try:
            await self.redis.lpush("recent_alerts", json.dumps(alert, default=str))
            await self.redis.ltrim("recent_alerts", 0, 99)  # Keep last 100
        except Exception as e:
            logger.error("Alert storage failed", error=str(e))
