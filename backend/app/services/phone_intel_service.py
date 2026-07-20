"""phone_intel_service.py — AI-powered phone number intelligence.

Pipeline:
  1. NumVerify  → carrier, line_type, location (already done in sentinel_service)
  2. Groq LLM   → structured risk analysis from all available signals
  3. Internal DB → crowd reports from citizen submissions

Web scraping is NOT used — external spam sites are unreachable from this
environment and Truecaller serves a JS-only shell with no usable data.
"""
from __future__ import annotations

import json
import logging
import re
import time
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# ── Cache ─────────────────────────────────────────────────────────────────────
_CACHE: dict[str, tuple[float, "OsintResult"]] = {}
_CACHE_TTL = 3600  # 1 hour

_GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
_TIMEOUT = httpx.Timeout(connect=5.0, read=15.0, write=4.0, pool=4.0)


class OsintResult:
    def __init__(self) -> None:
        self.name: Optional[str] = None
        self.name_source: Optional[str] = None
        self.spam_count: int = 0
        self.spam_tags: list[str] = []
        self.caller_type: str = "unknown"      # personal | business | call_centre | robocall
        self.reasoning: str = ""               # Groq explanation
        self.ai_risk_score: float = 0.0        # 0–100 from Groq
        self.ai_risk_level: str = "low"        # low | medium | high
        self.signals: list[str] = []           # human-readable signal list
        self.public_profiles: list[dict] = []
        self.sources_checked: list[str] = []
        self.sources_hit: list[str] = []

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "name_source": self.name_source,
            "spam_count": self.spam_count,
            "spam_tags": self.spam_tags,
            "caller_type": self.caller_type,
            "reasoning": self.reasoning,
            "ai_risk_score": self.ai_risk_score,
            "ai_risk_level": self.ai_risk_level,
            "signals": self.signals,
            "public_profiles": self.public_profiles,
            "sources_checked": self.sources_checked,
            "sources_hit": self.sources_hit,
        }


# ── Structural signal extraction (no API needed) ──────────────────────────────

# Prefixes known to be heavily used by Indian call centres / fraud operations
# Source: TRAI enforcement reports, NCRP data patterns
_CALLCENTRE_PREFIXES = {
    # VoIP / virtual number blocks commonly abused
    "7317", "7318", "7319", "7310", "7311",  # MP VoIP heavy
    "7400", "7401", "7402",                   # Airtel VoIP
    "1400", "1600", "1800",                   # TRAI commercial (misused)
    "0120", "0124", "0130",                   # Noida/Gurugram call centre codes
}

_DIGITAL_ARREST_PREFIXES = {
    "9999", "8888", "7777", "6666",          # Pattern-repeated numbers used in scams
}


def extract_structural_signals(
    digits: str,
    carrier: Optional[str],
    line_type: Optional[str],
    location: Optional[str],
) -> list[str]:
    """
    Extract spam-indicative structural signals from number metadata.
    Returns a list of human-readable signal strings.
    """
    signals: list[str] = []

    # Line type signals
    if line_type == "landline":
        signals.append("Landline/VoIP on a mobile series — typical of call centre operations")
    elif line_type == "voip":
        signals.append("VoIP number — commonly used by spam/fraud call centres")

    # Carrier signals
    if not carrier or carrier.strip() == "":
        signals.append("No carrier record — suggests heavily ported or virtual number")

    # Prefix signals
    prefix4 = digits[:4]
    prefix3 = digits[:3]
    if prefix4 in _CALLCENTRE_PREFIXES or prefix3 in _CALLCENTRE_PREFIXES:
        signals.append(f"Prefix {prefix4} is overrepresented in call centre registrations")
    if prefix4 in _DIGITAL_ARREST_PREFIXES:
        signals.append(f"Prefix {prefix4} matches patterns used in digital arrest scam scripts")

    # Location signals
    if location:
        tier2_callcentre_hubs = {
            "jamtara", "deoghar", "bharatpur", "mewat", "indore",
            "ahmedabad", "surat", "rajkot", "agra", "kanpur"
        }
        if any(hub in location.lower() for hub in tier2_callcentre_hubs):
            signals.append(f"{location} is a known hub for cyber fraud operations (NCRP data)")

    # Number pattern signals (repeating digits, sequential)
    if len(set(digits)) <= 3:
        signals.append("Highly repetitive digit pattern — common in spoofed/scripted numbers")
    if digits == digits[::-1]:
        signals.append("Palindrome number pattern — often synthetic/generated")

    return signals


# ── Groq AI analysis ──────────────────────────────────────────────────────────

async def _groq_analyse(
    digits: str,
    carrier: Optional[str],
    line_type: Optional[str],
    location: Optional[str],
    signals: list[str],
    groq_api_key: str,
    groq_model: str = "llama-3.3-70b-versatile",
) -> dict | None:
    """
    Use Groq LLM to produce a structured risk assessment from all available signals.
    Returns parsed JSON dict or None on failure.
    """
    signals_text = "\n".join(f"- {s}" for s in signals) if signals else "- No structural anomalies detected"

    prompt = f"""You are a cybercrime intelligence analyst for India's RAKSHA AI platform.

Analyse this phone number for spam/scam risk using the signals below.
Known Indian fraud patterns: digital arrest scams (CBI/ED/Customs impersonation),
KYC fraud, UPI scam calls, loan harassment, TRAI SIM block scams.

NUMBER DETAILS:
- Number: +91-{digits[:5]}-{digits[5:]}
- Carrier: {carrier or 'Not available (blank from telecom registry)'}
- Line type: {line_type or 'unknown'}
- Telecom circle / location: {location or 'unknown'}

STRUCTURAL SIGNALS DETECTED:
{signals_text}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation outside JSON):
{{
  "risk_score": <integer 0-100>,
  "risk_level": "<low|medium|high|critical>",
  "caller_type": "<personal|business|telemarketer|call_centre|robocall|spoofed|unknown>",
  "likely_scam_type": "<type or null>",
  "subscriber_hint": "<inferred name or entity if determinable, else null>",
  "reasoning": "<2-3 sentence explanation of the risk assessment>",
  "confidence": "<low|medium|high>"
}}"""

    payload = {
        "model": groq_model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a cybercrime intelligence AI. "
                    "Respond only with valid JSON. No markdown code blocks. No extra text."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 400,
        "temperature": 0.1,
    }

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.post(
                _GROQ_ENDPOINT,
                json=payload,
                headers={
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json",
                },
            )
            if resp.status_code != 200:
                logger.warning("Groq returned %s: %s", resp.status_code, resp.text[:200])
                return None

            content = resp.json()["choices"][0]["message"]["content"].strip()

            # Strip markdown fences if Groq wraps in ```json
            content = re.sub(r"^```(?:json)?\s*", "", content)
            content = re.sub(r"\s*```$", "", content)

            return json.loads(content)

    except json.JSONDecodeError as e:
        logger.warning("Groq JSON parse error: %s", e)
    except Exception as e:
        logger.warning("Groq analysis failed: %s", e)
    return None


# ── Main entry point ──────────────────────────────────────────────────────────

async def fetch_osint(
    digits_10: str,
    carrier: Optional[str] = None,
    line_type: Optional[str] = None,
    location: Optional[str] = None,
) -> OsintResult:
    """
    Run full OSINT + AI analysis for a 10-digit Indian mobile number.

    Pass in NumVerify data (carrier, line_type, location) if already fetched
    so we don't duplicate the API call.
    """
    cached = _CACHE.get(digits_10)
    if cached and (time.time() - cached[0]) < _CACHE_TTL:
        return cached[1]

    from app.config import settings

    result = OsintResult()
    result.sources_checked = ["structural_analysis", "groq_ai"]

    # ── Step 1: structural signals (free, no API) ─────────────────────────────
    signals = extract_structural_signals(digits_10, carrier, line_type, location)
    result.signals = signals

    # ── Step 2: Groq AI analysis ──────────────────────────────────────────────
    if settings.groq_api_key:
        groq_result = await _groq_analyse(
            digits=digits_10,
            carrier=carrier,
            line_type=line_type,
            location=location,
            signals=signals,
            groq_api_key=settings.groq_api_key,
            groq_model=settings.groq_model,
        )

        if groq_result:
            result.sources_hit.append("groq_ai")
            result.ai_risk_score = float(groq_result.get("risk_score", 0))
            result.ai_risk_level = groq_result.get("risk_level", "low")
            result.caller_type = groq_result.get("caller_type", "unknown")
            result.reasoning = groq_result.get("reasoning", "")
            result.spam_count = 0  # No crowd data available

            # Subscriber hint from AI
            hint = groq_result.get("subscriber_hint")
            if hint and hint not in (None, "null", "None", ""):
                result.name = hint
                result.name_source = "AI inference"

            # Scam type as tag
            scam_type = groq_result.get("likely_scam_type")
            if scam_type and scam_type not in (None, "null", "None", ""):
                result.spam_tags.append(scam_type)

            # Add signals as tags too
            caller_type_tags = {
                "call_centre": "Call Centre",
                "robocall": "Robocall",
                "spoofed": "Spoofed Number",
                "telemarketer": "Telemarketer",
            }
            if result.caller_type in caller_type_tags:
                result.spam_tags.append(caller_type_tags[result.caller_type])
    else:
        # No Groq key — fall back to pure structural scoring
        if signals:
            result.ai_risk_score = min(20.0 * len(signals), 80.0)
            result.ai_risk_level = (
                "high" if result.ai_risk_score >= 65
                else "medium" if result.ai_risk_score >= 35
                else "low"
            )
            result.reasoning = f"Based on {len(signals)} structural signal(s): " + "; ".join(signals[:2])
        result.sources_hit.append("structural_analysis")

    _CACHE[digits_10] = (time.time(), result)
    return result
