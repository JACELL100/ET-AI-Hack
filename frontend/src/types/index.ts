// ─────────────────────────────────────────────────────────────────────────────
// RAKSHA AI — Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

// ── Common ───────────────────────────────────────────────────────────────────
export type Severity = "critical" | "high" | "medium" | "low";
export type Theme = "dark" | "light";

// ── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardStats {
  activeAlerts: number;
  scamsDetectedToday: number;
  counterfeitFound: number;
  citizensProtected: number;
}

export interface Alert {
  id: string | number;
  type: string;
  severity: Severity;
  location: string;
  time: string;
  score?: number;
  module?: string;
}

// ── SENTINEL ─────────────────────────────────────────────────────────────────
export type SentinelInputTab = "simulate" | "upload" | "text" | "cdr";

export interface TranscriptLine {
  speaker: "CALLER" | "VICTIM" | "SYSTEM";
  text: string;
  intent: string;
  time: string;
}

export interface SentinelAnalysisResult {
  threat_score: number;
  verdict: "SCAM" | "SUSPICIOUS" | "SAFE";
  intents: string[];
  transcript?: TranscriptLine[];
  confidence: number;
}

// ── NETRA ─────────────────────────────────────────────────────────────────────
export type NetraVerdict = "AUTHENTIC" | "SUSPICIOUS" | "COUNTERFEIT";

export interface SecurityFeature {
  name: string;
  status: "pass" | "fail" | "warn";
  description?: string;
}

export interface NetraScanResult {
  verdict: NetraVerdict;
  confidence: number;
  features: SecurityFeature[];
  denomination?: string;
  imageUrl?: string;
}

export interface NetraScanResultExtended extends NetraScanResult {
  scan_id?: string;
  overall_score?: number;
  denomination_confidence?: number;
  feature_details?: Array<{
    name: string;
    status: "pass" | "fail" | "warn";
    confidence: number;
    bounding_box?: { x: number; y: number; w: number; h: number };
    detected: boolean;
    detector: string;
  }>;
  serial_number?: {
    extracted: string | null;
    format_valid: boolean;
    is_known_counterfeit_prefix: boolean;
    is_specimen_pattern?: boolean;
    denomination_match: boolean;
    ocr_detected: boolean;
  };
  detection_reason?: string;
  processing_time_ms?: number;
  pipeline_version?: string;
  banknote_score?: number;
  image_quality?: {
    sharpness: number;
    edge_density: number;
    brightness: number;
  };
}

export interface NetraScanHistory {
  id: string;
  timestamp: string;
  verdict: NetraVerdict;
  confidence: number;
  denomination?: string;
  thumbnailUrl?: string;
}

// ── JAAL ──────────────────────────────────────────────────────────────────────
export interface GraphNode {
  id: string;
  label: string;
  type: "person" | "phone" | "account" | "mule" | "hub";
  riskScore?: number;
  position?: { x: number; y: number };
  data?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  weight?: number;
  timestamp?: string;
}

export interface FraudCommunity {
  id: string;
  name: string;
  nodeCount: number;
  riskScore: number;
  primaryType: string;
  lastActive: string;
}

export interface NodeDetail {
  id: string;
  label: string;
  type: string;
  riskScore: number;
  connections: string[];
  evidenceRefs: string[];
  location?: string;
  firstSeen?: string;
  lastSeen?: string;
}

// ── DRISHTI ───────────────────────────────────────────────────────────────────
export interface HotspotData {
  id: string;
  lat: number;
  lng: number;
  intensity: number;
  type: string;
  district?: string;
  count?: number;
}

export interface LiveIncident {
  id: string;
  time: string;
  type: string;
  location: string;
  severity: Severity;
  coordinates?: { lat: number; lng: number };
}

export type MapLayer = "heatmap" | "hotspots" | "patrol" | "incidents";

// ── KAVACH ────────────────────────────────────────────────────────────────────
export type KavachTab = "webchat" | "whatsapp" | "ivr";

export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: string;
  intents?: string[];
  quickActions?: string[];
}

export interface KavachChatResponse {
  reply: string;
  intents: string[];
  quickActions?: string[];
  riskLevel?: "safe" | "warning" | "danger";
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export type UserRole = "citizen" | "officer" | "admin";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  role: UserRole;
  phone?: string;
  badgeId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badgeId?: string;
}

// ── API Responses ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ── WhatsApp Scanner (KAVACH-WA) ──────────────────────────────────────────────
export interface WhatsAppStatus {
  connected: boolean;
  qrReady: boolean;
  phone: string | null;
  error?: string;
}

export interface WhatsAppChat {
  id: string;
  name: string;
  isGroup: boolean;
  timestamp: number | null;
  unreadCount: number;
  lastMessage: string | null;
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  author?: string;
  body: string;
  timestamp: number;
  fromMe: boolean;
  type: string;
}

export interface FlaggedMessage {
  message_index: number;
  message_body: string;
  risk_level: "critical" | "high" | "medium" | "low";
  threat_type: string;
  explanation: string;
  recommendation: string;
}

export interface ChatAnalysisResult {
  chat_id: string;
  chat_name: string;
  overall_risk: "safe" | "low" | "medium" | "high" | "critical" | "unknown";
  summary: string;
  flagged_messages: FlaggedMessage[];
  key_findings: string[];
  total_messages_scanned: number;
  flagged_count: number;
  scan_time_ms: number;
  groq_called?: boolean;
  groq_error?: string;
}

export interface BatchAnalysisResult {
  total_chats: number;
  chats_scanned: number;
  high_risk_chats: ChatAnalysisResult[];
  safe_chats: number;
  scan_time_ms: number;
}
