"""KAVACH — RAG-powered citizen fraud shield endpoints."""
from __future__ import annotations

import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.models.schemas import KavachChatRequest, KavachNumberCheck, ok, fail
from app.services import kavach_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/kavach", tags=["kavach"])


@router.post("/chat")
async def chat(payload: KavachChatRequest):
    """RAG-powered chat — searches vector DB and generates Groq LLM response."""
    if not payload.message or not payload.message.strip():
        return fail("Message cannot be empty")

    result = kavach_service.reply(
        message=payload.message.strip(),
        session_id=payload.sessionId,
        language=payload.language,
    )
    return ok(result)


@router.post("/check/number")
async def check_number(payload: KavachNumberCheck):
    """Check a phone number against known scam databases."""
    if not payload.phone or not payload.phone.strip():
        return fail("Phone number cannot be empty")
    return ok(kavach_service.check_number(payload.phone))


@router.post("/ingest")
async def ingest_documents(background_tasks: BackgroundTasks):
    """Trigger document ingestion into the vector DB (runs in background)."""
    def _run_ingest():
        try:
            from app.services.kavach_ingest import run_ingestion
            run_ingestion(include_web=False)  # Use built-in corpus only for speed
        except Exception as exc:
            logger.error("Background ingestion failed: %s", exc)

    background_tasks.add_task(_run_ingest)
    return ok({"message": "Document ingestion started in background"})


@router.get("/status")
async def rag_status():
    """Return the current status of the KAVACH RAG knowledge base."""
    try:
        from app.services.kavach_rag import get_rag
        rag = get_rag()
        stats = rag.get_index_stats()
        return ok({
            "status": "ready",
            "vectorCount": stats.get("total_vectors", 0),
            "embeddingModel": "all-MiniLM-L6-v2",
            "llmModel": "llama-3.3-70b-versatile",
            "vectorDb": "Upstash Vector",
        })
    except Exception as exc:
        logger.warning("RAG status check failed: %s", exc)
        return ok({
            "status": "initializing",
            "vectorCount": 0,
            "embeddingModel": "all-MiniLM-L6-v2",
            "llmModel": "llama-3.3-70b-versatile",
            "vectorDb": "Upstash Vector",
        })
