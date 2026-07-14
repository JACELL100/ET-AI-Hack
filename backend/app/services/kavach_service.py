"""KAVACH — citizen fraud shield (rule-based mock chat + number check).

Lightweight intent detection so the chat endpoint is usable before the
Rasa / IndicBERT stack is wired in (plan mock strategy). Shapes match the
frontend KavachChatResponse / number-check responses.
"""
from __future__ import annotations

import re

_INTENTS = {
    "report_scam": ["report", "scam", "fraud", "cheated"],
    "check_number": ["number", "caller", "who called", "safe"],
    "currency": ["fake", "currency", "note", "counterfeit", "cash"],
    "emergency": ["help", "urgent", "arrest", "threat"],
    "greeting": ["hi", "hello", "hey"],
}


def detect_intents(message: str) -> list[str]:
    lowered = message.lower()
    return [intent for intent, keys in _INTENTS.items() if any(k in lowered for k in keys)]


def reply(message: str) -> dict:
    intents = detect_intents(message)
    if not intents:
        intents = ["fallback"]
    if "emergency" in intents:
        text = (
            "If you are being threatened with 'digital arrest', do NOT transfer money. "
            "It is a scam. Call 1930 (Cyber Crime Helpline) immediately."
        )
        risk = "danger"
        actions = ["Call 1930", "Report to local police"]
    elif "report_scam" in intents:
        text = (
            "I can help you file a report. Please share the caller number and a short "
            "description, and I'll draft an NCRB complaint for you."
        )
        risk = "warning"
        actions = ["Start report", "Share number"]
    elif "check_number" in intents:
        text = (
            "Share the phone number and I'll check it against known scam databases and "
            "warn you if it has been reported."
        )
        risk = "warning"
        actions = ["Check a number"]
    elif "currency" in intents:
        text = (
            "You can scan a note with NETRA to verify if it's counterfeit. Want me to "
            "open the scanner?"
        )
        risk = "safe"
        actions = ["Open NETRA scanner"]
    elif "greeting" in intents:
        text = "Namaste! I'm KAVACH, your fraud shield. Ask me about scams, suspicious numbers, or how to stay safe."
        risk = "safe"
        actions = ["Check a number", "Report a scam"]
    else:
        text = (
            "I'm here to help you stay safe from digital fraud. Ask me to check a "
            "suspicious number, report a scam, or learn how to protect yourself."
        )
        risk = "safe"
        actions = ["Check a number", "Report a scam"]
    return {"reply": text, "intents": intents, "quickActions": actions, "riskLevel": risk}


def check_number(phone: str) -> dict:
    digits = re.sub(r"\D", "", phone)
    safe = not digits.startswith(("98765",))
    return {"safe": safe, "risk_score": 0.15 if safe else 0.88}
