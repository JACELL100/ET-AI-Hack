"""Pydantic v2 models and the standard API response envelope.

Every endpoint returns the same envelope shape:
    { "success": bool, "data": ..., "error": str | null, "meta": {} }
defined in the plan (Section 15.1).

Field names use camelCase to match the frontend type definitions in
frontend/src/types/index.ts so the link works without a translation layer.
"""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


# ── Response envelope helpers ───────────────────────────────────────────────
class ApiResponse(BaseModel):
    success: bool = True
    data: Any = None
    error: Optional[str] = None
    meta: dict = Field(default_factory=dict)


def ok(data: Any = None, meta: Optional[dict] = None) -> ApiResponse:
    return ApiResponse(success=True, data=data, error=None, meta=meta or {})


def fail(error: str, data: Any = None, meta: Optional[dict] = None) -> ApiResponse:
    return ApiResponse(success=False, data=data, error=error, meta=meta or {})


# ── Dashboard ───────────────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    activeAlerts: int
    scamsDetectedToday: int
    counterfeitFound: int
    citizensProtected: int


class Alert(BaseModel):
    id: str
    type: str
    severity: str  # critical | high | medium | low
    location: str
    time: str
    score: Optional[float] = None
    module: Optional[str] = None


# ── SENTINEL ────────────────────────────────────────────────────────────────
class SentinelTextRequest(BaseModel):
    text: str


class SentinelAnalysisResult(BaseModel):
    threat_score: float
    verdict: str  # SCAM | SUSPICIOUS | SAFE
    intents: list[str]
    confidence: float


# ── NETRA ───────────────────────────────────────────────────────────────────
class SecurityFeature(BaseModel):
    name: str
    status: str  # pass | fail | warn


class NetraScanResult(BaseModel):
    verdict: str  # AUTHENTIC | SUSPICIOUS | COUNTERFEIT
    confidence: float
    features: list[SecurityFeature] = Field(default_factory=list)
    denomination: Optional[str] = None


class NetraStats(BaseModel):
    totalScans: int
    counterfeits: int
    authentic: int


# ── JAAL ────────────────────────────────────────────────────────────────────
class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    riskScore: float = 0.0


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: Optional[str] = None
    weight: float = 1.0


class FraudCommunity(BaseModel):
    id: str
    name: str
    nodeCount: int
    riskScore: float
    primaryType: str
    lastActive: str


# ── DRISHTI ─────────────────────────────────────────────────────────────────
class HotspotData(BaseModel):
    id: str
    lat: float
    lng: float
    intensity: float
    type: str
    district: str = ""


# ── KAVACH ──────────────────────────────────────────────────────────────────
class KavachChatRequest(BaseModel):
    message: str
    sessionId: Optional[str] = None


class KavachChatResponse(BaseModel):
    reply: str
    intents: list[str] = Field(default_factory=list)
    quickActions: list[str] = Field(default_factory=list)
    riskLevel: Optional[str] = None


class KavachNumberCheck(BaseModel):
    phone: str
