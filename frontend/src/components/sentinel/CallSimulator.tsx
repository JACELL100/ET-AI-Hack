"use client";
import React, { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, Play, Square, Volume2, VolumeX } from "lucide-react";
import { AudioVisualizer } from "./AudioVisualizer";
import { TranscriptPanel } from "./TranscriptPanel";
import { ThreatGauge } from "@/components/ui/ThreatGauge";
import { useSentinelStream } from "@/hooks/useSentinelStream";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const intentColors: Record<string, string> = {
  IMPERSONATION: "#818CF8", LEGAL_THREAT: "#E63A1E", URGENCY_CREATION: "#F59E0B",
  MONEY_DEMAND: "#EF4444", INTIMIDATION: "#E63A1E", IDENTITY_THEFT: "#F97316",
};

interface Scenario {
  id: string;
  title: string;
  description: string;
  language: string;
  duration_seconds: number;
  expected_threat_score: number;
  expected_intents: string[];
}

interface CallSimulatorProps {
  scenarios: Scenario[];
  onSessionComplete?: (result: unknown) => void;
  onSendAlert?: () => void;
}

export function CallSimulator({ scenarios, onSessionComplete, onSendAlert }: CallSimulatorProps) {
  const [selectedScenario, setSelectedScenario] = useState<string>(scenarios[0]?.id || "cbi-hindi-1");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    transcript, threatScore, verdict, intents, scamType, voiceAnalysis,
    alert, sessionResult, isConnected, isSimulating,
    startSimulation, stopSession, reset,
  } = useSentinelStream();

  const isCallActive = isSimulating;

  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isCallActive]);

  useEffect(() => {
    if (sessionResult && onSessionComplete) onSessionComplete(sessionResult);
  }, [sessionResult, onSessionComplete]);

  // Stop audio when simulation ends
  useEffect(() => {
    if (!isCallActive && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isCallActive]);

  const handleStart = () => {
    reset();
    setCallDuration(0);
    startSimulation(selectedScenario);

    // Play scenario audio
    const audioUrl = `${API_URL}/api/v1/sentinel/scenarios/${selectedScenario}/audio`;
    const audio = new Audio(audioUrl);
    audio.volume = isMuted ? 0 : 0.7;
    audio.play().catch(() => {
      // Audio autoplay may be blocked — that's OK
      console.log("[CallSimulator] Audio autoplay blocked — click to unmute");
    });
    audioRef.current = audio;
  };

  const handleStop = () => {
    stopSession();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const toggleMute = () => {
    setIsMuted((m) => {
      const next = !m;
      if (audioRef.current) audioRef.current.volume = next ? 0 : 0.7;
      return next;
    });
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const scenario = scenarios.find((s) => s.id === selectedScenario);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Scenario Selector */}
      <div className="card-static" style={{ padding: "1.25rem" }}>
        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
          Select Scenario
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => !isCallActive && setSelectedScenario(s.id)}
              style={{
                padding: "0.5rem 0.875rem", borderRadius: "8px", cursor: isCallActive ? "default" : "pointer",
                border: `1px solid ${selectedScenario === s.id ? "var(--accent)" : "var(--bg-border)"}`,
                background: selectedScenario === s.id ? "var(--accent-glow)" : "transparent",
                color: selectedScenario === s.id ? "var(--accent)" : "var(--text-secondary)",
                fontSize: "0.75rem", fontWeight: 600, fontFamily: "var(--font-body)",
                opacity: isCallActive && selectedScenario !== s.id ? 0.4 : 1,
                transition: "all 150ms ease",
              }}
            >
              {s.language === "hi" ? "🇮🇳" : "🌐"} {s.title}
            </button>
          ))}
        </div>
        {scenario && (
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem", lineHeight: 1.5 }}>
            {scenario.description}
          </p>
        )}
      </div>

      {/* Call UI */}
      <div className="card-static" style={{ overflow: "hidden" }}>
        <div style={{
          background: isCallActive ? "linear-gradient(135deg, #1a0a0a, #2a0f0f)" : "var(--bg-tertiary)",
          border: isCallActive ? "1px solid rgba(230,58,30,0.25)" : "none",
          padding: "2rem", textAlign: "center", transition: "all 400ms ease",
        }}>
          {/* Caller avatar */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              background: isCallActive ? "linear-gradient(135deg, #E63A1E, #991b1b)" : "var(--bg-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.75rem", transition: "all 300ms ease",
              boxShadow: isCallActive ? "0 0 30px rgba(230,58,30,0.3)" : "none",
            }}>
              🤖
            </div>
          </div>

          {isCallActive ? (
            <>
              <div style={{ fontSize: "0.6875rem", color: "var(--accent)", fontWeight: 700, letterSpacing: "0.12em", marginBottom: "0.25rem" }}>
                CALL IN PROGRESS
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                {fmt(callDuration)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                {scenario?.title}
              </div>

              <AudioVisualizer isActive={true} threatLevel={threatScore} height={48} />

              <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                <button onClick={toggleMute} style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: "44px", height: "44px", borderRadius: "10px",
                  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                  color: "white", cursor: "pointer",
                }}>
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <button onClick={handleStop} style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.75rem 2rem", background: "#EF4444", border: "none",
                  borderRadius: "10px", color: "white", fontWeight: 700, fontSize: "0.875rem",
                  cursor: "pointer", fontFamily: "var(--font-body)",
                }}>
                  <PhoneOff size={16} /> End Call
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
                Ready to simulate scam detection
              </div>
              <AudioVisualizer isActive={false} height={32} />
              <div style={{ marginTop: "1.25rem" }}>
                <button onClick={handleStart} style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.75rem 2rem", background: "var(--accent)", border: "none",
                  borderRadius: "10px", color: "white", fontWeight: 700, fontSize: "0.875rem",
                  cursor: "pointer", fontFamily: "var(--font-body)",
                }}>
                  <Play size={16} /> Simulate Scam Call
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Transcript */}
      {transcript.length > 0 && (
        <TranscriptPanel lines={transcript} isLive={isCallActive} />
      )}
    </div>
  );
}
