"""Bust Detection API endpoints."""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from datetime import datetime, timedelta
from typing import Optional, List
import uuid
import structlog

from app.schemas.bust import BustDetectRequest, BustDetectResponse, TaskStatusResponse
from app.services.bust_service import bust_service
from app.services.forecast_service import forecast_service
from app.utils.synthetic_data import SyntheticWeatherGenerator

logger = structlog.get_logger(__name__)
router = APIRouter()

# In-memory task store for demo (use Redis in production)
_task_store: dict = {}
# Pre-generated bust events for demo
_demo_generator = SyntheticWeatherGenerator(seed=42)
_demo_busts: List[dict] = _demo_generator.inject_bust_events(n_events=200)


@router.get("/")
async def list_busts(
    region: Optional[str] = None,
    severity: Optional[str] = None,
    days: int = Query(7, ge=1, le=365),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List historical bust detections with filtering."""
    busts = list(_demo_busts)

    if region:
        busts = [b for b in busts if b.get("region_id") == region or b.get("region_name", "").lower() == region.lower()]
    if severity:
        busts = [b for b in busts if b.get("severity") == severity.upper()]

    # Compute stats
    total = len(busts)
    stats = {
        "total_detections": total,
        "critical_count": sum(1 for b in busts if b.get("severity") == "CRITICAL"),
        "high_count": sum(1 for b in busts if b.get("severity") == "HIGH"),
        "moderate_count": sum(1 for b in busts if b.get("severity") == "MODERATE"),
        "low_count": sum(1 for b in busts if b.get("severity") == "LOW"),
        "avg_confidence": round(sum(b.get("confidence_score", 0.7) for b in busts) / max(total, 1), 4),
        "top_affected_regions": _compute_top_regions(busts),
    }

    start = (page - 1) * page_size
    end = start + page_size
    page_busts = busts[start:end]

    return {"busts": page_busts, "stats": stats, "total": total}


def _compute_top_regions(busts: List[dict]) -> List[dict]:
    region_counts: dict = {}
    for b in busts:
        rid = b.get("region_id", "unknown")
        rname = b.get("region_name", rid)
        if rid not in region_counts:
            region_counts[rid] = {"region_id": rid, "region_name": rname, "count": 0, "avg_prob": 0}
        region_counts[rid]["count"] += 1
        region_counts[rid]["avg_prob"] += b.get("bust_probability", 0)

    for v in region_counts.values():
        v["avg_prob"] = round(v["avg_prob"] / v["count"], 4) if v["count"] > 0 else 0

    return sorted(region_counts.values(), key=lambda x: x["count"], reverse=True)[:5]


@router.post("/detect")
async def trigger_bust_detection(request: BustDetectRequest, background_tasks: BackgroundTasks):
    """Trigger async ML inference job on a forecast run."""
    task_id = str(uuid.uuid4())
    _task_store[task_id] = {"status": "pending", "progress": 0.0}

    try:
        from app.workers.inference_task import run_bust_detection
        celery_task = run_bust_detection.apply_async(
            args=[request.run_id],
            kwargs={"force_recompute": request.force_recompute},
            task_id=task_id,
        )
        _task_store[task_id]["celery_task_id"] = celery_task.id
    except Exception:
        # Fallback: run inline for demo if Celery not available
        _task_store[task_id] = {"status": "running", "progress": 0.1}

        def run_inline():
            try:
                run_meta = forecast_service.get_run_by_id(request.run_id)
                init_time = datetime.fromisoformat(run_meta["init_time"].replace("Z", ""))
                result = bust_service.run_inference(request.run_id, init_time)
                _task_store[task_id] = {"status": "complete", "progress": 1.0, "result": result}
            except Exception as e:
                _task_store[task_id] = {"status": "failed", "error": str(e)}

        background_tasks.add_task(run_inline)

    return {"task_id": task_id, "status": "pending", "message": "Bust detection job queued"}


@router.get("/detect/{task_id}")
async def get_task_status(task_id: str):
    """Poll inference job status."""
    if task_id not in _task_store:
        # Try Celery backend
        try:
            from app.workers.celery_app import celery_app
            result = celery_app.AsyncResult(task_id)
            status_map = {"PENDING": "pending", "STARTED": "running", "SUCCESS": "complete", "FAILURE": "failed"}
            status = status_map.get(result.state, "pending")
            return {
                "task_id": task_id,
                "status": status,
                "result": result.result if result.ready() and not result.failed() else None,
                "error": str(result.result) if result.failed() else None,
            }
        except Exception:
            raise HTTPException(status_code=404, detail="Task not found")

    task = _task_store[task_id]
    return {
        "task_id": task_id,
        "status": task.get("status", "pending"),
        "result": task.get("result"),
        "error": task.get("error"),
        "progress": task.get("progress", 0.0),
    }


@router.get("/recent")
async def get_recent_busts(limit: int = Query(10, ge=1, le=50)):
    """Get most recent high-severity bust detections."""
    critical = [b for b in _demo_busts if b.get("severity") in ["CRITICAL", "HIGH"]]
    return {"busts": critical[:limit], "total": len(critical)}
