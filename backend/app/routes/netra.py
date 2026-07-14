"""NETRA — counterfeit currency identification endpoints (mock)."""
from __future__ import annotations

from fastapi import APIRouter

from app.models.schemas import ok
from app.services import netra_service

router = APIRouter(prefix="/netra", tags=["netra"])


@router.get("/scan")
def scan(seed: str = "note"):
    return ok(netra_service.scan_image(seed))


@router.get("/stats")
def netra_stats():
    return ok(netra_service.get_stats())
