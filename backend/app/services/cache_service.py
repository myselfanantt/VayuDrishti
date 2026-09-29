"""CacheService — Redis cache strategies for forecast data."""

import json
import hashlib
from typing import Any, Optional
import structlog

logger = structlog.get_logger(__name__)

CONFIDENCE_MAP_TTL = 900      # 15 minutes
BUST_LIST_TTL = 300           # 5 minutes
REGION_RISK_TTL = 600         # 10 minutes
EXPLAIN_TTL = 3600            # 1 hour


class CacheService:
    def __init__(self, redis):
        self.redis = redis

    async def get(self, key: str) -> Optional[Any]:
        try:
            val = await self.redis.get(key)
            if val:
                return json.loads(val)
        except Exception as e:
            logger.warning("Cache get failed", key=key, error=str(e))
        return None

    async def set(self, key: str, value: Any, ttl: int = 300) -> None:
        try:
            await self.redis.setex(key, ttl, json.dumps(value, default=str))
        except Exception as e:
            logger.warning("Cache set failed", key=key, error=str(e))

    async def delete(self, key: str) -> None:
        try:
            await self.redis.delete(key)
        except Exception as e:
            logger.warning("Cache delete failed", key=key, error=str(e))

    def confidence_map_key(self, run_id: str, lead_day: int) -> str:
        return f"conf_map:{run_id}:d{lead_day}"

    def bust_list_key(self, filters_hash: str) -> str:
        return f"busts:{filters_hash}"

    def region_risk_key(self, run_id: Optional[str] = None) -> str:
        return f"region_risk:{run_id or 'latest'}"

    def explain_key(self, bust_id: str) -> str:
        return f"explain:{bust_id}"

    @staticmethod
    def hash_filters(filters: dict) -> str:
        s = json.dumps(filters, sort_keys=True)
        return hashlib.md5(s.encode()).hexdigest()[:12]

    async def publish_alert(self, channel: str, message: dict) -> None:
        """Publish real-time alert to Redis pub/sub."""
        try:
            await self.redis.publish(channel, json.dumps(message, default=str))
        except Exception as e:
            logger.warning("Alert publish failed", channel=channel, error=str(e))
