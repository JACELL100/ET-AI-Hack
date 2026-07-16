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
    description: Optional[str] = None


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


class Incident(BaseModel):
    id: str
    lat: float
    lng: float
    type: str                          # scam | counterfeit | upi | network
    severity: str                      # critical | high | medium | low
    timestamp: str
    district: str
    state: str
    description: str = ""
    sourceModule: str = "DRISHTI"


class HotspotDetailed(BaseModel):
    id: str
    lat: float
    lng: float
    intensity: float                   # 0.0 – 1.0
    type: str
    district: str
    state: str
    incidentCount: int
    criticalCount: int
    riskTrend: str                     # rising | stable | falling
    predictedRisk72h: float
    topCrimeType: str
    breakdown: dict                    # {scam, counterfeit, upi, network} counts


class Waypoint(BaseModel):
    lat: float
    lng: float
    label: str = ""


class PatrolRoute(BaseModel):
    routeId: str
    unitName: str
    waypoints: list[Waypoint]
    coverageKm: float
    estimatedMinutes: int
    priority: str                      # high | medium


class PredictionZone(BaseModel):
    gridId: str
    lat: float
    lng: float
    riskScore: float                   # 0.0 – 1.0
    confidence: float
    timeframe: str                     # 24h | 48h | 72h
    predictedType: str
    district: str
    state: str


class DistrictStat(BaseModel):
    district: str
    state: str
    totalIncidents: int
    criticalCount: int
    changePercent: float               # negative = improvement
    riskRank: int
    dominantType: str


class DrishtiStats(BaseModel):
    totalToday: int
    criticalZones: int
    activePatrols: int
    avgResponseMin: float
    hotspotCount: int
    totalThisWeek: int


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


# ── NETRA extended ──────────────────────────────────────────────────────────
class NetraScanResultExtended(BaseModel):
    scan_id: str
    verdict: str  # AUTHENTIC | SUSPICIOUS | COUNTERFEIT
    confidence: float
    overall_score: float
    denomination: Optional[str] = None
    denomination_confidence: Optional[float] = None
    features: list[SecurityFeature] = Field(default_factory=list)
    serial_number: Optional[dict] = None
    processing_time_ms: Optional[int] = None
    pipeline_version: str = "NETRA-v2.0-YOLOv12"
    image_quality: Optional[dict] = None


class NetraReportRequest(BaseModel):
    scan_id: str
    notes: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_description: Optional[str] = None


# ── DRISHTI citizen reporting ────────────────────────────────────────────────
class CitizenReportRequest(BaseModel):
    type: str                              # scam | counterfeit | upi | network | other
    description: str
    district: str
    state: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    phone: Optional[str] = None            # suspect phone (optional)
    reporterName: Optional[str] = None


class CitizenReport(BaseModel):
    id: str
    type: str
    description: str
    district: str
    state: str
    lat: float
    lng: float
    phone: Optional[str] = None
    reporterName: Optional[str] = None
    timestamp: str
    status: str = "received"               # received | verified | escalated


class NetraHistoryItem(BaseModel):
    id: str
    timestamp: str
    verdict: str
    confidence: float
    denomination: Optional[str] = None
