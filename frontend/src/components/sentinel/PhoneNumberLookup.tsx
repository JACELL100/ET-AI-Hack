"use client";
/**
 * PhoneNumberLookup — citizen-facing phone safety check panel.
 *
 * Calls GET /api/v1/sentinel/number/{phone} which returns a
 * PhoneNumberLookupResult with carrier, telecom circle, risk score, and
 * crowd-sourced threat reports.
 */
import React, { useState, useRef } from "react";
import {
  Phone, Search, AlertTriangle, CheckCircle, ShieldAlert, ShieldCheck,
  Wifi, MapPin, Signal, Clock, FileWarning, Database, RefreshCw, X,
  User, Globe,
} from "lucide-react";
import { checkPhoneNumber } from "@/lib/api";
import type { PhoneNumberLookupResult } from "@/types";

// ── Colour palette keyed by verdict ──────────────────────────────────────────
const VERDICT_CONFIG = {
  KNOWN_SCAM: {
    bg: "rgba(230,58,30,0.08)",
    border: "rgba(230,58,30,0.3)",
    color: "#E63A1E",
    label: "KNOWN SCAM",
    Icon: ShieldAlert,
  },
  SUSPICIOUS: {
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.3)",
    color: "#F59E0B",
    label: "SUSPICIOUS",
    Icon: AlertTriangle,
  },
  SAFE: {
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.3)",
    color: "#10B981",
    label: "NO THREAT DETECTED",
    Icon: ShieldCheck,
  },
} as const;

// ── Risk score colour ─────────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 70) return "#E63A1E";
  if (score >= 40) return "#F59E0B";
  return "#10B981";
}

// ── Semicircular gauge ────────────────────────────────────────────────────────
function RiskGauge({ score }: { score: number }) {
  const r = 52;
  const cx = 70;
  const cy = 70;
  const circumference = Math.PI * r; // half circle arc length
  const fill = ((100 - score) / 100) * circumference;
  const color = scoreColor(score);

  return (
    <svg width="140" height="80" viewBox="0 0 140 80" style={{ overflow: "visible" }}>
      {/* Track */}
      <path
        d={`M ${cx - r},${cy} A ${r},${r} 0 0 1 ${cx + r},${cy}`}
        fill="none"
        stroke="var(--bg-border)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Fill */}
      <path
        d={`M ${cx - r},${cy} A ${r},${r} 0 0 1 ${cx + r},${cy}`}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={fill}
        style={{ transition: "stroke-dashoffset 600ms ease, stroke 400ms ease" }}
      />
      {/* Score text */}
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        fontSize="22"
        fontWeight="800"
        fill={color}
        fontFamily="var(--font-mono)"
      >
        {score.toFixed(0)}
      </text>
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize="9"
        fill="var(--text-muted)"
        fontFamily="var(--font-body)"
        fontWeight="600"
        letterSpacing="0.1em"
      >
        RISK SCORE
      </text>
    </svg>
  );
}

// ── Mini badge ────────────────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: "0.5625rem",
        fontWeight: 700,
        letterSpacing: "0.07em",
        padding: "0.2rem 0.55rem",
        borderRadius: "100px",
        background: `${color}18`,
        color,
        border: `1px solid ${color}35`,
        textTransform: "uppercase" as const,
        whiteSpace: "nowrap" as const,
      }}
    >
      {label}
    </span>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  valueColor?: string;
}) {
  if (!value) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.5rem 0",
        borderBottom: "1px solid var(--bg-border-subtle)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--text-muted)",
        }}
      >
        {icon}
        <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>{label}</span>
      </div>
      <span
        style={{
          fontSize: "0.8125rem",
          fontWeight: 700,
          color: valueColor || "var(--text-primary)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export interface PhoneNumberLookupProps {
  /** Optional pre-filled number (e.g. from KAVACH chat) */
  initialPhone?: string;
  /** Compact mode — hides header, fits inside a card */
  compact?: boolean;
}

export function PhoneNumberLookup({
  initialPhone = "",
  compact = false,
}: PhoneNumberLookupProps) {
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PhoneNumberLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const resp = await checkPhoneNumber(trimmed);
      if (resp.success && resp.data) {
        setResult(resp.data);
      } else {
        setError(resp.error ?? "Lookup failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPhone("");
    setResult(null);
    setError(null);
    inputRef.current?.focus();
  };

  const cfg = result
    ? VERDICT_CONFIG[result.verdict] ?? VERDICT_CONFIG.SAFE
    : null;

  const categoryColors: Record<string, string> = {
    DIGITAL_ARREST: "#E63A1E",
    CBI_IMPERSONATION: "#E63A1E",
    ED_FRAUD: "#E63A1E",
    CUSTOMS_PARCEL_SCAM: "#F97316",
    BANK_KYC_FRAUD: "#818CF8",
    TRAI_SIM_BLOCK: "#F59E0B",
    ROBOCALL_SPAM: "#9CA3AF",
    TELEMARKETING_FRAUD: "#9CA3AF",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Header */}
      {!compact && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              marginBottom: "0.375rem",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(230,58,30,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Phone size={16} color="#E63A1E" />
            </div>
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1rem",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Phone Number Safety Lookup
              </h3>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  margin: 0,
                }}
              >
                Carrier detection · Threat intelligence · Crowd-sourced reports
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search bar */}
      <form
        onSubmit={handleLookup}
        style={{ display: "flex", gap: "0.625rem" }}
      >
        <div style={{ position: "relative", flex: 1 }}>
          <Phone
            size={15}
            color="var(--text-muted)"
            style={{
              position: "absolute",
              left: "0.875rem",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
          <input
            ref={inputRef}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter 10-digit mobile number…"
            maxLength={15}
            style={{
              width: "100%",
              padding: "0.75rem 2.5rem 0.75rem 2.5rem",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--bg-border)",
              borderRadius: "10px",
              color: "var(--text-primary)",
              fontSize: "0.9375rem",
              fontFamily: "var(--font-mono)",
              outline: "none",
              letterSpacing: "0.05em",
              boxSizing: "border-box",
              transition: "border-color 150ms ease",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--bg-border)")
            }
          />
          {phone && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: 0,
                display: "flex",
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !phone.trim()}
          style={{
            flexShrink: 0,
            padding: "0.75rem 1.25rem",
            borderRadius: "10px",
            border: "none",
            background:
              phone.trim() && !loading ? "var(--accent)" : "var(--bg-border)",
            color: "white",
            fontWeight: 700,
            fontSize: "0.875rem",
            cursor: phone.trim() && !loading ? "pointer" : "default",
            fontFamily: "var(--font-body)",
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            transition: "background 150ms ease",
          }}
        >
          {loading ? (
            <>
              <RefreshCw size={15} className="spin" />
              Checking…
            </>
          ) : (
            <>
              <Search size={15} />
              Verify
            </>
          )}
        </button>
      </form>

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: "0.875rem 1rem",
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
          }}
        >
          <AlertTriangle size={15} color="#EF4444" />
          <span style={{ fontSize: "0.8125rem", color: "#EF4444" }}>{error}</span>
        </div>
      )}

      {/* Result panel */}
      {result && cfg && (
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--bg-border)",
            borderRadius: "14px",
            overflow: "hidden",
            animation: "fadeInUp 250ms ease",
          }}
        >
          {/* Verdict header */}
          <div
            style={{
              background: cfg.bg,
              borderBottom: `1px solid ${cfg.border}`,
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <cfg.Icon size={20} color={cfg.color} />
              <div>
                <div
                  style={{
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: cfg.color,
                    textTransform: "uppercase",
                  }}
                >
                  {cfg.label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "1rem",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {result.formatted || result.phone}
                </div>
              </div>
            </div>

            {/* Gauge */}
            <RiskGauge score={result.risk_score} />
          </div>

          {/* Body */}
          <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>

            {/* ── Caller type + subscriber name ─────────────────────────── */}
            <div style={{
              display: "flex", gap: "0.625rem", flexWrap: "wrap",
            }}>
              {result.caller_type && result.caller_type !== "unknown" && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.5rem 0.875rem",
                  background: result.caller_type === "personal" ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
                  border: `1px solid ${result.caller_type === "personal" ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`,
                  borderRadius: "8px", flex: "1", minWidth: "140px",
                }}>
                  <User size={14} color={result.caller_type === "personal" ? "#10B981" : "#F59E0B"} />
                  <div>
                    <div style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase" }}>Caller Type</div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "capitalize" }}>
                      {result.caller_type.replace(/_/g, " ")}
                    </div>
                  </div>
                </div>
              )}
              {result.subscriber_name && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.5rem 0.875rem",
                  background: "rgba(129,140,248,0.08)",
                  border: "1px solid rgba(129,140,248,0.2)",
                  borderRadius: "8px", flex: "2", minWidth: "160px",
                }}>
                  <Globe size={14} color="#818CF8" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Identified As · {result.name_source}
                    </div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {result.subscriber_name}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Number details ────────────────────────────────────────── */}
            <div>
              <div style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.375rem" }}>
                Number Details
              </div>
              <InfoRow icon={<Wifi size={13} />} label="Carrier" value={result.carrier || "Not available"} />
              <InfoRow icon={<Signal size={13} />} label="Line Type" value={result.line_type ? result.line_type.charAt(0).toUpperCase() + result.line_type.slice(1) : null} />
              <InfoRow icon={<MapPin size={13} />} label="Telecom Circle" value={result.telecom_circle} />
              <InfoRow
                icon={<Database size={13} />}
                label="DB Reports"
                value={result.reports_count > 0 ? `${result.reports_count} complaint${result.reports_count !== 1 ? "s" : ""}` : "None on record"}
                valueColor={result.reports_count > 0 ? "#E63A1E" : "#10B981"}
              />
              {result.last_reported && (
                <InfoRow icon={<Clock size={13} />} label="Last Reported" value={result.last_reported} valueColor="#F59E0B" />
              )}
            </div>

            {/* ── AI-detected signals ───────────────────────────────────── */}
            {result.osint && result.osint.signals && result.osint.signals.length > 0 && (
              <div>
                <div style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  Risk Signals Detected
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  {result.osint.signals.map((signal, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: "0.5rem",
                      padding: "0.5rem 0.75rem",
                      background: "rgba(245,158,11,0.06)",
                      border: "1px solid rgba(245,158,11,0.18)",
                      borderRadius: "8px",
                    }}>
                      <AlertTriangle size={12} color="#F59E0B" style={{ flexShrink: 0, marginTop: "1px" }} />
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{signal}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── AI reasoning ─────────────────────────────────────────── */}
            {result.osint?.reasoning && (
              <div style={{
                padding: "0.75rem 0.875rem",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--bg-border)",
                borderRadius: "8px",
              }}>
                <div style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.375rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#818CF8", display: "inline-block" }} />
                  AI Analysis
                </div>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                  {result.osint.reasoning}
                </p>
              </div>
            )}

            {/* ── Scam categories ───────────────────────────────────────── */}
            {result.scam_categories.length > 0 && (
              <div>
                <div style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  Threat Categories
                </div>
                <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                  {result.scam_categories.map((cat) => (
                    <Badge key={cat} label={cat.replace(/_/g, " ")} color={categoryColors[cat] ?? "#818CF8"} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Intelligence reports (DB matches) ────────────────────── */}
            {result.reports.length > 0 && (
              <div>
                <div style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  Intelligence Reports
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {result.reports.map((report, i) => (
                    <div key={i} style={{
                      padding: "0.625rem 0.875rem",
                      background: "var(--bg-tertiary)",
                      borderRadius: "8px",
                      border: "1px solid var(--bg-border)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                          <FileWarning size={12} color={report.source === "GROQ_AI" ? "#818CF8" : "#F59E0B"} />
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>{report.type}</span>
                        </div>
                        <span style={{ fontSize: "0.5625rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{report.source}</span>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>{report.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Safe — no threat message ──────────────────────────────── */}
            {result.verdict === "SAFE" && result.reports.length === 0 && (!result.osint?.signals?.length) && (
              <div style={{
                display: "flex", alignItems: "center", gap: "0.625rem",
                padding: "0.75rem", background: "rgba(16,185,129,0.06)",
                borderRadius: "8px", border: "1px solid rgba(16,185,129,0.15)",
              }}>
                <CheckCircle size={15} color="#10B981" />
                <span style={{ fontSize: "0.8125rem", color: "#10B981", fontWeight: 600 }}>
                  No complaints or risk signals found. Always stay cautious with unsolicited callers.
                </span>
              </div>
            )}

            {/* ── Intelligence sources ──────────────────────────────────── */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingTop: "0.625rem", borderTop: "1px solid var(--bg-border-subtle)",
            }}>
              <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Data sources:</span>
              <div style={{ display: "flex", gap: "0.3rem" }}>
                {result.intelligence_sources.map((src) => (
                  <span key={src} style={{
                    fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.07em",
                    padding: "0.15rem 0.45rem", borderRadius: "100px",
                    background: "var(--bg-tertiary)", color: "var(--text-muted)",
                    border: "1px solid var(--bg-border)", textTransform: "uppercase",
                  }}>
                    {src.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Helpline ──────────────────────────────────────────────── */}
            {result.is_flagged && (
              <div style={{
                padding: "0.75rem 1rem",
                background: "rgba(230,58,30,0.07)",
                border: "1px solid rgba(230,58,30,0.2)",
                borderRadius: "8px", textAlign: "center",
              }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#E63A1E", marginBottom: "0.25rem" }}>
                  ⚠️ Do NOT transfer money or share OTPs with unknown callers.
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  Call <strong style={{ color: "var(--text-primary)" }}>1930</strong> (Cyber Crime Helpline) to report immediately.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default PhoneNumberLookup;
