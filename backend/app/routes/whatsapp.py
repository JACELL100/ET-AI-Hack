"""KAVACH-WA — WhatsApp chat scanner REST endpoints.

Proxies requests to the Node.js WhatsApp bridge and orchestrates
Groq-powered chat analysis.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.schemas import ChatAnalyseRequest, ok, fail
from app.services import whatsapp_service

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])


@router.get("/status")
async def status():
    """Get WhatsApp connection status (connected / qr-pending / disconnected)."""
    data = await whatsapp_service.get_bridge_status()
    return ok(data)


@router.get("/chats")
async def list_chats():
    """List all WhatsApp chats (proxied from the bridge)."""
    try:
        chats = await whatsapp_service.get_bridge_chats()
        return ok(chats)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.get("/chat/{chat_id}/messages")
async def chat_messages(chat_id: str, limit: int = 100):
    """Get raw messages for a specific WhatsApp chat."""
    try:
        data = await whatsapp_service.get_bridge_messages(chat_id, limit)
        return ok(data)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.post("/analyse")
async def analyse_chat(payload: ChatAnalyseRequest):
    """Analyse a specific chat — sends messages to Groq, returns flagged results."""
    try:
        result = await whatsapp_service.analyse_single_chat(
            payload.chat_id, payload.limit
        )
        return ok(result)
    except Exception as exc:
        return fail(f"Analysis failed: {str(exc)[:300]}")


@router.post("/analyse/all")
async def analyse_all():
    """Batch-analyse all WhatsApp chats — returns summary per chat."""
    try:
        result = await whatsapp_service.analyse_all_chats()
        return ok(result)
    except Exception as exc:
        return fail(f"Batch analysis failed: {str(exc)[:300]}")


@router.post("/disconnect")
async def disconnect():
    """Disconnect/logout the WhatsApp session."""
    try:
        data = await whatsapp_service.disconnect_bridge()
        return ok(data)
    except Exception as exc:
        return fail(f"Disconnect failed: {str(exc)[:200]}")


@router.post("/clear-session")
async def clear_session():
    """Clear stored credentials and force a fresh QR scan.

    Use this when the session is stale (MessageCounterError / init-query
    timeouts) so the bridge deletes .baileys_auth and shows a new QR.
    """
    try:
        data = await whatsapp_service.clear_bridge_session()
        return ok(data)
    except Exception as exc:
        return fail(f"Clear session failed: {str(exc)[:200]}")
