"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Activity, CheckCircle2, Database, Radio, ShieldAlert, Video } from "lucide-react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { getLiveIntelStatus, ingestLiveIntelDemo, type LiveIntelResult, type LiveIntelStatus } from "@/lib/api";

const demoEvent = {
  event_id: "demo-consented-multisignal-001",
  occurred_at: "2026-07-21T10:00:00Z",
  transcript: "This is CBI. You are under digital arrest. Transfer money immediately to prove innocence.",
  consent_reference: "DEMO-CONSENT-ONLY",
  telecom: {
    provider: "Authorised Telecom Sandbox", caller: "+919999999999", callee: "+919812345678",
    asserted_caller_id: "+911800555000", cli_verified: false, stir_shaken_attestation: "failed",
    line_type: "voip", sim_age_days: 2, call_attempts_24h: 32, unique_callees_24h: 28,
    district: "Mumbai", state: "Maharashtra", latitude: 19.076, longitude: 72.8777,
  },
  video: {
    provider: "Authorised Video Sandbox", virtual_camera_detected: true, deepfake_probability: 0.82,
    audio_video_desync_ms: 420, identity_claim: "CBI officer", official_identity_verified: false,
  },
  payment: {
    provider: "Authorised PSP Sandbox", beneficiary: "fraudster@upi", mule_risk_score: 0.91,
    beneficiary_name_mismatch: true, account_age_days: 1,
  },
};

const card: CSSProperties = {
  background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: 14, padding: "1.1rem",
};

export default function LiveIntelligencePage() {
  const [status, setStatus] = useState<LiveIntelStatus | null>(null);
  const [result, setResult] = useState<LiveIntelResult | null>(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    getLiveIntelStatus().then((r) => setStatus(r.data)).catch(() => setError("Live backend is unavailable."));
  }, []);

  async function runDemo() {
    setRunning(true); setError("");
    try {
      const response = await ingestLiveIntelDemo({ ...demoEvent, event_id: `demo-consented-${Date.now()}` });
      setResult(response.data);
      const refreshed = await getLiveIntelStatus();
      setStatus(refreshed.data);
    } catch {
      setError("Unable to ingest the consented demo event. Check that the FastAPI service is running.");
    } finally {
      setRunning(false);
    }
  }

  // A controlled recording aid: opening this admin-only route with ?demo=1
  // runs the same clearly labelled synthetic/consented event as the button.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1") void runDemo();
  // This intentionally runs once on page load, never on a real incoming event.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)", paddingLeft: 240 }}>
      <AdminSidebar />
      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", gap: 9, alignItems: "center", color: "#06B6D4" }}><Radio size={18} /><span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".1em" }}>SIGNED INTELLIGENCE FABRIC</span></div>
            <h1 style={{ margin: ".4rem 0", fontSize: "2rem" }}>Live Telecom & Video Integrity</h1>
            <p style={{ margin: 0, color: "var(--text-secondary)", maxWidth: 760 }}>Fuse authorised carrier, video-platform and payment-risk signals before a victim transfers funds. Every lead remains reviewable—not an automated accusation.</p>
          </div>
          <button onClick={runDemo} disabled={running} style={{ border: 0, borderRadius: 10, padding: ".8rem 1rem", cursor: running ? "wait" : "pointer", background: "#06B6D4", color: "#06222A", fontWeight: 800, display: "flex", gap: 8, alignItems: "center" }}>
            {running ? <Activity className="spin" size={17} /> : <ShieldAlert size={17} />} Run consented demo
          </button>
        </div>

        {error && <p style={{ marginTop: 16, color: "#EF4444" }}>{error}</p>}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginTop: 24 }}>
          <div style={card}><Radio size={18} color="#06B6D4" /><strong style={{ display: "block", marginTop: 8 }}>Telecom boundary</strong><small style={{ color: "var(--text-secondary)" }}>CLI mismatch, attestation, SIM age, VoIP, forwarding and velocity.</small></div>
          <div style={card}><Video size={18} color="#A78BFA" /><strong style={{ display: "block", marginTop: 8 }}>Video integrity</strong><small style={{ color: "var(--text-secondary)" }}>Deepfake score, virtual camera, A/V desync and verified identity claim.</small></div>
          <div style={card}><Database size={18} color="#F59E0B" /><strong style={{ display: "block", marginTop: 8 }}>Evidence ledger</strong><small style={{ color: "var(--text-secondary)" }}>{status?.ledger.valid ? `Hash chain valid · ${status.ledger.recordCount} records` : "Ledger health pending"}</small></div>
        </section>

        <section style={{ ...card, marginTop: 16 }}>
          <strong>Integration readiness</strong>
          <p style={{ color: "var(--text-secondary)", margin: ".5rem 0" }}>{status?.webhookContract ?? "Loading webhook contract…"}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{status?.supportedSources.map((source) => <span key={source} style={{ fontSize: 12, border: "1px solid var(--bg-border)", borderRadius: 99, padding: ".3rem .55rem" }}>{source}</span>)}</div>
          <small style={{ display: "block", marginTop: 12, color: "var(--text-muted)" }}>{status?.deploymentNote}</small>
        </section>

        {result && <section style={{ ...card, marginTop: 16, borderColor: result.verdict === "SCAM" ? "#EF4444" : "var(--bg-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}><div><span style={{ color: result.verdict === "SCAM" ? "#EF4444" : "#F59E0B", fontWeight: 800 }}>{result.verdict}</span><h2 style={{ margin: ".2rem 0" }}>{result.threat_score}% fused threat score</h2></div><div style={{ textAlign: "right", color: "var(--text-secondary)" }}>Confidence {Math.round(result.confidence * 100)}%<br /><small>{result.integration_trust}</small></div></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginTop: 16 }}>{Object.entries(result.signal_breakdown).map(([name, score]) => <div key={name} style={{ background: "var(--bg-tertiary)", borderRadius: 9, padding: ".65rem" }}><small style={{ color: "var(--text-muted)", textTransform: "uppercase" }}>{name.replace("_", " ")}</small><strong style={{ display: "block", fontSize: "1.2rem" }}>{score}%</strong></div>)}</div>
          <h3 style={{ fontSize: ".9rem", marginTop: 18 }}>Why SENTINEL escalated</h3>{result.reasons.slice(0, 5).map((reason) => <div key={reason} style={{ display: "flex", gap: 7, margin: ".45rem 0", color: "var(--text-secondary)", fontSize: 14 }}><CheckCircle2 size={15} color="#06B6D4" />{reason}</div>)}
          <p style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)" }}>Evidence {result.evidence_id} · SHA-256 {result.evidence_hash.slice(0, 18)}…</p>
        </section>}
      </main>
    </div>
  );
}
