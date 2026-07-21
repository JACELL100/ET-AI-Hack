"""DRISHTI — Geospatial Crime Pattern Intelligence endpoints.

All endpoints return the standard { success, data, error, meta } envelope.

Endpoints:
    GET  /api/v1/drishti/stats
    GET  /api/v1/drishti/hotspots
    GET  /api/v1/drishti/heatmap
    GET  /api/v1/drishti/incidents
    GET  /api/v1/drishti/predictions/{timeframe}
    GET  /api/v1/drishti/patrol-routes
    GET  /api/v1/drishti/districts
"""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Query

from app.models.schemas import AgencyFeedIncidentRequest, ok, CitizenReportRequest
from app.services import drishti_service, jaal_service
from app.services import agency_feed_service
from app.websockets.manager import manager

router = APIRouter(prefix="/drishti", tags=["drishti"])


@router.post("/feeds/agency")
def ingest_agency_feed(
    payload: AgencyFeedIncidentRequest,
    background_tasks: BackgroundTasks,
    x_raksha_timestamp: str | None = Header(default=None),
    x_raksha_signature: str | None = Header(default=None),
):
    """Ingest a signed NCRP/NCRB/state/bank incident and fan it into operations."""
    raw = payload.model_dump(mode="json")
    try:
        trust = agency_feed_service.verify_delivery(raw, x_raksha_timestamp, x_raksha_signature)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    stored = agency_feed_service.ingest(raw, trust=trust)
    if stored["duplicate"]:
        return ok({"feed": stored, "incident": None, "jaal": None})
    incident = drishti_service.ingest_intelligence_incident({
        "eventId": f"{payload.source}:{payload.externalId}", "type": payload.type, "severity": payload.severity,
        "district": payload.district, "state": payload.state, "lat": payload.latitude, "lng": payload.longitude,
        "timestamp": payload.occurredAt, "description": payload.description, "evidenceRef": stored["evidenceId"],
        "sourceModule": payload.source,
    })
    jaal_result = None
    if payload.indicators:
        jaal_result = jaal_service.ingest_module_signal(
            f"{payload.source}_FEED", payload.indicators[0],
            f"Authorised {payload.source} feed event {payload.externalId}: {payload.description}",
            entity_type="phone" if payload.type == "scam" else "account", risk_score={"critical": .95, "high": .8, "medium": .6, "low": .4}[payload.severity],
        )
    background_tasks.add_task(
        manager.broadcast,
        {"event": "agency_feed", "module": "drishti", "payload": {"feed": stored, "incident": incident, "trust": trust}},
        "ws:drishti",
    )
    if jaal_result:
        background_tasks.add_task(
            manager.broadcast,
            {"event": "agency_feed", "module": "jaal", "payload": jaal_result},
            "ws:jaal",
        )
    return ok({"feed": stored, "incident": incident, "jaal": jaal_result, "trust": trust})


@router.get("/feeds/status")
def agency_feed_status():
    return ok(agency_feed_service.status())


@router.get("/feeds/recent")
def recent_agency_feeds(limit: Annotated[int, Query(ge=1, le=100)] = 50):
    return ok(agency_feed_service.recent(limit))


@router.get("/stats")
def stats():
    """Live KPI numbers for the command centre header strip."""
    return ok(drishti_service.get_stats())


@router.get("/hotspots")
def hotspots(type: Annotated[Optional[str], Query()] = None):
    """
    Detailed hotspot profiles.

    Query params:
        type — filter by crime type: scam | counterfeit | upi | network | all
    """
    return ok(drishti_service.get_hotspots_detailed(type_filter=type))


@router.get("/heatmap")
def heatmap():
    """
    Raw heatmap points — one entry per incident.
    Each point: { lat, lng, weight, type, severity }
    """
    return ok(drishti_service.get_heatmap())


@router.get("/incidents")
def incidents(
    severity: Annotated[Optional[str], Query()] = None,
    type: Annotated[Optional[str], Query()] = None,
    hours: Annotated[int, Query(ge=1, le=168)] = 24,
):
    """
    Filtered incident list.

    Query params:
        severity — critical | high | medium | low
        type     — scam | counterfeit | upi | network
        hours    — lookback window (1–168, default 24)
    """
    data = drishti_service.get_incidents(
        severity=severity, type_filter=type, hours=hours
    )
    return ok(data, meta={"count": len(data), "hours": hours})


@router.get("/live")
def live_incidents(limit: Annotated[int, Query(ge=1, le=100)] = 50):
    """Authorised live intelligence feed; excludes demo/random incidents."""
    return ok(drishti_service.get_live_incidents(limit=limit))


@router.get("/predictions/{timeframe}")
def predictions(timeframe: str):
    """
    Predicted risk zones for a given time window.

    Path param:
        timeframe — 24h | 48h | 72h
    """
    tf = timeframe if timeframe in ("24h", "48h", "72h") else "24h"
    return ok(drishti_service.get_predictions(tf), meta={"timeframe": tf})


@router.get("/patrol-routes")
def patrol_routes():
    """Optimised patrol routes with waypoints and unit assignments."""
    return ok(drishti_service.get_patrol_routes())


@router.get("/districts")
def districts():
    """District-level comparison statistics for the bottom table."""
    return ok(drishti_service.get_district_stats())


@router.post("/report")
def submit_report(req: CitizenReportRequest):
    """
    Citizen-submitted crime report.

    Accepts a report, resolves coordinates for the district if lat/lng are
    not supplied, and injects the incident into the live feed.
    """
    data = drishti_service.submit_citizen_report(req.model_dump())
    return ok(data, meta={"message": "Report received. Thank you for contributing to DRISHTI."})


@router.get("/citizen-reports")
def citizen_reports(limit: Annotated[int, Query(ge=1, le=100)] = 50):
    """Recent citizen-submitted reports (most recent first)."""
    return ok(drishti_service.get_citizen_reports(limit=limit))
