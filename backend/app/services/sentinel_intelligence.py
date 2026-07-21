"""Real-time, multi-source SENTINEL intelligence fusion.

The service accepts *authorised* telecom/video/payment webhook events and
combines their independently explainable risk signals with the existing scam
language classifier.  It does not try to infer identity from a phone number or
claim a carrier connection: partners must supply signed events using the
documented contract.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import math
import re
from datetime import datetime, timezone
from typing import Any

from app.config import settings
from app.models.schemas import Alert, SentinelLiveSignalRequest
from app.services import drishti_service, jaal_service, sentinel_service
from app.services.evidence_ledger import append_evidence, verify_ledger


def _canonical(payload: dict[str, Any]) -> str:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)


def expected_signature(payload: dict[str, Any], timestamp: str) -> str:
    """Return the HMAC expected in ``X-Raksha-Signature`` for partner tests."""
    message = f"{timestamp}.{_canonical(payload)}".encode("utf-8")
    return hmac.new(settings.integration_hmac_secret.encode("utf-8"), message, hashlib.sha256).hexdigest()


def integration_trust(payload: dict[str, Any], timestamp: str | None, signature: str | None) -> str:
    """Validate a signed partner event; never silently label unsigned data live."""
    if not settings.integration_hmac_secret:
        return "unverified-local-demo"
    if not timestamp or not signature:
        if settings.integration_require_signature:
            raise ValueError("Missing X-Raksha-Timestamp or X-Raksha-Signature")
        return "unverified-local-demo"
    try:
        received = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        age = abs((datetime.now(timezone.utc) - received).total_seconds())
        if age > settings.integration_max_event_age_seconds:
            raise ValueError("Webhook timestamp is outside the permitted replay window")
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError("Invalid X-Raksha-Timestamp") from exc
    supplied = signature.removeprefix("sha256=")
    if not hmac.compare_digest(supplied, expected_signature(payload, timestamp)):
        raise ValueError("Invalid X-Raksha-Signature")
    return "signed-partner-webhook"


def _combined_probability(scores: list[float]) -> float:
    """Noisy-OR fusion keeps every evidence channel visible and bounded."""
    complement = 1.0
    for score in scores:
        complement *= 1 - min(0.99, max(0.0, score))
    return round(1 - complement, 4)


def _telecom_risk(data: dict[str, Any]) -> tuple[float, list[str]]:
    scores: list[float] = []
    reasons: list[str] = []
    caller = re.sub(r"\D", "", data.get("caller", ""))
    asserted = re.sub(r"\D", "", data.get("asserted_caller_id") or "")
    if asserted and caller and asserted != caller:
        scores.append(0.68); reasons.append("Network caller identity differs from the asserted caller ID.")
    if data.get("cli_verified") is False:
        scores.append(0.58); reasons.append("Carrier could not verify the caller ID.")
    if data.get("stir_shaken_attestation") == "failed":
        scores.append(0.58); reasons.append("Caller-ID attestation failed at the telecom boundary.")
    elif data.get("stir_shaken_attestation") == "C":
        scores.append(0.18); reasons.append("Caller-ID attestation has low provenance (C level).")
    if data.get("line_type") == "voip":
        scores.append(0.16); reasons.append("Call originated from a VoIP line.")
    sim_age = data.get("sim_age_days")
    if sim_age is not None and sim_age < 7:
        scores.append(0.16); reasons.append("Originating SIM is less than seven days old.")
    ported = data.get("number_ported_days")
    if ported is not None and ported < 3:
        scores.append(0.12); reasons.append("Number was recently ported.")
    if data.get("forwarding_hops", 0) >= 3:
        scores.append(0.18); reasons.append("Call traversed three or more forwarding hops.")
    attempts = data.get("call_attempts_24h", 0)
    if attempts >= 20:
        scores.append(min(0.32, 0.14 + attempts / 500)); reasons.append("High repeated-call velocity in the last 24 hours.")
    callees = data.get("unique_callees_24h", 0)
    if callees >= 15:
        scores.append(min(0.30, 0.12 + callees / 600)); reasons.append("High unique-recipient call velocity in the last 24 hours.")
    reputation = data.get("telecom_reputation_score")
    if reputation is not None and reputation >= 0.5:
        scores.append(reputation * 0.55); reasons.append("Telecom partner supplied an elevated reputation-risk score.")
    if data.get("duration_seconds", 0) >= 1800:
        scores.append(0.12); reasons.append("Unusually long call duration is consistent with coercive scam sessions.")
    return _combined_probability(scores), reasons


def _video_risk(data: dict[str, Any] | None) -> tuple[float, list[str]]:
    if not data:
        return 0.0, []
    scores: list[float] = []
    reasons: list[str] = []
    deepfake = data.get("deepfake_probability")
    if deepfake is not None and deepfake >= 0.35:
        scores.append(deepfake * 0.90); reasons.append(f"Upstream video verifier reported deepfake probability {deepfake:.0%}.")
    if data.get("virtual_camera_detected"):
        scores.append(0.24); reasons.append("Video platform reported a virtual camera source.")
    desync = data.get("audio_video_desync_ms")
    if desync is not None and desync >= 250:
        scores.append(min(0.38, desync / 2500)); reasons.append("Audio/video timing divergence exceeds the verification threshold.")
    claim = (data.get("identity_claim") or "").lower()
    if data.get("official_identity_verified") is False and any(term in claim for term in ("cbi", "ed", "customs", "police", "rbi", "government")):
        scores.append(0.56); reasons.append("A government identity claim could not be verified by the authorised source.")
    if data.get("screen_share_active"):
        scores.append(0.08); reasons.append("Screen sharing is active; preserve this session for investigator review.")
    return _combined_probability(scores), reasons


def _payment_risk(data: dict[str, Any] | None) -> tuple[float, list[str]]:
    if not data:
        return 0.0, []
    scores: list[float] = []
    reasons: list[str] = []
    mule = data.get("mule_risk_score")
    if mule is not None and mule >= 0.25:
        scores.append(mule * 0.95); reasons.append(f"Beneficiary carries payment-network mule risk {mule:.0%}.")
    if data.get("beneficiary_name_mismatch"):
        scores.append(0.47); reasons.append("Beneficiary name verification did not match the presented identity.")
    if data.get("transaction_count_24h", 0) >= 10:
        scores.append(0.20); reasons.append("Beneficiary has elevated transaction velocity.")
    age = data.get("account_age_days")
    if age is not None and age < 7:
        scores.append(0.16); reasons.append("Beneficiary account is newly created.")
    return _combined_probability(scores), reasons


def _severity(score: float) -> tuple[str, str]:
    if score >= 0.82:
        return "SCAM", "critical"
    if score >= 0.62:
        return "SCAM", "high"
    if score >= 0.38:
        return "SUSPICIOUS", "medium"
    return "SAFE", "low"


def ingest_live_signal(event: SentinelLiveSignalRequest, *, trust: str) -> dict[str, Any]:
    """Assess one signed multi-source event and fan out actionable intelligence."""
    event_data = event.model_dump(mode="json")
    telecom = event_data["telecom"]
    text_result = sentinel_service.analyse_text(event.transcript) if event.transcript else {}
    text_score = float(text_result.get("threat_score", 0)) / 100
    telecom_score, telecom_reasons = _telecom_risk(telecom)
    video_score, video_reasons = _video_risk(event_data.get("video"))
    payment_score, payment_reasons = _payment_risk(event_data.get("payment"))
    component_scores = {
        "content": round(text_score, 4),
        "telecom_spoofing": telecom_score,
        "video_integrity": video_score,
        "payment_risk": payment_score,
    }
    score = _combined_probability(list(component_scores.values()))
    verdict, severity = _severity(score)
    reasons = [*telecom_reasons, *video_reasons, *payment_reasons]
    for intent in text_result.get("intents_detected", []):
        reasons.append(f"Scam-language classifier detected {intent.replace('_', ' ').lower()}.")
    if not reasons:
        reasons.append("No high-risk content, spoofing, video-integrity, or payment signal was supplied.")
    evidence = append_evidence(
        "SENTINEL_LIVE_SIGNAL",
        {"event": event_data, "risk": component_scores, "verdict": verdict, "reasons": reasons},
        actor="SENTINEL", source=trust,
    )
    confidence = min(0.98, 0.50 + (0.10 * sum(v > 0 for v in component_scores.values())) + (0.12 if trust == "signed-partner-webhook" else 0.0))
    alert_created = score >= 0.62
    if alert_created:
        sentinel_service.add_alert(Alert(
            id=f"al-live-{event.event_id[-10:]}", type="SENTINEL_LIVE", severity=severity,
            location=telecom.get("district") or telecom.get("state") or "Location withheld by provider",
            time=event.occurred_at or datetime.now(timezone.utc).isoformat(), score=round(score * 100, 1), module="SENTINEL",
        ))
        # These are intelligence leads, not automatic accusations.  JAAL keeps
        # them in a separately reviewable live-intelligence community.
        jaal_service.ingest_verified_signal({
            "eventId": event.event_id, "source": telecom["provider"], "caller": telecom["caller"],
            "callee": telecom.get("callee"), "beneficiary": (event_data.get("payment") or {}).get("beneficiary"),
            "riskScore": score, "evidenceRef": evidence["evidence_id"], "description": "; ".join(reasons[:4]),
        })
        drishti_service.ingest_intelligence_incident({
            "eventId": event.event_id, "type": "scam", "severity": severity,
            "district": telecom.get("district") or "India", "state": telecom.get("state") or "India",
            "lat": telecom.get("latitude"), "lng": telecom.get("longitude"), "score": score,
            "description": "SENTINEL multi-signal event: " + " ".join(reasons[:2]), "evidenceRef": evidence["evidence_id"],
        })
    actions = ["Preserve consented call metadata and the evidence hash for review."]
    if verdict == "SCAM":
        actions += ["Warn the potential victim: no agency conducts a digital arrest over video call.", "Route the lead to the cybercrime cell and place a payment hold only through authorised bank/PSP workflows."]
    elif verdict == "SUSPICIOUS":
        actions += ["Request analyst review before blocking, reporting, or contacting the subscriber."]
    return {
        "event_id": event.event_id, "threat_score": round(score * 100, 1), "verdict": verdict,
        "confidence": round(confidence, 2), "signal_breakdown": {k: round(v * 100, 1) for k, v in component_scores.items()},
        "reasons": reasons, "recommended_actions": actions, "evidence_id": evidence["evidence_id"],
        "evidence_hash": evidence["evidence_hash"], "alert_created": alert_created, "integration_trust": trust,
    }


def integration_status() -> dict[str, Any]:
    """Report readiness without exposing secrets or pretending a partner is live."""
    return {
        "webhookContract": "signed HMAC-SHA256 JSON",
        "signatureRequired": settings.integration_require_signature,
        "secretConfigured": bool(settings.integration_hmac_secret),
        "supportedSources": ["telecom CDR/CLI attestation", "video-platform integrity metadata", "bank/PSP payment-risk metadata"],
        "ledger": verify_ledger(),
        "deploymentNote": "Partner credentials, data-sharing agreement, consent, and retention policy are required before live agency use.",
    }
