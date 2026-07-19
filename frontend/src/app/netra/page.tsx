"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Eye,
  Network,
  Map,
  MessageCircle,
  LayoutDashboard,
  Settings,
  Sun,
  Moon,
  Upload,
  Camera,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  RotateCcw,
  Clock,
  Zap,
  FileText,
  Cpu,
  Search,
  Hash,
  LogOut,
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAuth } from "@/components/providers/AuthContext";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { CitizenSidebar } from "@/components/layout/CitizenSidebar";
import {
  scanCurrency,
  getNetraStats,
  getNetraHistory,
  checkSerialNumber,
  reportCounterfeit,
} from "@/lib/api";
import type { NetraScanResultExtended, NetraScanHistory } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Nav
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const verdictColors: Record<string, string> = {
  AUTHENTIC: "#10B981",
  SUSPICIOUS: "#F59E0B",
  COUNTERFEIT: "#E63A1E",
};

const riskColors: Record<string, string> = {
  low: "#10B981",
  medium: "#F59E0B",
  high: "#E63A1E",
  critical: "#E63A1E",
};

const steps = ["CAPTURE", "PREPROCESS", "ANALYSE", "REPORT"];

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function NetraPage() {
  const { user, loading, registerCitizen } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.href = "/login";
      } else if (!user.isCitizen) {
        registerCitizen();
      }
    }
  }, [user, loading, registerCitizen]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [denomination, setDenomination] = useState("₹500");
  const [analysing, setAnalysing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<NetraScanResultExtended | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [history, setHistory] = useState<NetraScanHistory[]>([]);
  const [stats, setStats] = useState({
    total_scans: 142,
    counterfeits: 8,
    authentic: 134,
    accuracy: 98.7,
  });
  const [error, setError] = useState<string | null>(null);
  const [isNotBanknoteError, setIsNotBanknoteError] = useState(false);
  const [serialCheckInput, setSerialCheckInput] = useState("");
  const [serialCheckResult, setSerialCheckResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "serial">("upload");
  const [reported, setReported] = useState(false);
  const [serialChecking, setSerialChecking] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.href = "/login";
      } else if (user.activeRole === "citizen" && !user.isCitizen) {
        registerCitizen();
      }
    }
  }, [user, loading, registerCitizen]);

  // Load stats + history on mount
  useEffect(() => {
    getNetraStats()
      .then((r) => {
        if (r.data) setStats((prev) => ({ ...prev, ...(r.data as any) }));
      })
      .catch(() => {});
    getNetraHistory()
      .then((r) => {
        if (r.data) setHistory(r.data);
      })
      .catch(() => {});
  }, []);

  if (loading || !user) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)", color: "var(--text-secondary)" }}>
        <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>Verifying NETRA access...</div>
      </div>
    );
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleFile = (file: File) => {
    // Basic client-side image type validation
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPEG, PNG, WEBP, BMP).");
      setIsNotBanknoteError(false);
      return;
    }
    setSelectedFile(file);
    setResult(null);
    setCurrentStep(0);
    setError(null);
    setIsNotBanknoteError(false);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyse = async () => {
    if (!selectedFile || analysing) return;
    setAnalysing(true);
    setError(null);
    setIsNotBanknoteError(false);
    setReported(false);
    setCurrentStep(1); // PREPROCESS
    await new Promise((r) => setTimeout(r, 400));
    setCurrentStep(2); // ANALYSE
    try {
      const response = await scanCurrency(selectedFile, denomination);
      setCurrentStep(3); // REPORT
      await new Promise((r) => setTimeout(r, 200));
      if (response.success && response.data) {
        setResult(response.data as NetraScanResultExtended);
        getNetraHistory()
          .then((r) => { if (r.data) setHistory(r.data); })
          .catch(() => {});
        getNetraStats()
          .then((r) => { if (r.data) setStats((prev) => ({ ...prev, ...(r.data as any) })); })
          .catch(() => {});
      } else {
        const msg = response.error || "Analysis failed";
        const notNote =
          msg.toLowerCase().includes("not appear to be") ||
          msg.toLowerCase().includes("currency note") ||
          msg.toLowerCase().includes("banknote");
        setIsNotBanknoteError(notNote);
        setError(msg);
      }
    } catch (err: any) {
      setError(err?.message || "Network error — is the backend running?");
    } finally {
      setAnalysing(false);
    }
  };

  const handleSerialCheck = async () => {
    if (!serialCheckInput.trim() || serialChecking) return;
    setSerialChecking(true);
    setSerialCheckResult(null);
    try {
      const response = await checkSerialNumber(serialCheckInput.trim());
      if (response.success && response.data) {
        setSerialCheckResult(response.data);
      } else {
        setSerialCheckResult({ _error: response.error || "Check failed" });
      }
    } catch (err: any) {
      setSerialCheckResult({
        _error: err?.message || "Network error — is the backend running?",
      });
    } finally {
      setSerialChecking(false);
    }
  };

  const handleReportCounterfeit = async () => {
    if (!result?.scan_id || reported) return;
    try {
      const response = await reportCounterfeit(result.scan_id);
      if (response.success) {
        setReported(true);
      } else {
        setError(response.error || "Report submission failed");
      }
    } catch (err: any) {
      setError(err?.message || "Report failed — is the backend running?");
    }
  };

  const statusIcon = (status: string) => {
    if (status === "pass") return <CheckCircle size={15} color="#10B981" />;
    if (status === "fail") return <XCircle size={15} color="#E63A1E" />;
    return <AlertTriangle size={15} color="#F59E0B" />;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "var(--bg-primary)",
      }}
    >
      <CitizenSidebar />

      <main
        style={{
          marginLeft: "240px",
          flex: 1,
          padding: "2rem",
          overflowY: "auto",
        }}
      >
        {/* ── Header ── */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.5rem",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(16,185,129,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Eye size={20} color="#10B981" />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: "1.5rem",
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                NETRA{" "}
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontWeight: 400,
                    fontSize: "1.125rem",
                  }}
                >
                  —
                </span>{" "}
                Currency Authenticity Scanner
              </h1>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--text-secondary)",
                  margin: 0,
                }}
              >
                AI-powered counterfeit detection using multi-point security
                feature analysis
              </p>
            </div>
          </div>

          {/* Stats cards */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "1.25rem" }}>
            {[
              { label: "Total Scans", value: stats.total_scans.toString() },
              {
                label: "Counterfeits Found",
                value: stats.counterfeits.toString(),
                color: "#E63A1E",
              },
              {
                label: "Authentic",
                value: stats.authentic.toString(),
                color: "#10B981",
              },
              {
                label: "Accuracy",
                value: `${stats.accuracy}%`,
                color: "#10B981",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  padding: "0.75rem 1.25rem",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--bg-border)",
                  borderRadius: "var(--radius-lg)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: 0,
                  }}
                >
                  {s.label}
                </p>
                <p
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    color: s.color ?? "var(--text-primary)",
                    fontFamily: "var(--font-display)",
                    margin: 0,
                  }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Steps indicator ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            marginBottom: "1.5rem",
          }}
        >
          {steps.map((step, i) => (
            <React.Fragment key={step}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "var(--radius-md)",
                  background:
                    currentStep >= i
                      ? "rgba(16,185,129,0.12)"
                      : "var(--bg-secondary)",
                  border: `1px solid ${currentStep >= i ? "#10B981" : "var(--bg-border)"}`,
                  transition: "all 300ms ease",
                }}
              >
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background:
                      currentStep > i
                        ? "#10B981"
                        : currentStep === i
                          ? analysing
                            ? "#F59E0B"
                            : "#10B981"
                          : "var(--bg-tertiary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: currentStep >= i ? "white" : "var(--text-muted)",
                    animation:
                      currentStep === i && analysing
                        ? "pulse 1s ease-in-out infinite"
                        : "none",
                  }}
                >
                  {currentStep > i ? "✓" : i + 1}
                </div>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color:
                      currentStep >= i
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                  }}
                >
                  {step}
                </span>
              </div>
              {i < steps.length - 1 && (
                <ChevronRight
                  size={16}
                  color="var(--text-muted)"
                  style={{ flexShrink: 0 }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Tab switcher ── */}
        <div
          style={{
            display: "flex",
            gap: "0.25rem",
            marginBottom: "1.5rem",
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius-md)",
            padding: "0.25rem",
            border: "1px solid var(--bg-border)",
            width: "fit-content",
          }}
        >
          <button
            onClick={() => setActiveTab("upload")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1.25rem",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background:
                activeTab === "upload" ? "var(--bg-tertiary)" : "transparent",
              color:
                activeTab === "upload"
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              fontSize: "0.8125rem",
              fontWeight: activeTab === "upload" ? 700 : 500,
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
          >
            <Upload
              size={15}
              color={activeTab === "upload" ? "#10B981" : "currentColor"}
            />
            Scan Currency Note
          </button>
          <button
            onClick={() => setActiveTab("serial")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1.25rem",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background:
                activeTab === "serial" ? "var(--bg-tertiary)" : "transparent",
              color:
                activeTab === "serial"
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              fontSize: "0.8125rem",
              fontWeight: activeTab === "serial" ? 700 : 500,
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
          >
            <Hash
              size={15}
              color={activeTab === "serial" ? "#10B981" : "currentColor"}
            />
            Serial Number Check
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* Tab: Upload / Scan                                                */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "upload" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            {/* Left — Scanner panel */}
            <div
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--bg-border)",
                borderRadius: "var(--radius-lg)",
                padding: "1.5rem",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: "0 0 1rem 0",
                }}
              >
                Currency Note Image
              </h3>

              {/* Drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleFile(f);
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? "#10B981" : imagePreview ? "#10B981" : "var(--bg-border)"}`,
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 200ms ease",
                  background: dragOver
                    ? "rgba(16,185,129,0.05)"
                    : "transparent",
                  minHeight: "200px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Currency note preview"
                    style={{
                      width: "100%",
                      maxHeight: "220px",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      padding: "2rem 1rem",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <Upload size={28} color="var(--text-muted)" />
                      <Camera size={28} color="var(--text-muted)" />
                    </div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--text-secondary)",
                        textAlign: "center",
                        margin: 0,
                      }}
                    >
                      Drop currency note image here
                      <br />
                      or click to capture / upload
                    </p>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        margin: 0,
                      }}
                    >
                      Supports JPG, PNG, WEBP
                    </p>
                  </div>
                )}
              </div>
              {selectedFile && (
                <p
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    marginTop: "0.5rem",
                    textAlign: "center",
                  }}
                >
                  {selectedFile.name} · {(selectedFile.size / 1024).toFixed(1)}{" "}
                  KB · Click to change
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                }}
              />

              {/* Denomination selector */}
              <div style={{ marginTop: "1.25rem" }}>
                <p
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: "0 0 0.625rem 0",
                  }}
                >
                  Denomination Hint
                </p>
                <div
                  style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                >
                  {["₹50", "₹100", "₹200", "₹500", "₹2000"].map((d) => (
                    <button
                      key={d}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDenomination(d);
                      }}
                      style={{
                        padding: "0.375rem 0.875rem",
                        borderRadius: "var(--radius-md)",
                        border: `1px solid ${denomination === d ? "#10B981" : "var(--bg-border)"}`,
                        background:
                          denomination === d
                            ? "rgba(16,185,129,0.15)"
                            : "var(--bg-tertiary)",
                        color:
                          denomination === d
                            ? "#10B981"
                            : "var(--text-secondary)",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 150ms ease",
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "0.875rem 1rem",
                    background: isNotBanknoteError
                      ? "rgba(245,158,11,0.08)"
                      : "rgba(230,58,30,0.08)",
                    border: `1px solid ${
                      isNotBanknoteError
                        ? "rgba(245,158,11,0.4)"
                        : "rgba(230,58,30,0.3)"
                    }`,
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.625rem",
                      marginBottom: isNotBanknoteError ? "0.75rem" : 0,
                    }}
                  >
                    <AlertTriangle
                      size={15}
                      color={isNotBanknoteError ? "#F59E0B" : "#E63A1E"}
                      style={{ flexShrink: 0, marginTop: "2px" }}
                    />
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: isNotBanknoteError ? "#F59E0B" : "#E63A1E",
                        margin: 0,
                        fontWeight: 600,
                      }}
                    >
                      {isNotBanknoteError
                        ? "Not a valid currency note image"
                        : error}
                    </p>
                  </div>
                  {isNotBanknoteError && (
                    <div
                      style={{
                        marginLeft: "1.5rem",
                        fontSize: "0.775rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.6,
                      }}
                    >
                      <p style={{ margin: "0 0 0.4rem 0", fontWeight: 600 }}>
                        Tips for a good scan:
                      </p>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "1.1rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.2rem",
                        }}
                      >
                        <li>Place the note flat under good, even lighting</li>
                        <li>
                          Fill most of the frame — front side facing the camera
                        </li>
                        <li>
                          Accepted denominations: ₹10 / ₹20 / ₹50 / ₹100 /
                          ₹200 / ₹500 / ₹2000
                        </li>
                        <li>Avoid screenshots, printed images, or other objects</li>
                        <li>Ensure the image is sharp (not blurry or cropped)</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Analyse button */}
              <button
                onClick={handleAnalyse}
                disabled={!selectedFile || analysing}
                style={{
                  marginTop: "1.25rem",
                  width: "100%",
                  padding: "0.875rem",
                  background:
                    !selectedFile || analysing
                      ? "var(--bg-tertiary)"
                      : "#10B981",
                  color:
                    !selectedFile || analysing ? "var(--text-muted)" : "white",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  cursor:
                    !selectedFile || analysing ? "not-allowed" : "pointer",
                  letterSpacing: "0.06em",
                  transition: "all 200ms ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                {analysing ? (
                  <>
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        border: "2px solid var(--text-muted)",
                        borderTopColor: "transparent",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                      }}
                    />
                    ANALYSING...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    ANALYSE NOTE
                  </>
                )}
              </button>
            </div>

            {/* Right — Results panel */}
            <div
              style={{
                background: "var(--bg-secondary)",
                border: `1px solid ${result ? verdictColors[result.verdict] + "40" : "var(--bg-border)"}`,
                borderRadius: "var(--radius-lg)",
                padding: "1.5rem",
                transition: "border-color 400ms ease",
                overflowY: "auto",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: "0 0 1rem 0",
                }}
              >
                Analysis Results
              </h3>

              {!result ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "280px",
                    gap: "1rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <Eye size={44} style={{ opacity: 0.2 }} />
                  <div style={{ textAlign: "center" }}>
                    <p
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        margin: "0 0 0.375rem 0",
                      }}
                    >
                      No scan yet
                    </p>
                    <p style={{ fontSize: "0.8rem", margin: 0 }}>
                      Upload a currency note image
                      <br />
                      and click Analyse to begin
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Verdict */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      marginBottom: "1.25rem",
                      padding: "1rem",
                      background: `${verdictColors[result.verdict]}12`,
                      borderRadius: "var(--radius-md)",
                      border: `1px solid ${verdictColors[result.verdict]}30`,
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: `${verdictColors[result.verdict]}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {result.verdict === "AUTHENTIC" ? (
                        <CheckCircle
                          size={22}
                          color={verdictColors[result.verdict]}
                        />
                      ) : result.verdict === "SUSPICIOUS" ? (
                        <AlertTriangle
                          size={22}
                          color={verdictColors[result.verdict]}
                        />
                      ) : (
                        <XCircle
                          size={22}
                          color={verdictColors[result.verdict]}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.25rem 0.875rem",
                          borderRadius: "100px",
                          background: `${verdictColors[result.verdict]}25`,
                          color: verdictColors[result.verdict],
                          fontSize: "0.8rem",
                          fontWeight: 800,
                          letterSpacing: "0.1em",
                        }}
                      >
                        {result.verdict}
                      </span>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          margin: "0.25rem 0 0 0",
                        }}
                      >
                        Confidence:{" "}
                        <strong
                          style={{ color: verdictColors[result.verdict] }}
                        >
                          {result.confidence}%
                        </strong>
                        {result.overall_score !== undefined && (
                          <>
                            {" "}
                            · Score:{" "}
                            <strong style={{ color: "var(--text-secondary)" }}>
                              {result.overall_score.toFixed(1)}%
                            </strong>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* OCR detection reason banner */}
                  {result.detection_reason && (
                    <div
                      style={{
                        marginBottom: "1rem",
                        padding: "0.75rem 1rem",
                        background: "rgba(230,58,30,0.08)",
                        border: "1px solid rgba(230,58,30,0.35)",
                        borderRadius: "var(--radius-md)",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.625rem",
                      }}
                    >
                      <AlertTriangle size={14} color="#E63A1E" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <div>
                        <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#E63A1E", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 0.2rem 0" }}>OCR Detection</p>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>{result.detection_reason}</p>
                      </div>
                    </div>
                  )}

                  {/* Denomination */}
                  {result.denomination && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.625rem 1rem",
                        background:
                          result.denomination === "unknown"
                            ? "rgba(245,158,11,0.08)"
                            : "rgba(16,185,129,0.06)",
                        borderRadius: "var(--radius-md)",
                        marginBottom: "1rem",
                        border: `1px solid ${
                          result.denomination === "unknown"
                            ? "rgba(245,158,11,0.3)"
                            : "rgba(16,185,129,0.2)"
                        }`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <Hash
                          size={14}
                          color={
                            result.denomination === "unknown"
                              ? "#F59E0B"
                              : "#10B981"
                          }
                        />
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          Detected Denomination
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "1.05rem",
                            fontWeight: 800,
                            color:
                              result.denomination === "unknown"
                                ? "#F59E0B"
                                : "var(--text-primary)",
                            fontFamily: "var(--font-display)",
                          }}
                        >
                          {result.denomination === "unknown"
                            ? "Not Detected"
                            : result.denomination}
                        </span>
                        {result.denomination_confidence !== undefined && (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--text-muted)",
                              background: "var(--bg-secondary)",
                              padding: "0.125rem 0.5rem",
                              borderRadius: "100px",
                              border: "1px solid var(--bg-border)",
                            }}
                          >
                            {result.denomination_confidence.toFixed(1)}% conf
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Processing info */}
                  {(result.pipeline_version ||
                    result.processing_time_ms !== undefined) && (
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginBottom: "1.25rem",
                      }}
                    >
                      {result.pipeline_version && (
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.375rem",
                            padding: "0.5rem 0.75rem",
                            background: "var(--bg-tertiary)",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--bg-border)",
                          }}
                        >
                          <Cpu size={12} color="var(--text-muted)" />
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            Pipeline
                          </span>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              color: "var(--text-secondary)",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {result.pipeline_version}
                          </span>
                        </div>
                      )}
                      {result.processing_time_ms !== undefined && (
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.375rem",
                            padding: "0.5rem 0.75rem",
                            background: "var(--bg-tertiary)",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--bg-border)",
                          }}
                        >
                          <Zap size={12} color="#10B981" />
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            Processed in
                          </span>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              color: "#10B981",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {result.processing_time_ms}ms
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Security features checklist */}
                  {result.features && result.features.length > 0 && (
                    <div style={{ marginBottom: "1.25rem" }}>
                      <p
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          margin: "0 0 0.5rem 0",
                        }}
                      >
                        Security Features
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.375rem",
                        }}
                      >
                        {result.features.map((f, idx) => (
                          <div
                            key={`${f.name}-${idx}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.625rem",
                              padding: "0.45rem 0.625rem",
                              borderRadius: "var(--radius-sm)",
                              background: "var(--bg-tertiary)",
                            }}
                          >
                            {statusIcon(f.status)}
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--text-secondary)",
                                flex: 1,
                              }}
                            >
                              {f.name}
                            </span>
                            {f.description && (
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  color: "var(--text-muted)",
                                  marginRight: "0.25rem",
                                }}
                              >
                                {f.description}
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                flexShrink: 0,
                                color:
                                  f.status === "pass"
                                    ? "#10B981"
                                    : f.status === "fail"
                                      ? "#E63A1E"
                                      : "#F59E0B",
                              }}
                            >
                              {f.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Serial number */}
                  {result.serial_number && (
                    <div style={{ marginBottom: "1.25rem" }}>
                      <p
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          margin: "0 0 0.5rem 0",
                        }}
                      >
                        Serial Number
                      </p>
                      <div
                        style={{
                          padding: "0.75rem 1rem",
                          background: "var(--bg-tertiary)",
                          borderRadius: "var(--radius-md)",
                          border: `1px solid ${
                            result.serial_number.is_known_counterfeit_prefix ||
                            result.serial_number.is_specimen_pattern
                              ? "rgba(230,58,30,0.4)"
                              : "var(--bg-border)"
                          }`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "0.625rem",
                          }}
                        >
                          <Hash
                            size={14}
                            color={
                              result.serial_number.ocr_detected
                                ? "var(--text-muted)"
                                : "var(--text-muted)"
                            }
                          />
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.875rem",
                              fontWeight: 700,
                              color: result.serial_number.ocr_detected
                                ? "var(--text-primary)"
                                : "var(--text-muted)",
                              letterSpacing: "0.1em",
                              fontStyle: result.serial_number.ocr_detected
                                ? "normal"
                                : "italic",
                            }}
                          >
                            {result.serial_number.extracted ?? "NOT DETECTED"}
                          </span>
                          {!result.serial_number.ocr_detected && (
                            <span
                              style={{
                                fontSize: "0.65rem",
                                color: "var(--text-muted)",
                                background: "var(--bg-secondary)",
                                padding: "0.1rem 0.4rem",
                                borderRadius: "4px",
                                border: "1px solid var(--bg-border)",
                              }}
                            >
                              OCR could not read serial
                            </span>
                          )}
                        </div>
                        {result.serial_number.ocr_detected && (
                          <div
                            style={{
                              display: "flex",
                              gap: "0.5rem",
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                padding: "0.175rem 0.625rem",
                                borderRadius: "100px",
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                background: result.serial_number.format_valid
                                  ? "rgba(16,185,129,0.15)"
                                  : "rgba(230,58,30,0.15)",
                                color: result.serial_number.format_valid
                                  ? "#10B981"
                                  : "#E63A1E",
                              }}
                            >
                              {result.serial_number.format_valid
                                ? "Valid Format"
                                : "Invalid Format"}
                            </span>
                            {result.serial_number.is_known_counterfeit_prefix && (
                              <span
                                style={{
                                  padding: "0.175rem 0.625rem",
                                  borderRadius: "100px",
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  background: "rgba(230,58,30,0.15)",
                                  color: "#E63A1E",
                                }}
                              >
                                ⚠ Counterfeit Prefix
                              </span>
                            )}
                            {result.serial_number.is_specimen_pattern && (
                              <span
                                style={{
                                  padding: "0.175rem 0.625rem",
                                  borderRadius: "100px",
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  background: "rgba(230,58,30,0.15)",
                                  color: "#E63A1E",
                                }}
                              >
                                ⚠ Specimen Serial
                              </span>
                            )}
                            <span
                              style={{
                                padding: "0.175rem 0.625rem",
                                borderRadius: "100px",
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                background: result.serial_number.denomination_match
                                  ? "rgba(16,185,129,0.15)"
                                  : "rgba(245,158,11,0.15)",
                                color: result.serial_number.denomination_match
                                  ? "#10B981"
                                  : "#F59E0B",
                              }}
                            >
                              {result.serial_number.denomination_match
                                ? "Denom. Match"
                                : "Denom. Mismatch"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Image quality */}
                  {result.image_quality && (
                    <div style={{ marginBottom: "1.25rem" }}>
                      <p
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          margin: "0 0 0.5rem 0",
                        }}
                      >
                        Image Quality
                      </p>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: "0.5rem",
                        }}
                      >
                        {[
                          {
                            label: "Sharpness",
                            value: result.image_quality.sharpness,
                          },
                          {
                            label: "Edge Density",
                            value: result.image_quality.edge_density,
                          },
                          {
                            label: "Brightness",
                            value: result.image_quality.brightness,
                          },
                        ].map((m) => (
                          <div
                            key={m.label}
                            style={{
                              padding: "0.625rem",
                              background: "var(--bg-tertiary)",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--bg-border)",
                              textAlign: "center",
                            }}
                          >
                            <p
                              style={{
                                fontSize: "0.6rem",
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                margin: "0 0 0.25rem 0",
                              }}
                            >
                              {m.label}
                            </p>
                            <p
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                fontFamily: "var(--font-mono)",
                                margin: 0,
                              }}
                            >
                              {typeof m.value === "number"
                                ? m.value.toFixed(2)
                                : "—"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      marginTop: "0.75rem",
                    }}
                  >
                    <button
                      onClick={() => {
                        setResult(null);
                        setSelectedFile(null);
                        setImagePreview(null);
                        setCurrentStep(0);
                        setError(null);
                        setReported(false);
                      }}
                      style={{
                        flex: 1,
                        padding: "0.625rem",
                        background: "var(--bg-tertiary)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--bg-border)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.8125rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        transition: "all 150ms ease",
                      }}
                    >
                      <RotateCcw size={14} /> New Scan
                    </button>
                    <button
                      onClick={handleReportCounterfeit}
                      disabled={!result.scan_id || reported}
                      style={{
                        flex: 1,
                        padding: "0.625rem",
                        background: reported
                          ? "rgba(16,185,129,0.1)"
                          : !result.scan_id
                            ? "var(--bg-tertiary)"
                            : "rgba(230,58,30,0.1)",
                        color: reported
                          ? "#10B981"
                          : !result.scan_id
                            ? "var(--text-muted)"
                            : "#E63A1E",
                        border: `1px solid ${reported ? "rgba(16,185,129,0.3)" : !result.scan_id ? "var(--bg-border)" : "rgba(230,58,30,0.3)"}`,
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.8125rem",
                        cursor:
                          !result.scan_id || reported
                            ? "not-allowed"
                            : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        transition: "all 150ms ease",
                      }}
                    >
                      {reported ? (
                        <>
                          <CheckCircle size={14} /> Reported
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={14} /> Report Counterfeit
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* Tab: Serial number checker                                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "serial" && (
          <div style={{ marginBottom: "2rem" }}>
            <div
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--bg-border)",
                borderRadius: "var(--radius-lg)",
                padding: "1.5rem",
                maxWidth: "640px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  marginBottom: "0.75rem",
                }}
              >
                <Hash size={18} color="#10B981" />
                <h3
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  Serial Number Checker
                </h3>
              </div>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--text-secondary)",
                  margin: "0 0 1.25rem 0",
                }}
              >
                Enter the serial number printed on the currency note to check
                its validity and flag status.
              </p>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <input
                  type="text"
                  value={serialCheckInput}
                  onChange={(e) => setSerialCheckInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSerialCheck();
                  }}
                  placeholder="e.g. 5AG123456"
                  style={{
                    flex: 1,
                    padding: "0.75rem 1rem",
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--bg-border)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.9rem",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-mono)",
                    outline: "none",
                  }}
                />
                <button
                  onClick={handleSerialCheck}
                  disabled={!serialCheckInput.trim() || serialChecking}
                  style={{
                    padding: "0.75rem 1.25rem",
                    background:
                      !serialCheckInput.trim() || serialChecking
                        ? "var(--bg-tertiary)"
                        : "#10B981",
                    color:
                      !serialCheckInput.trim() || serialChecking
                        ? "var(--text-muted)"
                        : "white",
                    border: "none",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    cursor:
                      !serialCheckInput.trim() || serialChecking
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    transition: "all 200ms ease",
                  }}
                >
                  {serialChecking ? (
                    <span
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        border: "2px solid var(--text-muted)",
                        borderTopColor: "transparent",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                      }}
                    />
                  ) : (
                    <Search size={15} />
                  )}
                  CHECK
                </button>
              </div>

              {/* Serial check result */}
              {serialCheckResult && (
                <div style={{ marginTop: "1.25rem" }}>
                  {serialCheckResult._error ? (
                    <div
                      style={{
                        padding: "0.75rem 1rem",
                        background: "rgba(230,58,30,0.08)",
                        border: "1px solid rgba(230,58,30,0.3)",
                        borderRadius: "var(--radius-md)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <AlertTriangle size={15} color="#E63A1E" />
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "#E63A1E",
                          margin: 0,
                        }}
                      >
                        {serialCheckResult._error}
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "1rem",
                        background: "var(--bg-tertiary)",
                        borderRadius: "var(--radius-md)",
                        border: `1px solid ${serialCheckResult.is_flagged ? "rgba(230,58,30,0.3)" : "var(--bg-border)"}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          marginBottom: "0.75rem",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "1rem",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            letterSpacing: "0.1em",
                          }}
                        >
                          {serialCheckResult.serial}
                        </span>
                        {serialCheckResult.is_flagged ? (
                          <span
                            style={{
                              padding: "0.2rem 0.625rem",
                              borderRadius: "100px",
                              fontSize: "0.65rem",
                              fontWeight: 800,
                              letterSpacing: "0.08em",
                              background: "rgba(230,58,30,0.15)",
                              color: "#E63A1E",
                            }}
                          >
                            FLAGGED
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: "0.2rem 0.625rem",
                              borderRadius: "100px",
                              fontSize: "0.65rem",
                              fontWeight: 800,
                              letterSpacing: "0.08em",
                              background: "rgba(16,185,129,0.15)",
                              color: "#10B981",
                            }}
                          >
                            CLEAR
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                          marginBottom: "0.75rem",
                        }}
                      >
                        <span
                          style={{
                            padding: "0.175rem 0.625rem",
                            borderRadius: "100px",
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            background: serialCheckResult.format_valid
                              ? "rgba(16,185,129,0.15)"
                              : "rgba(230,58,30,0.15)",
                            color: serialCheckResult.format_valid
                              ? "#10B981"
                              : "#E63A1E",
                          }}
                        >
                          {serialCheckResult.format_valid
                            ? "Valid Format"
                            : "Invalid Format"}
                        </span>
                        <span
                          style={{
                            padding: "0.175rem 0.625rem",
                            borderRadius: "100px",
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            background: riskColors[serialCheckResult.risk_level]
                              ? `${riskColors[serialCheckResult.risk_level]}20`
                              : "var(--bg-secondary)",
                            color:
                              riskColors[serialCheckResult.risk_level] ??
                              "var(--text-muted)",
                          }}
                        >
                          Risk: {serialCheckResult.risk_level?.toUpperCase()}
                        </span>
                      </div>
                      {serialCheckResult.message && (
                        <p
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--text-secondary)",
                            margin: 0,
                          }}
                        >
                          {serialCheckResult.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Scan History table ── */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--bg-border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "1rem 1.5rem",
              borderBottom: "1px solid var(--bg-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Clock size={16} color="var(--text-muted)" />
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Scan History
              </h3>
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {history.length} records
            </span>
          </div>

          {history.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <FileText
                size={28}
                color="var(--text-muted)"
                style={{
                  opacity: 0.3,
                  display: "block",
                  margin: "0 auto 0.75rem",
                }}
              />
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-muted)",
                  margin: 0,
                }}
              >
                No scan history yet. Analyse a note to begin.
              </p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--bg-border)" }}>
                  {[
                    "Scan ID",
                    "Time",
                    "Denomination",
                    "Verdict",
                    "Confidence",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "0.75rem 1.25rem",
                        textAlign: "left",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom:
                        i < history.length - 1
                          ? "1px solid var(--bg-border)"
                          : "none",
                      transition: "background 150ms ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg-tertiary)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td
                      style={{
                        padding: "0.875rem 1.25rem",
                        fontSize: "0.8125rem",
                        fontFamily: "var(--font-mono)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {row.id}
                    </td>
                    <td
                      style={{
                        padding: "0.875rem 1.25rem",
                        fontSize: "0.8125rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {row.timestamp}
                    </td>
                    <td
                      style={{
                        padding: "0.875rem 1.25rem",
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      {row.denomination ?? "—"}
                    </td>
                    <td style={{ padding: "0.875rem 1.25rem" }}>
                      <span
                        style={{
                          padding: "0.175rem 0.6rem",
                          borderRadius: "100px",
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                          background: `${verdictColors[row.verdict]}20`,
                          color: verdictColors[row.verdict],
                        }}
                      >
                        {row.verdict}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "0.875rem 1.25rem",
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        color: verdictColors[row.verdict],
                      }}
                    >
                      {row.confidence}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(0.88);
          }
        }
      `}</style>
    </div>
  );
}
