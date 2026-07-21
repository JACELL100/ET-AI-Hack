"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Shield, MessageCircle, Send, Phone, Hash, QrCode,
  Smartphone, AlertTriangle, CheckCircle, Info,
  Loader2, RefreshCw, BookOpen, Zap
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";
import { CitizenSidebar } from "@/components/layout/CitizenSidebar";

// ── Types ─────────────────────────────────────────────────────────────────────

type RiskLevel = "danger" | "warning" | "safe";
type Tab = "webchat" | "whatsapp" | "ivr";

type Source = { title: string; category: string };

type ChatMsg = {
  id: string;
  role: "user" | "bot";
  text: string;
  time: string;
  riskLevel?: RiskLevel;
  quickActions?: string[];
  sources?: Source[];
  isLoading?: boolean;
};

// ── Constants ──────────────────────────────────────────────────────────────────

const RISK_COLOR: Record<RiskLevel, string> = {
  danger: "#E63A1E",
  warning: "#F59E0B",
  safe: "#10B981",
};

const RISK_BG: Record<RiskLevel, string> = {
  danger: "rgba(230,58,30,0.08)",
  warning: "rgba(245,158,11,0.08)",
  safe: "rgba(16,185,129,0.08)",
};

const CATEGORY_LABELS: Record<string, string> = {
  digital_arrest: "Digital Arrest",
  upi_fraud: "UPI Fraud",
  otp_kyc_fraud: "OTP/KYC Fraud",
  counterfeit_currency: "Counterfeit Currency",
  phishing: "Phishing",
  loan_fraud: "Loan Fraud",
  investment_fraud: "Investment Fraud",
  job_fraud: "Job Fraud",
  social_media_fraud: "Social Media Fraud",
  child_safety: "Child Safety",
  identity_theft: "Identity Theft",
  ecommerce_fraud: "E-Commerce Fraud",
  govt_fraud: "Govt Scheme Fraud",
  whatsapp_fraud: "WhatsApp Fraud",
  cyber_hygiene: "Cyber Hygiene",
  helpline: "Helpline Info",
  platform: "RAKSHA AI",
};

const SUGGESTED_QUESTIONS = [
  "What is a digital arrest scam?",
  "I received a call from someone claiming to be CBI",
  "How do I report a UPI fraud?",
  "How to identify a fake currency note?",
  "Someone asked me to share my OTP",
  "What is the cybercrime helpline number?",
  "I think I've been scammed online",
  "How to stay safe from WhatsApp frauds?",
];

const INITIAL_MESSAGES: ChatMsg[] = [
  {
    id: "welcome",
    role: "bot",
    text: "Namaste! I'm KAVACH (कवच) — your AI-powered fraud shield, backed by a real knowledge base of cybercrime awareness documents.\n\nAsk me anything about:\n• Digital arrest scams\n• UPI / OTP / Banking fraud\n• Fake currency notes\n• How to report cybercrime\n• Staying safe online",
    time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    riskLevel: "safe",
    quickActions: ["What is Digital Arrest?", "How to report fraud?", "UPI safety tips"],
  },
];

// ── API Helpers ────────────────────────────────────────────────────────────────

async function callKavachAPI(message: string, sessionId: string) {
  const response = await fetch("/api/v1/kavach/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId }),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const json = await response.json();
  const data = json.data ?? {};
  return {
    reply: data.reply ?? "I couldn't process your request. Please try again.",
    riskLevel: (data.riskLevel as RiskLevel) ?? "safe",
    quickActions: (data.quickActions as string[]) ?? [],
    sources: (data.sources as Source[]) ?? [],
  };
}

async function fetchRAGStatus() {
  try {
    const res = await fetch("/api/v1/kavach/status");
    const json = await res.json();
    return json.data ?? { vectorCount: 0, status: "unknown" };
  } catch {
    return { vectorCount: 0, status: "error" };
  }
}

async function triggerIngest() {
  await fetch("/api/v1/kavach/ingest", { method: "POST" });
}


// ── Sub-components ─────────────────────────────────────────────────────────────

function BotMessage({ msg, onQuickAction }: { msg: ChatMsg; onQuickAction: (a: string) => void }) {
  const risk = msg.riskLevel ?? "safe";
  return (
    <div style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: RISK_BG[risk], border: `1px solid ${RISK_COLOR[risk]}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {msg.isLoading
          ? <Loader2 size={14} color="#22D3EE" style={{ animation: "spin 1s linear infinite" }} />
          : <Shield size={14} color="#22D3EE" />}
      </div>
      <div style={{ flex: 1, maxWidth: "82%" }}>
        <div style={{ padding: "0.75rem 1rem", borderRadius: "4px 16px 16px 16px", background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", fontSize: "0.875rem", lineHeight: 1.65, color: "var(--text-primary)", whiteSpace: "pre-line" }}>
          {msg.isLoading
            ? <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#22D3EE", display: "inline-block", animation: `bounce 1.2s ${i * 0.2}s infinite` }} />)}
              </div>
            : msg.text}
        </div>
        {!msg.isLoading && msg.riskLevel && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: "0.375rem", padding: "2px 8px", borderRadius: 100, background: RISK_BG[risk], border: `1px solid ${RISK_COLOR[risk]}30`, fontSize: "0.7rem", color: RISK_COLOR[risk], fontWeight: 600 }}>
            {risk === "danger" ? <AlertTriangle size={11} /> : risk === "warning" ? <AlertTriangle size={11} /> : <CheckCircle size={11} />}
            {risk === "danger" ? "High Risk" : risk === "warning" ? "Caution" : "Safe"}
          </div>
        )}
        {!msg.isLoading && msg.sources && msg.sources.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: "0.375rem" }}>
            {msg.sources.map((s, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 100, background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)", fontSize: "0.68rem", color: "#22D3EE" }}>
                <BookOpen size={9} />{CATEGORY_LABELS[s.category] ?? s.category}
              </span>
            ))}
          </div>
        )}
        {!msg.isLoading && msg.quickActions && msg.quickActions.length > 0 && (
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
            {msg.quickActions.map(a => (
              <button key={a} onClick={() => onQuickAction(a)} style={{ padding: "0.3rem 0.75rem", borderRadius: 100, border: "1px solid rgba(34,211,238,0.35)", background: "rgba(34,211,238,0.07)", color: "#22D3EE", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(34,211,238,0.18)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(34,211,238,0.07)"; }}>
                {a}
              </button>
            ))}
          </div>
        )}
        <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{msg.time}</p>
      </div>
    </div>
  );
}

function UserMessage({ msg }: { msg: ChatMsg }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{ maxWidth: "72%", padding: "0.75rem 1rem", borderRadius: "16px 4px 16px 16px", background: "var(--accent)", color: "white", fontSize: "0.875rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>
        {msg.text}
        <p style={{ fontSize: "0.65rem", opacity: 0.7, textAlign: "right", marginTop: "0.25rem" }}>{msg.time}</p>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function KavachPage() {
  const { user, loading, registerCitizen } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("webchat");
  const [messages, setMessages] = useState<ChatMsg[]>(INITIAL_MESSAGES);
  const [waMessages, setWaMessages] = useState<ChatMsg[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [waInput, setWaInput] = useState("");
  const [sessionId] = useState(() => `sess_${Date.now()}`);
  const [ragStatus, setRagStatus] = useState<{ vectorCount: number; status: string } | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) window.location.href = "/login";
    else if (!loading && user && !user.isCitizen) registerCitizen();
  }, [user, loading, registerCitizen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => { fetchRAGStatus().then(setRagStatus); }, []);

  const sendMessage = useCallback(async (text: string, isWa = false) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMsg = { id: `u_${Date.now()}`, role: "user", text: text.trim(), time: now };
    const loadingMsg: ChatMsg = { id: `l_${Date.now()}`, role: "bot", text: "", time: now, isLoading: true };
    if (isWa) { setWaMessages(p => [...p, userMsg, loadingMsg]); setWaInput(""); }
    else { setMessages(p => [...p, userMsg, loadingMsg]); setInput(""); }
    try {
      const result = await callKavachAPI(text.trim(), sessionId);
      const botMsg: ChatMsg = {
        id: `b_${Date.now()}`, role: "bot",
        text: result.reply,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        riskLevel: result.riskLevel,
        quickActions: result.quickActions,
        sources: result.sources,
      };
      if (isWa) setWaMessages(p => p.filter(m => !m.isLoading).concat(botMsg));
      else setMessages(p => p.filter(m => !m.isLoading).concat(botMsg));
    } catch {
      const errMsg: ChatMsg = {
        id: `e_${Date.now()}`, role: "bot",
        text: "I'm having trouble connecting. For urgent help, call 1930 (National Cyber Crime Helpline).",
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        riskLevel: "warning", quickActions: ["Call 1930"],
      };
      if (isWa) setWaMessages(p => p.filter(m => !m.isLoading).concat(errMsg));
      else setMessages(p => p.filter(m => !m.isLoading).concat(errMsg));
    }
  }, [sessionId]);

  const handleIngest = async () => {
    setIngesting(true);
    await triggerIngest();
    setTimeout(async () => { setRagStatus(await fetchRAGStatus()); setIngesting(false); }, 5000);
  };

  if (loading || !user || !user.isCitizen) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)" }}>
        <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Verifying Citizen access...</div>
      </div>
    );
  }


  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "var(--bg-primary)" }}>
      <CitizenSidebar />
      <main style={{ marginLeft: "240px", flex: 1, padding: "1.5rem 2rem", display: "flex", flexDirection: "column", overflowY: "auto", gap: "1.25rem" }}>

        {/* Header */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(34,211,238,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MessageCircle size={20} color="#22D3EE" />
              </div>
              <div>
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.5rem", color: "var(--text-primary)" }}>KAVACH — Citizen Shield</h1>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>RAG-powered AI • Upstash Vector DB • Groq LLaMA-3.3-70B</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              {ragStatus && (
                <div style={{ padding: "0.4rem 0.875rem", borderRadius: 100, background: ragStatus.vectorCount > 0 ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", border: `1px solid ${ragStatus.vectorCount > 0 ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`, display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", fontWeight: 600, color: ragStatus.vectorCount > 0 ? "#10B981" : "#F59E0B" }}>
                  <Zap size={11} />
                  {ragStatus.vectorCount > 0 ? `${ragStatus.vectorCount} docs indexed` : "Knowledge base empty"}
                </div>
              )}
              <button onClick={handleIngest} disabled={ingesting} style={{ padding: "0.4rem 0.875rem", borderRadius: 100, border: "1px solid rgba(34,211,238,0.3)", background: "rgba(34,211,238,0.08)", color: "#22D3EE", fontSize: "0.75rem", fontWeight: 600, cursor: ingesting ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <RefreshCw size={11} style={{ animation: ingesting ? "spin 1s linear infinite" : "none" }} />
                {ingesting ? "Indexing..." : "Re-index Docs"}
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {[{ label: "Citizens Helped", value: "12,847", color: "#22D3EE" }, { label: "Scams Blocked", value: "3,241", color: "#10B981" }, { label: "Response Time", value: "< 2s" }, { label: "Knowledge Docs", value: ragStatus ? `${ragStatus.vectorCount || "—"}` : "—", color: "#818CF8" }].map(s => (
              <div key={s.label} style={{ padding: "0.625rem 1rem", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-lg)" }}>
                <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
                <p style={{ fontSize: "1.125rem", fontWeight: 800, color: s.color ?? "var(--text-primary)", fontFamily: "var(--font-display)" }}>{s.value}</p>
              </div>
            ))}
            <Link href="/kavach/whatsapp-scan" style={{ padding: "0.625rem 1rem", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: "var(--radius-lg)", color: "#25D366", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, fontSize: "0.8rem", marginLeft: "auto" }}>
              <QrCode size={16} /> Scan WhatsApp Web →
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--bg-border)" }}>
          {(["webchat", "whatsapp", "ivr"] as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "0.625rem 1.25rem", background: "none", border: "none", borderBottom: `2px solid ${activeTab === tab ? "#22D3EE" : "transparent"}`, color: activeTab === tab ? "#22D3EE" : "var(--text-muted)", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer", marginBottom: "-1px", transition: "all 150ms" }}>
              {tab === "webchat" ? "AI Chat" : tab === "whatsapp" ? "WhatsApp Sim" : "IVR Sim"}
            </button>
          ))}
        </div>

        {/* Web Chat Tab */}
        {activeTab === "webchat" && (
          <div style={{ display: "flex", gap: "1.25rem", flex: 1, minHeight: 0 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-lg)", overflow: "hidden", maxHeight: "560px" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.125rem" }}>
                {messages.map(msg => msg.role === "bot"
                  ? <BotMessage key={msg.id} msg={msg} onQuickAction={(a) => sendMessage(a)} />
                  : <UserMessage key={msg.id} msg={msg} />
                )}
                <div ref={chatEndRef} />
              </div>
              <div style={{ padding: "0.875rem 1.25rem", borderTop: "1px solid var(--bg-border)", display: "flex", gap: "0.625rem" }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  placeholder="Ask about scams, fraud, digital arrest, fake currency…"
                  style={{ flex: 1, padding: "0.625rem 1rem", background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "0.875rem", fontFamily: "var(--font-body)", outline: "none" }}
                />
                <button onClick={() => sendMessage(input)} disabled={!input.trim()} style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", flexShrink: 0, background: input.trim() ? "var(--accent)" : "var(--bg-tertiary)", border: "none", color: "white", cursor: input.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Send size={15} />
                </button>
              </div>
            </div>
            <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 4 }}>
                <Info size={11} /> Suggested Questions
              </p>
              {SUGGESTED_QUESTIONS.map(q => (
                <button key={q} onClick={() => sendMessage(q)} style={{ textAlign: "left", padding: "0.625rem 0.875rem", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", color: "var(--text-secondary)", fontSize: "0.78rem", lineHeight: 1.45, cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(34,211,238,0.4)"; e.currentTarget.style.color = "#22D3EE"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bg-border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}


        {/* WhatsApp Sim Tab */}
        {activeTab === "whatsapp" && (
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ padding: "1rem 1.25rem", borderRadius: "var(--radius-lg)", background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <p style={{ fontWeight: 700, color: "#25D366", margin: 0, display: "flex", alignItems: "center", gap: 6 }}><Smartphone size={16} /> Connect Real WhatsApp Web</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0.25rem 0 0" }}>Scan QR code to automatically check live chats for fraud</p>
                </div>
                <Link href="/kavach/whatsapp-scan" style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", background: "#25D366", color: "white", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <QrCode size={15} /> Open Scanner →
                </Link>
              </div>
              <div style={{ maxWidth: 400, borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--bg-border)", display: "flex", flexDirection: "column", maxHeight: 520 }}>
                <div style={{ padding: "0.75rem 1rem", background: "#075E54", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#128C7E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Shield size={16} color="white" />
                  </div>
                  <div>
                    <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "white", margin: 0 }}>KAVACH Bot</p>
                    <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.65)", margin: 0 }}>Online · AI-Powered Safety Assistant</p>
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "1rem", background: "#ECE5DD", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {waMessages.map(msg => msg.role === "user" ? (
                    <div key={msg.id} style={{ display: "flex", justifyContent: "flex-end" }}>
                      <div style={{ maxWidth: "75%", padding: "0.625rem 0.875rem", borderRadius: "12px 12px 4px 12px", background: "#DCF8C6", color: "#111", fontSize: "0.875rem", lineHeight: 1.5, whiteSpace: "pre-line" }}>
                        {msg.text}<p style={{ fontSize: "0.65rem", color: "#555", textAlign: "right", marginTop: 2 }}>{msg.time} ✓✓</p>
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id} style={{ display: "flex", justifyContent: "flex-start" }}>
                      <div style={{ maxWidth: "80%", padding: "0.625rem 0.875rem", borderRadius: "12px 12px 12px 4px", background: "white", color: "#111", fontSize: "0.875rem", lineHeight: 1.5, whiteSpace: "pre-line" }}>
                        {msg.isLoading
                          ? <div style={{ display: "flex", gap: 4 }}>{[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#128C7E", display: "inline-block", animation: `bounce 1.2s ${i*0.2}s infinite` }} />)}</div>
                          : msg.text}
                        <p style={{ fontSize: "0.65rem", color: "#555", marginTop: 2 }}>{msg.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "0.625rem", background: "#F0F0F0", display: "flex", gap: "0.5rem" }}>
                  <input value={waInput} onChange={e => setWaInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendMessage(waInput, true); }} placeholder="Type a message" style={{ flex: 1, padding: "0.625rem 1rem", borderRadius: 24, border: "none", background: "white", fontSize: "0.875rem", outline: "none", color: "#111" }} />
                  <button onClick={() => sendMessage(waInput, true)} style={{ width: 40, height: 40, borderRadius: "50%", background: "#128C7E", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* IVR Sim Tab */}
        {activeTab === "ivr" && (
          <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-xl)", padding: "2rem", width: 260, flexShrink: 0 }}>
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(34,211,238,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
                  <Phone size={26} color="#22D3EE" />
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>National Cyber Crime Helpline</p>
                <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "#22D3EE", fontFamily: "var(--font-mono)" }}>1930</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.625rem" }}>
                {["1","2","3","4","5","6","7","8","9","*","0","#"].map(k => (
                  <button key={k} style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", color: "var(--text-primary)", fontSize: "1rem", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-mono)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(34,211,238,0.15)"; e.currentTarget.style.color = "#22D3EE"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-tertiary)"; e.currentTarget.style.color = "var(--text-primary)"; }}>
                    {k === "*" ? <Hash size={14} /> : k}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>IVR Menu — Click to simulate in AI Chat</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {[
                  { key: "1", label: "Report a Scam", desc: "File an immediate report for fraud or scam calls", color: "#E63A1E" },
                  { key: "2", label: "Check Phone Number", desc: "Verify if a number has been reported for fraud", color: "#F59E0B" },
                  { key: "3", label: "Digital Arrest Help", desc: "Get immediate guidance if you are being threatened", color: "#E63A1E" },
                  { key: "4", label: "UPI / Banking Fraud", desc: "Steps to take after a UPI or banking fraud", color: "#F59E0B" },
                  { key: "5", label: "Safety Tips", desc: "Learn how to protect yourself from digital fraud", color: "#22D3EE" },
                  { key: "6", label: "Speak to an Officer", desc: "Connect to a live law enforcement officer", color: "#818CF8" },
                ].map(item => (
                  <button key={item.key} onClick={() => { setActiveTab("webchat"); sendMessage(`${item.label}`); }} style={{ display: "flex", gap: "1rem", padding: "0.875rem 1rem", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", alignItems: "center", cursor: "pointer", textAlign: "left" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.background = `${item.color}08`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bg-border)"; e.currentTarget.style.background = "var(--bg-secondary)"; }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: `${item.color}20`, border: `1px solid ${item.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.05rem", color: item.color }}>
                      {item.key}
                    </div>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Press {item.key} — {item.label}</p>
                      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
      <style jsx global>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
