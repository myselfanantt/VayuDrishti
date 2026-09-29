"""Alerts API endpoints."""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
import uuid
import structlog

logger = structlog.get_logger(__name__)
router = APIRouter()

_subscriptions: List[dict] = []

# In-memory storage for addendum alert rules, active alerts, and history
_rules: List[dict] = [
    {
        "rule_id": "rule_1",
        "region_id": "all_india",
        "region_name": "All India",
        "threshold": 80.0,
        "lead_day_max": 3,
        "severity": "CRITICAL",
        "notify_channels": ["dashboard", "email"],
        "created_at": "2026-09-20T10:00:00Z",
    },
    {
        "rule_id": "rule_2",
        "region_id": "bob_coast",
        "region_name": "BoB Coast",
        "threshold": 60.0,
        "lead_day_max": 5,
        "severity": "HIGH",
        "notify_channels": ["dashboard"],
        "created_at": "2026-09-22T14:30:00Z",
    },
]

_active_alerts: List[dict] = [
    {
        "alert_id": "alert_101",
        "region": "Odisha Coast",
        "bust_probability": 0.84,
        "lead_day": 4,
        "severity": "CRITICAL",
        "issued_at": "14 mins ago",
        "bust_id": "odisha_20260928_d4",
        "acknowledged": False,
    },
    {
        "alert_id": "alert_102",
        "region": "Uttarakhand",
        "bust_probability": 0.71,
        "lead_day": 3,
        "severity": "HIGH",
        "issued_at": "1h 2m ago",
        "bust_id": "uttarakhand_20260927_d3",
        "acknowledged": False,
    },
    {
        "alert_id": "alert_103",
        "region": "Kerala Coast",
        "bust_probability": 0.58,
        "lead_day": 6,
        "severity": "MODERATE",
        "issued_at": "3h 14m ago",
        "bust_id": "kerala_20260926_d6",
        "acknowledged": False,
    },
]


class AlertSubscribeRequest(BaseModel):
    region_id: str
    threshold: float = Field(default=0.7, ge=0.0, le=1.0)
    email: Optional[str] = None
    webhook_url: Optional[str] = None


class NewAlertRuleRequest(BaseModel):
    region_id: str
    threshold: float
    lead_day_max: int
    notify_channels: List[str]


@router.post("/")
async def create_alert_subscription(request: AlertSubscribeRequest):
    """Subscribe to bust alerts for a region."""
    sub = {
        "id": str(uuid.uuid4()),
        "region_id": request.region_id,
        "threshold": request.threshold,
        "email": request.email,
        "webhook_url": request.webhook_url,
        "is_active": True,
        "trigger_count": 0,
        "created_at": datetime.utcnow().isoformat(),
    }
    _subscriptions.append(sub)
    return {"message": "Alert subscription created", "subscription": sub}


@router.get("/")
async def list_alert_subscriptions():
    """List all alert subscriptions."""
    return {"subscriptions": _subscriptions, "total": len(_subscriptions)}


@router.get("/live")
async def get_live_alerts():
    """Get recent live alerts."""
    from app.utils.synthetic_data import SyntheticWeatherGenerator
    gen = SyntheticWeatherGenerator(seed=int(datetime.utcnow().hour))
    busts = gen.inject_bust_events(n_events=10)
    alerts = [
        {
            "type": "bust_alert",
            "alert_id": str(uuid.uuid4()),
            "region_name": b["region_name"],
            "region_id": b["region_id"],
            "bust_probability": b["bust_probability"],
            "severity": b["severity"],
            "lead_day": b["lead_day"],
            "triggered_at": datetime.utcnow().isoformat(),
        }
        for b in busts if b["bust_probability"] > 0.7
    ]
    return {"alerts": alerts, "total": len(alerts)}


# ── Addendum Endpoints for Alert Management ──────────────────────────────────

@router.get("/active")
async def get_active_alerts():
    """Get active unacknowledged alerts."""
    unack = [a for a in _active_alerts if not a.get("acknowledged", False)]
    return {"alerts": unack}


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    """Acknowledge an active alert."""
    for a in _active_alerts:
        if a["alert_id"] == alert_id:
            a["acknowledged"] = True
            return {"success": True}
    return {"success": True}


@router.get("/rules")
async def get_alert_rules():
    """List configured alert rules."""
    return {"rules": _rules}


@router.post("/rules")
async def create_alert_rule(body: NewAlertRuleRequest):
    """Create a new alert rule."""
    region_names = {
        "all_india": "All India",
        "odisha_coast": "Odisha Coast",
        "kerala": "Kerala Coast",
        "uttarakhand": "Uttarakhand",
        "rajasthan": "Rajasthan Desert",
        "bob_coast": "BoB Coast",
    }
    sev = "CRITICAL" if body.threshold >= 80 else "HIGH" if body.threshold >= 60 else "MODERATE"
    rule = {
        "rule_id": f"rule_{uuid.uuid4().hex[:6]}",
        "region_id": body.region_id,
        "region_name": region_names.get(body.region_id, body.region_id.title()),
        "threshold": body.threshold,
        "lead_day_max": body.lead_day_max,
        "severity": sev,
        "notify_channels": body.notify_channels,
        "created_at": datetime.utcnow().isoformat(),
    }
    _rules.append(rule)
    return rule


@router.put("/rules/{rule_id}")
async def update_alert_rule(rule_id: str, body: NewAlertRuleRequest):
    """Update an existing alert rule."""
    for r in _rules:
        if r["rule_id"] == rule_id:
            r["threshold"] = body.threshold
            r["lead_day_max"] = body.lead_day_max
            r["notify_channels"] = body.notify_channels
            return r
    raise HTTPException(status_code=404, detail="Rule not found")


@router.delete("/rules/{rule_id}")
async def delete_alert_rule(rule_id: str):
    """Delete an alert rule."""
    global _rules
    _rules = [r for r in _rules if r["rule_id"] != rule_id]
    return {"success": True}


@router.get("/history")
async def get_alert_history(region: Optional[str] = None, severity: Optional[str] = None):
    """Get alert history for the last 30 days."""
    sample_history = [
        {"alert_id": "hist_1", "date": "2026-09-28", "region": "Odisha", "bust_probability": 0.84, "severity": "CRITICAL", "outcome": "bust_confirmed"},
        {"alert_id": "hist_2", "date": "2026-09-27", "region": "Kerala", "bust_probability": 0.67, "severity": "HIGH", "outcome": "bust_confirmed"},
        {"alert_id": "hist_3", "date": "2026-09-26", "region": "Rajasthan", "bust_probability": 0.71, "severity": "HIGH", "outcome": "false_alarm"},
        {"alert_id": "hist_4", "date": "2026-09-25", "region": "Uttarakhand", "bust_probability": 0.82, "severity": "CRITICAL", "outcome": "bust_confirmed"},
        {"alert_id": "hist_5", "date": "2026-09-24", "region": "Odisha", "bust_probability": 0.62, "severity": "MODERATE", "outcome": "bust_confirmed"},
        {"alert_id": "hist_6", "date": "2026-09-23", "region": "Kerala", "bust_probability": 0.58, "severity": "MODERATE", "outcome": "false_alarm"},
    ]

    filtered = sample_history
    if region:
        filtered = [h for h in filtered if region.lower() in h["region"].lower()]
    if severity:
        filtered = [h for h in filtered if h["severity"].upper() == severity.upper()]

    return {"history": filtered, "total": len(filtered)}


@router.get("/stats/volume")
async def get_alert_volume_stats():
    """Get 30-day alert volume stats by severity."""
    now = datetime.utcnow()
    res = []
    for i in range(14, -1, -1):
        dt_str = (now - timedelta(days=i*2)).strftime("%b %d")
        res.append({
            "date": dt_str,
            "critical": (i * 3 + 2) % 5 + 1,
            "high": (i * 2 + 1) % 6 + 2,
            "moderate": (i * 4 + 3) % 7 + 2,
        })
    return res


@router.get("/stats/accuracy")
async def get_alert_accuracy_stats():
    """Get alert verification accuracy stats."""
    return {
        "verified": 74,
        "false_alarm": 18,
        "missed": 8,
    }
