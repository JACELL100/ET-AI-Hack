"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Shield, Radio, Phone, FileText, Upload, AlertTriangle,
  ChevronRight, Zap, Eye, Activity,
} from "lucide-react";
import { ThreatGauge } from "@/components/ui/ThreatGauge";
import { CallSimulator } from "@/components/sentinel/CallSimulator";
import { LiveAnalysis } from "@/components/sentinel/LiveAnalysis";
import { PSTNPanel } from "@/components/sentinel/PSTNPanel";
import { AnalysisReport } from "@/components/sentinel/AnalysisReport";
import { TranscriptPanel } from "@/components/sentinel/TranscriptPanel";
import { useSentinelStream } from "@/hooks/useSentinelStream";
import type { SessionCompleteData, VoiceAnalysisData } from "@/hooks/useSentinelStream";
import { analyseText as apiAnalyseText, analyseAudio as apiAnalyseAudio } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthContext";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { CitizenSidebar } from "@/components/layout/CitizenSidebar";

/* ── Scenarios (fetched from API or fallback) ───────────────────────── */
const FALLBACK_SCENARIOS = [
  { id: "cbi-hindi-1", title: "CBI Digital Arrest (Hindi)", description: "Caller impersonates CBI officer, threatens arrest for money laundering", language: "hi", duration_seconds: 55, expected_threat_score: 87, expected_intents: ["IMPERSONATION", "LEGAL_THREAT", "MONEY_DEMAND", "INTIMIDATION"] },
  { id: "customs-english-1", title: "Customs Parcel Scam (English)", description: "Caller claims parcel with drugs was intercepted by customs", language: "en", duration_seconds: 48, expected_threat_score: 82, expected_intents: ["IMPERSONATION", "LEGAL_THREAT", "INTIMIDATION"] },
  { id: "bank-kyc-hindi-1", title: "Bank KYC Fraud (Hindi)", description: "Caller poses as bank rep, asks for Aadhaar/OTP with processing fee", language: "hi", duration_seconds: 42, expected_threat_score: 68, expected_intents: ["IMPERSONATION", "URGENCY_CREATION", "IDENTITY_THEFT", "MONEY_DEMAND"] },
  { id: "ed-english-1", title: "ED Investigation Scam (English)", description: "Caller impersonates Enforcement Directorate, demands penalty payment", language: "en", duration_seconds: 50, expected_threat_score: 85, expected_intents: ["IMPERSONATION", "LEGAL_THREAT", "MONEY_DEMAND"] },
  { id: "trai-hindi-1", title: "TRAI SIM Block Scam (Hindi)", description: "Automated IVR claiming TRAI will block mobile number", language: "hi", duration_seconds: 38, expected_threat_score: 75, expected_intents: ["IMPERSONATION", "LEGAL_THREAT", "URGENCY_CREATION"] },
];

/* ── Tab Definition ──────────────────────────────────────────────────── */
type TabKey = "simulate" | "live" | "pstn" | "upload" | "text";

const TABS: { key: TabKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "simulate", label: "Simulation", icon: <Shield size={15} />, color: "#E63A1E" },
  { key: "live", label: "Live WebRTC", icon: <Radio size={15} />, color: "#818CF8" },
  { key: "pstn", label: "PSTN Alerts", icon: <Phone size={15} />, color: "#10B981" },
  { key: "upload", label: "Upload Audio", icon: <Upload size={15} />, color: "#F59E0B" },
  { key: "text", label: "Text Analysis", icon: <FileText size={15} />, color: "#8B5CF6" },
];

/* ── Styles (inline objects for key reused pieces) ───────────────────── */
const sectionLabel: React.CSSProperties = {
  fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase",
  letterSpacing: "0.12em", fontWeight: 700, marginBottom: "0.25rem",
};

export default function SentinelPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("simulate");
  const [sessionResult, setSessionResult] = useState<SessionCompleteData | null>(null);
  const [voiceAnalysis, setVoiceAnalysis] = useState<VoiceAnalysisData | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showAlertPanel, setShowAlertPanel] = useState(false);

  // This root module is available from the citizen navigation.
  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.href = "/login";
      }
    }
  }, [user, loading]);

  /* ── Upload state ────────────────────────────────────────────────── */
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<SessionCompleteData | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  /* ── Text state ──────────────────────────────────────────────────── */
  const [textInput, setTextInput] = useState("");
  const [textResult, setTextResult] = useState<SessionCompleteData | null>(null);
  const [isAnalysingText, setIsAnalysingText] = useState(false);

  /* ── Real-time sidebar state (for sim/live tabs) ─────────────────── */
  const stream = useSentinelStream();

  const handleSessionComplete = useCallback((result: unknown) => {
    const r = result as SessionCompleteData;
    setSessionResult(r);
    setShowReport(true);
  }, []);

  const handleSendAlert = useCallback(() => {
    setShowAlertPanel(true);
    setActiveTab("pstn");
  }, []);

  /* ── Upload handler ──────────────────────────────────────────────── */
  const handleUpload = async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    try {
      const resp = await apiAnalyseAudio(uploadFile);
      const data = (resp as unknown as { data: SessionCompleteData }).data;
      setUploadResult(data);
    } catch (err) {
      console.error("Upload analysis failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  /* ── Text handler ────────────────────────────────────────────────── */
  const handleTextAnalysis = async () => {
    if (!textInput.trim()) return;
    setIsAnalysingText(true);
    try {
      const resp = await apiAnalyseText(textInput.trim());
      const data = (resp as unknown as { data: SessionCompleteData }).data;
      setTextResult(data);
    } catch (err) {
      console.error("Text analysis failed:", err);
    } finally {
      setIsAnalysingText(false);
    }
  };

  /* ── Determine what to show in the right sidebar ─────────────────── */
  const sidebarResult = sessionResult || uploadResult || textResult;
  const activeThreat = stream.threatScore || sidebarResult?.threat_score || 0;
  const activeVerdict = stream.verdict || sidebarResult?.verdict || "SAFE";
  const activeIntents = stream.intents.length > 0 ? stream.intents : sidebarResult?.intents_detected || [];

  // Show loading while verifying credentials
  if (loading || !user) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)", color: "var(--text-secondary)" }}>
        <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>Verifying your account...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      {user.isAdmin ? <AdminSidebar /> : <CitizenSidebar />}
      <div style={{ marginLeft: "240px", flex: 1, minWidth: 0 }}>
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div style={{ padding: "1.5rem 2rem 0", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "linear-gradient(135deg, #E63A1E, #991b1b)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={18} color="white" />
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.375rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, lineHeight: 1.2 }}>
              SENTINEL
            </h1>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", margin: 0, letterSpacing: "0.05em" }}>
              Real-time Digital Arrest Scam Detection & Alerting
            </p>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────────────── */}
      <div style={{ padding: "1rem 2rem 0", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", gap: "0.25rem", padding: "0.25rem", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--bg-border)" }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                padding: "0.625rem 0.5rem", borderRadius: "9px", border: "none", cursor: "pointer",
                background: activeTab === tab.key ? "var(--bg-tertiary)" : "transparent",
                color: activeTab === tab.key ? tab.color : "var(--text-muted)",
                fontWeight: activeTab === tab.key ? 700 : 500,
                fontSize: "0.75rem", fontFamily: "var(--font-body)",
                boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
                transition: "all 200ms ease",
              }}
            >
              {tab.icon}
              <span className="hide-mobile">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <div style={{ padding: "1.25rem 2rem 2rem", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.25rem", alignItems: "start" }}>

          {/* ── LEFT PANEL: Tab Content ─────────────────────────────── */}
          <div style={{ minWidth: 0 }}>
            {activeTab === "simulate" && (
              <CallSimulator
                scenarios={FALLBACK_SCENARIOS}
                onSessionComplete={handleSessionComplete}
                onSendAlert={handleSendAlert}
              />
            )}

            {activeTab === "live" && (
              <LiveAnalysis
                onSessionComplete={handleSessionComplete}
                onSendAlert={handleSendAlert}
              />
            )}

            {activeTab === "pstn" && <PSTNPanel />}

            {activeTab === "upload" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Upload card */}
                <div className="card-static" style={{ padding: "1.5rem" }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>
                    Upload Audio for Analysis
                  </h3>
                  <div
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) setUploadFile(f); }}
                    style={{
                      border: "2px dashed var(--bg-border)", borderRadius: "12px",
                      padding: "2.5rem 2rem", textAlign: "center", cursor: "pointer",
                      background: uploadFile ? "rgba(245,158,11,0.05)" : "transparent",
                      transition: "all 200ms ease",
                    }}
                    onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "audio/*"; inp.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) setUploadFile(f); }; inp.click(); }}
                  >
                    <Upload size={32} color={uploadFile ? "#F59E0B" : "var(--text-muted)"} style={{ marginBottom: "0.75rem" }} />
                    {uploadFile ? (
                      <>
                        <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#F59E0B" }}>{uploadFile.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                          {(uploadFile.size / 1024).toFixed(0)} KB — Click to change
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                          Drop an audio file or click to browse
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                          WAV, MP3, OGG, WebM supported
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={handleUpload}
                    disabled={!uploadFile || isUploading}
                    style={{
                      width: "100%", marginTop: "1rem", padding: "0.875rem", borderRadius: "10px",
                      border: "none", background: uploadFile ? "#F59E0B" : "var(--bg-border)",
                      color: "white", fontWeight: 700, fontSize: "0.875rem",
                      cursor: uploadFile ? "pointer" : "default", fontFamily: "var(--font-body)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                      opacity: isUploading ? 0.7 : 1,
                    }}
                  >
                    {isUploading ? (
                      <>
                        <Activity size={16} className="spin" /> Analysing...
                      </>
                    ) : (
                      <>
                        <Zap size={16} /> Analyse Audio
                      </>
                    )}
                  </button>
                </div>

                {/* Upload result */}
                {uploadResult && (
                  <AnalysisReport
                    result={uploadResult}
                    onSendAlert={handleSendAlert}
                  />
                )}
              </div>
            )}

            {activeTab === "text" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div className="card-static" style={{ padding: "1.5rem" }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>
                    Text / SMS / Message Analysis
                  </h3>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste a suspicious SMS, WhatsApp message, or email content here..."
                    className="input"
                    style={{ minHeight: "140px", resize: "vertical", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", lineHeight: 1.7 }}
                  />
                  <button
                    onClick={handleTextAnalysis}
                    disabled={!textInput.trim() || isAnalysingText}
                    style={{
                      width: "100%", marginTop: "1rem", padding: "0.875rem", borderRadius: "10px",
                      border: "none", background: textInput.trim() ? "#8B5CF6" : "var(--bg-border)",
                      color: "white", fontWeight: 700, fontSize: "0.875rem",
                      cursor: textInput.trim() ? "pointer" : "default", fontFamily: "var(--font-body)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                      opacity: isAnalysingText ? 0.7 : 1,
                    }}
                  >
                    {isAnalysingText ? (
                      <>
                        <Activity size={16} className="spin" /> Analysing...
                      </>
                    ) : (
                      <>
                        <Eye size={16} /> Analyse Text
                      </>
                    )}
                  </button>
                </div>

                {textResult && (
                  <AnalysisReport
                    result={textResult}
                    onSendAlert={handleSendAlert}
                  />
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR: Live Dashboard ──────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "sticky", top: "1.25rem" }}>
            {/* Threat Gauge */}
            <div className="card-static" style={{ padding: "1.5rem", textAlign: "center" }}>
              <div style={sectionLabel}>Threat Level</div>
              <ThreatGauge score={activeThreat} size={140} animated />
              <div style={{
                marginTop: "0.75rem", fontSize: "0.8125rem", fontWeight: 800,
                color: activeVerdict === "SCAM" ? "#E63A1E" : activeVerdict === "SUSPICIOUS" ? "#F59E0B" : "#10B981",
                letterSpacing: "0.08em",
              }}>
                {activeVerdict}
              </div>
              {stream.scamType && (
                <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  {stream.scamType.replace(/_/g, " ")}
                </div>
              )}
            </div>

            {/* Detected Intents */}
            <div className="card-static" style={{ padding: "1rem 1.25rem" }}>
              <div style={{ ...sectionLabel, marginBottom: "0.5rem" }}>Detected Patterns</div>
              {activeIntents.length === 0 ? (
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  No patterns detected yet
                </div>
              ) : (
                <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                  {activeIntents.map((intent) => {
                    const colors: Record<string, string> = {
                      IMPERSONATION: "#818CF8", LEGAL_THREAT: "#E63A1E", URGENCY_CREATION: "#F59E0B",
                      MONEY_DEMAND: "#EF4444", INTIMIDATION: "#E63A1E", IDENTITY_THEFT: "#F97316",
                    };
                    const c = colors[intent] || "#6B7280";
                    return (
                      <span key={intent} style={{
                        fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.06em",
                        padding: "0.2rem 0.5rem", borderRadius: "100px",
                        background: `${c}18`, color: c, border: `1px solid ${c}35`,
                      }}>
                        {intent}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Script Similarity */}
            <div className="card-static" style={{ padding: "1rem 1.25rem" }}>
              <div style={sectionLabel}>Script Similarity</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.375rem" }}>
                <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "var(--bg-border)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: "3px", transition: "width 500ms ease",
                    width: `${stream.scriptSimilarity * 100}%`,
                    background: stream.scriptSimilarity >= 0.7 ? "#E63A1E" : stream.scriptSimilarity >= 0.5 ? "#F59E0B" : "#10B981",
                  }} />
                </div>
                <span style={{ fontSize: "0.875rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text-primary)", width: "40px", textAlign: "right" }}>
                  {(stream.scriptSimilarity * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Voice Analysis */}
            {stream.voiceAnalysis && (
              <div className="card-static" style={{ padding: "1rem 1.25rem" }}>
                <div style={{ ...sectionLabel, marginBottom: "0.5rem" }}>Voice Analysis</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
                  {[
                    { label: "Scripted", value: stream.voiceAnalysis.is_scripted ? "Yes" : "No", color: stream.voiceAnalysis.is_scripted ? "#E63A1E" : "#10B981" },
                    { label: "BG Noise", value: stream.voiceAnalysis.bg_noise_type.replace(/_/g, " "), color: "var(--text-primary)" },
                    { label: "Pitch", value: `${stream.voiceAnalysis.pitch_mean_hz.toFixed(0)} Hz`, color: "var(--text-primary)" },
                    { label: "Rate", value: stream.voiceAnalysis.speech_rate.toFixed(3), color: "var(--text-primary)" },
                  ].map((item) => (
                    <div key={item.label} style={{ padding: "0.375rem 0.5rem", background: "var(--bg-tertiary)", borderRadius: "6px" }}>
                      <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.label}</div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: item.color, marginTop: "1px", textTransform: "capitalize" }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alert Banner */}
            {stream.alert && (
              <div style={{
                padding: "0.75rem 1rem", borderRadius: "10px",
                background: "rgba(230,58,30,0.1)", border: "1px solid rgba(230,58,30,0.3)",
                animation: "pulse-glow 1.5s infinite",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <AlertTriangle size={14} color="#E63A1E" />
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#E63A1E" }}>{stream.alert.severity.toUpperCase()}</span>
                </div>
                <p style={{ fontSize: "0.6875rem", color: "var(--text-secondary)", marginTop: "0.25rem", lineHeight: 1.5 }}>
                  {stream.alert.message}
                </p>
                <button onClick={handleSendAlert} style={{
                  marginTop: "0.5rem", padding: "0.375rem 0.75rem", borderRadius: "6px",
                  background: "#E63A1E", border: "none", color: "white",
                  fontSize: "0.6875rem", fontWeight: 700, cursor: "pointer",
                  fontFamily: "var(--font-body)",
                }}>
                  Send Alert Now →
                </button>
              </div>
            )}

            {/* Session Complete — View Report */}
            {stream.sessionResult && (
              <button
                onClick={() => { setSessionResult(stream.sessionResult); setShowReport(true); }}
                style={{
                  padding: "0.75rem 1rem", borderRadius: "10px",
                  background: "var(--bg-secondary)", border: "1px solid var(--bg-border)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                  fontFamily: "var(--font-body)",
                }}
              >
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--accent)" }}>
                  View Full Report
                </span>
                <ChevronRight size={16} color="var(--accent)" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Full Report Modal ──────────────────────────────────────── */}
      {showReport && sessionResult && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "2rem",
        }}
          onClick={() => setShowReport(false)}
        >
          <div style={{ maxWidth: "560px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <AnalysisReport
              result={sessionResult}
              voiceAnalysis={stream.voiceAnalysis}
              onSendAlert={handleSendAlert}
              onClose={() => setShowReport(false)}
            />
          </div>
        </div>
      )}

      {/* ── Global Styles ──────────────────────────────────────────── */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.2; }
          50%      { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
        .card-static {
          background: var(--bg-secondary);
          border: 1px solid var(--bg-border);
          border-radius: 14px;
        }
        .input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--bg-border);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 0.875rem;
          font-family: var(--font-body);
          outline: none;
          transition: border-color 150ms ease;
        }
        .input:focus {
          border-color: var(--accent);
        }
        .input::placeholder {
          color: var(--text-muted);
        }
        @media (max-width: 900px) {
          .hide-mobile { display: none; }
        }
      `}</style>
      </div>
    </div>
  );
}
