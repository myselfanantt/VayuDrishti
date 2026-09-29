"""
VayuDrishti — AI-Based Forecast Bust Detection System
FastAPI Application Factory
"""

import time
import uuid
import structlog  # type: ignore
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from prometheus_fastapi_instrumentator import Instrumentator  # type: ignore

from app.config import settings
from app.database import init_db
from app.redis_client import get_redis, close_redis
from app.api.v1.router import router as api_v1_router

# Configure structured logging
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ]
)
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    logger.info("VayuDrishti starting up", version=settings.app_version, env=settings.environment)

    # Initialize database
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.warning("Database init failed (continuing without DB)", error=str(e))

    # Initialize Redis
    try:
        redis = await get_redis()
        await redis.ping()
        logger.info("Redis connected")
    except Exception as e:
        logger.warning("Redis unavailable (continuing without cache)", error=str(e))

    # Pre-load ML model
    if settings.seed_on_startup:
        try:
            logger.info("Pre-loading ML model...")
            from app.ml.model_registry import model_registry
            model = model_registry.get_model()
            logger.info("ML model ready", model_type=type(model).__name__)
        except Exception as e:
            logger.error("ML model loading failed", error=str(e))

    logger.info("VayuDrishti startup complete. Ready for requests.")
    yield

    # Shutdown
    logger.info("VayuDrishti shutting down")
    await close_redis()
    logger.info("Shutdown complete")


def create_app() -> FastAPI:
    """FastAPI application factory."""
    app = FastAPI(
        title=settings.app_name,
        description=(
            "AI-Based Forecast Bust Detection for Medium-Range Weather Forecasts. "
            "Built for Smart India Hackathon 2026 — Problem 26079 — NCMRWF, Ministry of Earth Sciences."
        ),
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins + ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Compression
    app.add_middleware(GZipMiddleware, minimum_size=1024)

    # Request ID + timing middleware
    @app.middleware("http")
    async def request_middleware(request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        start = time.perf_counter()
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        response: Response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)

        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{duration_ms}ms"
        response.headers["X-VayuDrishti-Version"] = settings.app_version

        logger.info(
            "HTTP request",
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            duration_ms=duration_ms,
        )
        return response

    # Prometheus metrics
    Instrumentator().instrument(app).expose(app, endpoint="/metrics")

    # API routes
    app.include_router(api_v1_router)

    # Health check
    @app.get("/health", tags=["Health"])
    async def health():
        import torch  # type: ignore
        return {
            "status": "healthy",
            "version": settings.app_version,
            "environment": settings.environment,
            "torch_available": True,
            "torch_version": torch.__version__,
            "timestamp": time.time(),
        }

    @app.get("/", tags=["Root"])
    async def root():
        return {
            "app": settings.app_name,
            "version": settings.app_version,
            "docs": "/docs",
            "problem_id": "SIH-2026-26079",
            "organization": "NCMRWF, Ministry of Earth Sciences",
        }

    return app


app = create_app()
