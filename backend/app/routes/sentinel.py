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
import re

from fastapi import APIRouter, BackgroundTasks, File, Header, HTTPException, Path as PathParam, UploadFile, Query
from fastapi.responses import FileResponse

from app.models.schemas import (
    SentinelTextRequest,
    SentinelLiveSignalRequest,
    SentinelEvaluationRequest,
    AuthkeyAlertRequest,
    SentinelReportRequest,
    ok,
    fail,
)
from app.services import jaal_service, sentinel_service
from app.services.evidence_ledger import get_evidence, public_key_bundle, verify_ledger
from app.services.evaluation_service import evaluate_text_samples
from app.services.sentinel_intelligence import ingest_live_signal, integration_status, integration_trust
from app.services.simulation_scenarios import list_scenarios, get_scenario_by_id
from app.websockets.manager import manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sentinel", tags=["sentinel"])


# ── Text Analysis ──────────────────────────────────────────────────────────

@router.post("/analyse/text")
def analyse_text(payload: SentinelTextRequest):
    """Analyse text (SMS/WhatsApp/email) for scam patterns."""
    result = sentinel_service.analyse_text(payload.text)
    score = float(result.get("threat_score", result.get("risk_score", 0)))
    # SENTINEL's operational score is 0–100; JAAL stores risk as 0–1.
    if score >= 70:
        phone = re.search(r"(?:\+91[-\s]?)?[6-9]\d{9}", payload.text)
        fingerprint = phone.group(0) if phone else f"SENTINEL-{abs(hash(payload.text)) % 10**10:010d}"
        jaal_service.ingest_module_signal(
            "SENTINEL", fingerprint,
            "High-confidence scam content detected by SENTINEL.",
            entity_type="phone" if phone else "website", risk_score=score / 100,
        )
    return ok(result)


# ── Signed partner intelligence ingestion ──────────────────────────────────

@router.post("/ingest/live")
def ingest_live(
    payload: SentinelLiveSignalRequest,
    background_tasks: BackgroundTasks,
    x_raksha_timestamp: str | None = Header(default=None),
    x_raksha_signature: str | None = Header(default=None),
):
    """Ingest an authorised telecom/video/payment signal in real time.

    Partners send normalised metadata only and sign the request with
    ``HMAC-SHA256(timestamp + '.' + canonical-json)``.  A local unsigned demo
    remains visibly labelled as such; production can require the signature.
    """
    try:
        trust = integration_trust(payload.model_dump(mode="json"), x_raksha_timestamp, x_raksha_signature)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    result = ingest_live_signal(payload, trust=trust)
    # Keep API latency predictable while active command-centre sessions receive
    # the same event on their existing module-specific WebSocket subscriptions.
    background_tasks.add_task(manager.broadcast, {"event": "live_intelligence", "module": "sentinel", "payload": result}, "ws:sentinel")
    background_tasks.add_task(manager.broadcast, {"event": "live_intelligence", "module": "drishti", "payload": result}, "ws:drishti")
    background_tasks.add_task(manager.broadcast, {"event": "live_intelligence", "module": "jaal", "payload": result}, "ws:jaal")
    return ok(result)


@router.get("/integrations/status")
def live_integration_status():
    """Expose integration readiness and evidence-ledger health to operators."""
    return ok(integration_status())


@router.get("/evidence/verify")
def verify_evidence_ledger():
    """Verify the local evidence hash chain without returning sensitive data."""
    return ok(verify_ledger())


@router.get("/evidence/public-key")
def evidence_public_key():
    """Public Ed25519 verifier key for independent integrity checks."""
    return ok(public_key_bundle())


@router.get("/evidence/{record_id}")
def get_evidence_record(record_id: str):
    """Export one privacy-minimised, signed record for offline verification."""
    record = get_evidence(record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Evidence record not found")
    return ok(record)


@router.post("/evaluate")
def evaluate_detection(payload: SentinelEvaluationRequest):
    """Run a reproducible precision/recall/FPR evaluation on labelled hold-out text."""
    return ok(evaluate_text_samples(
        [sample.model_dump() for sample in payload.samples], sentinel_service.analyse_text, payload.scamThreshold,
    ))


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
async def number_reputation(phone: str = PathParam(...)):
    """
    Enriched phone number safety lookup.

    Returns carrier, telecom circle, threat intelligence, and crowd-sourced
    scam reports for a given Indian mobile number.

    The ``phone`` path parameter accepts:
    - Raw 10-digit number:  9876543210
    - With country code:    919876543210  or  +919876543210
    - Formatted:            +91-98765-43210
    """
    try:
        result = await sentinel_service.check_number_enriched(phone)
        return ok(result)
    except Exception as exc:
        logger.error("Number lookup failed: %s", exc)
        # Fall back to the lightweight sync check so the endpoint always responds
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
