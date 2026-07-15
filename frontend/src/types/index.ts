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
