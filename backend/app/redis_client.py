import redis.asyncio as aioredis
from redis.asyncio import Redis
from app.config import settings
import structlog

logger = structlog.get_logger(__name__)

_redis_pool: Redis | None = None


async def get_redis() -> Redis:
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = await aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
        )
        logger.info("Redis connection pool created", url=settings.redis_url)
    return _redis_pool


async def close_redis() -> None:
    global _redis_pool
    if _redis_pool is not None:
        await _redis_pool.aclose()
        _redis_pool = None
        logger.info("Redis connection pool closed")
