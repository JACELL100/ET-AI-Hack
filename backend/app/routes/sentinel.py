"""SENTINEL — digital arrest scam detection endpoints (mock)."""
from __future__ import annotations

from fastapi import APIRouter, Path

from app.models.schemas import SentinelTextRequest, ok
from app.services import sentinel_service

router = APIRouter(prefix="/sentinel", tags=["sentinel"])


@router.post("/analyse/text")
def analyse_text(payload: SentinelTextRequest):
    return ok(sentinel_service.analyse_text(payload.text))


@router.get("/number/{phone}")
def number_reputation(phone: str = Path(...)):
    return ok(sentinel_service.check_number(phone))


@router.get("/alerts")
def sentinel_alerts():
    return ok([a.model_dump() for a in sentinel_service.get_alerts()])
