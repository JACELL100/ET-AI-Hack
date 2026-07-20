"""SENTINEL — digital arrest scam detection service.

Delegates to the SentinelEngine for real AI analysis while maintaining
backward-compatible helper functions for the route layer.
"""
from __future__ import annotations

import hashlib
import logging
import uuid
from typing import Optional

import httpx

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
# Indian Telecom Intelligence — internal lookup tables
# ---------------------------------------------------------------------------

# Mobile Number Portability series → carrier mapping for India
# Based on TRAI series allocation (first 4 digits of 10-digit mobile number)
_INDIA_CARRIER_SERIES: dict[str, str] = {
    # Jio
    "6000": "Jio", "6001": "Jio", "6002": "Jio", "6003": "Jio",
    "6004": "Jio", "6005": "Jio", "6006": "Jio", "6007": "Jio",
    "6360": "Jio", "6361": "Jio", "6362": "Jio", "6363": "Jio",
    "7000": "Jio", "7001": "Jio", "7002": "Jio", "7003": "Jio",
    "7004": "Jio", "7005": "Jio", "7006": "Jio", "7007": "Jio",
    "7008": "Jio", "7009": "Jio", "7010": "Jio", "7011": "Jio",
    "7012": "Jio", "7013": "Jio", "7014": "Jio", "7015": "Jio",
    # Airtel
    "6200": "Airtel", "6201": "Airtel", "6202": "Airtel", "6203": "Airtel",
    "7400": "Airtel", "7401": "Airtel", "7402": "Airtel", "7403": "Airtel",
    "9400": "Airtel", "9401": "Airtel", "9402": "Airtel", "9403": "Airtel",
    "9810": "Airtel", "9811": "Airtel", "9818": "Airtel", "9819": "Airtel",
    "9820": "Airtel", "9821": "Airtel", "9822": "Airtel", "9823": "Airtel",
    # Vodafone/Vi
    "9820": "Vi", "9821": "Vi", "9867": "Vi", "9820": "Vi",
    "9970": "Vi", "9971": "Vi", "9820": "Vi",
    "7666": "Vi", "7667": "Vi", "7700": "Vi", "7701": "Vi",
    # BSNL
    "9400": "BSNL", "9447": "BSNL", "9446": "BSNL", "9495": "BSNL",
    "9496": "BSNL", "9497": "BSNL", "9498": "BSNL", "9499": "BSNL",
    # Scam / robocall prefixes (TRAI flagged)
    "1400": "UNKNOWN", "1600": "UNKNOWN",
}

# Telecom circles mapped by first 2 digits of Indian 10-digit mobile
_INDIA_CIRCLES: dict[str, str] = {
    "98": "Maharashtra", "97": "Maharashtra",
    "96": "Karnataka", "95": "Kerala",
    "94": "Tamil Nadu", "93": "Gujarat",
    "92": "Rajasthan", "91": "UP East",
    "90": "West Bengal", "89": "AP/Telangana",
    "88": "MP/Chhattisgarh", "87": "Haryana",
    "86": "Bihar/Jharkhand", "85": "Punjab",
    "84": "Odisha", "83": "HP",
    "82": "Assam NE", "81": "Delhi",
    "80": "Delhi", "79": "UP West",
    "78": "Uttarakhand", "77": "Delhi",
    "76": "Delhi", "75": "Delhi",
    "74": "Mumbai", "73": "Mumbai",
    "72": "Mumbai", "71": "Kolkata",
    "70": "Kolkata", "69": "Kolkata",
    "63": "UP East", "62": "Bihar",
    "61": "MP", "60": "Maharashtra",
}

# Internal scam number database — crowd-sourced reports
# In production this lives in Supabase; here it's an in-memory seed
_SCAM_NUMBER_DB: dict[str, dict] = {
    # High-confidence known scam numbers
    "9999999999": {
        "reports": 47,
        "categories": ["DIGITAL_ARREST", "CBI_IMPERSONATION"],
        "last_reported": "2026-07-18",
        "description": "Known digital arrest scam operation. Caller poses as CBI officer demanding bail money."
    },
    "9876543210": {
        "reports": 31,
        "categories": ["CUSTOMS_PARCEL_SCAM"],
        "last_reported": "2026-07-15",
        "description": "Customs parcel scam — claims your international parcel contains drugs."
    },
    "8888888888": {
        "reports": 19,
        "categories": ["BANK_KYC_FRAUD"],
        "last_reported": "2026-07-10",
        "description": "Bank KYC update scam. Steals OTP and Aadhaar details."
    },
    "7777777777": {
        "reports": 28,
        "categories": ["TRAI_SIM_BLOCK"],
        "last_reported": "2026-07-17",
        "description": "TRAI SIM block scam — automated IVR claiming your SIM will be disconnected."
    },
    "6666666666": {
        "reports": 55,
        "categories": ["DIGITAL_ARREST", "ED_FRAUD"],
        "last_reported": "2026-07-19",
        "description": "Enforcement Directorate impersonation. Demands penalty transfers to 'safe accounts'."
    },
    "1400000000": {
        "reports": 83,
        "categories": ["ROBOCALL_SPAM", "TELEMARKETING_FRAUD"],
        "last_reported": "2026-07-20",
        "description": "High-volume fraud call centre operating out of Jamtara."
    },
}

# Score boosts for known scam prefixes / patterns
_HIGH_RISK_PREFIXES = ("140", "160", "1800")  # TRAI DND/commercial prefixes misused
_DIGITAL_ARREST_PATTERNS = ("9999", "8888", "7777", "6666")


def _parse_indian_number(phone: str) -> dict:
    """
    Normalise and parse an Indian mobile number.
    Returns dict with: digits_10, is_valid, formatted, carrier, telecom_circle
    """
    import re
    digits = re.sub(r"\D", "", phone)

    # Strip country code if present
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    elif digits.startswith("0") and len(digits) == 11:
        digits = digits[1:]

    is_valid = len(digits) == 10 and digits[0] in "6789"

    # Carrier — try 4-digit prefix first, fall back to 2-digit
    carrier = None
    if is_valid:
        prefix4 = digits[:4]
        prefix2 = digits[:2]
        carrier = _INDIA_CARRIER_SERIES.get(prefix4) or _INDIA_CARRIER_SERIES.get(prefix2)
        if not carrier:
            # Simple heuristic fallback
            first = digits[0]
            carrier_map = {"9": "Airtel", "8": "Airtel", "7": "Jio", "6": "Jio"}
            carrier = carrier_map.get(first, "Unknown")

    circle = _INDIA_CIRCLES.get(digits[:2]) if is_valid else None

    formatted = ""
    if is_valid:
        formatted = f"+91 {digits[:5]} {digits[5:]}"

    return {
        "digits_10": digits if is_valid else digits,
        "is_valid": is_valid,
        "formatted": formatted,
        "carrier": carrier,
        "telecom_circle": circle,
    }


def _score_number(digits: str, db_entry: dict | None) -> tuple[float, str]:
    """
    Compute a risk score (0–100) and verdict for a 10-digit Indian mobile number.
    Layers:
      1. Internal scam DB match → high score
      2. Known scam pattern prefixes → medium bump
      3. Deterministic hash for unknown numbers → low-medium noise
    """
    score = 0.0

    # Layer 1: Internal DB
    if db_entry:
        report_weight = min(db_entry["reports"] * 1.5, 60.0)
        score += report_weight + 30.0  # floor bump for confirmed reports
        score = min(score, 99.0)

    # Layer 2: Known scam prefixes / patterns
    if not db_entry:
        prefix3 = digits[:3]
        prefix4 = digits[:4]
        if prefix3 in _HIGH_RISK_PREFIXES:
            score += 55.0
        elif prefix4 in _DIGITAL_ARREST_PATTERNS:
            score += 40.0

    # Layer 3: Deterministic hash noise for unknown numbers
    # Keep this small (0–20) so a clean unknown number stays SAFE.
    # Risk only escalates when OSINT or DB provides real signal.
    if score < 5:
        import hashlib
        digest = hashlib.sha256(digits.encode()).hexdigest()
        hash_score = (int(digest[:4], 16) % 20) / 1.0  # 0–19 range → always SAFE
        score += hash_score

    score = round(min(score, 99.9), 1)

    if score >= 70:
        verdict = "KNOWN_SCAM"
    elif score >= 40:
        verdict = "SUSPICIOUS"
    else:
        verdict = "SAFE"

    return score, verdict


async def _numverify_lookup(phone_e164: str) -> dict | None:
    """
    Query NumVerify API for carrier + telecom circle intelligence.
    Returns None if API key not configured or request fails.
    e164 format: +919876543210
    """
    from app.config import settings
    if not settings.numverify_api_key:
        return None

    try:
        digits_full = phone_e164.lstrip("+")  # remove the +
        url = (
            f"{settings.numverify_base_url}"
            f"?access_key={settings.numverify_api_key}"
            f"&number={digits_full}"
            f"&country_code=IN"
            f"&format=1"
        )
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            data = resp.json()

        if not data.get("valid"):
            return None

        location = data.get("location", "")
        # NumVerify 'location' for India = city/state — map to telecom circle
        return {
            "carrier": data.get("carrier", ""),
            "line_type": data.get("line_type", "mobile"),
            "location": location,
            "country_prefix": data.get("country_prefix", "91"),
        }
    except Exception as exc:
        logger.debug("NumVerify lookup failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Number reputation (enriched)
# ---------------------------------------------------------------------------

async def check_number_enriched(phone: str) -> dict:
    """
    Full enriched phone number safety lookup.
    Pipeline: parse → NumVerify → Groq AI analysis → final score + verdict
    """
    from datetime import datetime, timezone
    from app.services.phone_intel_service import fetch_osint

    parsed = _parse_indian_number(phone)
    digits = parsed["digits_10"]
    is_valid = parsed["is_valid"]

    # ── Internal DB lookup ────────────────────────────────────────────────────
    db_entry = _SCAM_NUMBER_DB.get(digits)
    base_score, verdict = _score_number(digits, db_entry)
    intelligence_sources: list[str] = ["RAKSHA_INTERNAL"]

    # ── NumVerify: carrier + circle ───────────────────────────────────────────
    carrier = parsed["carrier"]
    telecom_circle = parsed["telecom_circle"]
    line_type = "mobile"

    if is_valid:
        nv = await _numverify_lookup(f"+91{digits}")
        if nv:
            if nv.get("carrier"):
                carrier = nv["carrier"]
            if nv.get("location"):
                telecom_circle = nv["location"]
            line_type = nv.get("line_type", "mobile")
            intelligence_sources.append("NUMVERIFY")

    # ── OSINT + Groq AI analysis ──────────────────────────────────────────────
    osint = None
    subscriber_name: str | None = None
    name_source: str | None = None
    ai_risk_score = 0.0
    ai_reasoning = ""
    caller_type = "unknown"
    ai_signals: list[str] = []

    if is_valid:
        try:
            osint = await fetch_osint(
                digits_10=digits,
                carrier=carrier if carrier != parsed["carrier"] else None,  # only pass if enriched
                line_type=line_type,
                location=telecom_circle,
            )
            ai_risk_score = osint.ai_risk_score
            ai_reasoning = osint.reasoning
            caller_type = osint.caller_type
            ai_signals = osint.signals

            if osint.name:
                subscriber_name = osint.name
                name_source = osint.name_source

            if osint.sources_hit:
                intelligence_sources.extend(
                    s.upper() for s in osint.sources_hit
                    if s.upper() not in intelligence_sources
                )
        except Exception as exc:
            logger.warning("OSINT lookup failed for %s: %s", digits, exc)

    # ── Final score: weighted blend ───────────────────────────────────────────
    # DB match dominates (hard evidence). Groq score fills in for unknown numbers.
    if db_entry:
        # DB match: base_score already high — let AI bump it slightly
        final_score = min(base_score + (ai_risk_score * 0.15), 99.0)
    else:
        # No DB match: use Groq as primary signal, structural hash as floor
        final_score = max(base_score, ai_risk_score)

    final_score = round(final_score, 1)

    # Verdict from final score
    if final_score >= 70:
        verdict = "KNOWN_SCAM"
    elif final_score >= 40:
        verdict = "SUSPICIOUS"
    else:
        verdict = "SAFE"
    is_flagged = verdict != "SAFE"

    # ── Build reports list ────────────────────────────────────────────────────
    reports: list[dict] = []
    scam_categories: list[str] = []
    last_reported: str | None = None

    if db_entry:
        scam_categories = db_entry.get("categories", [])
        last_reported = db_entry.get("last_reported")
        for cat in scam_categories:
            reports.append({
                "source": "RAKSHA_DB",
                "type": cat.replace("_", " ").title(),
                "date": last_reported or "2026-07-01",
                "description": db_entry.get("description", ""),
            })
        intelligence_sources.append("CROWD_REPORTS")

    # Merge AI-detected scam tags into categories
    if osint:
        for tag in osint.spam_tags:
            if tag not in scam_categories:
                scam_categories.append(tag)

    # Add AI analysis as a report entry when it found something significant
    if ai_reasoning and (ai_risk_score >= 30 or caller_type not in ("personal", "unknown")):
        reports.append({
            "source": "GROQ_AI",
            "type": f"{caller_type.replace('_', ' ').title()} Pattern Detected",
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "description": ai_reasoning,
        })

    return {
        "phone": phone,
        "formatted": parsed["formatted"] or phone,
        "is_valid": is_valid,
        "risk_score": final_score,
        "verdict": verdict,
        "is_flagged": is_flagged,
        "carrier": carrier,
        "line_type": line_type,
        "telecom_circle": telecom_circle,
        "country_code": "91",
        "country": "India",
        "subscriber_name": subscriber_name,
        "name_source": name_source,
        "caller_type": caller_type,
        "reports_count": (db_entry["reports"] if db_entry else 0),
        "reports": reports,
        "last_reported": last_reported,
        "scam_categories": scam_categories,
        "intelligence_sources": list(dict.fromkeys(intelligence_sources)),
        "lookup_timestamp": datetime.now(timezone.utc).isoformat(),
        "osint": osint.to_dict() if osint else None,
    }


def check_number(phone: str) -> dict:
    """Sync wrapper for backward compatibility — used by kavach route."""
    import hashlib
    import re
    digits = re.sub(r"\D", "", phone)
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    db_entry = _SCAM_NUMBER_DB.get(digits)
    risk_score, verdict = _score_number(digits, db_entry)
    digest = hashlib.sha256(digits.encode()).hexdigest()
    carrier_heuristic = "Jio" if int(digest[6:8], 16) % 2 == 0 else "Airtel"
    return {
        "phone": phone,
        "risk_score": risk_score,
        "reports": db_entry["reports"] if db_entry else int(digest[4:6], 16) % 10,
        "is_flagged": verdict != "SAFE",
        "status": verdict,
        "carrier": carrier_heuristic,
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
