"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { Mic, MicOff, Radio } from "lucide-react";
import { AudioVisualizer } from "./AudioVisualizer";
import { TranscriptPanel } from "./TranscriptPanel";
import { ThreatGauge } from "@/components/ui/ThreatGauge";
import { useSentinelStream } from "@/hooks/useSentinelStream";
import { useAudioCapture } from "@/hooks/useAudioCapture";

interface LiveAnalysisProps {
  onSessionComplete?: (result: unknown) => void;
  onSendAlert?: () => void;
}

export function LiveAnalysis({ onSessionComplete, onSendAlert }: LiveAnalysisProps) {
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stream = useSentinelStream();

  const handleChunk = useCallback((blob: Blob) => {
    stream.sendAudioChunk(blob);
  }, [stream]);

  const audio = useAudioCapture(handleChunk);

  useEffect(() => {
    if (stream.sessionResult && onSessionComplete) {
      onSessionComplete(stream.sessionResult);
    }
  }, [stream.sessionResult, onSessionComplete]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive]);

  const handleStart = async () => {
    stream.reset();
    setDuration(0);
    stream.startLive();
    await audio.start();
    setIsActive(true);
  };

  const handleStop = () => {
    audio.stop();
    stream.stopSession();
    setIsActive(false);
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Info banner */}
      <div style={{ padding: "1rem 1.25rem", background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.2)", borderRadius: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
          <Radio size={14} color="#818CF8" />
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#818CF8" }}>Live Microphone Analysis</span>
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
          Grant microphone access to analyse audio in real-time. Speak or play a suspicious call near the mic — SENTINEL will transcribe and detect scam patterns live.
        </p>
      </div>

      {/* Recording UI */}
      <div className="card-static" style={{ overflow: "hidden" }}>
        <div style={{
          padding: "2rem", textAlign: "center",
          background: isActive ? "linear-gradient(135deg, #0a0a1a, #0f0f2a)" : "var(--bg-tertiary)",
          transition: "all 400ms ease",
        }}>
          {/* Mic icon */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              background: isActive ? "linear-gradient(135deg, #818CF8, #4F46E5)" : "var(--bg-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 300ms ease",
              boxShadow: isActive ? "0 0 30px rgba(129,140,248,0.3)" : "none",
            }}>
              {isActive ? <Mic size={28} color="white" /> : <MicOff size={28} color="var(--text-muted)" />}
            </div>
          </div>

          {isActive ? (
            <>
              <div style={{ fontSize: "0.6875rem", color: "#818CF8", fontWeight: 700, letterSpacing: "0.12em", marginBottom: "0.25rem" }}>
                🔴 RECORDING & ANALYSING
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
                {fmt(duration)}
              </div>

              {/* Audio level indicator */}
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ height: "4px", borderRadius: "2px", background: "var(--bg-border)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: "2px",
                    background: stream.threatScore >= 70 ? "#E63A1E" : stream.threatScore >= 40 ? "#F59E0B" : "#818CF8",
                    width: `${Math.min(100, audio.audioLevel * 100 * 2)}%`,
                    transition: "width 100ms ease",
                  }} />
                </div>
              </div>

              <AudioVisualizer isActive={true} threatLevel={stream.threatScore} height={48} />

              <div style={{ marginTop: "1.25rem" }}>
                <button onClick={handleStop} style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.75rem 2rem", background: "#EF4444", border: "none",
                  borderRadius: "10px", color: "white", fontWeight: 700, fontSize: "0.875rem",
                  cursor: "pointer", fontFamily: "var(--font-body)",
                }}>
                  <MicOff size={16} /> Stop Recording
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
                Click to start live audio analysis
              </div>
              {audio.error && (
                <div style={{ fontSize: "0.75rem", color: "#EF4444", marginBottom: "1rem" }}>
                  ⚠ {audio.error}
                </div>
              )}
              <button onClick={handleStart} style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.75rem 2rem", background: "#818CF8", border: "none",
                borderRadius: "10px", color: "white", fontWeight: 700, fontSize: "0.875rem",
                cursor: "pointer", fontFamily: "var(--font-body)",
              }}>
                <Mic size={16} /> Start Live Analysis
              </button>
            </>
          )}
        </div>
      </div>

      {/* Transcript */}
      {stream.transcript.length > 0 && (
        <TranscriptPanel lines={stream.transcript} isLive={isActive} />
      )}
    </div>
  );
}
