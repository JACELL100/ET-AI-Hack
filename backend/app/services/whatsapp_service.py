"""KAVACH-WA — WhatsApp chat scanner service.

Two responsibilities:
1. Bridge Communication — HTTP client to the Node.js WhatsApp bridge
2. Groq AI Analysis   — send chat messages to Groq for fraud/scam analysis

The service talks to the WhatsApp bridge (Node.js) via HTTP and uses the
Groq SDK to analyse message batches with a specialised fraud-detection
system prompt.
"""
from __future__ import annotations

import json
import logging
import time
from typing import Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Groq client (lazy-loaded)
# ---------------------------------------------------------------------------

_groq_client = None


def _get_groq():
    global _groq_client
    if _groq_client is not None:
        return _groq_client

    if not settings.groq_api_key:
        logger.warning("GROQ_API_KEY not set — chat analysis will be unavailable")
        return None

    try:
        from groq import Groq
        _groq_client = Groq(api_key=settings.groq_api_key)
        logger.info("Groq client initialised (model: %s)", settings.groq_model)
        return _groq_client
    except ImportError:
        logger.error("groq package not installed — run: pip install groq")
        return None
    except Exception as exc:
        logger.error("Failed to initialise Groq client: %s", exc)
        return None


# ---------------------------------------------------------------------------
# System prompt for fraud analysis
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """\
You are RAKSHA AI's WhatsApp Fraud Detection Engine — an expert system trained \
to identify scams, phishing, financial fraud, identity theft, social engineering, \
and threats in WhatsApp conversations.

You will receive a WhatsApp conversation as a numbered list of messages.  \
Analyse EVERY message carefully and flag any that show signs of:

• **SCAM** — lottery wins, fake prizes, digital arrest threats, impersonation \
  of government officials (CBI, ED, RBI, police), too-good-to-be-true offers
• **PHISHING** — suspicious links, fake login pages, requests to click unknown URLs
• **FINANCIAL_FRAUD** — requests for money transfer, UPI collect requests from \
  unknowns, investment schemes with guaranteed returns, cryptocurrency scams
• **IDENTITY_THEFT** — requests for Aadhaar, PAN, OTP, passwords, bank details, CVV
• **SOCIAL_ENGINEERING** — emotional manipulation, urgency creation, threatening \
  language to extract information or money
• **THREAT** — blackmail, extortion, intimidation, threats of violence or legal action
• **SUSPICIOUS** — anything else that seems off or potentially harmful

Messages may include media metadata such as image/video captions, document file
names, locations, contacts, polls, stickers, or audio notes. Treat captions,
file names, shared links, locations, QR/payment images, invoices/APKs, and
identity documents as evidence. If a media-only message has no readable text,
flag it only when its metadata or surrounding context is suspicious.

Respond with ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "overall_risk": "safe" | "low" | "medium" | "high" | "critical",
  "summary": "Brief 1-2 sentence summary of the conversation safety",
  "key_findings": ["finding1", "finding2"],
  "flagged_messages": [
    {
      "message_index": 3,
      "risk_level": "high",
      "threat_type": "SCAM",
      "explanation": "Why this message is flagged",
      "recommendation": "What the user should do"
    }
  ]
}

Rules:
- If the conversation is completely safe, return overall_risk "safe" with empty \
  flagged_messages and key_findings.
- message_index is the 0-based index of the message in the list provided.
- Be thorough but avoid false positives — normal friendly/business conversations \
  are safe.
- Focus on messages FROM OTHERS (not sent by the user) as primary risk sources, \
  but also flag if the user is sharing sensitive info.
- For Indian context: be especially alert for "digital arrest" scams, UPI fraud, \
  KYC update scams, and loan app harassment.
"""


# ---------------------------------------------------------------------------
# Bridge communication
# ---------------------------------------------------------------------------

BRIDGE_TIMEOUT = 30.0  # seconds


async def get_bridge_status() -> dict:
    """Get WhatsApp connection status from the Node.js bridge."""
    try:
        async with httpx.AsyncClient(timeout=BRIDGE_TIMEOUT) as client:
            r = await client.get(f"{settings.whatsapp_bridge_url}/status")
            r.raise_for_status()
            return r.json()
    except httpx.ConnectError:
        return {"connected": False, "qrReady": False, "phone": None,
                "error": "WhatsApp bridge is not running"}
    except Exception as exc:
        logger.error("Bridge /status error: %s", exc)
        return {"connected": False, "qrReady": False, "phone": None,
                "error": str(exc)}


async def get_bridge_chats() -> list[dict]:
    """Fetch all WhatsApp chats from the bridge."""
    async with httpx.AsyncClient(timeout=BRIDGE_TIMEOUT) as client:
        r = await client.get(f"{settings.whatsapp_bridge_url}/chats")
        r.raise_for_status()
        return r.json()


async def get_bridge_messages(chat_id: str, limit: int = 100) -> dict:
    """Fetch messages for a specific chat from the bridge."""
    async with httpx.AsyncClient(timeout=BRIDGE_TIMEOUT) as client:
        r = await client.get(
            f"{settings.whatsapp_bridge_url}/chats/{chat_id}/messages",
            params={"limit": limit},
        )
        r.raise_for_status()
        return r.json()


async def disconnect_bridge() -> dict:
    """Disconnect/logout from WhatsApp via the bridge."""
    async with httpx.AsyncClient(timeout=BRIDGE_TIMEOUT) as client:
        r = await client.post(f"{settings.whatsapp_bridge_url}/disconnect")
        r.raise_for_status()
        return r.json()


async def clear_bridge_session() -> dict:
    """Delete .baileys_auth and restart — user must re-scan QR."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(f"{settings.whatsapp_bridge_url}/clear-session")
        r.raise_for_status()
        return r.json()


# ---------------------------------------------------------------------------
# Groq AI analysis
# ---------------------------------------------------------------------------

def _format_messages_for_prompt(messages: list[dict]) -> str:
    """Format messages into a numbered list for the LLM prompt."""
    lines = []
    for i, msg in enumerate(messages):
        sender = "YOU" if msg.get("fromMe") else (msg.get("author") or msg.get("from", "Other"))
        body = _message_text_for_analysis(msg)
        if not body:
            continue
        lines.append(f"[{i}] {sender}: {body}")
    return "\n".join(lines)


def _message_text_for_analysis(msg: dict) -> str:
    """Build an analysis string from text plus safe media metadata."""
    body = (msg.get("body") or "").strip()
    preview = (msg.get("preview") or "").strip()
    media = msg.get("media") or {}
    parts: list[str] = []

    if body:
        parts.append(body)
    elif preview:
        parts.append(preview)

    kind = media.get("kind") or msg.get("type")
    if kind and kind != "text":
        parts.append(f"[media: {kind}]")

    for label, key in (
        ("caption", "caption"),
        ("file", "fileName"),
        ("mime", "mimeType"),
    ):
        value = media.get(key)
        if value:
            parts.append(f"{label}: {str(value)[:180]}")

    if media.get("latitude") is not None and media.get("longitude") is not None:
        parts.append(f"location: {media.get('latitude')},{media.get('longitude')}")

    return " | ".join(dict.fromkeys(parts))


def _parse_groq_response(raw: str) -> dict:
    """Parse Groq's JSON response, handling potential formatting issues."""
    # Strip code fences if present
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]  # remove first line
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    if text.startswith("json"):
        text = text[4:]
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse Groq response: %s\nRaw: %s", exc, text[:500])
        return {
            "overall_risk": "low",
            "summary": "Analysis completed but response format was unexpected.",
            "key_findings": [],
            "flagged_messages": [],
        }


def analyse_messages_with_groq(messages: list[dict]) -> dict:
    """Send a batch of messages to Groq for fraud analysis.

    Parameters
    ----------
    messages : list[dict]
        Each dict should have keys: body, fromMe, from/author, timestamp.

    Returns
    -------
    dict  with keys: overall_risk, summary, key_findings, flagged_messages
    """
    client = _get_groq()
    if client is None:
        return {
            "overall_risk": "unknown",
            "summary": "Groq API key not configured — analysis unavailable.",
            "key_findings": ["Groq API key missing. Add GROQ_API_KEY to backend/.env"],
            "flagged_messages": [],
            "groq_called": False,
            "groq_error": "No API key",
        }

    # Filter to messages with text or media metadata, cap at ~80 for token budget.
    scannable_msgs = [m for m in messages if _message_text_for_analysis(m)]
    logger.info("Groq analysis: %d total messages, %d scannable messages", len(messages), len(scannable_msgs))

    if not scannable_msgs:
        logger.warning("No text messages to analyse — Groq will NOT be called for this chat")
        return {
            "overall_risk": "safe",
            "summary": "No readable messages or media metadata found in this chat yet. WhatsApp history may still be syncing — try again in a few seconds.",
            "key_findings": ["No messages were found in the message store for this chat. This usually means the WhatsApp sync hasn't delivered message history yet."],
            "flagged_messages": [],
            "groq_called": False,
            "groq_error": "Empty message store",
        }

    batch = sorted(scannable_msgs, key=lambda m: m.get("timestamp") or 0)[-80:]
    conversation_text = _format_messages_for_prompt(batch)

    logger.info("Calling Groq model '%s' with %d messages (%d chars)",
                 settings.groq_model, len(batch), len(conversation_text))

    try:
        completion = client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": f"Analyse this WhatsApp conversation:\n\n{conversation_text}"},
            ],
            temperature=0.1,
            max_tokens=settings.groq_max_tokens,
        )

        raw_content = completion.choices[0].message.content or ""
        logger.info("Groq responded: %d chars, model=%s",
                    len(raw_content), completion.model)
        result = _parse_groq_response(raw_content)

        # Map message_index back to original message body for context
        for fm in result.get("flagged_messages", []):
            idx = fm.get("message_index", -1)
            if 0 <= idx < len(batch):
                fm["message_body"] = _message_text_for_analysis(batch[idx])[:500]
                media = batch[idx].get("media") or {}
                fm["message_type"] = batch[idx].get("type") or media.get("kind") or "text"
                fm["media_kind"] = media.get("kind")
            else:
                fm["message_body"] = ""

        result["groq_called"] = True
        result["messages_analysed"] = len(batch)
        return result

    except Exception as exc:
        logger.error("Groq API call failed: %s", exc)
        return {
            "overall_risk": "unknown",
            "summary": f"Groq analysis failed: {str(exc)[:200]}",
            "key_findings": [f"Groq error: {str(exc)[:200]}"],
            "flagged_messages": [],
            "groq_called": False,
            "groq_error": str(exc)[:200],
        }


# ---------------------------------------------------------------------------
# High-level analysis functions (used by routes)
# ---------------------------------------------------------------------------

async def analyse_single_chat(chat_id: str, limit: int = 100) -> dict:
    """Fetch messages for a chat and run Groq analysis."""
    t0 = time.time()

    # Fetch messages from bridge
    chat_data = await get_bridge_messages(chat_id, limit)
    messages = sorted(chat_data.get("messages", []), key=lambda m: m.get("timestamp") or 0)
    chat_name = chat_data.get("chatName", "Unknown")

    # Run Groq analysis (sync — fast enough for Groq)
    analysis = analyse_messages_with_groq(messages)

    elapsed_ms = int((time.time() - t0) * 1000)

    return {
        "chat_id": chat_id,
        "chat_name": chat_name,
        "overall_risk": analysis.get("overall_risk", "safe"),
        "summary": analysis.get("summary", ""),
        "flagged_messages": analysis.get("flagged_messages", []),
        "key_findings": analysis.get("key_findings", []),
        "total_messages_scanned": len(messages),
        "media_messages_scanned": sum(1 for m in messages if (m.get("media") or {}).get("kind") not in (None, "text")),
        "flagged_count": len(analysis.get("flagged_messages", [])),
        "scan_time_ms": elapsed_ms,
        "groq_called": analysis.get("groq_called", False),
        "groq_error": analysis.get("groq_error"),
    }


async def analyse_all_chats(max_chats: int = 30) -> dict:
    """Fetch all chats, analyse each, return aggregated results."""
    t0 = time.time()

    chats = await get_bridge_chats()
    chats = chats[:max_chats]  # cap for performance

    results: list[dict] = []
    safe_count = 0

    for chat in chats:
        try:
            result = await analyse_single_chat(chat["id"], limit=50)
            if result["overall_risk"] in ("high", "critical", "medium"):
                results.append(result)
            else:
                safe_count += 1
        except Exception as exc:
            logger.warning("Failed to analyse chat %s: %s", chat.get("name"), exc)
            safe_count += 1  # count failed as safe to avoid blocking

    elapsed_ms = int((time.time() - t0) * 1000)

    # Sort by risk: critical > high > medium
    risk_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "safe": 4}
    results.sort(key=lambda r: risk_order.get(r.get("overall_risk", "safe"), 5))

    return {
        "total_chats": len(chats),
        "chats_scanned": len(chats),
        "high_risk_chats": results,
        "safe_chats": safe_count,
        "scan_time_ms": elapsed_ms,
    }
