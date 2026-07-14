"use client";

import React, { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { WireSphere } from "@/components/ui/WireSphere";

export function ContactSection() {
  const [formData, setFormData] = useState({ name: "", org: "", email: "", role: "law-enforcement", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "0.75rem 1rem",
    marginBottom: "0.875rem",
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "var(--radius-md)",
    color: "white",
    fontSize: "0.9rem",
    fontFamily: "var(--font-body)",
    outline: "none",
    transition: "border-color 150ms ease",
  };

  return (
    <section
      id="contact"
      className="section-gap wire-bg"
      style={{
        background: "linear-gradient(135deg, var(--accent) 0%, #8B1D0E 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative sphere */}
      <div style={{ position: "absolute", top: "50%", right: "-5%", transform: "translateY(-50%)", opacity: 0.15, pointerEvents: "none" }}>
        <WireSphere size={400} variant="active" />
      </div>

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
          {/* Left text */}
          <div>
            <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: "1rem" }}>
              Get Started
            </span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 900, color: "white", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "1.5rem" }}>
              Let&apos;s Strengthen Security — Get in Touch
            </h2>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1rem", lineHeight: 1.7, marginBottom: "2rem" }}>
              Whether you&apos;re law enforcement, a financial institution, or want to protect citizens —
              RAKSHA AI is ready to deploy.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { title: "Law Enforcement", desc: "Full access to SENTINEL, DRISHTI, JAAL" },
                { title: "Financial Institutions", desc: "NETRA integration for currency verification" },
                { title: "Government Agencies", desc: "Citizen protection via KAVACH deployment" },
              ].map(item => (
                <div key={item.title} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(255,255,255,0.6)", marginTop: "7px", flexShrink: 0 }} />
                  <div>
                    <p style={{ color: "white", fontWeight: 600, fontSize: "0.9375rem" }}>{item.title}</p>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8125rem" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "16px", padding: "2rem", backdropFilter: "blur(12px)" }}>
            {submitted ? (
              <div style={{ textAlign: "center", padding: "2rem 0" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
                <h3 style={{ color: "white", fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>Thank You!</h3>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.9375rem", lineHeight: 1.6 }}>We'll reach out within 24 hours to schedule your RAKSHA AI demo.</p>
                <button onClick={() => setSubmitted(false)} style={{ marginTop: "1.5rem", padding: "0.625rem 1.5rem", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "var(--radius-md)", color: "white", cursor: "pointer", fontSize: "0.875rem" }}>Submit Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Organisation Type</span>
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                    {["Law Enforcement", "Financial Institution", "Government Agency"].map(r => (
                      <label key={r} style={{ display: "flex", alignItems: "center", gap: "0.375rem", cursor: "pointer" }}>
                        <input type="radio" name="role" value={r} style={{ accentColor: "white" }} onChange={() => setFormData(p => ({ ...p, role: r }))} />
                        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.8125rem" }}>{r}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {[
                  { key: "name", placeholder: "Full Name", type: "text" },
                  { key: "org", placeholder: "Organisation Name", type: "text" },
                  { key: "email", placeholder: "Official Email Address", type: "email" },
                ].map(f => (
                  <input key={f.key} type={f.type} placeholder={f.placeholder} required style={inputStyle}
                    value={(formData as Record<string, string>)[f.key]}
                    onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                    onFocus={ev => { ev.target.style.borderColor = "rgba(255,255,255,0.5)"; }}
                    onBlur={ev => { ev.target.style.borderColor = "rgba(255,255,255,0.15)"; }} />
                ))}

                <textarea placeholder="Tell us about your use case..." rows={3} style={{ ...inputStyle, resize: "none", marginBottom: "1rem" }}
                  value={formData.message}
                  onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                  onFocus={ev => { ev.target.style.borderColor = "rgba(255,255,255,0.5)"; }}
                  onBlur={ev => { ev.target.style.borderColor = "rgba(255,255,255,0.15)"; }} />

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center", background: "white", color: "#111", border: "none" }}>
                  Book a Demo <ArrowUpRight size={15} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
