import axios from "axios";
import type {
  DashboardStats,
  Alert,
  SentinelAnalysisResult,
  NetraScanResult,
  NetraScanResultExtended,
  NetraScanHistory,
  FraudCommunity,
  GraphNode,
  GraphEdge,
  JaalCitizenReportInput,
  JaalCitizenReportResult,
  JaalEvidencePackage,
  JaalSearchResult,
  JaalTraceResult,
  HotspotData,
  LiveIncident,
  KavachChatResponse,
  ApiResponse,
  LoginCredentials,
  RegisterData,
  User,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 90_000,   // 90 s default — OCR + CV pipeline can be slow on first run
  headers: { "Content-Type": "application/json" },
});

// ── Interceptors ──────────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("raksha-token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // A caller renders the user-facing failure state. Logging as an error here
    // makes Next's dev overlay appear even when that failure is handled.
    console.warn("[API request failed]", err?.response?.status ?? "network", err?.message);
    return Promise.reject(err);
  },
);

// ── Health ────────────────────────────────────────────────────────────────────
export const healthCheck = () =>
  api.get<{ status: string }>("/health").then((r) => r.data);

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardStats = () =>
  api
    .get<ApiResponse<DashboardStats>>("/api/v1/dashboard/stats")
    .then((r) => r.data);

export const getDashboardAlerts = () =>
  api.get<ApiResponse<Alert[]>>("/api/v1/dashboard/alerts").then((r) => r.data);

// ── SENTINEL ──────────────────────────────────────────────────────────────
export const analyseText = (text: string) =>
  api
    .post<ApiResponse<SentinelAnalysisResult>>(
      "/api/v1/sentinel/analyse/text",
      { text },
    )
    .then((r) => r.data);

export const analyseAudio = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return api
    .post<ApiResponse<SentinelAnalysisResult>>(
      "/api/v1/sentinel/analyse/audio",
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
      },
    )
    .then((r) => r.data);
};

export const checkPhoneNumber = (phone: string) =>
  api
    .get<ApiResponse<import("@/types").PhoneNumberLookupResult>>(
      `/api/v1/sentinel/number/${encodeURIComponent(phone)}`,
    )
    .then((r) => r.data);

export const getSentinelAlerts = () =>
  api.get<ApiResponse<Alert[]>>("/api/v1/sentinel/alerts").then((r) => r.data);

export const getScenarios = () =>
  api.get<ApiResponse<unknown[]>>("/api/v1/sentinel/scenarios").then((r) => r.data);

export const getScenarioById = (id: string) =>
  api.get<ApiResponse<unknown>>(`/api/v1/sentinel/scenarios/${id}`).then((r) => r.data);

export const getScenarioAudioUrl = (id: string) =>
  `${BASE_URL}/api/v1/sentinel/scenarios/${id}/audio`;

export const sendSentinelAlert = (payload: {
  phone: string;
  message?: string;
  alert_type: string;
  threat_score?: number;
  scam_type?: string;
}) =>
  api.post<ApiResponse<unknown>>("/api/v1/sentinel/alert/send", payload).then((r) => r.data);

export const submitScamReport = (payload: {
  phone_number?: string;
  description: string;
  scam_type?: string;
  evidence_text?: string;
}) =>
  api.post<ApiResponse<unknown>>("/api/v1/sentinel/report", payload).then((r) => r.data);

export type LiveIntelStatus = {
  webhookContract: string;
  signatureRequired: boolean;
  secretConfigured: boolean;
  supportedSources: string[];
  ledger: { valid: boolean; recordCount: number; lastHash?: string };
  deploymentNote: string;
};

export type LiveIntelResult = {
  event_id: string;
  threat_score: number;
  verdict: string;
  confidence: number;
  signal_breakdown: Record<string, number>;
  reasons: string[];
  recommended_actions: string[];
  evidence_id: string;
  evidence_hash: string;
  alert_created: boolean;
  integration_trust: string;
};

export const getLiveIntelStatus = () =>
  api.get<ApiResponse<LiveIntelStatus>>("/api/v1/sentinel/integrations/status").then((r) => r.data);

export const ingestLiveIntelDemo = (payload: Record<string, unknown>) =>
  api.post<ApiResponse<LiveIntelResult>>("/api/v1/sentinel/ingest/live", payload).then((r) => r.data);

// ── NETRA ─────────────────────────────────────────────────────────────────────
export const scanCurrency = (file: File, denomination?: string) => {
  const form = new FormData();
  form.append("file", file);
  const url = denomination
    ? `/api/v1/netra/scan?denomination=${encodeURIComponent(denomination)}`
    : "/api/v1/netra/scan";
  return api
    .post<ApiResponse<NetraScanResult>>(url, form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60_000,   // 60 s — Tesseract is fast; no EasyOCR model loading
    })
    .then((r) => r.data);
};

export const getNetraStats = () =>
  api
    .get<
      ApiResponse<{
        total_scans: number;
        counterfeits: number;
        authentic: number;
      }>
    >("/api/v1/netra/stats")
    .then((r) => r.data);

export const getNetraHistory = () =>
  api
    .get<ApiResponse<NetraScanHistory[]>>("/api/v1/netra/history")
    .then((r) => r.data);

export const getNetraScanById = (id: string) =>
  api
    .get<ApiResponse<NetraScanResultExtended>>(`/api/v1/netra/scan/${id}`)
    .then((r) => r.data);

export const checkSerialNumber = (number: string) =>
  api
    .get<
      ApiResponse<{
        serial: string;
        format_valid: boolean;
        is_flagged: boolean;
        risk_level: string;
        message: string;
      }>
    >(`/api/v1/netra/serial/${number}`)
    .then((r) => r.data);

export const reportCounterfeit = (
  scanId: string,
  notes?: string,
  lat?: number,
  lng?: number,
) =>
  api
    .post<ApiResponse<{ reported: boolean; case_id: string }>>(
      "/api/v1/netra/report",
      {
        scan_id: scanId,
        notes,
        latitude: lat,
        longitude: lng,
      },
    )
    .then((r) => r.data);

// ── JAAL ──────────────────────────────────────────────────────────────────────
export const getJaalCommunities = () =>
  api
    .get<ApiResponse<FraudCommunity[]>>("/api/v1/jaal/communities")
    .then((r) => r.data);

export const getJaalGraph = (id: string) =>
  api
    .get<ApiResponse<{ nodes: GraphNode[]; edges: GraphEdge[] }>>(
      `/api/v1/jaal/graph/${id}`,
    )
    .then((r) => r.data);

export const getJaalStats = () =>
  api
    .get<
      ApiResponse<{
        total_nodes: number;
        total_edges: number;
        total_communities: number;
        high_risk_nodes: number;
        frozen_accounts: number;
        active_investigations: number;
      }>
    >("/api/v1/jaal/stats")
    .then((r) => r.data);

export const searchJaalEntities = (query: string) =>
  api
    .get<ApiResponse<JaalSearchResult[]>>("/api/v1/jaal/search", { params: { q: query } })
    .then((r) => r.data);

export const submitJaalCitizenReport = (data: JaalCitizenReportInput) =>
  api
    .post<ApiResponse<JaalCitizenReportResult>>("/api/v1/jaal/citizen-report", data)
    .then((r) => r.data);

export const traceJaalRelationships = (sourceId: string, targetId: string, maxHops = 5) =>
  api
    .post<ApiResponse<JaalTraceResult>>("/api/v1/jaal/trace", { sourceId, targetId, maxHops })
    .then((r) => r.data);

export const generateJaalEvidencePackage = (data: { communityId: string; title?: string; selectedNodeIds?: string[]; investigator?: string }) =>
  api
    .post<ApiResponse<JaalEvidencePackage>>("/api/v1/jaal/evidence-package", data)
    .then((r) => r.data);

// ── DRISHTI ───────────────────────────────────────────────────────────────────
export const getDrishtiHotspots = () =>
  api
    .get<ApiResponse<HotspotData[]>>("/api/v1/drishti/hotspots")
    .then((r) => r.data);

export const getDrishtiLiveFeed = () =>
  api
    .get<ApiResponse<LiveIncident[]>>("/api/v1/drishti/live")
    .then((r) => r.data);

// ── KAVACH ────────────────────────────────────────────────────────────────────
export const kavachChat = (message: string, sessionId: string) =>
  api
    .post<ApiResponse<KavachChatResponse>>("/api/v1/kavach/chat", {
      message,
      session_id: sessionId,
    })
    .then((r) => r.data);

export const checkNumberSafety = (phone: string) =>
  api
    .post<ApiResponse<{ safe: boolean; risk_score: number }>>(
      "/api/v1/kavach/check/number",
      {
        phone,
      },
    )
    .then((r) => r.data);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (credentials: LoginCredentials) =>
  api
    .post<ApiResponse<{ token: string; user: User }>>(
      "/api/v1/auth/login",
      credentials,
    )
    .then((r) => r.data);

export const register = (data: RegisterData) =>
  api
    .post<ApiResponse<{ token: string; user: User }>>(
      "/api/v1/auth/register",
      data,
    )
    .then((r) => r.data);

// ── WHATSAPP SCANNER ──────────────────────────────────────────────────────────
export const getWhatsAppStatus = () =>
  api
    .get<ApiResponse<import("@/types").WhatsAppStatus>>("/api/v1/whatsapp/status")
    .then((r) => r.data);

export const getWhatsAppChats = () =>
  api
    .get<ApiResponse<import("@/types").WhatsAppChat[]>>("/api/v1/whatsapp/chats")
    .then((r) => r.data);

export const analyseWhatsAppChat = (chatId: string, limit?: number) =>
  api
    .post<ApiResponse<import("@/types").ChatAnalysisResult>>(
      "/api/v1/whatsapp/analyse",
      { chat_id: chatId, limit: limit ?? 100 },
    )
    .then((r) => r.data);

export const analyseAllWhatsAppChats = () =>
  api
    .post<ApiResponse<import("@/types").BatchAnalysisResult>>(
      "/api/v1/whatsapp/analyse/all",
    )
    .then((r) => r.data);

export const disconnectWhatsApp = () =>
  api
    .post<ApiResponse<{ disconnected: boolean }>>("/api/v1/whatsapp/disconnect")
    .then((r) => r.data);

export const clearWhatsAppSession = () =>
  api
    .post<ApiResponse<{ cleared: boolean; message: string }>>("/api/v1/whatsapp/clear-session")
    .then((r) => r.data);

export const getWhatsAppMessages = (chatId: string, limit?: number) =>
  api
    .get<ApiResponse<{ messages: import("@/types").WhatsAppMessage[]; chatName: string; kind?: string }>>(
      `/api/v1/whatsapp/chat/${chatId}/messages`,
      { params: { limit: limit ?? 100 } },
    )
    .then((r) => r.data);

export default api;
