import axios from "axios";
import type {
  DashboardStats,
  Alert,
  SentinelAnalysisResult,
  NetraScanResult,
  NetraScanHistory,
  FraudCommunity,
  GraphNode,
  GraphEdge,
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
  timeout: 15_000,
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
    console.error("[API Error]", err?.response?.status, err?.message);
    return Promise.reject(err);
  }
);

// ── Health ────────────────────────────────────────────────────────────────────
export const healthCheck = () =>
  api.get<{ status: string }>("/health").then((r) => r.data);

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardStats = () =>
  api.get<ApiResponse<DashboardStats>>("/api/v1/dashboard/stats").then((r) => r.data);

export const getDashboardAlerts = () =>
  api.get<ApiResponse<Alert[]>>("/api/v1/dashboard/alerts").then((r) => r.data);

// ── SENTINEL ──────────────────────────────────────────────────────────────────
export const analyseText = (text: string) =>
  api
    .post<ApiResponse<SentinelAnalysisResult>>("/api/v1/sentinel/analyse/text", { text })
    .then((r) => r.data);

export const analyseAudio = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return api
    .post<ApiResponse<SentinelAnalysisResult>>("/api/v1/sentinel/analyse/audio", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const checkPhoneNumber = (phone: string) =>
  api
    .get<ApiResponse<{ risk_score: number; reports: number }>>(`/api/v1/sentinel/number/${phone}`)
    .then((r) => r.data);

export const getSentinelAlerts = () =>
  api.get<ApiResponse<Alert[]>>("/api/v1/sentinel/alerts").then((r) => r.data);

// ── NETRA ─────────────────────────────────────────────────────────────────────
export const scanCurrency = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return api
    .post<ApiResponse<NetraScanResult>>("/api/v1/netra/scan", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const getNetraStats = () =>
  api
    .get<ApiResponse<{ total_scans: number; counterfeits: number; authentic: number }>>(
      "/api/v1/netra/stats"
    )
    .then((r) => r.data);

export const getNetraHistory = () =>
  api.get<ApiResponse<NetraScanHistory[]>>("/api/v1/netra/history").then((r) => r.data);

// ── JAAL ──────────────────────────────────────────────────────────────────────
export const getJaalCommunities = () =>
  api
    .get<ApiResponse<FraudCommunity[]>>("/api/v1/jaal/communities")
    .then((r) => r.data);

export const getJaalGraph = (id: string) =>
  api
    .get<ApiResponse<{ nodes: GraphNode[]; edges: GraphEdge[] }>>(`/api/v1/jaal/graph/${id}`)
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
    .post<ApiResponse<{ safe: boolean; risk_score: number }>>("/api/v1/kavach/check/number", {
      phone,
    })
    .then((r) => r.data);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (credentials: LoginCredentials) =>
  api
    .post<ApiResponse<{ token: string; user: User }>>("/api/v1/auth/login", credentials)
    .then((r) => r.data);

export const register = (data: RegisterData) =>
  api
    .post<ApiResponse<{ token: string; user: User }>>("/api/v1/auth/register", data)
    .then((r) => r.data);

export default api;
