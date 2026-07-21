"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, FileWarning, Network, Search, Send, ShieldCheck, Sparkles } from "lucide-react";
import { CitizenSidebar } from "@/components/layout/CitizenSidebar";
import { useAuth } from "@/components/providers/AuthContext";
import { searchJaalEntities, submitJaalCitizenReport } from "@/lib/api";
import type { JaalCitizenReportInput, JaalCitizenReportResult, JaalSearchResult } from "@/types";

const entityTypes = ["phone", "account", "upi", "website"] as const;
const labelStyle: React.CSSProperties = { display: "block", marginBottom: "0.45rem", color: "var(--text-secondary)", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.075em", textTransform: "uppercase" };
const fieldStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "0.75rem 0.85rem", background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", borderRadius: 9, color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "0.9rem", outline: "none" };

function riskColor(score: number) {
  return score >= 0.7 ? "#E63A1E" : score >= 0.4 ? "#F59E0B" : "#10B981";
}

export default function JaalCitizenPage() {
  const { user, loading, registerCitizen } = useAuth();
  const [form, setForm] = useState<JaalCitizenReportInput>({ entityType: "phone", entityValue: "", relatedEntityType: "account", relatedEntityValue: "", relationship: "REPORTED_WITH", description: "", reportType: "scam", district: "", state: "", reporterName: "" });
  const [results, setResults] = useState<JaalSearchResult[]>([]);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<JaalCitizenReportResult | null>(null);

  useEffect(() => {
    if (!loading && !user) window.location.href = "/login";
    if (!loading && user && !user.isCitizen) registerCitizen();
    if (user?.isCitizen) setForm(current => ({ ...current, reporterName: current.reporterName || user.name }));
  }, [loading, user, registerCitizen]);

  const set = <K extends keyof JaalCitizenReportInput>(key: K, value: JaalCitizenReportInput[K]) => setForm(current => ({ ...current, [key]: value }));

  const checkEntity = async () => {
    const value = form.entityValue.trim();
    if (value.length < 3) { setError("Enter a phone number, account, UPI ID, or website to check."); return; }
    setChecking(true); setError("");
    try { const response = await searchJaalEntities(value); setResults(response.data ?? []); }
    catch { setError("The network check could not be completed. Please try again."); }
    finally { setChecking(false); }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.entityValue.trim().length < 3 || form.description.trim().length < 8) { setError("Please add the suspicious identifier and a short description."); return; }
    setSubmitting(true); setError("");
    try {
      const response = await submitJaalCitizenReport({ ...form, entityValue: form.entityValue.trim(), relatedEntityValue: form.relatedEntityValue?.trim() || undefined });
      setSubmitted(response.data ?? null);
      setResults(response.data?.matches ?? []);
    } catch { setError("Your signal could not be sent. Please try again."); }
    finally { setSubmitting(false); }
  };

  if (loading || !user || !user.isCitizen) return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-secondary)" }}>Verifying citizen account…</div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <CitizenSidebar />
      <main style={{ marginLeft: 240, flex: 1, padding: "2rem", maxWidth: 1280 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", marginBottom: "1.75rem" }}>
          <div style={{ width: 46, height: 46, display: "grid", placeItems: "center", borderRadius: 13, background: "linear-gradient(135deg, rgba(129,140,248,.22), rgba(34,211,238,.12))", border: "1px solid rgba(129,140,248,.35)" }}><Network size={22} color="#A5B4FC" /></div>
          <div><h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1.55rem" }}>JAAL Network Check</h1><p style={{ margin: "0.25rem 0 0", color: "var(--text-secondary)" }}>Check a suspicious identity and securely add a signal for fraud-network analysis.</p></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.12fr) minmax(290px, .88fr)", gap: "1.25rem", alignItems: "start" }}>
          <section style={{ padding: "1.5rem", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: 16 }}>
            {submitted ? (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                <CheckCircle2 size={52} color="#10B981" /><h2 style={{ fontFamily: "var(--font-display)", marginBottom: ".5rem" }}>Signal added securely</h2>
                <p style={{ color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto 1.25rem" }}>{submitted.message}</p>
                <div style={{ display: "inline-flex", gap: "1rem", padding: ".8rem 1rem", borderRadius: 10, background: "var(--bg-tertiary)", color: "var(--text-secondary)", fontSize: ".82rem" }}><span>Reference: <strong style={{ color: "#A5B4FC" }}>{submitted.report.id}</strong></span><span>{submitted.report.matchCount} correlation{submitted.report.matchCount === 1 ? "" : "s"} found</span></div>
                <button onClick={() => setSubmitted(null)} style={{ display: "block", margin: "1.5rem auto 0", padding: ".65rem 1rem", border: "1px solid rgba(129,140,248,.45)", background: "rgba(129,140,248,.1)", borderRadius: 8, color: "#A5B4FC", cursor: "pointer", fontWeight: 700 }}>Add another signal</button>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem", color: "#A5B4FC" }}><Sparkles size={15} /><strong style={{ fontSize: ".84rem" }}>Report a connected fraud signal</strong></div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: ".75rem" }}><div><label style={labelStyle}>Identifier type</label><select value={form.entityType} onChange={e => set("entityType", e.target.value as JaalCitizenReportInput["entityType"])} style={fieldStyle}>{entityTypes.map(type => <option key={type}>{type}</option>)}</select></div><div><label style={labelStyle}>Suspicious identifier *</label><input value={form.entityValue} onChange={e => set("entityValue", e.target.value)} placeholder="+91…, UPI ID, account or website" style={fieldStyle} /></div></div>
                <button type="button" onClick={checkEntity} disabled={checking} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: ".45rem", padding: ".58rem .85rem", background: "rgba(34,211,238,.09)", border: "1px solid rgba(34,211,238,.3)", borderRadius: 8, color: "#67E8F9", cursor: checking ? "wait" : "pointer", fontWeight: 700, fontSize: ".8rem" }}><Search size={14} />{checking ? "Checking JAAL…" : "Check network"}</button>
                <div style={{ padding: "1rem", borderRadius: 10, background: "rgba(129,140,248,.055)", border: "1px solid rgba(129,140,248,.15)" }}><p style={{ margin: "0 0 .7rem", color: "var(--text-secondary)", fontSize: ".78rem", fontWeight: 700 }}>Optional: connect a second identifier</p><div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: ".75rem" }}><select value={form.relatedEntityType} onChange={e => set("relatedEntityType", e.target.value as JaalCitizenReportInput["relatedEntityType"])} style={fieldStyle}>{entityTypes.map(type => <option key={type}>{type}</option>)}</select><input value={form.relatedEntityValue} onChange={e => set("relatedEntityValue", e.target.value)} placeholder="Linked UPI / account / number" style={fieldStyle} /></div></div>
                <div><label style={labelStyle}>What happened? *</label><textarea required rows={4} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Tell us how these details were connected. Never include your OTP, PIN, password, or full card number." style={{ ...fieldStyle, resize: "vertical" }} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}><div><label style={labelStyle}>District (optional)</label><input value={form.district} onChange={e => set("district", e.target.value)} style={fieldStyle} /></div><div><label style={labelStyle}>State (optional)</label><input value={form.state} onChange={e => set("state", e.target.value)} style={fieldStyle} /></div></div>
                {error && <div style={{ padding: ".75rem", borderRadius: 8, background: "rgba(230,58,30,.08)", border: "1px solid rgba(230,58,30,.2)", color: "#FB7185", fontSize: ".84rem" }}>{error}</div>}
                <button type="submit" disabled={submitting} style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: ".5rem", padding: ".85rem", border: 0, borderRadius: 10, background: "linear-gradient(90deg, #6366F1, #4F46E5)", color: "white", fontWeight: 800, cursor: submitting ? "wait" : "pointer", opacity: submitting ? .7 : 1 }}><Send size={16} />{submitting ? "Adding to JAAL…" : "Submit to JAAL review"}</button>
              </form>
            )}
          </section>

          <aside style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <section style={{ padding: "1.25rem", background: "linear-gradient(145deg, rgba(34,211,238,.08), var(--bg-secondary) 65%)", border: "1px solid rgba(34,211,238,.18)", borderRadius: 16 }}><ShieldCheck size={22} color="#67E8F9" /><h2 style={{ fontSize: ".98rem", margin: ".7rem 0 .35rem" }}>Your privacy comes first</h2><p style={{ margin: 0, color: "var(--text-secondary)", fontSize: ".82rem", lineHeight: 1.55 }}>JAAL only uses the suspicious identifiers and description you submit to find patterns. Do not enter OTPs, passwords, PINs, or full card details.</p></section>
            <section style={{ padding: "1.25rem", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: 16 }}><div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".85rem" }}><Search size={16} color="#A5B4FC" /><h2 style={{ margin: 0, fontSize: ".9rem" }}>Correlation results</h2></div>{results.length ? results.map(result => <div key={result.id} style={{ padding: ".8rem", marginBottom: ".55rem", background: "var(--bg-tertiary)", border: `1px solid ${riskColor(result.riskScore)}33`, borderRadius: 9 }}><div style={{ display: "flex", justifyContent: "space-between", gap: ".5rem" }}><strong style={{ fontSize: ".82rem", overflow: "hidden", textOverflow: "ellipsis" }}>{result.label}</strong><span style={{ color: riskColor(result.riskScore), fontSize: ".72rem", fontWeight: 800 }}>{Math.round(result.riskScore * 100)} RISK</span></div><p style={{ margin: ".35rem 0 0", color: "var(--text-muted)", fontSize: ".72rem" }}>{result.status === "known" ? "Known network signal" : "Under review"} · {result.connections} links</p></div>) : <p style={{ color: "var(--text-muted)", fontSize: ".82rem", lineHeight: 1.5, margin: 0 }}>Run a check to see whether an identifier matches signals already known to JAAL.</p>}</section>
            <section style={{ padding: "1rem", borderRadius: 12, background: "rgba(230,58,30,.08)", border: "1px solid rgba(230,58,30,.18)", display: "flex", gap: ".65rem" }}><FileWarning size={18} color="#FB7185" style={{ flexShrink: 0 }} /><p style={{ margin: 0, color: "var(--text-secondary)", fontSize: ".78rem", lineHeight: 1.45 }}>If money was transferred, call <strong style={{ color: "#FB7185" }}>1930</strong> immediately and file a report at cybercrime.gov.in.</p></section>
          </aside>
        </div>
      </main>
    </div>
  );
}
