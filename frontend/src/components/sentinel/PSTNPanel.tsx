"use client";
import React, { useState } from "react";
import { Send, Phone, MessageSquare, CheckCircle, XCircle, Loader2, Clock } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface AlertHistoryEntry {
  channel: string;
  phone: string;
  message: string;
  success: boolean;
  timestamp: number;
}

export function PSTNPanel() {
  const [phone, setPhone] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [alertType, setAlertType] = useState<"sms" | "voice" | "both">("sms");
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);
  const [history, setHistory] = useState<AlertHistoryEntry[]>([]);

  const handleSendAlert = async () => {
    if (!phone.trim()) return;
    setIsSending(true);
    setLastResult(null);

    try {
      const payload: Record<string, unknown> = {
        phone: phone.trim(),
        alert_type: alertType,
      };
      if (customMessage.trim()) {
        payload.message = customMessage.trim();
      } else {
        payload.threat_score = 85;
        payload.scam_type = "DIGITAL_ARREST";
      }

      const resp = await axios.post(`${API_URL}/api/v1/sentinel/alert/send`, payload);
      const data = resp.data?.data;

      const success = data?.success ?? false;
      setLastResult({
        success,
        message: success ? `Alert sent via ${alertType.toUpperCase()} to ${phone}` : (data?.error || "Failed to send alert"),
      });

      setHistory((prev) => [{
        channel: alertType,
        phone: phone.trim(),
        message: customMessage.trim() || "Auto-generated scam alert",
        success,
        timestamp: Date.now(),
      }, ...prev].slice(0, 20));

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setLastResult({ success: false, message: msg });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Info */}
      <div style={{ padding: "1rem 1.25rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
          <Phone size={14} color="#10B981" />
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#10B981" }}>PSTN Integration — Authkey.io</span>
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
          Send real SMS alerts or place TTS voice calls to warn citizens about detected scams. Powered by Authkey.io with ₹2,400 startup credits.
        </p>
      </div>

      {/* Send Alert Card */}
      <div className="card-static" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1.25rem" }}>
          Send Scam Alert
        </h3>

        {/* Phone input */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.375rem" }}>
            Recipient Phone Number
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <span style={{ padding: "0.625rem 0.75rem", background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", borderRadius: "8px", fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              +91
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="9876543210"
              className="input"
              style={{ flex: 1, fontSize: "0.875rem" }}
            />
          </div>
        </div>

        {/* Alert type selector */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.375rem" }}>
            Alert Channel
          </label>
          <div style={{ display: "flex", gap: "0.375rem" }}>
            {([
              { key: "sms", icon: MessageSquare, label: "SMS" },
              { key: "voice", icon: Phone, label: "Voice Call" },
              { key: "both", icon: Send, label: "SMS + Voice" },
            ] as const).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setAlertType(key)}
                style={{
                  flex: 1, padding: "0.625rem 0.5rem", borderRadius: "8px", cursor: "pointer",
                  border: `1px solid ${alertType === key ? "#10B981" : "var(--bg-border)"}`,
                  background: alertType === key ? "rgba(16,185,129,0.1)" : "transparent",
                  color: alertType === key ? "#10B981" : "var(--text-secondary)",
                  fontSize: "0.75rem", fontWeight: 600, fontFamily: "var(--font-body)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                  transition: "all 150ms ease",
                }}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom message (optional) */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.375rem" }}>
            Custom Message <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional — leave blank for auto-generated)</span>
          </label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="⚠️ RAKSHA AI Alert: Potential Digital Arrest scam detected (Risk: 85%). Do NOT transfer money..."
            className="input"
            style={{ minHeight: "80px", resize: "vertical", fontFamily: "var(--font-body)", lineHeight: 1.6, fontSize: "0.8125rem" }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSendAlert}
          disabled={!phone.trim() || phone.length < 10 || isSending}
          style={{
            width: "100%", padding: "0.875rem", borderRadius: "10px", border: "none",
            background: !phone.trim() || phone.length < 10 ? "var(--bg-border)" : "#10B981",
            color: "white", fontWeight: 700, fontSize: "0.875rem", cursor: phone.length >= 10 ? "pointer" : "default",
            fontFamily: "var(--font-body)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            opacity: isSending ? 0.7 : 1, transition: "all 200ms ease",
          }}
        >
          {isSending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
          {isSending ? "Sending..." : `Send ${alertType === "both" ? "SMS + Voice" : alertType === "voice" ? "Voice Call" : "SMS"} Alert`}
        </button>

        {/* Result */}
        {lastResult && (
          <div style={{
            marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: "8px",
            background: lastResult.success ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${lastResult.success ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
            display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            {lastResult.success ? <CheckCircle size={16} color="#10B981" /> : <XCircle size={16} color="#EF4444" />}
            <span style={{ fontSize: "0.8125rem", color: lastResult.success ? "#10B981" : "#EF4444", fontWeight: 600 }}>
              {lastResult.message}
            </span>
          </div>
        )}
      </div>

      {/* Alert History */}
      {history.length > 0 && (
        <div className="card-static" style={{ overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--bg-border)" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Alert History
            </h3>
          </div>
          <div style={{ maxHeight: "250px", overflowY: "auto" }}>
            {history.map((entry, i) => (
              <div key={i} style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--bg-border)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {entry.success ? <CheckCircle size={14} color="#10B981" /> : <XCircle size={14} color="#EF4444" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-primary)", fontWeight: 600 }}>
                    {entry.channel.toUpperCase()} → +91 {entry.phone}
                  </div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {entry.message}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0 }}>
                  <Clock size={10} color="var(--text-muted)" />
                  <span style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
