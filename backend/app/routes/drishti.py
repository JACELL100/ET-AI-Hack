"""DRISHTI — geospatial crime pattern intelligence endpoints (mock)."""
from __future__ import annotations

from fastapi import APIRouter

from app.models.schemas import ok
from app.services import drishti_service

router = APIRouter(prefix="/drishti", tags=["drishti"])


@router.get("/hotspots")
def hotspots():
    return ok(drishti_service.get_hotspots())


@router.get("/heatmap")
def heatmap():
    return ok(drishti_service.get_heatmap())
