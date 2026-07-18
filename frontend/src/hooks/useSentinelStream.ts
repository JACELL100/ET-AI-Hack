/**
 * Custom hook for SENTINEL WebSocket streaming.
 *
 * Connects to /ws/sentinel/stream and handles bidirectional communication
 * for both simulation mode and live audio analysis.
 */
import { useState, useRef, useCallback, useEffect } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export interface TranscriptLine {
  speaker: string;
  text: string;
  time?: string;
  start_time?: number;
  end_time?: number;
  intent: string;
  language?: string;
  confidence?: number;
  line_index?: number;
}

export interface ThreatUpdate {
  score: number;
  verdict: string;
  scam_type?: string | null;
  intents: string[];
  script_similarity?: number;
}

export interface VoiceAnalysisData {
  is_scripted: boolean;
  scripted_confidence: number;
  speech_rate: number;
  pitch_mean_hz: number;
  pitch_variance: number;
  bg_noise_type: string;
}

export interface AlertData {
  severity: string;
  message: string;
  scam_type?: string | null;
}

export interface SessionCompleteData {
  session_id: string;
  threat_score: number;
  verdict: string;
  scam_type?: string | null;
  transcript: TranscriptLine[];
  intents_detected: string[];
  voice_analysis?: Record<string, unknown> | null;
  script_similarity: number;
  confidence: number;
  processing_time_ms: number;
}

export function useSentinelStream() {
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [threatScore, setThreatScore] = useState(0);
  const [verdict, setVerdict] = useState("SAFE");
  const [intents, setIntents] = useState<string[]>([]);
  const [scamType, setScamType] = useState<string | null>(null);
  const [voiceAnalysis, setVoiceAnalysis] = useState<VoiceAnalysisData | null>(null);
  const [alert, setAlert] = useState<AlertData | null>(null);
  const [sessionResult, setSessionResult] = useState<SessionCompleteData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [scriptSimilarity, setScriptSimilarity] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    setTranscript([]);
    setThreatScore(0);
    setVerdict("SAFE");
    setIntents([]);
    setScamType(null);
    setVoiceAnalysis(null);
    setAlert(null);
    setSessionResult(null);
    setScriptSimilarity(0);
  }, []);

  const connect = useCallback((): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        resolve(wsRef.current);
        return;
      }

      // Close any existing connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      const ws = new WebSocket(`${WS_URL}/ws/sentinel/stream`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        resolve(ws);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const { type, data } = msg;

          switch (type) {
            case "connected":
              break;

            case "simulation_started":
            case "session_started":
              setIsSimulating(true);
              break;

            case "transcript":
              setTranscript((prev) => [...prev, data as TranscriptLine]);
              break;

            case "threat_update": {
              const tu = data as ThreatUpdate;
              setThreatScore(tu.score);
              setVerdict(tu.verdict);
              setScamType(tu.scam_type ?? null);
              setScriptSimilarity(tu.script_similarity ?? 0);
              setIntents((prev) => {
                const merged = new Set([...prev, ...(tu.intents || [])]);
                return Array.from(merged);
              });
              break;
            }

            case "intent":
              setIntents((prev) => {
                const merged = new Set([...prev, data.intent]);
                return Array.from(merged);
              });
              break;

            case "voice_analysis":
              setVoiceAnalysis(data as VoiceAnalysisData);
              break;

            case "alert":
              setAlert(data as AlertData);
              break;

            case "session_complete":
              setSessionResult(data as SessionCompleteData);
              setIsSimulating(false);
              break;

            case "error":
              console.error("[SENTINEL WS]", data.message);
              break;
          }
        } catch (e) {
          console.error("[SENTINEL WS] Parse error:", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsSimulating(false);
      };

      ws.onerror = () => {
        reject(new Error("WebSocket connection failed"));
        ws.close();
      };
    });
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectRef.current) clearTimeout(reconnectRef.current);
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
    setIsSimulating(false);
  }, []);

  const startSimulation = useCallback(async (scenarioId: string) => {
    reset();
    try {
      const ws = await connect();
      ws.send(JSON.stringify({
        action: "start_simulation",
        scenario_id: scenarioId,
      }));
    } catch (err) {
      console.error("[SENTINEL] Failed to start simulation:", err);
    }
  }, [connect, reset]);

  const startLive = useCallback(async () => {
    reset();
    try {
      const ws = await connect();
      ws.send(JSON.stringify({ action: "start_live" }));
    } catch (err) {
      console.error("[SENTINEL] Failed to start live:", err);
    }
  }, [connect, reset]);

  const stopSession = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "stop" }));
    }
    setIsSimulating(false);
  }, []);

  const sendAudioChunk = useCallback((blob: Blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      blob.arrayBuffer().then((buffer) => {
        wsRef.current?.send(buffer);
      });
    }
  }, []);

  const analyseText = useCallback(async (text: string) => {
    reset();
    try {
      const ws = await connect();
      ws.send(JSON.stringify({ action: "analyse_text", text }));
    } catch (err) {
      console.error("[SENTINEL] Failed to analyse text:", err);
    }
  }, [connect, reset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    transcript,
    threatScore,
    verdict,
    intents,
    scamType,
    voiceAnalysis,
    alert,
    sessionResult,
    isConnected,
    isSimulating,
    scriptSimilarity,
    // Actions
    connect,
    disconnect,
    startSimulation,
    startLive,
    stopSession,
    sendAudioChunk,
    analyseText,
    reset,
  };
}
