"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield, Eye, Network, Map, MessageCircle, LayoutDashboard,
  Settings, Sun, Moon, Layers, Activity, AlertTriangle,
  MapPin, Clock, TrendingUp, TrendingDown, Minus,
  Navigation, ChevronUp, ChevronDown, X, ExternalLink,
  RefreshCw, Filter, Radio, LogOut, Plus, Send, User,
  CheckCircle,
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAuth } from "@/components/providers/AuthContext";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { CitizenSidebar } from "@/components/layout/CitizenSidebar";

// Leaflet must be loaded client-side only (no SSR)
const LeafletMap = dynamic(() => import("@/components/ui/DrishtiLeafletMap"), { ssr: false, loading: () => (
  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#060D1A", flexDirection: "column", gap: "0.75rem" }}>
    <RefreshCw size={24} color="#F59E0B" style={{ animation: "spin 1s linear infinite" }} />
    <span style={{ fontSize: "0.8rem", color: "#888" }}>Loading map…</span>
  </div>
)});

// ── Constants ─────────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Incident {
  id: string; lat: number; lng: number;
  type: string; severity: string; timestamp: string;
  district: string; state: string; description: string; sourceModule: string;
}

interface HotspotDetailed {
  id: string; lat: number; lng: number; intensity: number;
  type: string; district: string; state: string;
  incidentCount: number; criticalCount: number;
  riskTrend: string; predictedRisk72h: number; topCrimeType: string;
  breakdown: Record<string, number>;
}

interface PredictionZone {
  gridId: string; lat: number; lng: number;
  riskScore: number; confidence: number;
  timeframe: string; predictedType: string; district: string; state: string;
}

interface PatrolRoute {
  routeId: string; unitName: string;
  waypoints: Array<{ lat: number; lng: number; label: string }>;
  coverageKm: number; estimatedMinutes: number; priority: string;
}

interface DistrictStat {
  district: string; state: string; totalIncidents: number;
  criticalCount: number; changePercent: number; riskRank: number; dominantType: string;
}

interface DrishtiStats {
  totalToday: number; criticalZones: number; activePatrols: number;
  avgResponseMin: number; hotspotCount: number; totalThisWeek: number;
}

interface CitizenReport {
  id: string; type: string; description: string;
  district: string; state: string; lat: number; lng: number;
  phone?: string; reporterName?: string; timestamp: string; status: string;
}

// ── Colours ────────────────────────────────────────────────────────────────────
const SEV_COLOR: Record<string, string> = {
  critical: "#E63A1E", high: "#F59E0B", medium: "#818CF8", low: "#6B7280",
};
const TYPE_COLOR: Record<string, string> = {
  scam: "#E63A1E", counterfeit: "#F59E0B", upi: "#818CF8",
  network: "#22D3EE", other: "#10B981",
};
const RISK_COLOR = (s: number) =>
  s >= 0.7 ? "#E63A1E" : s >= 0.5 ? "#F59E0B" : "#10B981";

// ── Sidebar ───────────────────────────────────────────────────────────────────



// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, color, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string; trend?: "up" | "down" | "neutral";
}) {
  return (
    <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-lg)", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.875rem", flex: 1, minWidth: 0 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: "0.7rem", color }}>{sub}</div>}
      </div>
      {trend && (
        <div style={{ color: trend === "up" ? "#E63A1E" : trend === "down" ? "#10B981" : "var(--text-muted)" }}>
          {trend === "up" ? <TrendingUp size={16} /> : trend === "down" ? <TrendingDown size={16} /> : <Minus size={16} />}
        </div>
      )}
    </div>
  );
}

// ── Hotspot detail drawer ─────────────────────────────────────────────────────
function HotspotDrawer({ hotspot, onClose }: { hotspot: HotspotDetailed; onClose: () => void }) {
  const total = Object.values(hotspot.breakdown).reduce((a, b) => a + b, 0) || 1;
  const trendIcon = hotspot.riskTrend === "rising"
    ? <TrendingUp size={14} color="#E63A1E" />
    : hotspot.riskTrend === "falling"
    ? <TrendingDown size={14} color="#10B981" />
    : <Minus size={14} color="#F59E0B" />;

  return (
    <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 300, background: "var(--bg-secondary)", borderLeft: "1px solid var(--bg-border)", zIndex: 30, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--bg-border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: 2 }}>
            <MapPin size={13} color="#F59E0B" />
            <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Hotspot Detail</span>
          </div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)" }}>{hotspot.district}</h3>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{hotspot.state}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}><X size={17} /></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
        {/* Risk bar */}
        <div style={{ background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", borderRadius: 10, padding: "0.875rem", marginBottom: "0.875rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
            <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Risk Score</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              {trendIcon}
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: hotspot.riskTrend === "rising" ? "#E63A1E" : hotspot.riskTrend === "falling" ? "#10B981" : "#F59E0B", textTransform: "capitalize" }}>{hotspot.riskTrend}</span>
            </div>
          </div>
          <div style={{ height: 7, background: "var(--bg-border)", borderRadius: 4, overflow: "hidden", marginBottom: "0.375rem" }}>
            <div style={{ height: "100%", width: `${hotspot.intensity * 100}%`, background: RISK_COLOR(hotspot.intensity), borderRadius: 4 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "var(--font-display)", color: RISK_COLOR(hotspot.intensity) }}>{Math.round(hotspot.intensity * 100)}</span>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>72h pred: <strong style={{ color: RISK_COLOR(hotspot.predictedRisk72h) }}>{Math.round(hotspot.predictedRisk72h * 100)}</strong></span>
          </div>
        </div>
        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.875rem" }}>
          {[
            { label: "Total", value: hotspot.incidentCount, color: "#F59E0B" },
            { label: "Critical", value: hotspot.criticalCount, color: "#E63A1E" },
            { label: "Top Crime", value: hotspot.topCrimeType.split(" ")[0], color: "#818CF8" },
            { label: "Trend", value: hotspot.riskTrend.charAt(0).toUpperCase() + hotspot.riskTrend.slice(1), color: hotspot.riskTrend === "rising" ? "#E63A1E" : "#10B981" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "var(--bg-tertiary)", borderRadius: 8, padding: "0.5rem 0.625rem" }}>
              <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{label}</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", color }}>{value}</div>
            </div>
          ))}
        </div>
        {/* Breakdown bars */}
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Crime Breakdown</div>
          {Object.entries(hotspot.breakdown).map(([type, count]) => (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
              <span style={{ fontSize: "0.65rem", color: TYPE_COLOR[type] ?? "var(--text-muted)", textTransform: "uppercase", width: 72, flexShrink: 0 }}>{type}</span>
              <div style={{ flex: 1, height: 5, background: "var(--bg-border)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(count / total) * 100}%`, background: TYPE_COLOR[type] ?? "#888", borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", width: 20, textAlign: "right" }}>{count}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: "0.75rem" }}>
            <Navigation size={13} /> Generate Patrol Route
          </button>
          <Link href="/jaal" className="btn btn-secondary" style={{ justifyContent: "center", fontSize: "0.75rem", textDecoration: "none" }}>
            <ExternalLink size={13} /> View in JAAL Network
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Citizen Report Modal ──────────────────────────────────────────────────────
const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Chandigarh","Jammu & Kashmir","Ladakh",
];

function CitizenReportModal({ onClose, onSubmitted }: {
  onClose: () => void;
  onSubmitted: (report: CitizenReport) => void;
}) {
  const [form, setForm] = useState({ type: "scam", description: "", district: "", state: "", phone: "", reporterName: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.description.trim() || !form.district.trim() || !form.state) {
      setError("Please fill in description, district, and state.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/v1/drishti/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setDone(true);
        onSubmitted(json.data as CitizenReport);
        setTimeout(onClose, 1800);
      } else {
        setError(json.error ?? "Submission failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: 16, width: "100%", maxWidth: 480, overflow: "hidden" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--bg-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(230,58,30,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={16} color="#E63A1E" />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>Report an Incident</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Your report goes live on the map instantly</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
        </div>

        {done ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <CheckCircle size={48} color="#10B981" style={{ margin: "0 auto 1rem" }} />
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.25rem", color: "#10B981", marginBottom: "0.5rem" }}>Report Received!</div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Your incident has been added to the live map.</div>
          </div>
        ) : (
          <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Type */}
            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.375rem" }}>Crime Type</label>
              <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                {["scam", "counterfeit", "upi", "network", "other"].map(t => (
                  <button key={t} onClick={() => set("type", t)} style={{ padding: "0.35rem 0.875rem", borderRadius: 100, border: `1px solid ${form.type === t ? TYPE_COLOR[t] : "var(--bg-border)"}`, background: form.type === t ? `${TYPE_COLOR[t]}18` : "transparent", color: form.type === t ? TYPE_COLOR[t] : "var(--text-secondary)", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-body)", transition: "all 150ms ease" }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.375rem" }}>Description *</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Describe what happened — caller details, amount demanded, method used..." style={{ width: "100%", padding: "0.625rem 0.875rem", background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", borderRadius: 8, color: "var(--text-primary)", fontSize: "0.875rem", fontFamily: "var(--font-body)", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* District + State */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.375rem" }}>District *</label>
                <input value={form.district} onChange={e => set("district", e.target.value)} placeholder="e.g. Mumbai" style={{ width: "100%", padding: "0.5rem 0.75rem", background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", borderRadius: 8, color: "var(--text-primary)", fontSize: "0.875rem", fontFamily: "var(--font-body)", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.375rem" }}>State *</label>
                <select value={form.state} onChange={e => set("state", e.target.value)} style={{ width: "100%", padding: "0.5rem 0.75rem", background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", borderRadius: 8, color: form.state ? "var(--text-primary)" : "var(--text-muted)", fontSize: "0.875rem", fontFamily: "var(--font-body)", outline: "none", boxSizing: "border-box" }}>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Optional fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.375rem" }}>Suspect Phone</label>
                <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 XXXXX XXXXX" style={{ width: "100%", padding: "0.5rem 0.75rem", background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", borderRadius: 8, color: "var(--text-primary)", fontSize: "0.875rem", fontFamily: "var(--font-body)", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.375rem" }}>Your Name</label>
                <input value={form.reporterName} onChange={e => set("reporterName", e.target.value)} placeholder="Anonymous" style={{ width: "100%", padding: "0.5rem 0.75rem", background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", borderRadius: 8, color: "var(--text-primary)", fontSize: "0.875rem", fontFamily: "var(--font-body)", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            {error && <div style={{ fontSize: "0.8rem", color: "#E63A1E", background: "rgba(230,58,30,0.08)", border: "1px solid rgba(230,58,30,0.2)", borderRadius: 8, padding: "0.625rem 0.875rem" }}>{error}</div>}

            <button onClick={submit} disabled={submitting} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.75rem", background: "var(--accent)", border: "none", borderRadius: 10, color: "white", fontWeight: 700, fontSize: "0.875rem", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, fontFamily: "var(--font-body)", transition: "opacity 150ms ease" }}>
              {submitting ? <RefreshCw size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : <Send size={15} />}
              {submitting ? "Submitting..." : "Submit Report to DRISHTI"}
            </button>
            <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", textAlign: "center", margin: 0 }}>
              Reports are verified by AI before escalation. Cyber Crime Helpline: <strong style={{ color: "var(--accent)" }}>1930</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DrishtiPage() {
  const { user, loading } = useAuth();

  // ── All state (before any early return) ──────────────────────────────────
  const [stats, setStats] = useState<DrishtiStats | null>(null);
  const [hotspots, setHotspots] = useState<HotspotDetailed[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [citizenReports, setCitizenReports] = useState<CitizenReport[]>([]);
  const [predictions, setPredictions] = useState<PredictionZone[]>([]);
  const [patrolRoutes, setPatrolRoutes] = useState<PatrolRoute[]>([]);
  const [districts, setDistricts] = useState<DistrictStat[]>([]);

  const [activeLayers, setActiveLayers] = useState(["Heatmap", "Hotspots", "Incidents", "Reports"]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [predTimeframe, setPredTimeframe] = useState("24h");
  const [rightTab, setRightTab] = useState<"feed" | "predictions" | "patrol" | "reports">("feed");
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotDetailed | null>(null);
  const [focusedCoords, setFocusedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [sortCol, setSortCol] = useState<keyof DistrictStat>("riskRank");
  const [sortAsc, setSortAsc] = useState(true);
  const [liveCount, setLiveCount] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval>[]>([]);

  // ── Fetchers ──────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/v1/drishti/stats`);
      const j = await r.json();
      if (j.success) setStats(j.data);
    } catch { /* ignore */ }
  }, []);

  const fetchHotspots = useCallback(async () => {
    try {
      const url = typeFilter !== "all"
        ? `${API}/api/v1/drishti/hotspots?type=${typeFilter}`
        : `${API}/api/v1/drishti/hotspots`;
      const r = await fetch(url);
      const j = await r.json();
      if (j.success) setHotspots(j.data);
    } catch { /* ignore */ }
  }, [typeFilter]);

const STATE_FALLBACKS: Record<string, [number, number]> = {
  "Tamil Nadu": [13.0827, 80.2707],
  "Maharashtra": [19.0760, 72.8777],
  "Delhi": [28.6139, 77.2090],
  "Karnataka": [12.9716, 77.5946],
  "Telangana": [17.3850, 78.4867],
  "Uttar Pradesh": [26.8467, 80.9462],
  "Haryana": [28.4595, 77.0266],
  "West Bengal": [22.5726, 88.3639],
  "Gujarat": [23.0225, 72.5714],
  "Rajasthan": [26.9124, 75.7873],
  "Kerala": [8.5241, 76.9366],
  "Andhra Pradesh": [16.5062, 80.6480],
  "Punjab": [30.9010, 75.8573],
  "Madhya Pradesh": [23.2599, 77.4126],
  "Bihar": [25.5941, 85.1376],
};

function resolveCoords(district: string, state: string, lat?: number, lng?: number): { lat: number; lng: number } {
  const isCentralFallback = typeof lat === "number" && typeof lng === "number" && Math.abs(lat - 20.5937) < 1.0 && Math.abs(lng - 78.9629) < 1.5 && !state?.includes("Maharashtra") && !district?.includes("Nagpur");
  if (typeof lat === "number" && typeof lng === "number" && !isCentralFallback) {
    return { lat, lng };
  }
  if (state && STATE_FALLBACKS[state]) {
    const [sLat, sLng] = STATE_FALLBACKS[state];
    return { lat: sLat, lng: sLng };
  }
  return { lat: lat ?? 20.5937, lng: lng ?? 78.9629 };
}

  const fetchIncidents = useCallback(async () => {
    try {
      const url = typeFilter !== "all"
        ? `${API}/api/v1/drishti/incidents?type=${typeFilter}&hours=24`
        : `${API}/api/v1/drishti/incidents?hours=24`;
      const r = await fetch(url);
      const j = await r.json();
      if (j.success) {
        const cleaned = (j.data as Incident[]).map(inc => {
          const c = resolveCoords(inc.district, inc.state, inc.lat, inc.lng);
          return { ...inc, lat: c.lat, lng: c.lng };
        });
        setIncidents(cleaned);
        setLiveCount(cleaned.length);
      }
    } catch { /* ignore */ }
  }, [typeFilter]);

  const fetchPredictions = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/v1/drishti/predictions/${predTimeframe}`);
      const j = await r.json();
      if (j.success) setPredictions(j.data);
    } catch { /* ignore */ }
  }, [predTimeframe]);

  const fetchPatrol = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/v1/drishti/patrol-routes`);
      const j = await r.json();
      if (j.success) setPatrolRoutes(j.data);
    } catch { /* ignore */ }
  }, []);

  const fetchDistricts = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/v1/drishti/districts`);
      const j = await r.json();
      if (j.success) setDistricts(j.data);
    } catch { /* ignore */ }
  }, []);

  const fetchCitizenReports = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/v1/drishti/citizen-reports`);
      const j = await r.json();
      if (j.success) {
        const cleaned = (j.data as CitizenReport[]).map(cr => {
          const c = resolveCoords(cr.district, cr.state, cr.lat, cr.lng);
          return { ...cr, lat: c.lat, lng: c.lng };
        });
        setCitizenReports(cleaned);
      }
    } catch { /* ignore */ }
  }, []);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in at all — go to admin login.
        window.location.href = "/admin";
      } else if (!user.isAdmin) {
        window.location.href = "/dashboard";
      }
    }
  }, [user, loading]);

  // Initial data load
  useEffect(() => {
    fetchStats();
    fetchHotspots();
    fetchIncidents();
    fetchPredictions();
    fetchPatrol();
    fetchDistricts();
    fetchCitizenReports();
  }, []); // Run once on mount

  // Refetch when filters change (skip initial mount to avoid duplicate calls)
  const isMountedRef = useRef(false);
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    fetchHotspots();
    fetchIncidents();
  }, [typeFilter]);

  useEffect(() => {
    fetchPredictions();
  }, [predTimeframe]);

  // Live polling
  useEffect(() => {
    const ids = [
      setInterval(fetchStats, 30_000),
      setInterval(fetchIncidents, 8_000),
      setInterval(fetchHotspots, 60_000),
      setInterval(fetchCitizenReports, 10_000),
    ];
    intervalRef.current = ids;
    return () => ids.forEach(clearInterval);
  }, [fetchStats, fetchIncidents, fetchHotspots, fetchCitizenReports]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toggleLayer = (l: string) =>
    setActiveLayers(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);

  const handleSort = (col: keyof DistrictStat) => {
    if (sortCol === col) setSortAsc(a => !a);
    else { setSortCol(col); setSortAsc(true); }
  };

  const sortedDistricts = [...districts].sort((a, b) => {
    const av = a[sortCol]; const bv = b[sortCol];
    const cmp = typeof av === "number" && typeof bv === "number"
      ? av - bv : String(av).localeCompare(String(bv));
    return sortAsc ? cmp : -cmp;
  });

  const fmtTime = (ts: string) => {
    try { return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }); }
    catch { return ts; }
  };

  const handleNewReport = (report: CitizenReport) => {
    const coords = resolveCoords(report.district, report.state, report.lat, report.lng);
    const cleanedReport = { ...report, lat: coords.lat, lng: coords.lng };
    setCitizenReports(prev => [cleanedReport, ...prev]);
    
    // Prepend directly to incidents so it instantly shows at top of LIVE INCIDENTS feed
    const newInc: Incident = {
      id: report.id,
      lat: coords.lat,
      lng: coords.lng,
      type: report.type,
      severity: report.type === "scam" ? "critical" : (report.type === "upi" || report.type === "counterfeit") ? "high" : "medium",
      timestamp: report.timestamp || new Date().toISOString(),
      district: report.district,
      state: report.state,
      description: `Citizen Report: ${report.description}`,
      sourceModule: "CITIZEN_PORTAL",
    };
    setIncidents(prev => [newInc, ...prev.filter(i => i.id !== report.id)]);

    setLiveCount(c => c + 1);
    if (stats) setStats(s => s ? { ...s, totalToday: s.totalToday + 1 } : s);
    setActiveLayers(prev => prev.includes("Reports") ? prev : [...prev, "Reports"]);
    setRightTab("feed");
    setFocusedCoords({ lat: coords.lat, lng: coords.lng });
  };

  const LAYERS = ["Heatmap", "Hotspots", "Predictions", "Patrol", "Incidents", "Reports"];

  // ── Auth guard ────────────────────────────────────────────────────────────
  if (loading || !user || !user.isAdmin) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)", color: "var(--text-secondary)" }}>
        <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>Verifying Admin credentials...</div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-primary)" }}>
      {user.isAdmin ? <AdminSidebar /> : <CitizenSidebar />}
      {showReportModal && (
        <CitizenReportModal
          onClose={() => setShowReportModal(false)}
          onSubmitted={handleNewReport}
        />
      )}

      <main style={{ marginLeft: 240, flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "0.875rem 1.5rem", borderBottom: "1px solid var(--bg-border)", background: "var(--bg-secondary)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Map size={18} color="#F59E0B" />
            </div>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)", lineHeight: 1 }}>DRISHTI — Geospatial Command Centre</h1>
              <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: 2 }}>Real-time crime mapping · Hotspot prediction · Citizen reporting · Patrol coordination</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ display: "flex", gap: "0.25rem", background: "var(--bg-tertiary)", padding: "0.25rem", borderRadius: 8, border: "1px solid var(--bg-border)" }}>
              {["all", "scam", "counterfeit", "upi", "network"].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: "0.3rem 0.7rem", borderRadius: 6, border: "none", cursor: "pointer", fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-body)", background: typeFilter === t ? (t === "all" ? "var(--accent)" : TYPE_COLOR[t]) : "transparent", color: typeFilter === t ? "white" : "var(--text-muted)", transition: "all 150ms ease" }}>
                  {t}
                </button>
              ))}
            </div>
            <button onClick={() => setShowReportModal(true)} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 1rem", background: "rgba(230,58,30,0.12)", border: "1px solid rgba(230,58,30,0.3)", borderRadius: 8, cursor: "pointer", color: "#E63A1E", fontSize: "0.75rem", fontWeight: 700, fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}>
              <Plus size={14} /> Report Incident
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <Radio size={11} color="#10B981" />
              <span style={{ fontSize: "0.73rem", fontWeight: 600, color: "#10B981" }}>{liveCount} Live</span>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ padding: "0.75rem 1.5rem", borderBottom: "1px solid var(--bg-border)", background: "var(--bg-secondary)", display: "flex", gap: "0.875rem", flexShrink: 0 }}>
          <KpiCard label="Incidents Today" value={stats?.totalToday ?? "—"} icon={<AlertTriangle size={17} color="#E63A1E" />} color="#E63A1E" trend="up" />
          <KpiCard label="Critical Zones" value={stats?.criticalZones ?? "—"} sub={`${stats?.hotspotCount ?? 0} hotspots`} icon={<MapPin size={17} color="#F59E0B" />} color="#F59E0B" trend="up" />
          <KpiCard label="Active Patrols" value={stats?.activePatrols ?? "—"} icon={<Navigation size={17} color="#10B981" />} color="#10B981" trend="neutral" />
          <KpiCard label="Avg Response" value={stats ? `${stats.avgResponseMin}m` : "—"} sub="Target: < 5 min" icon={<Clock size={17} color="#22D3EE" />} color="#22D3EE" trend="down" />
          <KpiCard label="Citizen Reports" value={citizenReports.length} sub="via DRISHTI portal" icon={<User size={17} color="#818CF8" />} color="#818CF8" trend="neutral" />
        </div>

        {/* Map + Right Panel */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

          {/* MAP */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            {/* Layer controls */}
            <div style={{ position: "absolute", top: "1rem", left: "1rem", zIndex: 1000, background: "rgba(6,13,26,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "0.875rem", backdropFilter: "blur(8px)", minWidth: 130 }}>
              <p style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <Layers size={10} /> Layers
              </p>
              {LAYERS.map(layer => (
                <button key={layer} onClick={() => toggleLayer(layer)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.5rem", borderRadius: 6, background: activeLayers.includes(layer) ? "rgba(245,158,11,0.1)" : "transparent", border: `1px solid ${activeLayers.includes(layer) ? "rgba(245,158,11,0.3)" : "transparent"}`, cursor: "pointer", color: activeLayers.includes(layer) ? "#F59E0B" : "var(--text-muted)", fontSize: "0.7rem", fontWeight: 500, width: "100%", marginBottom: "0.2rem", transition: "all 150ms ease", fontFamily: "var(--font-body)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: activeLayers.includes(layer) ? "#F59E0B" : "var(--bg-border)", flexShrink: 0 }} />
                  {layer}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div style={{ position: "absolute", bottom: "1rem", left: "1rem", zIndex: 1000, background: "rgba(6,13,26,0.9)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "0.5rem 0.875rem", display: "flex", gap: "1rem", alignItems: "center", backdropFilter: "blur(8px)", flexWrap: "wrap" }}>
              {[
                { color: "#E63A1E", label: "Critical" },
                { color: "#F59E0B", label: "Hotspot" },
                { color: "#22D3EE", label: "Patrol" },
                { color: "#818CF8", label: "Prediction" },
                { color: "#10B981", label: "Citizen Report" },
              ].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                  <span style={{ fontSize: "0.63rem", color: "#ccc" }}>{l.label}</span>
                </div>
              ))}
            </div>

            {/* Leaflet Map */}
            <LeafletMap
              incidents={activeLayers.includes("Incidents") ? incidents : []}
              hotspots={activeLayers.includes("Hotspots") ? hotspots : []}
              predictions={activeLayers.includes("Predictions") ? predictions : []}
              patrolRoutes={activeLayers.includes("Patrol") ? patrolRoutes : []}
              citizenReports={activeLayers.includes("Reports") ? citizenReports : []}
              showHeatmap={activeLayers.includes("Heatmap")}
              onHotspotClick={(h) => setSelectedHotspot(selectedHotspot?.id === h.id ? null : h)}
              focusedCoords={focusedCoords}
            />

            {/* Hotspot drawer overlaying map */}
            {selectedHotspot && (
              <HotspotDrawer hotspot={selectedHotspot} onClose={() => setSelectedHotspot(null)} />
            )}
          </div>


          {/* RIGHT PANEL */}
          <div style={{ width: 310, flexShrink: 0, background: "var(--bg-secondary)", borderLeft: "1px solid var(--bg-border)", display: "flex", flexDirection: "column" }}>
            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--bg-border)", flexShrink: 0 }}>
              {(["feed", "predictions", "patrol", "reports"] as const).map(tab => (
                <button key={tab} onClick={() => setRightTab(tab)} style={{ flex: 1, padding: "0.625rem 0.125rem", border: "none", cursor: "pointer", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", fontFamily: "var(--font-body)", background: "transparent", color: rightTab === tab ? "var(--accent)" : "var(--text-muted)", borderBottom: `2px solid ${rightTab === tab ? "var(--accent)" : "transparent"}`, transition: "all 150ms ease", position: "relative" }}>
                  {tab === "feed" ? "Live Feed" : tab === "predictions" ? "Predict" : tab === "patrol" ? "Patrol" : "Reports"}
                  {tab === "reports" && citizenReports.length > 0 && (
                    <span style={{ position: "absolute", top: 4, right: 4, width: 6, height: 6, borderRadius: "50%", background: "#E63A1E" }} />
                  )}
                </button>
              ))}
            </div>

            {/* Live Feed */}
            {rightTab === "feed" && (
              <div style={{ flex: 1, overflowY: "auto" }}>
                <div style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--bg-border)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <Activity size={11} color="#10B981" />
                  <span style={{ fontSize: "0.63rem", fontWeight: 700, color: "#10B981", letterSpacing: "0.08em" }}>LIVE INCIDENTS</span>
                  <span style={{ marginLeft: "auto", fontSize: "0.58rem", color: "var(--text-muted)" }}>auto-refresh 8s</span>
                </div>
                {incidents.length === 0 ? (
                  <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>Loading incidents…</div>
                ) : (
                  incidents.map((inc, i) => (
                    <div
                      key={inc.id}
                      onClick={() => setFocusedCoords({ lat: inc.lat, lng: inc.lng })}
                      style={{
                        padding: "0.625rem 0.875rem",
                        borderBottom: "1px solid var(--bg-border)",
                        borderLeft: `3px solid ${SEV_COLOR[inc.severity] ?? "#888"}`,
                        background: i === 0 ? `${SEV_COLOR[inc.severity] ?? "#888"}08` : undefined,
                        cursor: "pointer",
                        transition: "background 150ms ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i === 0 ? `${SEV_COLOR[inc.severity] ?? "#888"}08` : "transparent")}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.375rem" }}>
                        <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3, margin: 0 }}>{inc.description || inc.type}</p>
                        <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", flexShrink: 0 }}>{fmtTime(inc.timestamp)}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
                        <MapPin size={9} color="var(--text-muted)" />
                        <span style={{ fontSize: "0.67rem", color: "var(--text-muted)" }}>{inc.district}, {inc.state}</span>
                        {inc.sourceModule === "CITIZEN_PORTAL" && (
                          <span style={{ fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", padding: "0.1rem 0.35rem", borderRadius: 100, background: "rgba(129,140,248,0.2)", color: "#818CF8", border: "1px solid rgba(129,140,248,0.3)" }}>
                            Citizen Report
                          </span>
                        )}
                        <span style={{ marginLeft: "auto", fontSize: "0.57rem", fontWeight: 700, textTransform: "uppercase", padding: "0.1rem 0.35rem", borderRadius: 100, background: `${SEV_COLOR[inc.severity] ?? "#888"}20`, color: SEV_COLOR[inc.severity] ?? "#888" }}>{inc.severity}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Predictions */}
            {rightTab === "predictions" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ padding: "0.625rem 0.875rem", borderBottom: "1px solid var(--bg-border)", display: "flex", gap: "0.375rem" }}>
                  {["24h", "48h", "72h"].map(tf => (
                    <button key={tf} onClick={() => { setPredTimeframe(tf); if (!activeLayers.includes("Predictions")) toggleLayer("Predictions"); }} style={{ flex: 1, padding: "0.3rem 0", border: `1px solid ${predTimeframe === tf ? "var(--accent)" : "var(--bg-border)"}`, borderRadius: 6, background: predTimeframe === tf ? "var(--accent)" : "transparent", color: predTimeframe === tf ? "white" : "var(--text-secondary)", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 150ms ease" }}>
                      {tf}
                    </button>
                  ))}
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0.625rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {predictions.map(p => (
                    <div key={p.gridId} style={{ background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", borderRadius: 8, padding: "0.625rem 0.75rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.375rem" }}>
                        <div>
                          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{p.district}</div>
                          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{p.state}</div>
                        </div>
                        <span style={{ fontSize: "0.6rem", fontWeight: 700, color: TYPE_COLOR[p.predictedType] ?? "var(--text-muted)", background: `${TYPE_COLOR[p.predictedType] ?? "#888"}18`, padding: "0.15rem 0.4rem", borderRadius: 100 }}>
                          {p.predictedType.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ height: 4, background: "var(--bg-border)", borderRadius: 3, overflow: "hidden", marginBottom: "0.3rem" }}>
                        <div style={{ height: "100%", width: `${p.riskScore * 100}%`, background: RISK_COLOR(p.riskScore), borderRadius: 3 }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: RISK_COLOR(p.riskScore) }}>Risk: {Math.round(p.riskScore * 100)}%</span>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Conf: {Math.round(p.confidence * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Patrol */}
            {rightTab === "patrol" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem" }}>
                {patrolRoutes.map(route => (
                  <div key={route.routeId} style={{ background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", borderRadius: 10, padding: "0.875rem", marginBottom: "0.625rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.25rem" }}>
                      <Navigation size={11} color={route.priority === "high" ? "#22D3EE" : "#818CF8"} />
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, color: route.priority === "high" ? "#22D3EE" : "#818CF8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{route.priority} PRIORITY</span>
                    </div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>{route.unitName}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.5rem" }}>
                      <div style={{ background: "var(--bg-secondary)", borderRadius: 6, padding: "0.35rem 0.5rem" }}>
                        <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Coverage</div>
                        <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#10B981" }}>{route.coverageKm} km</div>
                      </div>
                      <div style={{ background: "var(--bg-secondary)", borderRadius: 6, padding: "0.35rem 0.5rem" }}>
                        <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", textTransform: "uppercase" }}>ETA</div>
                        <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#F59E0B" }}>{route.estimatedMinutes < 60 ? `${route.estimatedMinutes}m` : `${Math.floor(route.estimatedMinutes / 60)}h ${route.estimatedMinutes % 60}m`}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: "0.63rem", color: "var(--text-muted)" }}>
                      {route.waypoints.map(w => w.label).join(" → ")}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Citizen Reports */}
            {rightTab === "reports" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--bg-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <User size={11} color="#818CF8" />
                    <span style={{ fontSize: "0.63rem", fontWeight: 700, color: "#818CF8", letterSpacing: "0.08em" }}>CITIZEN REPORTS</span>
                  </div>
                  <button onClick={() => setShowReportModal(true)} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.5rem", background: "rgba(230,58,30,0.12)", border: "1px solid rgba(230,58,30,0.25)", borderRadius: 6, cursor: "pointer", color: "#E63A1E", fontSize: "0.6rem", fontWeight: 700, fontFamily: "var(--font-body)" }}>
                    <Plus size={10} /> New
                  </button>
                </div>
                {citizenReports.length === 0 ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem", color: "var(--text-muted)", padding: "2rem" }}>
                    <User size={28} opacity={0.3} />
                    <div style={{ textAlign: "center", fontSize: "0.8rem" }}>No citizen reports yet.</div>
                    <button onClick={() => setShowReportModal(true)} style={{ padding: "0.5rem 1rem", background: "var(--accent)", border: "none", borderRadius: 8, color: "white", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                      Submit First Report
                    </button>
                  </div>
                ) : (
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    {citizenReports.map((cr, i) => (
                      <div
                        key={cr.id}
                        onClick={() => setFocusedCoords({ lat: cr.lat, lng: cr.lng })}
                        style={{
                          padding: "0.625rem 0.875rem",
                          borderBottom: "1px solid var(--bg-border)",
                          borderLeft: `3px solid ${TYPE_COLOR[cr.type] ?? "#818CF8"}`,
                          background: i === 0 ? `${TYPE_COLOR[cr.type] ?? "#818CF8"}08` : undefined,
                          cursor: "pointer",
                          transition: "background 150ms ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = i === 0 ? `${TYPE_COLOR[cr.type] ?? "#818CF8"}08` : "transparent")}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.375rem", marginBottom: "0.25rem" }}>
                          <span style={{ fontSize: "0.58rem", fontWeight: 700, textTransform: "uppercase", color: TYPE_COLOR[cr.type] ?? "#818CF8", background: `${TYPE_COLOR[cr.type] ?? "#818CF8"}18`, padding: "0.1rem 0.35rem", borderRadius: 100 }}>{cr.type}</span>
                          <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", flexShrink: 0 }}>{fmtTime(cr.timestamp)}</span>
                        </div>
                        <p style={{ fontSize: "0.78rem", color: "var(--text-primary)", lineHeight: 1.35, margin: "0 0 0.25rem" }}>{cr.description}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <MapPin size={9} color="var(--text-muted)" />
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{cr.district}, {cr.state}</span>
                          <span style={{ marginLeft: "auto", fontSize: "0.57rem", fontWeight: 600, color: "#10B981", background: "rgba(16,185,129,0.1)", padding: "0.1rem 0.35rem", borderRadius: 100 }}>{cr.status}</span>
                        </div>
                        {cr.reporterName && (
                          <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                            Reported by: {cr.reporterName}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* District Table */}
        <div style={{ flexShrink: 0, background: "var(--bg-secondary)", borderTop: "1px solid var(--bg-border)", maxHeight: 190, overflow: "hidden" }}>
          <div style={{ padding: "0.4rem 1.5rem", borderBottom: "1px solid var(--bg-border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Filter size={11} color="var(--text-muted)" />
            <span style={{ fontSize: "0.63rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>District Intelligence</span>
          </div>
          <div style={{ overflowY: "auto", maxHeight: 148 }}>
            <table className="data-table" style={{ fontSize: "0.75rem" }}>
              <thead>
                <tr>
                  {([
                    { key: "riskRank", label: "Rank" },
                    { key: "district", label: "District" },
                    { key: "state", label: "State" },
                    { key: "totalIncidents", label: "Incidents" },
                    { key: "criticalCount", label: "Critical" },
                    { key: "changePercent", label: "Change %" },
                    { key: "dominantType", label: "Top Crime" },
                  ] as { key: keyof DistrictStat; label: string }[]).map(({ key, label }) => (
                    <th key={key} onClick={() => handleSort(key)} style={{ cursor: "pointer", userSelect: "none", paddingTop: "0.4rem", paddingBottom: "0.4rem" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                        {label}
                        {sortCol === key && (sortAsc ? <ChevronUp size={9} /> : <ChevronDown size={9} />)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedDistricts.map(d => (
                  <tr key={d.district}>
                    <td style={{ color: "var(--text-muted)", fontWeight: 700 }}>#{d.riskRank}</td>
                    <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>{d.district}</td>
                    <td>{d.state}</td>
                    <td style={{ fontWeight: 700, color: "var(--text-primary)" }}>{d.totalIncidents}</td>
                    <td style={{ color: "#E63A1E", fontWeight: 600 }}>{d.criticalCount}</td>
                    <td style={{ fontWeight: 700, color: d.changePercent > 0 ? "#E63A1E" : "#10B981" }}>
                      {d.changePercent > 0 ? "▲" : "▼"} {Math.abs(d.changePercent).toFixed(1)}%
                    </td>
                    <td>
                      <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "0.12rem 0.4rem", borderRadius: 100, background: `${TYPE_COLOR[d.dominantType] ?? "#888"}18`, color: TYPE_COLOR[d.dominantType] ?? "var(--text-muted)", border: `1px solid ${TYPE_COLOR[d.dominantType] ?? "#888"}28` }}>
                        {d.dominantType.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-glow { 0%,100%{opacity:1;} 50%{opacity:.4;} }
      `}</style>
    </div>
  );
}
