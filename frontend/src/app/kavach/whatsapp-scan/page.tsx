"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield, Eye, Network, Map, MessageCircle, LayoutDashboard,
  Settings, Sun, Moon, LogOut, QrCode, Scan, ShieldCheck,
  ShieldAlert, ShieldX, AlertTriangle, CheckCircle2, XCircle,
  ChevronDown, ChevronRight, Search, Users, User as UserIcon,
  Wifi, WifiOff, Loader2, Smartphone, ArrowLeft, RefreshCw,
  MessageSquare, Clock, Zap, BarChart3, FileWarning, Info,
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAuth } from "@/components/providers/AuthContext";
import {
  getWhatsAppStatus,
  getWhatsAppChats,
  analyseWhatsAppChat,
  analyseAllWhatsAppChats,
  disconnectWhatsApp,
  clearWhatsAppSession,
} from "@/lib/api";
import type {
  WhatsAppChat,
  ChatAnalysisResult,
  BatchAnalysisResult,
  FlaggedMessage,
} from "@/types";

// ── Navigation sidebar (shared pattern from Kavach page) ────────────────────

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "SENTINEL", href: "/sentinel", icon: Shield, color: "#E63A1E" },
  { label: "NETRA", href: "/netra", icon: Eye, color: "#10B981" },
  { label: "JAAL", href: "/jaal", icon: Network, color: "#818CF8" },
  { label: "DRISHTI", href: "/drishti", icon: Map, color: "#F59E0B" },
  { label: "KAVACH", href: "/kavach", icon: MessageCircle, color: "#22D3EE" },
  { label: "Settings", href: "/settings", icon: Settings },
];

function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  return (
    <aside style={{ width: "240px", flexShrink: 0, backgroundColor: "var(--bg-secondary)", borderRight: "1px solid var(--bg-border)", display: "flex", flexDirection: "column", padding: "1.5rem 1rem", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50, overflowY: "auto" }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", marginBottom: "2rem", padding: "0 0.5rem" }}>
        <div style={{ width: "32px", height: "32px", background: "var(--accent)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shield size={17} color="white" strokeWidth={2.5} />
        </div>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>
          RAKSHA<span style={{ color: "var(--accent)" }}>·AI</span>
        </span>
      </Link>
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {navItems.map(({ label, href, icon: Icon, color }) => {
          const isActive = pathname?.startsWith(href);
          return (
            <Link key={label} href={href} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0.875rem", borderRadius: "var(--radius-md)", textDecoration: "none", fontSize: "0.8125rem", fontWeight: isActive ? 600 : 500, color: isActive ? "var(--text-primary)" : "var(--text-secondary)", backgroundColor: isActive ? "var(--bg-tertiary)" : "transparent", borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent", transition: "all 150ms ease" }}>
              <Icon size={17} color={isActive ? "var(--accent)" : (color || "currentColor")} strokeWidth={2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--bg-border)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {user && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0 0.5rem" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Account</span>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={user.name}>{user.name}</span>
          </div>
        )}
        <button onClick={toggleTheme} style={{ display: "flex", alignItems: "center", gap: "0.625rem", width: "100%", padding: "0.625rem 0.875rem", background: "none", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "var(--font-body)" }}>
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        {user && (
          <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: "0.625rem", width: "100%", padding: "0.625rem 0.875rem", background: "rgba(230,58,30,0.1)", border: "1px solid rgba(230,58,30,0.2)", borderRadius: "var(--radius-md)", cursor: "pointer", color: "var(--accent)", fontSize: "0.8125rem", fontWeight: 600, fontFamily: "var(--font-body)" }}>
            <LogOut size={14} />
            Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}

// ── Helper: Risk level badge ────────────────────────────────────────────────

const riskColors: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "rgba(220,38,38,0.15)", text: "#EF4444", border: "rgba(220,38,38,0.3)" },
  high: { bg: "rgba(249,115,22,0.15)", text: "#F97316", border: "rgba(249,115,22,0.3)" },
  medium: { bg: "rgba(234,179,8,0.15)", text: "#EAB308", border: "rgba(234,179,8,0.3)" },
  low: { bg: "rgba(34,197,94,0.12)", text: "#22C55E", border: "rgba(34,197,94,0.2)" },
  safe: { bg: "rgba(34,197,94,0.12)", text: "#22C55E", border: "rgba(34,197,94,0.2)" },
  unknown: { bg: "rgba(100,116,139,0.15)", text: "#94A3B8", border: "rgba(100,116,139,0.3)" },
};

function RiskBadge({ level, size = "sm" }: { level: string; size?: "sm" | "md" }) {
  const c = riskColors[level] || riskColors.safe;
  const pad = size === "md" ? "0.375rem 0.875rem" : "0.2rem 0.5rem";
  const fs = size === "md" ? "0.75rem" : "0.6875rem";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: pad, borderRadius: "999px", background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontSize: fs, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase" }}>
      {level === "critical" || level === "high" ? <ShieldAlert size={12} /> : level === "safe" || level === "low" ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
      {level}
    </span>
  );
}

// ── Threat type badge ───────────────────────────────────────────────────────

function ThreatBadge({ type }: { type: string }) {
  return (
    <span style={{ display: "inline-flex", padding: "0.15rem 0.5rem", borderRadius: "4px", background: "rgba(139,92,246,0.15)", color: "#A78BFA", border: "1px solid rgba(139,92,246,0.25)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
      {type}
    </span>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

type PageState = "connect" | "chatlist" | "scanning" | "results";

export default function WhatsAppScanPage() {
  const { user, loading: authLoading, registerCitizen } = useAuth();

  const [pageState, setPageState] = useState<PageState>("connect");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [chatSearch, setChatSearch] = useState("");
  const [scanningChatName, setScanningChatName] = useState("");
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [singleResult, setSingleResult] = useState<ChatAnalysisResult | null>(null);
  const [batchResult, setBatchResult] = useState<BatchAnalysisResult | null>(null);
  const [expandedChats, setExpandedChats] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [sessionStale, setSessionStale] = useState(false);
  const [clearingSession, setClearingSession] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Auth check ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        window.location.href = "/login";
      } else if (!user.isCitizen) {
        registerCitizen();
      }
    }
  }, [user, authLoading, registerCitizen]);

  // ── WebSocket connection to backend for QR/events ─────────────────────
  useEffect(() => {
    const wsUrl = (process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000") + "/ws/whatsapp";
    let ws: WebSocket;

    function connect() {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
        setError(null);
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          handleWsEvent(msg);
        } catch { /* ignore */ }
      };

      ws.onerror = () => {
        setWsConnected(false);
        // Fallback to HTTP polling if WS fails
        startPolling();
      };

      ws.onclose = () => {
        setWsConnected(false);
      };

      wsRef.current = ws;
    }

    connect();

    return () => {
      if (ws) ws.close();
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleWsEvent = useCallback((msg: { event: string; data: Record<string, unknown> }) => {
    switch (msg.event) {
      case "qr":
        setQrDataUrl(msg.data.qr as string);
        setPageState("connect");
        break;
      case "authenticated":
        setQrDataUrl(null);
        break;
      case "ready":
        setConnectedPhone(msg.data.phone as string);
        setPageState("chatlist");
        // Delay chat loading — WhatsApp Web needs a moment to sync chats
        setTimeout(() => loadChatsWithRetry(), 3000);
        break;
      case "status":
        if (msg.data.connected) {
          setConnectedPhone(msg.data.phone as string);
          setPageState("chatlist");
          setTimeout(() => loadChatsWithRetry(), 2000);
        }
        break;
      case "disconnected":
        setPageState("connect");
        setConnectedPhone(null);
        setQrDataUrl(null);
        setChats([]);
        if ((msg.data.reason as string) === "session_cleared") {
          setSessionStale(false);
        }
        break;
    }
  }, []);

  function startPolling() {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await getWhatsAppStatus();
        if (res.data?.connected) {
          setConnectedPhone(res.data.phone);
          setPageState("chatlist");
          setTimeout(() => loadChatsWithRetry(), 2000);
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch { /* bridge not running */ }
    }, 3000);
  }

  async function loadChatsWithRetry(attempt = 1, maxAttempts = 5) {
    try {
      const res = await getWhatsAppChats();
      const chatList = res.data as WhatsAppChat[] | undefined;
      if (chatList && chatList.length > 0) {
        setChats(chatList);
        setError(null);
        // If ALL chats are groups and no personal contacts after multiple attempts
        // it likely means the session is stale (init-query timeout)
        const hasPersonal = chatList.some((c) => !c.isGroup);
        if (!hasPersonal && attempt >= 3) setSessionStale(true);
        else setSessionStale(false);
      } else if (attempt < maxAttempts) {
        setTimeout(() => loadChatsWithRetry(attempt + 1, maxAttempts), 2000);
      } else {
        setChats([]);
        setError(null);
      }
    } catch (err) {
      if (attempt < maxAttempts) {
        setTimeout(() => loadChatsWithRetry(attempt + 1, maxAttempts), 2000);
      } else {
        setError("Failed to load chats. Ensure WhatsApp bridge is running.");
      }
    }
  }

  // ── Scan single chat ──────────────────────────────────────────────────
  async function scanChat(chat: WhatsAppChat) {
    setPageState("scanning");
    setScanningChatName(chat.name);
    setScanProgress({ current: 1, total: 1 });
    setError(null);

    try {
      const res = await analyseWhatsAppChat(chat.id, 100);
      if (res.data) {
        setSingleResult(res.data as ChatAnalysisResult);
        setBatchResult(null);
        setPageState("results");
      } else {
        setError(res.error || "Analysis failed");
        setPageState("chatlist");
      }
    } catch (err) {
      setError("Analysis failed. Check Groq API key and bridge connection.");
      setPageState("chatlist");
    }
  }

  // ── Scan all chats ────────────────────────────────────────────────────
  async function scanAllChats() {
    setPageState("scanning");
    setScanningChatName("All Chats");
    setScanProgress({ current: 0, total: chats.length });
    setError(null);

    try {
      const res = await analyseAllWhatsAppChats();
      if (res.data) {
        setBatchResult(res.data as BatchAnalysisResult);
        setSingleResult(null);
        setPageState("results");
      } else {
        setError(res.error || "Batch analysis failed");
        setPageState("chatlist");
      }
    } catch (err) {
      setError("Batch analysis failed. Check Groq API key.");
      setPageState("chatlist");
    }
  }

  // ── Disconnect ────────────────────────────────────────────────────────
  async function handleDisconnect() {
    try {
      await disconnectWhatsApp();
    } catch { /* ignore */ }
    setPageState("connect");
    setConnectedPhone(null);
    setChats([]);
    setQrDataUrl(null);
    setSingleResult(null);
    setBatchResult(null);
    setSessionStale(false);
  }

  // ── Clear stale session (re-authenticate) ─────────────────────────────
  async function handleClearSession() {
    setClearingSession(true);
    try {
      await clearWhatsAppSession();
      setPageState("connect");
      setConnectedPhone(null);
      setChats([]);
      setQrDataUrl(null);
      setSingleResult(null);
      setBatchResult(null);
      setSessionStale(false);
      setError(null);
    } catch {
      setError("Failed to reset session. Restart the WhatsApp bridge manually.");
    } finally {
      setClearingSession(false);
    }
  }

  // ── Toggle expanded chat in results ───────────────────────────────────
  function toggleExpand(id: string) {
    setExpandedChats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ── Filtered chats ───────────────────────────────────────────────────
  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(chatSearch.toLowerCase())
  );

  if (authLoading || !user) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)", color: "var(--text-secondary)" }}>
        <Loader2 size={24} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "var(--bg-primary)" }}>
      <Sidebar />
      <main style={{ marginLeft: "240px", flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ padding: "1.5rem 2rem 0 2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Link href="/kavach" style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8125rem" }}>
                <ArrowLeft size={16} />
                KAVACH
              </Link>
              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>›</span>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)", fontWeight: 600 }}>WhatsApp Scanner</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.25rem 0.625rem", borderRadius: "999px", background: wsConnected ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${wsConnected ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, fontSize: "0.6875rem", color: wsConnected ? "#22C55E" : "#EF4444" }}>
                {wsConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
                {wsConnected ? "Live" : "Offline"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(37,211,102,0.3)" }}>
              <MessageSquare size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.5rem", color: "var(--text-primary)", margin: 0 }}>
                WhatsApp Chat Scanner
              </h1>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0 }}>
                Connect your WhatsApp • AI scans your chats for scams & threats
              </p>
            </div>
          </div>
        </div>

        {/* ── Error banner ───────────────────────────────────────────────── */}
        {error && (
          <div style={{ margin: "0 2rem 1rem", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <XCircle size={16} />
            {error}
            <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#EF4444", cursor: "pointer", padding: "0.25rem" }}>
              <XCircle size={14} />
            </button>
          </div>
        )}

        {/* ── State: Connect (QR Code) ───────────────────────────────────── */}
        {pageState === "connect" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
            <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
              {/* Animated shield + WhatsApp icon */}
              <div style={{ position: "relative", width: "80px", height: "80px", margin: "0 auto 2rem", borderRadius: "20px", background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px rgba(37,211,102,0.3)", animation: "pulse-glow 2s ease-in-out infinite" }}>
                <QrCode size={36} color="white" />
                <div style={{ position: "absolute", top: "-4px", right: "-4px", width: "24px", height: "24px", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--bg-primary)" }}>
                  <ShieldCheck size={12} color="white" />
                </div>
              </div>

              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.375rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Connect Your WhatsApp
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: 1.6 }}>
                Scan the QR code below with your WhatsApp mobile app to connect.
                RAKSHA AI will scan your chats for potential scams, fraud, and threats.
              </p>

              {/* QR Code Display */}
              <div style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", marginBottom: "2rem", position: "relative", overflow: "hidden" }}>
                {/* Animated scanning border */}
                <div style={{ position: "absolute", inset: 0, borderRadius: "var(--radius-lg)", border: "2px solid transparent", background: "linear-gradient(var(--bg-secondary), var(--bg-secondary)) padding-box, linear-gradient(135deg, #25D366, #128C7E, #25D366) border-box", animation: "border-glow 3s linear infinite", opacity: 0.7 }} />

                {qrDataUrl ? (
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <img src={qrDataUrl} alt="WhatsApp QR Code" style={{ width: "256px", height: "256px", margin: "0 auto", display: "block", borderRadius: "12px", background: "white", padding: "8px" }} />
                    <p style={{ fontSize: "0.75rem", color: "#25D366", marginTop: "1rem", fontWeight: 600 }}>
                      ✓ QR Code Ready — Scan Now
                    </p>
                  </div>
                ) : (
                  <div style={{ position: "relative", zIndex: 1, padding: "3rem 1rem" }}>
                    <Loader2 size={32} color="#25D366" style={{ margin: "0 auto 1rem", display: "block", animation: "spin 1.5s linear infinite" }} />
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      Waiting for WhatsApp Bridge...
                    </p>
                    <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                      Make sure the bridge is running on port 3001
                    </p>
                  </div>
                )}
              </div>

              {/* Steps */}
              <div style={{ textAlign: "left", padding: "1rem 1.25rem", borderRadius: "var(--radius-md)", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                  How to connect
                </p>
                {[
                  "Open WhatsApp on your phone",
                  "Go to Settings → Linked Devices → Link a Device",
                  "Point your phone camera at the QR code above",
                  "Wait for authentication to complete",
                ].map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(37,211,102,0.15)", color: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6875rem", fontWeight: 700, flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── State: Chat List (Connected) ────────────────────────────────── */}
        {pageState === "chatlist" && (
          <div style={{ flex: 1, padding: "0 2rem 2rem" }}>
            {/* Connected banner */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.25rem", borderRadius: "var(--radius-lg)", background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(37,211,102,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Smartphone size={16} color="#25D366" />
                </div>
                <div>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#25D366", margin: 0 }}>WhatsApp Connected</p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", margin: 0 }}>{connectedPhone ? `+${connectedPhone}` : "Connected"}</p>
                </div>
              </div>
              <button onClick={handleDisconnect} style={{ padding: "0.375rem 0.875rem", borderRadius: "var(--radius-md)", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                Disconnect
              </button>
            </div>

            {/* Stale session warning */}
            {sessionStale && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", padding: "1rem 1.25rem", borderRadius: "var(--radius-md)", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)", marginBottom: "1.25rem" }}>
                <AlertTriangle size={18} color="#F97316" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#F97316", margin: "0 0 0.25rem" }}>Session stale — only groups visible, no personal chats</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0 0 0.75rem" }}>
                    The stored WhatsApp session has expired encryption keys. Personal chats and message history can’t sync until you re-authenticate.
                  </p>
                  <button
                    onClick={handleClearSession}
                    disabled={clearingSession}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)", color: "#F97316", fontSize: "0.75rem", fontWeight: 700, cursor: clearingSession ? "not-allowed" : "pointer", fontFamily: "var(--font-body)", opacity: clearingSession ? 0.6 : 1 }}
                  >
                    <RefreshCw size={13} />
                    {clearingSession ? "Clearing…" : "Reset Session & Re-scan QR"}
                  </button>
                </div>
              </div>
            )}

            {/* Stats + Scan All */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: "1rem" }}>
                {[
                  { label: "Total Chats", value: chats.length, icon: MessageSquare, color: "#25D366" },
                  { label: "Groups", value: chats.filter((c) => c.isGroup).length, icon: Users, color: "#818CF8" },
                  { label: "Contacts", value: chats.filter((c) => !c.isGroup).length, icon: UserIcon, color: "#22D3EE" },
                ].map((s) => (
                  <div key={s.label} style={{ padding: "0.5rem 1rem", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <s.icon size={14} color={s.color} />
                    <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)" }}>{s.value}</span>
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{s.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => loadChatsWithRetry()} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.625rem 1rem", borderRadius: "var(--radius-md)", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", color: "var(--text-secondary)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 150ms ease" }}>
                  <RefreshCw size={14} />
                  Refresh
                </button>
                <button onClick={scanAllChats} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.5rem", borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, #25D366, #128C7E)", border: "none", color: "white", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", boxShadow: "0 4px 16px rgba(37,211,102,0.3)", transition: "transform 150ms ease, box-shadow 150ms ease" }} onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = "translateY(-1px)"; }} onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = "translateY(0)"; }}>
                  <Scan size={16} />
                  🔍 Scan All Chats
                </button>
              </div>
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: "1rem" }}>
              <Search size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search chats..."
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                style={{ width: "100%", padding: "0.625rem 0.875rem 0.625rem 2.5rem", borderRadius: "var(--radius-md)", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", color: "var(--text-primary)", fontSize: "0.8125rem", fontFamily: "var(--font-body)", outline: "none" }}
              />
            </div>

            {/* Chat list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {filteredChats.map((chat) => (
                <div key={chat.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", transition: "border-color 150ms ease" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: chat.isGroup ? "rgba(129,140,248,0.15)" : "rgba(34,211,238,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {chat.isGroup ? <Users size={16} color="#818CF8" /> : <UserIcon size={16} color="#22D3EE" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{chat.name}</p>
                      {chat.lastMessage && (
                        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "300px" }}>
                          {chat.lastMessage}
                        </p>
                      )}
                    </div>
                    {chat.unreadCount > 0 && (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: "20px", height: "20px", borderRadius: "999px", background: "#25D366", color: "white", fontSize: "0.625rem", fontWeight: 700, padding: "0 0.25rem" }}>
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                  <button onClick={() => scanChat(chat)} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.875rem", borderRadius: "var(--radius-md)", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.2)", color: "#25D366", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", marginLeft: "0.75rem", flexShrink: 0, transition: "background 150ms ease" }}>
                    <Scan size={13} />
                    Scan
                  </button>
                </div>
              ))}

              {filteredChats.length === 0 && (
                <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  {chats.length === 0 ? (
                    <>
                      <Loader2 size={24} style={{ margin: "0 auto 0.75rem", display: "block", animation: "spin 1.5s linear infinite" }} color="var(--text-muted)" />
                      Loading chats...
                    </>
                  ) : (
                    "No chats match your search"
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── State: Scanning ────────────────────────────────────────────── */}
        {pageState === "scanning" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
            <div style={{ maxWidth: "400px", width: "100%", textAlign: "center" }}>
              {/* Pulsing shield animation */}
              <div style={{ position: "relative", width: "100px", height: "100px", margin: "0 auto 2rem" }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(37,211,102,0.1)", animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }} />
                <div style={{ position: "absolute", inset: "10px", borderRadius: "50%", background: "rgba(37,211,102,0.15)", animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite", animationDelay: "0.3s" }} />
                <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "50%", background: "linear-gradient(135deg, #25D366, #128C7E)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px rgba(37,211,102,0.4)" }}>
                  <Scan size={36} color="white" style={{ animation: "spin 3s linear infinite" }} />
                </div>
              </div>

              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Scanning Chats...
              </h2>
              <p style={{ fontSize: "0.875rem", color: "#25D366", fontWeight: 600, marginBottom: "0.5rem" }}>
                {scanningChatName}
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "2rem" }}>
                RAKSHA AI is analysing messages with Groq for potential threats
              </p>

              {/* Progress bar */}
              <div style={{ width: "100%", height: "6px", borderRadius: "3px", background: "var(--bg-tertiary)", overflow: "hidden", marginBottom: "0.5rem" }}>
                <div style={{ height: "100%", borderRadius: "3px", background: "linear-gradient(90deg, #25D366, #128C7E)", animation: "progress-indeterminate 1.5s ease-in-out infinite", width: "40%" }} />
              </div>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                Powered by Groq AI · llama-3.3-70b-versatile
              </p>
            </div>
          </div>
        )}

        {/* ── State: Results ──────────────────────────────────────────────── */}
        {pageState === "results" && (
          <div style={{ flex: 1, padding: "0 2rem 2rem", overflowY: "auto" }}>
            {/* Back + Actions */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <button onClick={() => setPageState("chatlist")} style={{ display: "flex", alignItems: "center", gap: "0.375rem", background: "none", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", padding: "0.5rem 1rem", color: "var(--text-secondary)", fontSize: "0.8125rem", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                <ArrowLeft size={14} />
                Back to Chats
              </button>
              <button onClick={handleDisconnect} style={{ padding: "0.375rem 0.875rem", borderRadius: "var(--radius-md)", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                Disconnect WhatsApp
              </button>
            </div>

            {/* ── Single Chat Result ─────────────────────────────────────── */}
            {singleResult && (
              <div>
                {/* Groq status banner */}
                {singleResult.groq_called === false && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.875rem 1.25rem", borderRadius: "var(--radius-md)", background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)", marginBottom: "1.25rem" }}>
                    <AlertTriangle size={16} color="#EAB308" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#EAB308", margin: "0 0 0.25rem" }}>No messages found — Groq AI was not called</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>
                        {singleResult.groq_error === "Empty message store"
                          ? "WhatsApp message history hasn\'t synced to the bridge yet. Wait a few seconds after connecting, then try scanning again."
                          : singleResult.groq_error || "Unknown reason"}
                      </p>
                    </div>
                  </div>
                )}
                {singleResult.groq_called === true && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.18)", marginBottom: "1.25rem" }}>
                    <Zap size={13} color="#25D366" />
                    <p style={{ fontSize: "0.75rem", color: "#25D366", margin: 0, fontWeight: 600 }}>
                      Groq AI analysed {singleResult.total_messages_scanned} messages
                    </p>
                  </div>
                )}

                {/* Overall risk card */}
                <div style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <div>
                      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.125rem", color: "var(--text-primary)", margin: "0 0 0.25rem" }}>
                        {singleResult.chat_name}
                      </h3>
                      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: 0 }}>{singleResult.summary}</p>
                    </div>
                    <RiskBadge level={singleResult.overall_risk} size="md" />
                  </div>

                  {/* Stats row */}
                  <div style={{ display: "flex", gap: "1rem" }}>
                    {[
                      { label: "Messages Scanned", value: singleResult.total_messages_scanned, icon: MessageSquare, color: "#22D3EE" },
                      { label: "Flagged", value: singleResult.flagged_count, icon: FileWarning, color: singleResult.flagged_count > 0 ? "#EF4444" : "#22C55E" },
                      { label: "Scan Time", value: `${(singleResult.scan_time_ms / 1000).toFixed(1)}s`, icon: Clock, color: "#818CF8" },
                    ].map((s) => (
                      <div key={s.label} style={{ padding: "0.5rem 0.875rem", background: "var(--bg-primary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <s.icon size={14} color={s.color} />
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>{s.value}</span>
                        <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key findings */}
                {singleResult.key_findings.length > 0 && (
                  <div style={{ padding: "1rem 1.25rem", borderRadius: "var(--radius-md)", background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)", marginBottom: "1.5rem" }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#EAB308", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <Zap size={13} /> Key Findings
                    </p>
                    {singleResult.key_findings.map((f, i) => (
                      <p key={i} style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: "0.25rem 0", paddingLeft: "1rem", borderLeft: "2px solid rgba(234,179,8,0.3)" }}>
                        {f}
                      </p>
                    ))}
                  </div>
                )}

                {/* Flagged messages */}
                {singleResult.flagged_messages.length > 0 ? (
                  <div>
                    <h4 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <AlertTriangle size={15} color="#EF4444" />
                      Flagged Messages ({singleResult.flagged_messages.length})
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {singleResult.flagged_messages.map((fm, i) => (
                        <FlaggedMessageCard key={i} fm={fm} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "2rem", textAlign: "center", borderRadius: "var(--radius-lg)", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
                    <CheckCircle2 size={32} color="#22C55E" style={{ margin: "0 auto 0.75rem", display: "block" }} />
                    <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#22C55E", marginBottom: "0.25rem" }}>All Clear!</p>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>No suspicious messages were found in this chat.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Batch Result ──────────────────────────────────────────── */}
            {batchResult && (
              <div>
                {/* Summary cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
                  {[
                    { label: "Chats Scanned", value: batchResult.chats_scanned, icon: BarChart3, color: "#25D366" },
                    { label: "Safe Chats", value: batchResult.safe_chats, icon: ShieldCheck, color: "#22C55E" },
                    { label: "Flagged Chats", value: batchResult.high_risk_chats.length, icon: ShieldAlert, color: batchResult.high_risk_chats.length > 0 ? "#EF4444" : "#22C55E" },
                    { label: "Total Time", value: `${(batchResult.scan_time_ms / 1000).toFixed(1)}s`, icon: Clock, color: "#818CF8" },
                  ].map((s) => (
                    <div key={s.label} style={{ padding: "1rem 1.25rem", borderRadius: "var(--radius-lg)", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                        <s.icon size={16} color={s.color} />
                        <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</span>
                      </div>
                      <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)", margin: 0 }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Flagged chats list */}
                {batchResult.high_risk_chats.length > 0 ? (
                  <div>
                    <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <ShieldAlert size={16} color="#EF4444" />
                      Chats Requiring Attention
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {batchResult.high_risk_chats.map((cr) => (
                        <div key={cr.chat_id} style={{ borderRadius: "var(--radius-lg)", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", overflow: "hidden" }}>
                          {/* Chat header (clickable) */}
                          <button onClick={() => toggleExpand(cr.chat_id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "0.875rem 1.25rem", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              {expandedChats.has(cr.chat_id) ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
                              <div style={{ textAlign: "left" }}>
                                <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{cr.chat_name}</p>
                                <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", margin: 0 }}>{cr.summary}</p>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                                {cr.flagged_count} flagged / {cr.total_messages_scanned} msgs
                              </span>
                              <RiskBadge level={cr.overall_risk} />
                            </div>
                          </button>

                          {/* Expanded content */}
                          {expandedChats.has(cr.chat_id) && (
                            <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid var(--bg-border)" }}>
                              {/* Key findings */}
                              {cr.key_findings.length > 0 && (
                                <div style={{ padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)", margin: "0.75rem 0" }}>
                                  <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#EAB308", textTransform: "uppercase", marginBottom: "0.375rem" }}>Findings</p>
                                  {cr.key_findings.map((f, i) => (
                                    <p key={i} style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0.2rem 0" }}>• {f}</p>
                                  ))}
                                </div>
                              )}

                              {/* Flagged messages */}
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
                                {cr.flagged_messages.map((fm, i) => (
                                  <FlaggedMessageCard key={i} fm={fm} compact />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "3rem", textAlign: "center", borderRadius: "var(--radius-lg)", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
                    <ShieldCheck size={40} color="#22C55E" style={{ margin: "0 auto 1rem", display: "block" }} />
                    <p style={{ fontSize: "1.125rem", fontWeight: 800, color: "#22C55E", fontFamily: "var(--font-display)", marginBottom: "0.5rem" }}>All Chats Are Safe!</p>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                      RAKSHA AI scanned {batchResult.chats_scanned} chats and found no threats.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── CSS Animations ────────────────────────────────────────────────── */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 8px 32px rgba(37,211,102,0.3); }
          50% { box-shadow: 0 8px 48px rgba(37,211,102,0.5); }
        }
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.6; }
          75%, 100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes border-glow {
          0% { opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { opacity: 0.4; }
        }
        @keyframes progress-indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}

// ── Flagged Message Card ────────────────────────────────────────────────────

function FlaggedMessageCard({ fm, compact }: { fm: FlaggedMessage; compact?: boolean }) {
  const c = riskColors[fm.risk_level] || riskColors.low;
  return (
    <div style={{ padding: compact ? "0.75rem 1rem" : "1rem 1.25rem", borderRadius: "var(--radius-md)", background: "var(--bg-primary)", border: `1px solid ${c.border}`, borderLeft: `3px solid ${c.text}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <RiskBadge level={fm.risk_level} />
          <ThreatBadge type={fm.threat_type} />
        </div>
        <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>msg #{fm.message_index}</span>
      </div>

      {/* Original message */}
      {fm.message_body && (
        <div style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", background: c.bg, marginBottom: "0.5rem", fontSize: "0.8125rem", color: "var(--text-primary)", fontStyle: "italic", borderLeft: `2px solid ${c.text}` }}>
          &ldquo;{fm.message_body}&rdquo;
        </div>
      )}

      {/* Explanation */}
      <div style={{ display: "flex", gap: "0.375rem", alignItems: "flex-start", marginBottom: "0.375rem" }}>
        <Info size={13} color={c.text} style={{ flexShrink: 0, marginTop: "2px" }} />
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
          {fm.explanation}
        </p>
      </div>

      {/* Recommendation */}
      {fm.recommendation && (
        <div style={{ display: "flex", gap: "0.375rem", alignItems: "flex-start" }}>
          <CheckCircle2 size={13} color="#22C55E" style={{ flexShrink: 0, marginTop: "2px" }} />
          <p style={{ fontSize: "0.75rem", color: "#22C55E", margin: 0, lineHeight: 1.5 }}>
            {fm.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}
