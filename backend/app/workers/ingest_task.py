"""Periodic NWP data ingestion task."""

from app.workers.celery_app import celery_app
import structlog

logger = structlog.get_logger(__name__)


@celery_app.task(name="app.workers.ingest_task.ingest_latest_nwp")
def ingest_latest_nwp():
    """Periodic task: ingest latest NWP model run data."""
    from datetime import datetime
    from app.utils.synthetic_data import SyntheticWeatherGenerator

    logger.info("Starting NWP ingest task")
    gen = SyntheticWeatherGenerator()
    init_time = datetime.utcnow()
    features = gen.generate_forecast_run(init_time)
    logger.info(
        "NWP data ingested (synthetic)",
        shape=list(features.shape),
        init_time=init_time.isoformat(),
    )
    return {"status": "complete", "init_time": init_time.isoformat()}
