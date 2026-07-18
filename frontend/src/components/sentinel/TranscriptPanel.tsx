"use client";
import React, { useRef, useEffect } from "react";
import type { TranscriptLine } from "@/hooks/useSentinelStream";

const intentColors: Record<string, string> = {
  IMPERSONATION: "#818CF8",
  LEGAL_THREAT: "#E63A1E",
  URGENCY_CREATION: "#F59E0B",
  MONEY_DEMAND: "#EF4444",
  INTIMIDATION: "#E63A1E",
  IDENTITY_THEFT: "#F97316",
  NORMAL: "#6B7280",
};

interface TranscriptPanelProps {
  lines: TranscriptLine[];
  isLive?: boolean;
  maxHeight?: number;
}

export function TranscriptPanel({ lines, isLive = false, maxHeight = 340 }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines.length]);

  return (
    <div className="card-static" style={{ overflow: "hidden" }}>
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--bg-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Live Transcript
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: isLive ? "var(--accent)" : "#10B981", animation: isLive ? "pulse-glow 1.5s infinite" : "none" }} />
          <span style={{ fontSize: "0.625rem", color: isLive ? "var(--accent)" : "var(--text-muted)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {isLive ? "LIVE" : lines.length > 0 ? "COMPLETED" : "WAITING"}
          </span>
        </div>
      </div>

      <div ref={scrollRef} style={{ padding: "1rem 1.25rem", maxHeight: `${maxHeight}px`, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {lines.length === 0 && (
          <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Start analysis to see the transcript...
          </div>
        )}

        {lines.map((line, i) => (
          <div key={i} style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", animation: "fadeIn 0.3s ease" }}>
            <span style={{
              fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.1em",
              color: line.speaker === "CALLER" ? "var(--accent)" : "var(--text-secondary)",
              width: "48px", flexShrink: 0, paddingTop: "3px", textTransform: "uppercase",
            }}>
              {line.speaker}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-primary)", lineHeight: 1.6, fontFamily: "var(--font-mono)", margin: 0, wordBreak: "break-word" }}>
                {line.text}
              </p>
              {line.intent && line.intent !== "NORMAL" && (
                <span style={{
                  display: "inline-block", marginTop: "4px", fontSize: "0.5625rem",
                  fontWeight: 700, letterSpacing: "0.08em", padding: "0.15rem 0.5rem",
                  borderRadius: "100px",
                  background: `${intentColors[line.intent] || "#6B7280"}18`,
                  color: intentColors[line.intent] || "#6B7280",
                  border: `1px solid ${intentColors[line.intent] || "#6B7280"}35`,
                }}>
                  {line.intent}
                </span>
              )}
            </div>
            <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", flexShrink: 0 }}>
              {line.time || ""}
            </span>
          </div>
        ))}

        {isLive && lines.length > 0 && (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", paddingLeft: "3.5rem" }}>
            <div style={{ display: "flex", gap: "4px" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--text-muted)", animation: `blink 1.2s ${i * 0.2}s infinite` }} />
              ))}
            </div>
            <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Transcribing...</span>
          </div>
        )}
      </div>
    </div>
  );
}
