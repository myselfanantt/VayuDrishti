"""Async bust detection inference task."""

import uuid
from datetime import datetime
from app.workers.celery_app import celery_app
import structlog

logger = structlog.get_logger(__name__)


@celery_app.task(name="app.workers.inference_task.run_bust_detection", bind=True)
def run_bust_detection(self, run_id: str, force_recompute: bool = False):
    """
    Celery task: Run bust detection pipeline for a forecast run.
    Updates task state at each step so the frontend can poll progress.
    """
    try:
        self.update_state(state="RUNNING", meta={"progress": 0.1, "step": "loading_data"})
        logger.info("Bust detection task started", task_id=self.request.id, run_id=run_id)

        from app.services.bust_service import bust_service
        from app.services.forecast_service import forecast_service

        run_meta = forecast_service.get_run_by_id(run_id)
        init_time = datetime.fromisoformat(run_meta["init_time"].replace("Z", ""))

        self.update_state(state="RUNNING", meta={"progress": 0.3, "step": "model_inference"})

        result = bust_service.run_inference(run_id, init_time)

        self.update_state(state="RUNNING", meta={"progress": 0.9, "step": "saving_results"})

        logger.info(
            "Bust detection task complete",
            task_id=self.request.id,
            run_id=run_id,
            n_detections=len(result.get("bust_detections", [])),
        )

        return {
            "status": "complete",
            "run_id": run_id,
            "n_detections": len(result.get("bust_detections", [])),
            "n_high_risk_regions": sum(
                1 for r in result.get("region_risks", []) if r["risk_level"] in ["HIGH", "CRITICAL"]
            ),
            "synoptic_regime": result.get("synoptic_regime", {}).get("regime", "unknown"),
            "result_summary": result,
        }

    except Exception as e:
        logger.error("Bust detection task failed", task_id=self.request.id, error=str(e))
        self.update_state(state="FAILURE", meta={"error": str(e)})
        raise
