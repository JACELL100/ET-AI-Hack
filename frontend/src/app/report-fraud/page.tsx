"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, FileText, Send } from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";
import { CitizenSidebar } from "@/components/layout/CitizenSidebar";
import { submitJaalCitizenReport } from "@/lib/api";

const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal",
];
const typeColors: Record<string, string> = { scam: "#E63A1E", counterfeit: "#10B981", upi: "#818CF8", network: "#22D3EE", other: "#9CA3AF" };

export default function ReportFraudPage() {
  const { user, loading, registerCitizen } = useAuth();
  const [form, setForm] = useState({ type: "scam", description: "", district: "", state: "", phone: "", reporterName: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) window.location.href = "/login";
      else if (!user.isCitizen) registerCitizen();
      else setForm(current => ({ ...current, reporterName: current.reporterName || user.name }));
    }
  }, [user, loading, registerCitizen]);

  // VoiceAgent and the Chrome extension save a draft before navigating here.
  // Keeping this bridge event-based also lets a user correct any field normally.
  useEffect(() => {
    const applyDraft = (draft: Partial<typeof form>) => setForm(current => ({ ...current, ...draft }));
    try {
      const saved = localStorage.getItem("raksha_voice_report_draft");
      if (saved) applyDraft(JSON.parse(saved));
    } catch { /* Ignore an invalid browser draft. */ }
    const onDraft = (event: Event) => applyDraft((event as CustomEvent<Partial<typeof form>>).detail || {});
    const onSubmitVoiceReport = () => {
      const formElement = document.getElementById("fraud-report-form") as HTMLFormElement | null;
      formElement?.requestSubmit();
    };
    window.addEventListener("raksha:report-draft", onDraft);
    window.addEventListener("raksha:submit-fraud-report", onSubmitVoiceReport);
    return () => {
      window.removeEventListener("raksha:report-draft", onDraft);
      window.removeEventListener("raksha:submit-fraud-report", onSubmitVoiceReport);
    };
  }, []);

  const set = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.description.trim() || !form.district.trim() || !form.state) {
      setError("Please fill in the description, district, and state.");
      return;
    }
    setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/v1/drishti/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json();
      if (result.success) {
        // A reported suspect identifier is a JAAL trigger.  Keep the primary
        // crime report successful even when the optional correlation service
        // is temporarily unavailable.
        if (form.phone.trim()) {
          submitJaalCitizenReport({
            entityType: "phone",
            entityValue: form.phone.trim(),
            description: form.description,
            reportType: form.type,
            district: form.district,
            state: form.state,
            reporterName: form.reporterName,
          }).catch(() => undefined);
        }
        localStorage.removeItem("raksha_voice_report_draft");
        setDone(true);
      }
      else setError(result.error ?? "Submission failed. Please try again.");
    } catch { setError("Network error. Please check your connection and try again."); }
    finally { setSubmitting(false); }
  };

  if (loading || !user || !user.isCitizen) return <div style={{ display: "grid", placeItems: "center", height: "100vh", background: "var(--bg-primary)" }}>Verifying citizen account...</div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <CitizenSidebar />
      <main style={{ marginLeft: 240, flex: 1, padding: "2rem", maxWidth: 1040 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1.75rem" }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(230,58,30,0.12)", display: "grid", placeItems: "center" }}><FileText size={20} color="#E63A1E" /></div>
          <div><h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", margin: 0 }}>Report Fraud</h1><p style={{ color: "var(--text-secondary)", margin: "0.25rem 0 0" }}>Your report helps identify threats and protect more people.</p></div>
        </div>

        <div style={{ maxWidth: 760, background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-xl)", padding: "1.75rem" }}>
          {done ? (
            <div style={{ padding: "3rem 1rem", textAlign: "center" }}><CheckCircle size={52} color="#10B981" /><h2 style={{ fontFamily: "var(--font-display)", color: "#10B981" }}>Report submitted</h2><p style={{ color: "var(--text-secondary)" }}>Thank you. Your report has been added to the incident intelligence feed.</p></div>
          ) : (
            <form id="fraud-report-form" onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div><label style={labelStyle}>Crime type</label><div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>{Object.keys(typeColors).map(type => <button key={type} type="button" onClick={() => set("type", type)} style={{ padding: "0.45rem 0.875rem", borderRadius: 100, border: `1px solid ${form.type === type ? typeColors[type] : "var(--bg-border)"}`, background: form.type === type ? `${typeColors[type]}18` : "transparent", color: form.type === type ? typeColors[type] : "var(--text-secondary)", cursor: "pointer", fontWeight: 700, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.06em" }}>{type}</button>)}</div></div>
              <div><label htmlFor="description" style={labelStyle}>Description *</label><textarea id="description" required value={form.description} onChange={e => set("description", e.target.value)} rows={5} placeholder="Describe what happened — caller details, amount demanded, and method used..." style={{ ...fieldStyle, resize: "vertical" }} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}><div><label htmlFor="district" style={labelStyle}>District *</label><input id="district" required value={form.district} onChange={e => set("district", e.target.value)} placeholder="e.g. Mumbai" style={fieldStyle} /></div><div><label htmlFor="state" style={labelStyle}>State *</label><select id="state" required value={form.state} onChange={e => set("state", e.target.value)} style={fieldStyle}><option value="">Select state</option>{states.map(state => <option key={state}>{state}</option>)}</select></div></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}><div><label htmlFor="phone" style={labelStyle}>Suspect phone</label><input id="phone" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 XXXXX XXXXX" style={fieldStyle} /></div><div><label htmlFor="name" style={labelStyle}>Your name</label><input id="name" value={form.reporterName} onChange={e => set("reporterName", e.target.value)} style={fieldStyle} /></div></div>
              {error && <div style={{ color: "#E63A1E", background: "rgba(230,58,30,0.08)", border: "1px solid rgba(230,58,30,0.2)", borderRadius: 8, padding: "0.75rem", fontSize: "0.875rem" }}>{error}</div>}
              <button type="submit" disabled={submitting} style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", padding: "0.85rem", border: "none", borderRadius: 10, background: "var(--accent)", color: "white", fontWeight: 700, fontSize: "0.9375rem", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}><Send size={16} />{submitting ? "Submitting…" : "Submit report"}</button>
              <p style={{ margin: 0, textAlign: "center", color: "var(--text-muted)", fontSize: "0.75rem" }}><AlertTriangle size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />For urgent cybercrime support, call <strong style={{ color: "var(--accent)" }}>1930</strong>.</p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", marginBottom: "0.45rem", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" };
const fieldStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "0.7rem 0.8rem", background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", borderRadius: 8, color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "0.9rem", outline: "none" };
