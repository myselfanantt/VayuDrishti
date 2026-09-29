"""Celery application configuration."""

from celery import Celery
from app.config import settings

celery_app = Celery(
    "vayudrishti",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.workers.inference_task", "app.workers.ingest_task"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    result_expires=3600,
    task_soft_time_limit=300,
    task_time_limit=600,
    worker_prefetch_multiplier=1,
    task_routes={
        "app.workers.inference_task.*": {"queue": "inference"},
        "app.workers.ingest_task.*": {"queue": "ingest"},
    },
    beat_schedule={
        "ingest-nwp-every-6h": {
            "task": "app.workers.ingest_task.ingest_latest_nwp",
            "schedule": 6 * 3600,
        },
    },
)
