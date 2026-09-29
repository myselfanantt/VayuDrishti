# VayuDrishti — AI-Based Forecast Bust Detection
## Smart India Hackathon 2026 | Problem ID: 26079
### Organization: NCMRWF, Ministry of Earth Sciences

> **VayuDrishti** (वायुदृष्टि) — *Sanskrit: "Vision of the Wind"*
> Detecting forecast failures before they occur using spatiotemporal AI.

---

## What Problem Are We Solving?

Medium-range weather forecasts (Day 1-10) frequently fail during rapidly evolving synoptic events: monsoon depressions, cyclones, western disturbances, heat waves.
These failures are called **forecast busts**. Current tools only diagnose busts *after* they occur. **VayuDrishti predicts busts 2-7 days before they happen.**

## What Makes This Novel?

| Feature | Current Tools | VayuDrishti |
|---------|--------------|-------------|
| Detection timing | Post-event | Pre-event (2-7 days ahead) |
| Confidence | Single deterministic | MC Dropout uncertainty bands |
| Synoptic conditioning | None | Regime-specific (monsoon/WD/cyclone) |
| Spatial resolution | National skill score | District-level (0.25 grid) |
| Explainability | Black box | SHAP attribution in meteorological terms |

## Quick Start

### Prerequisites: Docker Desktop 24+, Docker Compose v2

`ash
git clone <repo> && cd VayuDrishti
cp .env.example .env
docker compose up --build
`

First startup: trains ML model on synthetic data (~60s), seeds 5 years of historical data.

### Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API Docs | http://localhost:8000/docs |
| Grafana | http://localhost:3001 |

## ML Model: ForecastBustTransformer

Architecture: Spatiotemporal Transformer
- Input: [batch, T=10, lat=121, lon=121, F=12]
- Spatial encoder: ConvNext-style patch embedding
- Temporal encoder: Causal multi-head attention
- Output: bust probability per grid cell per lead day

12 Features: 850hPa vorticity, CAPE, SST anomaly, OLR, precipitable water,
500hPa geopotential, wind speed anomaly, MSLP gradient, 200hPa divergence,
historical RMSE, 30-day model bias, synoptic regime encoding.

Uncertainty: Monte Carlo Dropout (30 passes) -> 10th/90th percentile CI.

## API Reference

`
GET  /api/v1/forecast/runs
GET  /api/v1/forecast/{run_id}/confidence
GET  /api/v1/busts/
POST /api/v1/busts/detect     -> { task_id }
GET  /api/v1/explain/{bust_id}
GET  /api/v1/regions/risk-map
WS   /api/v1/ws/live-alerts
`

## Tech Stack

Backend: Python 3.11, FastAPI, PostgreSQL 15 + TimescaleDB, Redis 7,
Celery, SQLAlchemy 2.0, Pydantic v2, PyTorch 2.x, SHAP, Prometheus

Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS v3,
Framer Motion, Mapbox GL JS v3, Recharts, Zustand, SWR

*VayuDrishti v1.0 — SIH 2026 Problem 26079 — NCMRWF, Ministry of Earth Sciences*