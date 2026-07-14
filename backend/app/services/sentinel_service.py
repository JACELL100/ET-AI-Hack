"""SENTINEL — digital arrest scam detection (mock logic).

Basic keyword-based scam scoring so the endpoint is demonstrable without
the real Faster-Whisper / IndicBERT stack (per the plan's mock strategy).
Returns shapes matching frontend SentinelAnalysisResult / Alert.
"""
from __future__ import annotations

import hashlib

from app.models.schemas import Alert

_SUSPICIOUS_TERMS = [
    "arrest", "cyber crime", "edi", "cbi", "rbi", "money laundering",
    "aadhaar", "pan card", "court", "legal notice", "urgent", "transfer",
    "freeze", "account", "fine", "customs",
]

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
]


def analyse_text(text: str) -> dict:
    lowered = text.lower()
    hits = [t for t in _SUSPICIOUS_TERMS if t in lowered]
    score = min(100.0, round(len(hits) * 18.5, 1))
    verdict = "SCAM" if score >= 70 else "SUSPICIOUS" if score >= 40 else "SAFE"
    return {
        "threat_score": score,
        "verdict": verdict,
        "intents": [h.upper() for h in hits],
        "confidence": round(min(1.0, score / 100 + 0.1), 2),
    }


def check_number(phone: str) -> dict:
    digest = hashlib.sha256(phone.encode()).hexdigest()
    risk_score = round((int(digest[:4], 16) % 100) / 1.0, 1)
    reports = int(digest[4:6], 16) % 50
    return {"risk_score": risk_score, "reports": reports}


def get_alerts() -> list[Alert]:
    return _RECENT_ALERTS
