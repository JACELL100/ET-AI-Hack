"use client";

import { useState, useCallback } from "react";
import { analyseText, analyseAudio, scanCurrency, kavachChat } from "@/lib/api";
import type { SentinelAnalysisResult, NetraScanResult, KavachChatResponse } from "@/types";

// ── Sentinel Text Analysis ────────────────────────────────────────────────────
export function useSentinelTextAnalysis() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SentinelAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyse = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyseText(text);
      if (res.data) setResult(res.data);
    } catch (err) {
      setError("Analysis failed. Using mock data.");
      // Mock fallback
      setResult({
        threat_score: Math.floor(Math.random() * 60) + 40,
        verdict: "SUSPICIOUS",
        intents: ["URGENCY_CREATION", "IMPERSONATION"],
        confidence: 0.82,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { loading, result, error, analyse, reset };
}

// ── Sentinel Audio Analysis ───────────────────────────────────────────────────
export function useSentinelAudioAnalysis() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SentinelAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyse = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyseAudio(file);
      if (res.data) setResult(res.data);
    } catch (err) {
      setError("Audio analysis failed. Using mock data.");
      setResult({
        threat_score: 78,
        verdict: "SCAM",
        intents: ["IMPERSONATION", "MONEY_DEMAND", "INTIMIDATION"],
        confidence: 0.91,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, result, error, analyse };
}

// ── NETRA Scan ────────────────────────────────────────────────────────────────
export function useNetraScan() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NetraScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const res = await scanCurrency(file);
      if (res.data) setResult(res.data);
    } catch (err) {
      setError("Scan failed. Using mock data.");
      setResult({
        verdict: "SUSPICIOUS",
        confidence: 0.76,
        denomination: "₹500",
        features: [
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
        ],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { loading, result, error, scan, reset };
}

// ── KAVACH Chat ───────────────────────────────────────────────────────────────
export function useKavachChat(sessionId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (message: string): Promise<KavachChatResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await kavachChat(message, sessionId);
        return res.data ?? null;
      } catch (err) {
        setError("Chat unavailable. Falling back to local mode.");
        return {
          reply:
            "I'm here to help you stay safe online. If you've received a suspicious call claiming to be from CBI, ED, or police, please hang up immediately. Real government agencies never demand money over the phone.",
          intents: ["HELP_REQUEST"],
          quickActions: ["Report Scam", "Check Number", "Emergency Help"],
          riskLevel: "warning",
        };
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  return { loading, error, sendMessage };
}
