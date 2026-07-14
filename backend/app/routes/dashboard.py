"""Unified command-centre dashboard endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Query

from app.models.schemas import ok
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def dashboard_stats():
    return ok(dashboard_service.get_stats().model_dump())


@router.get("/alerts")
def dashboard_alerts(limit: int = Query(20, ge=1, le=100)):
    return ok([a.model_dump() for a in dashboard_service.get_alerts(limit)])
