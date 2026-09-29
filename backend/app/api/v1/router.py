from fastapi import APIRouter
from app.api.v1 import forecast, busts, explain, regions, alerts, websocket, performance, region_detail, auth

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router, prefix="/auth", tags=["Auth"])
router.include_router(forecast.router, prefix="/forecast", tags=["Forecast"])
router.include_router(busts.router, prefix="/busts", tags=["Bust Detection"])
router.include_router(explain.router, prefix="/explain", tags=["Explainability"])
router.include_router(regions.router, prefix="/regions", tags=["Regions"])
router.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
router.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])
router.include_router(performance.router, prefix="/performance", tags=["performance"])
router.include_router(region_detail.router, prefix="/regions-detail", tags=["region-detail"])
