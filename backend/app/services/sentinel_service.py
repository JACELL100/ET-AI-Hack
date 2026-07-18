"""SENTINEL — digital arrest scam detection service.

Delegates to the SentinelEngine for real AI analysis while maintaining
backward-compatible helper functions for the route layer.
"""
from __future__ import annotations

import hashlib
import logging
import uuid
from typing import Optional

from app.config import settings
from app.models.schemas import Alert
from app.services.sentinel_engine import AnalysisResult, get_engine
from app.services.authkey_service import AuthkeyService, get_authkey_service

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Recent alerts (seeded for demo — in production these come from Supabase)
# ---------------------------------------------------------------------------

_RECENT_ALERTS: list[Alert] = [
    Alert(
        id="al-2001",
        type="SENTINEL",
        severity="critical",
        location="Mumbai, MH",
        time="2026-07-14T09:31:00Z",
        score=94.0,
        module="SENTINEL",
    ),
    Alert(
        id="al-2002",
        type="SENTINEL",
        severity="high",
        location="Delhi",
        time="2026-07-14T07:12:00Z",
        score=78.0,
        module="SENTINEL",
    ),
    Alert(
        id="al-2003",
        type="SENTINEL",
        severity="high",
        location="Bangalore, KA",
        time="2026-07-13T14:45:00Z",
        score=81.0,
        module="SENTINEL",
    ),
]


# ---------------------------------------------------------------------------
# Engine accessor
# ---------------------------------------------------------------------------

def _get_engine():
    return get_engine(
        whisper_model=settings.sentinel_whisper_model,
        whisper_device=settings.sentinel_whisper_device,
    )


# ---------------------------------------------------------------------------
# Text analysis
# ---------------------------------------------------------------------------

def analyse_text(text: str) -> dict:
    """Analyse text for scam patterns using the full engine."""
    engine = _get_engine()
    result: AnalysisResult = engine.analyse_text(text)
    return result.to_dict()


# ---------------------------------------------------------------------------
# Audio analysis
# ---------------------------------------------------------------------------

def analyse_audio(audio_bytes: bytes, suffix: str = ".wav") -> dict:
    """Full audio analysis: STT → Classification → Voice → Scoring."""
    engine = _get_engine()
    result: AnalysisResult = engine.analyse_audio(audio_bytes, suffix=suffix)
    return result.to_dict()


# ---------------------------------------------------------------------------
# Number reputation
# ---------------------------------------------------------------------------

def check_number(phone: str) -> dict:
    """Check phone number reputation (mock — in production queries Supabase + SERP)."""
    digest = hashlib.sha256(phone.encode()).hexdigest()
    risk_score = round((int(digest[:4], 16) % 100) / 1.0, 1)
    reports = int(digest[4:6], 16) % 50
    # Deterministic flagging for demo
    is_flagged = risk_score > 65
    return {
        "phone": phone,
        "risk_score": risk_score,
        "reports": reports,
        "is_flagged": is_flagged,
        "status": "KNOWN_SCAM" if is_flagged else "UNKNOWN",
        "carrier": "Jio" if int(digest[6:8], 16) % 2 == 0 else "Airtel",
    }


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------

def get_alerts() -> list[Alert]:
    return _RECENT_ALERTS


def add_alert(alert: Alert) -> None:
    _RECENT_ALERTS.insert(0, alert)
    # Keep last 50
    while len(_RECENT_ALERTS) > 50:
        _RECENT_ALERTS.pop()


# ---------------------------------------------------------------------------
# Authkey alert dispatch
# ---------------------------------------------------------------------------

async def send_alert(
    phone: str,
    message: Optional[str] = None,
    alert_type: str = "sms",
    threat_score: Optional[float] = None,
    scam_type: Optional[str] = None,
) -> dict:
    """Send an alert via Authkey.io SMS/Voice."""
    service = get_authkey_service(
        api_key=settings.authkey_api_key,
        sender_id=settings.authkey_sender_id,
    )

    if message:
        # Custom message
        if alert_type == "sms":
            result = await service.send_sms(phone, message)
        elif alert_type == "voice":
            result = await service.send_voice_alert(phone, message)
        else:
            result = await service.send_combined_alert(phone, message, message)
    else:
        # Auto-formatted scam alert
        result = await service.send_scam_alert(
            phone=phone,
            threat_score=threat_score or 85.0,
            scam_type=scam_type,
            channel=alert_type,
        )

    # Record as an alert
    if result.success:
        add_alert(Alert(
            id=f"al-{uuid.uuid4().hex[:6]}",
            type="SENTINEL",
            severity="critical" if (threat_score or 0) >= 80 else "high",
            location="Alert Sent",
            time=str(result.timestamp),
            score=threat_score or 0,
            module="SENTINEL",
        ))

    return result.to_dict()


# ---------------------------------------------------------------------------
# Citizen report
# ---------------------------------------------------------------------------

def submit_report(
    phone_number: Optional[str] = None,
    description: str = "",
    scam_type: Optional[str] = None,
    evidence_text: Optional[str] = None,
) -> dict:
    """Submit a citizen scam report."""
    report_id = f"rpt-{uuid.uuid4().hex[:8]}"

    # If evidence text provided, run analysis
    analysis = None
    if evidence_text:
        analysis = analyse_text(evidence_text)

    # In production, this would be stored in Supabase
    return {
        "report_id": report_id,
        "status": "received",
        "phone_number": phone_number,
        "scam_type": scam_type,
        "description": description,
        "analysis": analysis,
        "message": "Report received. Our team will investigate within 24 hours.",
    }
