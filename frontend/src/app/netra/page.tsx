"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield, Eye, Network, Map, MessageCircle, LayoutDashboard,
  Settings, Sun, Moon, Upload, Camera, CheckCircle, XCircle,
  AlertTriangle, ChevronRight, RotateCcw, Clock,
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

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
          const isActive = pathname === href;
          return (
            <Link key={label} href={href} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0.875rem", borderRadius: "var(--radius-md)", textDecoration: "none", fontSize: "0.8125rem", fontWeight: isActive ? 600 : 500, color: isActive ? "var(--text-primary)" : "var(--text-secondary)", backgroundColor: isActive ? "var(--bg-tertiary)" : "transparent", borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent", transition: "all 150ms ease" }}>
              <Icon size={17} color={isActive ? "var(--accent)" : (color || "currentColor")} strokeWidth={2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--bg-border)" }}>
        <button onClick={toggleTheme} style={{ display: "flex", alignItems: "center", gap: "0.625rem", width: "100%", padding: "0.625rem 0.875rem", background: "none", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "var(--font-body)" }}>
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    </aside>
  );
}

const mockFeatures = [
  { name: "Mahatma Gandhi Portrait", status: "pass" },
  { name: "Security Thread", status: "pass" },
  { name: "Watermark", status: "warn" },
  { name: "Micro Lettering", status: "fail" },
  { name: "Intaglio Printing", status: "pass" },
  { name: "Fluorescent Ink", status: "fail" },
  { name: "See-through Register", status: "pass" },
  { name: "Latent Image", status: "warn" },
  { name: "Serial Number", status: "pass" },
  { name: "Colour Shifting Ink", status: "fail" },
];

const mockHistory = [
  { id: "SCN-001", time: "10:24 AM", denom: "₹500", verdict: "AUTHENTIC", confidence: 98 },
  { id: "SCN-002", time: "10:18 AM", denom: "₹200", verdict: "COUNTERFEIT", confidence: 94 },
  { id: "SCN-003", time: "09:55 AM", denom: "₹500", verdict: "SUSPICIOUS", confidence: 71 },
  { id: "SCN-004", time: "09:41 AM", denom: "₹100", verdict: "AUTHENTIC", confidence: 99 },
  { id: "SCN-005", time: "09:12 AM", denom: "₹2000", verdict: "AUTHENTIC", confidence: 97 },
];

const verdictColors: Record<string, string> = {
  AUTHENTIC: "#10B981",
  SUSPICIOUS: "#F59E0B",
  COUNTERFEIT: "#E63A1E",
};

const steps = ["CAPTURE", "PREPROCESS", "ANALYSE", "REPORT"];

export default function NetraPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [denomination, setDenomination] = useState("₹500");
  const [analysing, setAnalysing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<null | { verdict: string; confidence: number }>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setSelectedFile(file);
    setResult(null);
    setCurrentStep(0);
  };

  const handleAnalyse = async () => {
    if (analysing) return;
    setAnalysing(true);
    setCurrentStep(1);
    await new Promise(r => setTimeout(r, 700));
    setCurrentStep(2);
    await new Promise(r => setTimeout(r, 900));
    setCurrentStep(3);
    await new Promise(r => setTimeout(r, 800));
    setResult({ verdict: "SUSPICIOUS", confidence: 76 });
    setAnalysing(false);
  };

  const statusIcon = (status: string) => {
    if (status === "pass") return <CheckCircle size={15} color="#10B981" />;
    if (status === "fail") return <XCircle size={15} color="#E63A1E" />;
    return <AlertTriangle size={15} color="#F59E0B" />;
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "var(--bg-primary)" }}>
      <Sidebar />
      <main style={{ marginLeft: "240px", flex: 1, padding: "2rem", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Eye size={20} color="#10B981" />
            </div>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.5rem", color: "var(--text-primary)" }}>
                NETRA — Currency Authenticity Scanner
              </h1>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>AI-powered counterfeit currency detection using 10-point security feature analysis</p>
            </div>
          </div>
          {/* Stats */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "1.25rem" }}>
            {[{ label: "Scans Today", value: "142" }, { label: "Counterfeits", value: "8", color: "#E63A1E" }, { label: "Accuracy", value: "98.7%", color: "#10B981" }].map(s => (
              <div key={s.label} style={{ padding: "0.75rem 1.25rem", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-lg)" }}>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
                <p style={{ fontSize: "1.25rem", fontWeight: 800, color: s.color ?? "var(--text-primary)", fontFamily: "var(--font-display)" }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", alignItems: "center", gap: "0", marginBottom: "2rem" }}>
          {steps.map((step, i) => (
            <React.Fragment key={step}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", background: currentStep >= i ? "rgba(16,185,129,0.15)" : "var(--bg-secondary)", border: `1px solid ${currentStep >= i ? "#10B981" : "var(--bg-border)"}`, transition: "all 300ms ease" }}>
                <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: currentStep > i ? "#10B981" : currentStep === i ? "#F59E0B" : "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: currentStep >= i ? "white" : "var(--text-muted)" }}>
                  {currentStep > i ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", color: currentStep >= i ? "var(--text-primary)" : "var(--text-muted)" }}>{step}</span>
              </div>
              {i < steps.length - 1 && <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />}
            </React.Fragment>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
          {/* Scanner zone */}
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>Currency Note Image</h3>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileInputRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? "#10B981" : selectedFile ? "#10B981" : "var(--bg-border)"}`, borderRadius: "var(--radius-lg)", padding: "2.5rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", cursor: "pointer", transition: "all 200ms ease", background: dragOver ? "rgba(16,185,129,0.05)" : "transparent" }}
            >
              {selectedFile ? (
                <>
                  <CheckCircle size={36} color="#10B981" />
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#10B981" }}>{selectedFile.name}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{(selectedFile.size / 1024).toFixed(1)} KB · Click to change</p>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <Upload size={28} color="var(--text-muted)" />
                    <Camera size={28} color="var(--text-muted)" />
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", textAlign: "center" }}>Drop currency note image here<br />or click to capture / upload</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Supports JPG, PNG, WEBP</p>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />

            {/* Denomination */}
            <div style={{ marginTop: "1rem" }}>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.625rem" }}>Denomination</p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["₹50", "₹100", "₹200", "₹500", "₹2000"].map(d => (
                  <button key={d} onClick={() => setDenomination(d)} style={{ padding: "0.375rem 0.875rem", borderRadius: "var(--radius-md)", border: `1px solid ${denomination === d ? "#10B981" : "var(--bg-border)"}`, background: denomination === d ? "rgba(16,185,129,0.15)" : "var(--bg-tertiary)", color: denomination === d ? "#10B981" : "var(--text-secondary)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", transition: "all 150ms ease" }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleAnalyse} disabled={analysing} style={{ marginTop: "1.25rem", width: "100%", padding: "0.875rem", background: analysing ? "var(--bg-tertiary)" : "var(--accent)", color: "white", border: "none", borderRadius: "var(--radius-md)", fontSize: "0.9rem", fontWeight: 700, cursor: analysing ? "not-allowed" : "pointer", letterSpacing: "0.06em", transition: "all 200ms ease", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              {analysing ? (
                <>
                  <span style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid white", borderTopColor: "transparent", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  ANALYSING...
                </>
              ) : "ANALYSE NOTE"}
            </button>
          </div>

          {/* Results */}
          <div style={{ background: "var(--bg-secondary)", border: `1px solid ${result ? verdictColors[result.verdict] + "40" : "var(--bg-border)"}`, borderRadius: "var(--radius-lg)", padding: "1.5rem", transition: "border-color 400ms ease" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>Analysis Results</h3>
            {!result ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "280px", gap: "1rem", color: "var(--text-muted)" }}>
                <Eye size={40} style={{ opacity: 0.3 }} />
                <p style={{ fontSize: "0.875rem" }}>Upload a note and click Analyse</p>
              </div>
            ) : (
              <>
                {/* Verdict */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", padding: "1rem", background: `${verdictColors[result.verdict]}15`, borderRadius: "var(--radius-md)", border: `1px solid ${verdictColors[result.verdict]}30` }}>
                  <div>
                    <span style={{ display: "inline-block", padding: "0.25rem 0.875rem", borderRadius: "100px", background: `${verdictColors[result.verdict]}25`, color: verdictColors[result.verdict], fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.1em" }}>{result.verdict}</span>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{denomination} · Confidence: <strong style={{ color: verdictColors[result.verdict] }}>{result.confidence}%</strong></p>
                  </div>
                </div>
                {/* Feature checklist */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {mockFeatures.map(f => (
                    <div key={f.name} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 0.625rem", borderRadius: "var(--radius-sm)", background: "var(--bg-tertiary)" }}>
                      {statusIcon(f.status)}
                      <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", flex: 1 }}>{f.name}</span>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: f.status === "pass" ? "#10B981" : f.status === "fail" ? "#E63A1E" : "#F59E0B" }}>{f.status}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setResult(null); setSelectedFile(null); setCurrentStep(0); }} style={{ marginTop: "1rem", width: "100%", padding: "0.625rem", background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", fontSize: "0.8125rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <RotateCcw size={14} /> New Scan
                </button>
              </>
            )}
          </div>
        </div>

        {/* History Table */}
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--bg-border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Clock size={16} color="var(--text-muted)" />
            <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>Scan History</h3>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--bg-border)" }}>
                {["Scan ID", "Time", "Denomination", "Verdict", "Confidence"].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockHistory.map((row, i) => (
                <tr key={row.id} style={{ borderBottom: i < mockHistory.length - 1 ? "1px solid var(--bg-border)" : "none", transition: "background 150ms ease" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-tertiary)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{row.id}</td>
                  <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{row.time}</td>
                  <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>{row.denom}</td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>
                    <span style={{ padding: "0.175rem 0.6rem", borderRadius: "100px", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.08em", background: `${verdictColors[row.verdict]}20`, color: verdictColors[row.verdict] }}>{row.verdict}</span>
                  </td>
                  <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.875rem", fontWeight: 700, color: verdictColors[row.verdict] }}>{row.confidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
