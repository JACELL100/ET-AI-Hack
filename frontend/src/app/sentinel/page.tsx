"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { Shield, LayoutDashboard, Eye, Network, Map, MessageCircle, Settings, Mic, MicOff, Upload, Phone, PhoneOff, Video, AlertTriangle, CheckCircle, ChevronRight, Play, Square, Sun, Moon } from "lucide-react";
import { ThreatGauge } from "@/components/ui/ThreatGauge";
import { WireSphere } from "@/components/ui/WireSphere";
import { useTheme } from "@/components/providers/ThemeProvider";
import { usePathname } from "next/navigation";

// Shared mini sidebar for module pages
function ModuleSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "SENTINEL", href: "/sentinel", icon: Shield, color: "#E63A1E" },
    { label: "NETRA", href: "/netra", icon: Eye, color: "#10B981" },
    { label: "JAAL", href: "/jaal", icon: Network, color: "#818CF8" },
    { label: "DRISHTI", href: "/drishti", icon: Map, color: "#F59E0B" },
    { label: "KAVACH", href: "/kavach", icon: MessageCircle, color: "#22D3EE" },
    { label: "Settings", href: "/settings", icon: Settings },
  ];
  return (
    <aside style={{ width: "240px", flexShrink: 0, backgroundColor: "var(--bg-secondary)", borderRight: "1px solid var(--bg-border)", display: "flex", flexDirection: "column", padding: "1.5rem 1rem", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50, overflowY: "auto" }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", marginBottom: "2rem", padding: "0 0.5rem" }}>
        <div style={{ width: "32px", height: "32px", background: "var(--accent)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Shield size={17} color="white" strokeWidth={2.5} /></div>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>RAKSHA<span style={{ color: "var(--accent)" }}>·AI</span></span>
      </Link>
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {navItems.map(({ label, href, icon: Icon, color }) => {
          const isActive = pathname === href;
          return (
            <Link key={label} href={href} className={`sidebar-nav-item ${isActive ? "active" : ""}`}>
              <Icon size={17} color={isActive ? "var(--accent)" : (color || "currentColor")} strokeWidth={2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--bg-border)" }}>
        <button onClick={toggleTheme} style={{ display: "flex", alignItems: "center", gap: "0.625rem", width: "100%", padding: "0.625rem 0.875rem", background: "none", border: "1px solid var(--bg-border)", borderRadius: "8px", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.8125rem", fontWeight: 500, fontFamily: "var(--font-body)" }}>
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    </aside>
  );
}

// Mock intents for transcript
const mockIntents = ["URGENCY_CREATION", "IMPERSONATION", "LEGAL_THREAT", "INTIMIDATION", "MONEY_DEMAND"];
const intentColors: Record<string, string> = {
  URGENCY_CREATION: "#F59E0B",
  IMPERSONATION: "#818CF8",
  LEGAL_THREAT: "#E63A1E",
  INTIMIDATION: "#E63A1E",
  MONEY_DEMAND: "#EF4444",
  NORMAL: "#6B7280",
};

const mockTranscript = [
  { speaker: "CALLER", text: "Namaste, main CBI Officer Rahul Kumar bol raha hoon. Aapka Aadhaar number money laundering case mein involved hai.", intent: "IMPERSONATION", time: "0:03" },
  { speaker: "VICTIM", text: "Sorry? Main kuch samjha nahi...", intent: "NORMAL", time: "0:08" },
  { speaker: "CALLER", text: "Aapko turant respond karna hoga! Supreme Court case number SC-2024-789 mein aapka naam hai. Agar abhi payment nahi ki toh arrest warrant issue ho jayega!", intent: "LEGAL_THREAT", time: "0:15" },
  { speaker: "CALLER", text: "Aapke paas sirf 2 ghante hain. Rs 50,000 immediately transfer karo ya police aayegi!", intent: "MONEY_DEMAND", time: "0:31" },
  { speaker: "VICTIM", text: "Main kya karun? Bahut dar lag raha hai...", intent: "NORMAL", time: "0:41" },
  { speaker: "CALLER", text: "Bilkul mera hi follow karo. Kisi ko mat batao, warna aur serious charges honge!", intent: "INTIMIDATION", time: "0:48" },
];

export default function SentinelPage() {
  const [activeTab, setActiveTab] = useState<"simulate" | "upload" | "text">("simulate");
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [threatScore, setThreatScore] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const [textInput, setTextInput] = useState("");
  const [textResult, setTextResult] = useState<null | { score: number; intents: string[] }>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCall = () => {
    setIsCallActive(true);
    setCallDuration(0);
    setThreatScore(0);
    setShowTranscript(true);
    setVisibleLines(0);

    timerRef.current = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);

    // Animate transcript
    mockTranscript.forEach((_, i) => {
      setTimeout(() => {
        setVisibleLines((v) => v + 1);
        if (i >= 1) setThreatScore(Math.min(10 + i * 14, 87));
      }, i * 1800 + 800);
    });
  };

  const stopCall = () => {
    setIsCallActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const analyseText = () => {
    if (!textInput.trim()) return;
    const score = textInput.toLowerCase().includes("cbi") || textInput.includes("arrest")
      ? 82 : textInput.includes("bank") || textInput.includes("kyc")
      ? 55 : 18;
    setTextResult({ score, intents: score > 60 ? ["IMPERSONATION", "LEGAL_THREAT"] : score > 30 ? ["URGENCY_CREATION"] : [] });
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "var(--bg-primary)" }}>
      <ModuleSidebar />

      <div style={{ marginLeft: "240px", flex: 1, padding: "2rem", paddingTop: "1.5rem", overflowY: "auto" }}>
        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)" }} />
              <span className="label-text">Module 01</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: "0.375rem" }}>
              SENTINEL <span style={{ color: "var(--accent)" }}>—</span> Scam Detection
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
              Real-time digital arrest scam detection via multilingual NLP, voice analysis, and deepfake detection.
            </p>
          </div>
          <WireSphere size={80} variant="active" animated />
        </div>

        {/* Tab Selector */}
        <div style={{ display: "flex", gap: "0.25rem", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "10px", padding: "0.375rem", marginBottom: "1.75rem", width: "fit-content" }}>
          {(["simulate", "upload", "text"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "7px",
                border: "none",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily: "var(--font-body)",
                background: activeTab === tab ? "var(--accent)" : "transparent",
                color: activeTab === tab ? "white" : "var(--text-muted)",
                transition: "all 150ms ease",
              }}
            >
              {tab === "simulate" ? "📞 Simulate Call" : tab === "upload" ? "📁 Upload Audio" : "✉️ Analyse Text"}
            </button>
          ))}
        </div>

        {/* Main Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "1.5rem" }}>

          {/* Left: Input Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Simulate Tab */}
            {activeTab === "simulate" && (
              <div className="card-static" style={{ padding: "2rem" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                  Scam Call Simulator
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
                  Simulates a CBI digital arrest scam call in Hindi. Watch as SENTINEL analyses in real-time.
                </p>

                {/* Scenario selection */}
                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
                  {["CBI Digital Arrest (Hindi)", "Customs Scam (English)", "Bank KYC Fraud (Marathi)"].map((s, i) => (
                    <button
                      key={s}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        border: `1px solid ${i === 0 ? "var(--accent)" : "var(--bg-border)"}`,
                        background: i === 0 ? "var(--accent-glow)" : "transparent",
                        color: i === 0 ? "var(--accent)" : "var(--text-secondary)",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Call control */}
                <div
                  style={{
                    background: isCallActive
                      ? "linear-gradient(135deg, #1a0a0a, #2a0f0f)"
                      : "var(--bg-tertiary)",
                    border: isCallActive ? "1px solid rgba(230,58,30,0.3)" : "1px solid var(--bg-border)",
                    borderRadius: "12px",
                    padding: "2rem",
                    textAlign: "center",
                    transition: "all 300ms ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>
                      🤖
                    </div>
                  </div>
                  {isCallActive ? (
                    <>
                      <div style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 600, letterSpacing: "0.1em", marginBottom: "0.25rem" }}>CALL IN PROGRESS</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", color: "var(--text-primary)", marginBottom: "1.5rem" }}>{fmt(callDuration)}</div>
                      {/* Waveform */}
                      <div style={{ display: "flex", gap: "3px", justifyContent: "center", height: "32px", alignItems: "center", marginBottom: "1.5rem" }}>
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div key={i} className="waveform-bar" style={{ width: "3px", height: `${8 + Math.random() * 24}px`, animationDelay: `${i * 0.05}s` }} />
                        ))}
                      </div>
                      <button onClick={stopCall} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.875rem 2rem", background: "#EF4444", border: "none", borderRadius: "8px", color: "white", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                        <PhoneOff size={16} /> End Call
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Ready to simulate scam detection</div>
                      <button onClick={startCall} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.875rem 2rem", background: "var(--accent)", border: "none", borderRadius: "8px", color: "white", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                        <Play size={16} /> Simulate Scam Call
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Text Tab */}
            {activeTab === "text" && (
              <div className="card-static" style={{ padding: "2rem" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1.25rem" }}>
                  Analyse Suspicious Text
                </h3>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste an SMS, WhatsApp message, or email text here...&#10;&#10;Example: 'Your Aadhaar card has been suspended. Call CBI immediately at 9876543210 or face arrest warrant...'"
                  className="input"
                  style={{ minHeight: "160px", resize: "vertical", fontFamily: "var(--font-body)", lineHeight: 1.6 }}
                />
                <button onClick={analyseText} className="btn btn-primary" style={{ marginTop: "1rem", width: "100%", justifyContent: "center" }}>
                  Analyse Message
                </button>
                {textResult && (
                  <div style={{ marginTop: "1.25rem", padding: "1.25rem", background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", borderRadius: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>Analysis Result</span>
                      <span style={{ fontSize: "0.8125rem", color: textResult.score > 60 ? "var(--accent)" : "#F59E0B" }}>
                        {textResult.score > 60 ? "⚠ HIGH RISK" : textResult.score > 30 ? "⚡ MEDIUM RISK" : "✓ LOW RISK"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {textResult.intents.length > 0 ? textResult.intents.map((intent) => (
                        <span key={intent} style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", padding: "0.25rem 0.625rem", borderRadius: "100px", background: `${intentColors[intent]}20`, color: intentColors[intent], border: `1px solid ${intentColors[intent]}40` }}>
                          {intent}
                        </span>
                      )) : <span style={{ fontSize: "0.875rem", color: "#10B981" }}>✓ No suspicious intents detected</span>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upload Tab */}
            {activeTab === "upload" && (
              <div className="card-static" style={{ padding: "2rem" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1.25rem" }}>
                  Upload Call Recording
                </h3>
                <div
                  style={{
                    border: "2px dashed var(--bg-border)",
                    borderRadius: "12px",
                    padding: "3rem 2rem",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "border-color 200ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--bg-border)")}
                >
                  <Upload size={36} color="var(--text-muted)" strokeWidth={1.5} style={{ marginBottom: "1rem" }} />
                  <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.375rem" }}>
                    Drop audio file here
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                    MP3, WAV, OGG, M4A up to 50MB
                  </div>
                  <button className="btn btn-secondary">Browse Files</button>
                </div>
              </div>
            )}

            {/* Transcript */}
            {showTranscript && (
              <div className="card-static" style={{ overflow: "hidden" }}>
                <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--bg-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>Live Transcript</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", animation: isCallActive ? "pulse-glow 1.5s infinite" : "none" }} />
                    <span style={{ fontSize: "0.6875rem", color: isCallActive ? "var(--accent)" : "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em" }}>
                      {isCallActive ? "LIVE" : "COMPLETED"}
                    </span>
                  </div>
                </div>
                <div style={{ padding: "1rem 1.5rem", maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  {mockTranscript.slice(0, visibleLines).map((line, i) => (
                    <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                      <span
                        style={{
                          fontSize: "0.625rem",
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          color: line.speaker === "CALLER" ? "var(--accent)" : "var(--text-secondary)",
                          width: "52px",
                          flexShrink: 0,
                          paddingTop: "2px",
                        }}
                      >
                        {line.speaker}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", lineHeight: 1.55, fontFamily: "var(--font-mono)" }}>{line.text}</p>
                        {line.intent !== "NORMAL" && (
                          <span style={{ display: "inline-block", marginTop: "4px", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", padding: "0.175rem 0.5rem", borderRadius: "100px", background: `${intentColors[line.intent]}20`, color: intentColors[line.intent], border: `1px solid ${intentColors[line.intent]}40` }}>
                            {line.intent}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", flexShrink: 0 }}>{line.time}</span>
                    </div>
                  ))}
                  {isCallActive && visibleLines < mockTranscript.length && (
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[0, 1, 2].map((i) => (
                          <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--text-muted)", animation: `blink 1.2s ${i * 0.2}s infinite` }} />
                        ))}
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Transcribing...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Analysis Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Threat Score */}
            <div className="card-static" style={{ padding: "1.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
                Real-Time Threat Score
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                <ThreatGauge score={threatScore} size={160} label="Threat Score" animated />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
                {["< 40: LOW", "40–70: MEDIUM", "> 70: HIGH"].map((l, i) => (
                  <span key={l} style={{ fontSize: "0.625rem", color: i === 0 ? "#10B981" : i === 1 ? "#F59E0B" : "var(--accent)", fontWeight: 600, letterSpacing: "0.06em" }}>{l}</span>
                ))}
              </div>
            </div>

            {/* Detected Intents */}
            <div className="card-static" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.875rem" }}>Detected Patterns</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {threatScore > 0 ? mockIntents.slice(0, Math.max(1, Math.floor(threatScore / 18))).map((intent) => (
                  <div key={intent} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 0.75rem", background: `${intentColors[intent]}12`, border: `1px solid ${intentColors[intent]}25`, borderRadius: "8px" }}>
                    <AlertTriangle size={13} color={intentColors[intent]} />
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: intentColors[intent] }}>{intent}</span>
                  </div>
                )) : (
                  <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", textAlign: "center", padding: "1rem" }}>
                    Start analysis to detect patterns
                  </div>
                )}
              </div>
            </div>

            {/* Number reputation */}
            <div className="card-static" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.875rem" }}>Number Reputation Check</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input type="tel" placeholder="+91 XXXXX XXXXX" className="input" style={{ fontSize: "0.875rem", flex: 1 }} />
                <button className="btn btn-primary" style={{ flexShrink: 0, padding: "0.625rem 1rem" }}>Check</button>
              </div>
            </div>

            {/* Alert trigger */}
            {threatScore >= 70 && (
              <div style={{ background: "rgba(230,58,30,0.1)", border: "1px solid rgba(230,58,30,0.3)", borderRadius: "12px", padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <AlertTriangle size={18} color="var(--accent)" />
                  <span style={{ fontWeight: 700, color: "var(--accent)", fontSize: "0.9375rem" }}>HIGH RISK DETECTED</span>
                </div>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.55 }}>
                  Scam probability exceeds threshold. Sending alert to citizen and LEO dashboard.
                </p>
                <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  Send Alert via SMS ↗
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
