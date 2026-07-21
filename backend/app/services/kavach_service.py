"""KAVACH — RAG-powered citizen fraud shield service.

Replaces the rule-based mock with a full Retrieval-Augmented Generation
pipeline: Upstash Vector DB for semantic search + Groq LLM for response.
Falls back to rule-based responses if the RAG system is unavailable.
"""
from __future__ import annotations

import logging
import re

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# RAG chat (primary path)
# ---------------------------------------------------------------------------

def reply(message: str, session_id: str | None = None) -> dict:
    """Main chat handler — uses RAG pipeline when available."""
    try:
        from app.services.kavach_rag import get_rag
        rag = get_rag()
        return rag.chat(user_message=message, session_id=session_id)
    except Exception as exc:
        logger.warning("RAG pipeline unavailable (%s), using fallback", exc)
        return _fallback_reply(message)


# ---------------------------------------------------------------------------
# Fallback rule-based handler
# ---------------------------------------------------------------------------

_INTENTS = {
    "report_scam": ["report", "scam", "fraud", "cheated", "complaint"],
    "check_number": ["number", "caller", "who called", "safe", "phone"],
    "currency": ["fake", "currency", "note", "counterfeit", "cash", "ficn"],
    "emergency": ["help", "urgent", "arrest", "threat", "digital arrest"],
    "greeting": ["hi", "hello", "hey", "namaste"],
}


def _detect_intents(message: str) -> list[str]:
    lowered = message.lower()
    return [intent for intent, keys in _INTENTS.items() if any(k in lowered for k in keys)]


def _fallback_reply(message: str) -> dict:
    intents = _detect_intents(message)
    if not intents:
        intents = ["fallback"]

    if "emergency" in intents:
        text = (
            "If you are being threatened with 'digital arrest', do NOT transfer money — "
            "it is 100% a scam. No government agency (CBI, ED, Police) ever arrests "
            "anyone over a video call. Hang up immediately and call 1930 (Cyber Crime "
            "Helpline) right now."
        )
        risk = "danger"
        actions = ["Call 1930 Now", "File Complaint Online", "Report to Police"]
    elif "report_scam" in intents:
        text = (
            "To report a cybercrime: Call 1930 (National Cyber Crime Helpline) or "
            "visit cybercrime.gov.in. For financial fraud, report within the first hour "
            "for the best chance of fund recovery."
        )
        risk = "warning"
        actions = ["Call 1930", "File at cybercrime.gov.in", "Check Phone Number"]
    elif "check_number" in intents:
        text = (
            "Share the phone number and I'll check it against known scam databases. "
            "You can use the phone number checker in this app."
        )
        risk = "warning"
        actions = ["Check a Number"]
    elif "currency" in intents:
        text = (
            "Use RAKSHA AI's NETRA module to scan a currency note for authenticity. "
            "Key checks: security thread, watermark, color-shifting ink, and raised "
            "intaglio print. Fake notes should be handed to the nearest bank branch."
        )
        risk = "safe"
        actions = ["Open NETRA Scanner"]
    elif "greeting" in intents:
        text = (
            "Namaste! I'm KAVACH (कवच), your AI-powered fraud shield. I can help you "
            "with: digital arrest scams, UPI fraud, fake currency, OTP theft, reporting "
            "cybercrime, and more. What do you need help with?"
        )
        risk = "safe"
        actions = ["Check a Number", "Report a Scam", "Learn About Scams"]
    else:
        text = (
            "I'm here to help you stay safe from digital fraud. Ask me about "
            "suspicious calls, UPI scams, digital arrest, fake currency, or how to "
            "report cybercrime. Call 1930 for urgent help."
        )
        risk = "safe"
        actions = ["Check a Number", "Report a Scam", "Call 1930"]

    return {
        "reply": text,
        "intents": intents,
        "quickActions": actions,
        "riskLevel": risk,
        "sources": [],
    }


# ---------------------------------------------------------------------------
# Number check
# ---------------------------------------------------------------------------

def check_number(phone: str) -> dict:
    digits = re.sub(r"\D", "", phone)
    safe = not digits.startswith(("98765",))
    return {"safe": safe, "risk_score": 0.15 if safe else 0.88}
