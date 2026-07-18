"use client";
import React from "react";
import { AlertTriangle, CheckCircle, Shield, Clock, Volume2, FileText } from "lucide-react";
import { ThreatGauge } from "@/components/ui/ThreatGauge";
import type { SessionCompleteData, VoiceAnalysisData } from "@/hooks/useSentinelStream";

const intentColors: Record<string, string> = {
  IMPERSONATION: "#818CF8",
  LEGAL_THREAT: "#E63A1E",
  URGENCY_CREATION: "#F59E0B",
  MONEY_DEMAND: "#EF4444",
  INTIMIDATION: "#E63A1E",
  IDENTITY_THEFT: "#F97316",
};

interface AnalysisReportProps {
  result: SessionCompleteData;
  voiceAnalysis?: VoiceAnalysisData | null;
  onSendAlert?: () => void;
  onClose?: () => void;
}

export function AnalysisReport({ result, voiceAnalysis, onSendAlert, onClose }: AnalysisReportProps) {
  const verdictColor = result.verdict === "SCAM" ? "#E63A1E" : result.verdict === "SUSPICIOUS" ? "#F59E0B" : "#10B981";
  const verdictBg = result.verdict === "SCAM" ? "rgba(230,58,30,0.1)" : result.verdict === "SUSPICIOUS" ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)";

  return (
    <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "14px", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "1.5rem", background: verdictBg, borderBottom: `2px solid ${verdictColor}30`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {result.verdict === "SCAM" ? <AlertTriangle size={22} color={verdictColor} /> : result.verdict === "SUSPICIOUS" ? <Shield size={22} color={verdictColor} /> : <CheckCircle size={22} color={verdictColor} />}
          <div>
            <div style={{ fontSize: "1.125rem", fontWeight: 800, color: verdictColor, fontFamily: "var(--font-display)" }}>
              {result.verdict === "SCAM" ? "🚨 SCAM DETECTED" : result.verdict === "SUSPICIOUS" ? "⚠️ SUSPICIOUS ACTIVITY" : "✅ SAFE"}
            </div>
            {result.scam_type && (
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                Type: {result.scam_type.replace(/_/g, " ")}
              </div>
            )}
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.25rem", padding: "0.25rem" }}>✕</button>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Score Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <div style={{ textAlign: "center" }}>
            <ThreatGauge score={result.threat_score} size={100} animated />
            <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", marginTop: "0.375rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Threat Score</div>
          </div>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              {(result.script_similarity * 100).toFixed(0)}%
            </div>
            <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Script Match</div>
          </div>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              {(result.confidence * 100).toFixed(0)}%
            </div>
            <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Confidence</div>
          </div>
        </div>

        {/* Intents */}
        {result.intents_detected.length > 0 && (
          <div>
            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Detected Patterns</div>
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
              {result.intents_detected.map((intent) => (
                <span key={intent} style={{
                  fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.08em",
                  padding: "0.25rem 0.625rem", borderRadius: "100px",
                  background: `${intentColors[intent] || "#6B7280"}18`,
                  color: intentColors[intent] || "#6B7280",
                  border: `1px solid ${intentColors[intent] || "#6B7280"}35`,
                }}>
                  {intent}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Voice Analysis */}
        {voiceAnalysis && (
          <div>
            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <Volume2 size={12} /> Voice Analysis
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              {[
                { label: "Scripted Speech", value: voiceAnalysis.is_scripted ? "Yes" : "No", color: voiceAnalysis.is_scripted ? "#E63A1E" : "#10B981" },
                { label: "Background", value: voiceAnalysis.bg_noise_type.replace(/_/g, " "), color: voiceAnalysis.bg_noise_type === "call_centre" ? "#F59E0B" : "#6B7280" },
                { label: "Pitch Mean", value: `${voiceAnalysis.pitch_mean_hz.toFixed(0)} Hz`, color: "var(--text-primary)" },
                { label: "Speech Rate", value: voiceAnalysis.speech_rate.toFixed(3), color: "var(--text-primary)" },
              ].map((item) => (
                <div key={item.label} style={{ padding: "0.5rem 0.75rem", background: "var(--bg-tertiary)", borderRadius: "8px", border: "1px solid var(--bg-border)" }}>
                  <div style={{ fontSize: "0.5625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.label}</div>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: item.color, marginTop: "2px", textTransform: "capitalize" }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing stats */}
        <div style={{ display: "flex", gap: "1rem", padding: "0.75rem", background: "var(--bg-tertiary)", borderRadius: "8px", border: "1px solid var(--bg-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Clock size={12} color="var(--text-muted)" />
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{result.processing_time_ms}ms</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <FileText size={12} color="var(--text-muted)" />
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{result.transcript?.length || 0} segments</span>
          </div>
        </div>

        {/* Action button */}
        {result.verdict !== "SAFE" && onSendAlert && (
          <button onClick={onSendAlert} style={{
            width: "100%", padding: "0.875rem", background: "var(--accent)", border: "none",
            borderRadius: "10px", color: "white", fontWeight: 700, fontSize: "0.875rem",
            cursor: "pointer", fontFamily: "var(--font-body)", display: "flex",
            alignItems: "center", justifyContent: "center", gap: "0.5rem",
          }}>
            <AlertTriangle size={16} />
            Send Alert via SMS / Voice Call
          </button>
        )}
      </div>
    </div>
  );
}
