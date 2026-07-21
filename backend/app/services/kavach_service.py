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

SUPPORTED_LANGUAGES = {
    "en": "English", "hi": "Hindi", "bn": "Bengali", "te": "Telugu", "mr": "Marathi", "ta": "Tamil",
    "gu": "Gujarati", "ur": "Urdu", "kn": "Kannada", "or": "Odia", "ml": "Malayalam", "pa": "Punjabi",
}

_EMERGENCY_ADVISORIES = {
    "en": "Digital arrest is a scam. Do not transfer money or share OTP/PIN. End the call, tell a trusted person, and call 1930 immediately.",
    "hi": "डिजिटल अरेस्ट एक ठगी है। पैसे ट्रांसफर न करें और OTP/PIN साझा न करें। कॉल बंद करें, किसी भरोसेमंद व्यक्ति को बताएं और तुरंत 1930 पर कॉल करें।",
    "bn": "ডিজিটাল অ্যারেস্ট একটি প্রতারণা। টাকা পাঠাবেন না বা OTP/PIN দেবেন না। কলটি বন্ধ করে বিশ্বস্ত কাউকে জানান এবং সঙ্গে সঙ্গে 1930-এ ফোন করুন।",
    "te": "డిజిటల్ అరెస్ట్ మోసం. డబ్బు బదిలీ చేయవద్దు, OTP/PIN పంచుకోవద్దు. కాల్‌ను ముగించి, నమ్మకమైన వ్యక్తికి చెప్పి వెంటనే 1930కు కాల్ చేయండి.",
    "mr": "डिजिटल अरेस्ट ही फसवणूक आहे. पैसे पाठवू नका किंवा OTP/PIN देऊ नका. कॉल बंद करा, विश्वासू व्यक्तीला सांगा आणि त्वरित 1930 वर कॉल करा.",
    "ta": "டிஜிட்டல் கைது ஒரு மோசடி. பணம் அனுப்பவோ OTP/PIN பகிரவோ வேண்டாம். அழைப்பை முடித்து, நம்பகமான ஒருவரிடம் தெரிவித்து உடனே 1930-ஐ அழைக்கவும்.",
    "gu": "ડિજિટલ અરેસ્ટ એક છેતરપિંડી છે. પૈસા ટ્રાન્સફર ન કરો કે OTP/PIN શેર ન કરો. કૉલ બંધ કરો, વિશ્વાસુ વ્યક્તિને જણાવો અને તરત 1930 પર કૉલ કરો.",
    "ur": "ڈیجیٹل گرفتاری ایک فراڈ ہے۔ رقم منتقل نہ کریں اور OTP/PIN شیئر نہ کریں۔ کال ختم کریں، کسی قابلِ اعتماد شخص کو بتائیں اور فوراً 1930 پر کال کریں۔",
    "kn": "ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್ ವಂಚನೆ. ಹಣ ವರ್ಗಾಯಿಸಬೇಡಿ ಅಥವಾ OTP/PIN ಹಂಚಿಕೊಳ್ಳಬೇಡಿ. ಕರೆಯನ್ನು ಕೊನೆಗೊಳಿಸಿ, ನಂಬಿಕೆಯ ವ್ಯಕ್ತಿಗೆ ತಿಳಿಸಿ ಮತ್ತು ತಕ್ಷಣ 1930 ಗೆ ಕರೆ ಮಾಡಿ.",
    "or": "ଡିଜିଟାଲ ଗିରଫ ଏକ ଠକେଇ। ଟଙ୍କା ପଠାନ୍ତୁ ନାହିଁ କିମ୍ବା OTP/PIN ଦିଅନ୍ତୁ ନାହିଁ। କଲ ବନ୍ଦ କରନ୍ତୁ, ବିଶ୍ୱସ୍ତ ଲୋକଙ୍କୁ କୁହନ୍ତୁ ଏବଂ ତୁରନ୍ତ 1930 କଲ କରନ୍ତୁ।",
    "ml": "ഡിജിറ്റൽ അറസ്റ്റ് ഒരു തട്ടിപ്പാണ്. പണം അയക്കരുത്, OTP/PIN പങ്കിടരുത്. കോൾ അവസാനിപ്പിച്ച് വിശ്വസ്തരായ ഒരാളെ അറിയിച്ച് ഉടൻ 1930-ൽ വിളിക്കുക.",
    "pa": "ਡਿਜ਼ਿਟਲ ਗ੍ਰਿਫ਼ਤਾਰੀ ਧੋਖਾਧੜੀ ਹੈ। ਪੈਸੇ ਟ੍ਰਾਂਸਫਰ ਨਾ ਕਰੋ ਅਤੇ OTP/PIN ਸਾਂਝਾ ਨਾ ਕਰੋ। ਕਾਲ ਬੰਦ ਕਰੋ, ਕਿਸੇ ਭਰੋਸੇਯੋਗ ਵਿਅਕਤੀ ਨੂੰ ਦੱਸੋ ਅਤੇ ਤੁਰੰਤ 1930 'ਤੇ ਕਾਲ ਕਰੋ।",
}


def reply(message: str, session_id: str | None = None, language: str = "auto") -> dict:
    """Main chat handler — uses RAG pipeline when available."""
    language = language.lower().strip()
    # The RAG corpus is currently English/Hinglish.  For an explicitly chosen
    # regional language, return the safety-first localised flow instead of
    # pretending an English-only model has translated it reliably.
    if language in SUPPORTED_LANGUAGES and language not in ("auto", "en"):
        return _fallback_reply(message, language=language)
    try:
        from app.services.kavach_rag import get_rag
        rag = get_rag()
        return rag.chat(user_message=message, session_id=session_id)
    except Exception as exc:
        logger.warning("RAG pipeline unavailable (%s), using fallback", exc)
        return _fallback_reply(message, language=language)


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


def _fallback_reply(message: str, language: str = "auto") -> dict:
    intents = _detect_intents(message)
    if not intents:
        intents = ["fallback"]

    selected_language = language if language in SUPPORTED_LANGUAGES else "en"
    if "emergency" in intents or (selected_language != "en" and any(token in message.lower() for token in ("arrest", "fraud", "scam", "otp", "upi"))):
        text = (
            _EMERGENCY_ADVISORIES[selected_language] + " "
            + ("No government agency arrests anyone over a video call." if selected_language == "en" else "")
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
        "language": selected_language,
        "supportedLanguages": SUPPORTED_LANGUAGES,
    }


# ---------------------------------------------------------------------------
# Number check
# ---------------------------------------------------------------------------

def check_number(phone: str) -> dict:
    digits = re.sub(r"\D", "", phone)
    safe = not digits.startswith(("98765",))
    return {"safe": safe, "risk_score": 0.15 if safe else 0.88}
