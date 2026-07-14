"""Dashboard aggregation — mock data for the prototype.

Returns unified command-centre stats and a recent-alerts feed shaped to the
frontend types (frontend/src/types/index.ts: DashboardStats, Alert).
Real implementations will aggregate across SENTINEL / NETRA / JAAL / DRISHTI.
"""
from __future__ import annotations

from app.models.schemas import Alert, DashboardStats

_ALERTS: list[Alert] = [
    Alert(
        id="al-1001",
        type="SENTINEL",
        severity="critical",
        location="Mumbai, MH",
        time="2026-07-14T09:31:00Z",
        score=94.0,
        module="SENTINEL",
    ),
    Alert(
        id="al-1002",
        type="NETRA",
        severity="high",
        location="Mumbai, MH",
        time="2026-07-14T09:18:00Z",
        score=81.0,
        module="NETRA",
    ),
    Alert(
        id="al-1003",
        type="JAAL",
        severity="medium",
        location="Pan-India",
        time="2026-07-14T08:55:00Z",
        score=66.0,
        module="JAAL",
    ),
    Alert(
        id="al-1004",
        type="DRISHTI",
        severity="low",
        location="Jharkhand",
        time="2026-07-14T08:40:00Z",
        score=42.0,
        module="DRISHTI",
    ),
]


def get_stats() -> DashboardStats:
    return DashboardStats(
        activeAlerts=len([a for a in _ALERTS if a.severity in ("critical", "high")]),
        scamsDetectedToday=127,
        counterfeitFound=34,
        citizensProtected=2410,
    )


def get_alerts(limit: int = 20) -> list[Alert]:
    return _ALERTS[:limit]
