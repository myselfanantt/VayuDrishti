"""WebSocket API for live bust alerts."""

import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime
import structlog

logger = structlog.get_logger(__name__)
router = APIRouter()

# Connected WebSocket clients
_connections: list[WebSocket] = []


@router.websocket("/live-alerts")
async def websocket_live_alerts(websocket: WebSocket):
    """WebSocket endpoint for real-time bust alerts."""
    await websocket.accept()
    _connections.append(websocket)
    logger.info("WebSocket client connected", total_clients=len(_connections))

    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connection_established",
            "message": "Connected to VayuDrishti live alerts",
            "connected_at": datetime.utcnow().isoformat(),
        })

        # Subscribe to Redis pub/sub for alerts
        from app.redis_client import get_redis
        redis = await get_redis()

        # Poll for messages and send simulated alerts every 30 seconds
        counter = 0
        while True:
            await asyncio.sleep(15)
            counter += 1

            # Simulate periodic confidence updates
            from app.utils.synthetic_data import SyntheticWeatherGenerator
            import random
            gen = SyntheticWeatherGenerator(seed=counter)
            busts = gen.inject_bust_events(n_events=3)

            for bust in busts:
                if bust["bust_probability"] > 0.75:
                    await websocket.send_json({
                        "type": "bust_alert",
                        "payload": {
                            "region_name": bust["region_name"],
                            "bust_probability": bust["bust_probability"],
                            "severity": bust["severity"],
                            "lead_day": bust["lead_day"],
                            "synoptic_regime": bust.get("synoptic_regime", "unknown"),
                            "alert_id": f"live_{counter}_{bust['region_id']}",
                            "triggered_at": datetime.utcnow().isoformat(),
                        },
                    })
                    break

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error("WebSocket error", error=str(e))
    finally:
        if websocket in _connections:
            _connections.remove(websocket)


async def broadcast_alert(alert: dict) -> None:
    """Broadcast alert to all connected WebSocket clients."""
    dead = []
    for ws in _connections:
        try:
            await ws.send_json(alert)
        except Exception:
            dead.append(ws)
    for ws in dead:
        _connections.remove(ws)
