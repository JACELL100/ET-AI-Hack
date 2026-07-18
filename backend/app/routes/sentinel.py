"""SENTINEL — digital arrest scam detection endpoints.

Provides the full SENTINEL API surface:
  - Text/Audio/Video analysis
  - Simulation scenarios
  - Number reputation
  - Alert dispatch (Authkey.io)
  - Citizen reporting
"""
from __future__ import annotations

import logging
from pathlib import Path

from fastapi import APIRouter, File, Path as PathParam, UploadFile, Query
from fastapi.responses import FileResponse

from app.models.schemas import (
    SentinelTextRequest,
    AuthkeyAlertRequest,
    SentinelReportRequest,
    ok,
    fail,
)
from app.services import sentinel_service
from app.services.simulation_scenarios import list_scenarios, get_scenario_by_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sentinel", tags=["sentinel"])


# ── Text Analysis ──────────────────────────────────────────────────────────

@router.post("/analyse/text")
def analyse_text(payload: SentinelTextRequest):
    """Analyse text (SMS/WhatsApp/email) for scam patterns."""
    result = sentinel_service.analyse_text(payload.text)
    return ok(result)


# ── Audio Analysis ─────────────────────────────────────────────────────────

@router.post("/analyse/audio")
async def analyse_audio(file: UploadFile = File(...)):
    """Upload an audio file for full scam analysis (STT + NLP + Voice)."""
    try:
        audio_bytes = await file.read()
        suffix = Path(file.filename or "audio.wav").suffix or ".wav"
        result = sentinel_service.analyse_audio(audio_bytes, suffix=suffix)
        return ok(result)
    except Exception as exc:
        logger.error("Audio analysis failed: %s", exc)
        return fail(f"Audio analysis failed: {str(exc)}")


# ── Number Reputation ──────────────────────────────────────────────────────

@router.get("/number/{phone}")
def number_reputation(phone: str = PathParam(...)):
    """Check phone number reputation against scam databases."""
    return ok(sentinel_service.check_number(phone))


# ── Alerts ─────────────────────────────────────────────────────────────────

@router.get("/alerts")
def sentinel_alerts():
    """List recent SENTINEL alerts."""
    return ok([a.model_dump() for a in sentinel_service.get_alerts()])


# ── Alert Dispatch (Authkey.io) ────────────────────────────────────────────

@router.post("/alert/send")
async def send_alert(payload: AuthkeyAlertRequest):
    """Send an SMS or voice call alert via Authkey.io.

    If ``message`` is provided, sends that exact message.
    If not, auto-generates a scam alert from ``threat_score`` and ``scam_type``.
    """
    result = await sentinel_service.send_alert(
        phone=payload.phone,
        message=payload.message,
        alert_type=payload.alert_type,
        threat_score=payload.threat_score,
        scam_type=payload.scam_type,
    )
    return ok(result)


# ── Simulation Scenarios ───────────────────────────────────────────────────

@router.get("/scenarios")
def get_scenarios():
    """List all available simulation scenarios."""
    return ok(list_scenarios())


@router.get("/scenarios/{scenario_id}")
def get_scenario(scenario_id: str = PathParam(...)):
    """Get a specific scenario by ID."""
    scenario = get_scenario_by_id(scenario_id)
    if not scenario:
        return fail(f"Scenario '{scenario_id}' not found")
    return ok(scenario.to_dict())


@router.get("/scenarios/{scenario_id}/audio")
def get_scenario_audio(scenario_id: str = PathParam(...)):
    """Stream the pre-recorded audio file for a scenario."""
    scenario = get_scenario_by_id(scenario_id)
    if not scenario:
        return fail(f"Scenario '{scenario_id}' not found")

    audio_path = scenario.audio_path
    if not audio_path or not audio_path.exists():
        return fail(f"Audio file not available for scenario '{scenario_id}'")

    return FileResponse(
        path=str(audio_path),
        media_type="audio/mpeg",
        filename=scenario.audio_filename,
    )


# ── Citizen Reporting ──────────────────────────────────────────────────────

@router.post("/report")
def submit_report(payload: SentinelReportRequest):
    """Submit a citizen scam report."""
    result = sentinel_service.submit_report(
        phone_number=payload.phone_number,
        description=payload.description,
        scam_type=payload.scam_type,
        evidence_text=payload.evidence_text,
    )
    return ok(result)
