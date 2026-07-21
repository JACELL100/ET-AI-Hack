"""Pydantic v2 models and the standard API response envelope.

Every endpoint returns the same envelope shape:
    { "success": bool, "data": ..., "error": str | null, "meta": {} }
defined in the plan (Section 15.1).

Field names use camelCase to match the frontend type definitions in
frontend/src/types/index.ts so the link works without a translation layer.
"""

from __future__ import annotations

from typing import Any, Literal, Optional
from uuid import uuid4

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


class ThreatReport(BaseModel):
    """A single crowd-sourced or database threat report for a phone number."""
    source: str           # e.g. "RAKSHA_DB", "TRAI", "TRUECALLER_CROWD"
    type: str             # e.g. "DIGITAL_ARREST", "KYC_FRAUD", "SPAM"
    date: str             # ISO date string
    description: str


class PhoneNumberLookupResult(BaseModel):
    """Enriched phone number reputation + owner metadata result."""
    phone: str
    formatted: str                         # e.g. "+91 98765 43210"
    is_valid: bool
    risk_score: float                      # 0–100
    verdict: str                           # SAFE | SUSPICIOUS | KNOWN_SCAM
    is_flagged: bool

    # Owner / carrier metadata
    carrier: Optional[str] = None          # e.g. "Jio", "Airtel", "BSNL"
    line_type: Optional[str] = None        # "mobile" | "landline" | "voip"
    telecom_circle: Optional[str] = None   # e.g. "Maharashtra", "Delhi"
    country_code: str = "91"
    country: str = "India"

    # Intelligence
    reports_count: int = 0
    reports: list[ThreatReport] = Field(default_factory=list)
    last_reported: Optional[str] = None   # ISO date of most recent report
    scam_categories: list[str] = Field(default_factory=list)

    # Source metadata
    intelligence_sources: list[str] = Field(default_factory=list)
    lookup_timestamp: str = ""


class TranscriptSegment(BaseModel):
    speaker: str = "CALLER"
    text: str = ""
    start_time: float = 0.0
    end_time: float = 0.0
    language: str = "en"
    intent: str = "NORMAL"
    confidence: float = 0.0


class VoiceAnalysis(BaseModel):
    is_scripted: bool = False
    scripted_confidence: float = 0.0
    speech_rate: float = 0.0
    pitch_mean_hz: float = 0.0
    pitch_variance: float = 0.0
    silence_ratio: float = 0.0
    pause_count: int = 0
    bg_noise_type: str = "unknown"


class SentinelFullResult(BaseModel):
    session_id: str = ""
    threat_score: float = 0.0
    verdict: str = "SAFE"
    scam_type: Optional[str] = None
    transcript: list[TranscriptSegment] = Field(default_factory=list)
    intents_detected: list[str] = Field(default_factory=list)
    voice_analysis: Optional[VoiceAnalysis] = None
    script_similarity: float = 0.0
    confidence: float = 0.0
    processing_time_ms: int = 0
    alerts_sent: list[str] = Field(default_factory=list)
    language: str = "en"


class SentinelStreamUpdate(BaseModel):
    type: str  # transcript | threat_update | intent | alert | session_complete
    data: dict = Field(default_factory=dict)
    timestamp: float = 0.0


class AuthkeyAlertRequest(BaseModel):
    phone: str
    message: Optional[str] = None
    alert_type: str = "sms"  # sms | voice | both
    threat_score: Optional[float] = None
    scam_type: Optional[str] = None


class AuthkeyAlertResponse(BaseModel):
    success: bool = False
    channel: str = ""
    phone: str = ""
    authkey_response: Optional[dict] = None
    error: Optional[str] = None


class ScenarioInfo(BaseModel):
    id: str
    title: str
    description: str
    language: str
    duration_seconds: int
    expected_threat_score: float
    expected_intents: list[str] = Field(default_factory=list)
    has_audio: bool = False


class SentinelReportRequest(BaseModel):
    phone_number: Optional[str] = None
    description: str = ""
    scam_type: Optional[str] = None
    evidence_text: Optional[str] = None


# ── SENTINEL live intelligence ingestion ───────────────────────────────────
class TelecomMetadata(BaseModel):
    """Privacy-minimised CDR/telecom signals supplied by an authorised partner.

    No call content is required.  The caller/callee values are pseudonymised in
    the evidence ledger and may be masked by upstream systems before delivery.
    """
    provider: str = Field(min_length=2, max_length=80)
    caller: str = Field(min_length=3, max_length=160)
    callee: Optional[str] = Field(default=None, max_length=160)
    asserted_caller_id: Optional[str] = Field(default=None, max_length=160)
    call_id: Optional[str] = Field(default=None, max_length=160)
    call_started_at: Optional[str] = Field(default=None, max_length=64)
    duration_seconds: int = Field(default=0, ge=0, le=172800)
    call_attempts_24h: int = Field(default=0, ge=0, le=10000)
    unique_callees_24h: int = Field(default=0, ge=0, le=100000)
    line_type: Literal["mobile", "landline", "voip", "unknown"] = "unknown"
    stir_shaken_attestation: Literal["A", "B", "C", "failed", "unavailable"] = "unavailable"
    cli_verified: Optional[bool] = None
    sim_age_days: Optional[int] = Field(default=None, ge=0, le=20000)
    number_ported_days: Optional[int] = Field(default=None, ge=0, le=20000)
    forwarding_hops: int = Field(default=0, ge=0, le=30)
    telecom_reputation_score: Optional[float] = Field(default=None, ge=0, le=1)
    district: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)


class VideoMetadata(BaseModel):
    """Signals from an authorised video platform or on-device verifier."""
    provider: str = Field(min_length=2, max_length=80)
    meeting_id: Optional[str] = Field(default=None, max_length=160)
    virtual_camera_detected: bool = False
    screen_share_active: bool = False
    face_count: Optional[int] = Field(default=None, ge=0, le=20)
    audio_video_desync_ms: Optional[int] = Field(default=None, ge=0, le=10000)
    deepfake_probability: Optional[float] = Field(default=None, ge=0, le=1)
    identity_claim: Optional[str] = Field(default=None, max_length=120)
    official_identity_verified: Optional[bool] = None
    source_model: Optional[str] = Field(default=None, max_length=120)
    source_evidence_uri: Optional[str] = Field(default=None, max_length=500)


class PaymentMetadata(BaseModel):
    """Optional payment risk signal from a bank/PSP, never card/PIN data."""
    provider: str = Field(min_length=2, max_length=80)
    beneficiary: Optional[str] = Field(default=None, max_length=160)
    amount_inr: Optional[float] = Field(default=None, ge=0, le=1000000000)
    transaction_count_24h: int = Field(default=0, ge=0, le=100000)
    mule_risk_score: Optional[float] = Field(default=None, ge=0, le=1)
    account_age_days: Optional[int] = Field(default=None, ge=0, le=20000)
    beneficiary_name_mismatch: bool = False


class SentinelLiveSignalRequest(BaseModel):
    """Signed, normalised partner event used for real-time intervention."""
    event_id: str = Field(default_factory=lambda: f"evt-{uuid4().hex}")
    occurred_at: Optional[str] = Field(default=None, max_length=64)
    transcript: Optional[str] = Field(default=None, max_length=20000)
    language: str = Field(default="auto", max_length=16)
    telecom: TelecomMetadata
    video: Optional[VideoMetadata] = None
    payment: Optional[PaymentMetadata] = None
    consent_reference: Optional[str] = Field(default=None, max_length=160)
    case_reference: Optional[str] = Field(default=None, max_length=160)


class SentinelLiveSignalResult(BaseModel):
    event_id: str
    threat_score: float
    verdict: str
    confidence: float
    signal_breakdown: dict[str, float] = Field(default_factory=dict)
    reasons: list[str] = Field(default_factory=list)
    recommended_actions: list[str] = Field(default_factory=list)
    evidence_id: str
    evidence_hash: str
    alert_created: bool = False
    integration_trust: str = "unverified-local-demo"


class EvaluationSample(BaseModel):
    """One labelled, consented evaluation example; no real citizen PII."""
    id: str = Field(min_length=1, max_length=160)
    text: str = Field(min_length=1, max_length=20000)
    label: Literal["scam", "safe"]


class SentinelEvaluationRequest(BaseModel):
    samples: list[EvaluationSample] = Field(min_length=2, max_length=10000)
    scamThreshold: float = Field(default=70.0, ge=0, le=100)


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


class NetraModelTrainRequest(BaseModel):
    """Train only from a server-side, approved dataset manifest name."""
    datasetName: str = Field(pattern=r"^[A-Za-z0-9_-]{3,80}$")
    modelName: str = Field(default="ficn-linear-v1", pattern=r"^[A-Za-z0-9_-]{3,80}$")
    epochs: int = Field(default=80, ge=1, le=1000)
    learningRate: float = Field(default=0.08, gt=0, le=2)


class NetraModelEvaluateRequest(BaseModel):
    datasetName: str = Field(pattern=r"^[A-Za-z0-9_-]{3,80}$")


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


class JaalCitizenReportRequest(BaseModel):
    """A privacy-conscious citizen signal that JAAL can correlate."""
    entityType: str = "phone"             # phone | account | upi | website
    entityValue: str = Field(min_length=3, max_length=160)
    relatedEntityType: Optional[str] = None
    relatedEntityValue: Optional[str] = Field(default=None, max_length=160)
    relationship: str = "REPORTED_WITH"
    description: str = Field(min_length=8, max_length=2000)
    reportType: str = "scam"
    district: Optional[str] = None
    state: Optional[str] = None
    reporterName: Optional[str] = Field(default=None, max_length=100)


class JaalTraceRequest(BaseModel):
    sourceId: str
    targetId: str
    maxHops: int = Field(default=5, ge=1, le=8)


class JaalEvidencePackageRequest(BaseModel):
    communityId: str
    title: Optional[str] = Field(default=None, max_length=180)
    selectedNodeIds: list[str] = Field(default_factory=list)
    investigator: Optional[str] = Field(default=None, max_length=100)


class JaalModuleSignalRequest(BaseModel):
    """Normalised event contract for transaction monitors and JAAL peers."""
    sourceModule: str = Field(min_length=2, max_length=40)
    entityValue: str = Field(min_length=3, max_length=160)
    description: str = Field(min_length=8, max_length=2000)
    entityType: str = "account"
    riskScore: float = Field(default=0.7, ge=0, le=1)


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


class AgencyFeedIncidentRequest(BaseModel):
    """Normalised incident from an authorised NCRP/NCRB/state/bank feed."""
    source: Literal["NCRP", "NCRB", "STATE_POLICE", "BANK_FICN", "FIU_IND", "TELECOM_PARTNER"]
    externalId: str = Field(min_length=3, max_length=160)
    occurredAt: str = Field(min_length=10, max_length=64)
    type: Literal["scam", "counterfeit", "upi", "network"]
    severity: Literal["critical", "high", "medium", "low"]
    district: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    description: str = Field(min_length=8, max_length=4000)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    indicators: list[str] = Field(default_factory=list, max_length=30)
    evidenceReference: Optional[str] = Field(default=None, max_length=300)
    legalBasisReference: Optional[str] = Field(default=None, max_length=200)
    dataClassification: Literal["restricted", "confidential", "internal"] = "restricted"


# ── KAVACH ──────────────────────────────────────────────────────────────────
class KavachChatRequest(BaseModel):
    message: str
    sessionId: Optional[str] = None
    language: str = Field(default="auto", max_length=12, description="ISO 639-1 language code or auto")


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


# ── WHATSAPP (KAVACH-WA) ───────────────────────────────────────────────────
class WhatsAppStatus(BaseModel):
    connected: bool = False
    qrReady: bool = False
    phone: Optional[str] = None


class WhatsAppChat(BaseModel):
    id: str
    kind: Optional[str] = None
    name: str
    isGroup: bool = False
    timestamp: Optional[int] = None
    unreadCount: int = 0
    lastMessage: Optional[str] = None
    messageCount: int = 0
    hasMedia: bool = False


class WhatsAppMedia(BaseModel):
    kind: str = "text"
    contentType: Optional[str] = None
    mimeType: Optional[str] = None
    fileName: Optional[str] = None
    caption: str = ""
    fileLength: Optional[int] = None
    seconds: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    hasPreview: bool = False
    dataUrl: Optional[str] = None
    downloadError: Optional[str] = None


class WhatsAppMessage(BaseModel):
    id: str
    from_field: str = Field(default="", alias="from")
    author: str = ""
    body: str = ""
    preview: str = ""
    timestamp: int = 0
    fromMe: bool = False
    type: str = "chat"
    media: Optional[WhatsAppMedia] = None

    model_config = {"populate_by_name": True}


class FlaggedMessage(BaseModel):
    message_index: int
    message_body: str = ""
    risk_level: str = "low"                  # critical | high | medium | low
    threat_type: str = "SUSPICIOUS"          # SCAM | PHISHING | FINANCIAL_FRAUD | IDENTITY_THEFT | SOCIAL_ENGINEERING | THREAT | SUSPICIOUS
    explanation: str = ""
    recommendation: str = ""
    message_type: Optional[str] = None
    media_kind: Optional[str] = None


class ChatAnalysisResult(BaseModel):
    chat_id: str
    chat_name: str
    overall_risk: str = "safe"               # safe | low | medium | high | critical
    summary: str = ""
    flagged_messages: list[FlaggedMessage] = Field(default_factory=list)
    key_findings: list[str] = Field(default_factory=list)
    total_messages_scanned: int = 0
    media_messages_scanned: int = 0
    flagged_count: int = 0
    scan_time_ms: int = 0


class ChatAnalyseRequest(BaseModel):
    chat_id: str
    limit: int = 100


class BatchAnalysisResult(BaseModel):
    total_chats: int = 0
    chats_scanned: int = 0
    high_risk_chats: list[ChatAnalysisResult] = Field(default_factory=list)
    safe_chats: int = 0
    scan_time_ms: int = 0
