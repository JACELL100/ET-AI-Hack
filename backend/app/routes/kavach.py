"""KAVACH — citizen fraud shield endpoints (rule-based mock)."""
from __future__ import annotations

from fastapi import APIRouter

from app.models.schemas import KavachChatRequest, KavachNumberCheck, ok
from app.services import kavach_service

router = APIRouter(prefix="/kavach", tags=["kavach"])


@router.post("/chat")
def chat(payload: KavachChatRequest):
    return ok(kavach_service.reply(payload.message))


@router.post("/check/number")
def check_number(payload: KavachNumberCheck):
    return ok(kavach_service.check_number(payload.phone))
