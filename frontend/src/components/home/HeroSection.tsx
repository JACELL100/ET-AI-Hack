"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { WireSphere } from "@/components/ui/WireSphere";
import { ThreatGauge } from "@/components/ui/ThreatGauge";
import { CodeSnippet } from "@/components/ui/CodeSnippet";

const heroCode = `// RAKSHA AI — Live Detection
{
  "module": "SENTINEL",
  "call_id": "CID-2024-9821",
  "threat_score": 87,
  "verdict": "SCAM",
  "intents": [
    "IMPERSONATION",
    "LEGAL_THREAT",
    "MONEY_DEMAND"
  ],
  "action": "ALERT_DISPATCHED",
  "time_ms": 2140
}`;

export function HeroSection() {
  const [visible, setVisible] = useState(false);
  const [threatScore, setThreatScore] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 100);
    const t2 = setTimeout(() => setThreatScore(87), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <section
      className="wire-bg"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        paddingTop: "80px",
        backgroundColor: "var(--bg-primary)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow overlays */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", background: "radial-gradient(ellipse 80% 60% at 50% 120%, rgba(230,58,30,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "20%", right: "-10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(230,58,30,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div className="container" style={{ position: "relative", zIndex: 1, width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
          {/* Left */}
          <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transition: "all 700ms ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)", animation: "pulse-glow 2s infinite" }} />
              <span className="label-text">AI For Digital Public Safety</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: "1.5rem" }}>
              AI-Powered{" "}
              <span style={{ color: "var(--accent)", fontStyle: "italic" }}>Digital Safety.</span>
              <br />
              We Protect{" "}
              <span style={{ position: "relative", display: "inline-block" }}>
                What Matters.
                <span style={{ position: "absolute", bottom: "4px", left: 0, right: 0, height: "3px", background: "var(--accent)", borderRadius: "2px" }} />
              </span>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.0625rem", lineHeight: 1.7, marginBottom: "2.5rem", maxWidth: "480px" }}>
              Five specialised AI agents detecting scams in real-time, identifying counterfeit currency,
              mapping fraud networks, and guiding citizens to safety across 12+ languages.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link href="/dashboard" className="btn btn-primary btn-lg">
                Explore Platform <ArrowUpRight size={16} />
              </Link>
              <Link href="#modules" className="btn btn-secondary btn-lg">View Modules</Link>
            </div>
            <div style={{ display: "flex", gap: "2rem", marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--bg-border)" }}>
              {[{ num: "95%", label: "Detection Accuracy" }, { num: "< 3s", label: "Response Time" }, { num: "12+", label: "Languages" }].map(({ num, label }) => (
                <div key={label}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.03em" }}>{num}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "2px" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : "translateX(32px)", transition: "all 900ms ease 200ms", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <CodeSnippet code={heroCode} filename="detection.json" language="json" animated />
            <div style={{ display: "flex", gap: "1.25rem" }}>
              <div style={{ flex: 1, background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ThreatGauge score={threatScore} size={140} label="Threat" />
              </div>
              <div style={{ flex: 1, background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-lg)", padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <WireSphere size={140} variant="active" animated />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
