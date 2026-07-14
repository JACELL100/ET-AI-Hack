"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { WireSphere } from "@/components/ui/WireSphere";

const challenges = [
  {
    title: "Undetected Digital Arrest Scams",
    desc: "Over 1.14M cybercrime complaints were filed in 2024, with digital arrest scams growing 400% YoY. Victims lose lakhs before realising the fraud. SENTINEL's real-time AI detection stops scammers mid-call.",
    active: false,
    href: "/sentinel",
    sphere: "default" as const,
  },
  {
    title: "Slow Fraud Response & Coordination",
    desc: "Law enforcement struggles with siloed data, manual analysis, and slow alert chains. DRISHTI and JAAL provide unified intelligence — heatmaps, network graphs, and automated evidence packages in seconds.",
    active: true,
    href: "/dashboard",
    sphere: "active" as const,
  },
  {
    title: "Regulatory Gaps in Citizen Safety",
    desc: "Citizens have no immediate recourse when targeted. KAVACH bridges this gap with AI-powered multilingual support, instant scam assessment, and direct helpline escalation in 12+ Indian languages.",
    active: false,
    href: "/kavach",
    sphere: "network" as const,
  },
];

export function ChallengesSection() {
  return (
    <section className="section-gap" style={{ backgroundColor: "var(--bg-secondary)", padding: "0" }}>
      <div className="container" style={{ paddingTop: "6rem", paddingBottom: "0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span className="label-text" style={{ display: "block", marginBottom: "0.75rem" }}>Case Studies</span>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1, letterSpacing: "-0.03em", textAlign: "right", maxWidth: "500px" }}>
            Key Challenges<br />We Solve.
          </h2>
        </div>
      </div>

      {/* 3-column cards, flush to container edge */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "var(--bg-border)" }}>
        {challenges.map(c => (
          <div
            key={c.title}
            style={{
              background: c.active ? "var(--accent)" : "var(--bg-secondary)",
              padding: "2.5rem 2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              minHeight: "440px",
            }}
          >
            <h3 style={{ fontFamily: "var(--font-body)", fontSize: "1.0625rem", fontWeight: 600, color: c.active ? "white" : "var(--text-primary)", letterSpacing: "-0.01em" }}>
              {c.title}
            </h3>
            <p style={{ color: c.active ? "rgba(255,255,255,0.8)" : "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.7, flex: 1 }}>
              {c.desc}
            </p>
            <div style={{ display: "flex", justifyContent: "center", padding: "1rem 0", opacity: c.active ? 0.9 : 0.6 }}>
              <WireSphere size={120} variant={c.active ? "critical" : c.sphere} animated={c.active} />
            </div>
            <Link
              href={c.href}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.875rem 1.125rem",
                background: c.active ? "rgba(255,255,255,0.15)" : "var(--bg-tertiary)",
                borderRadius: "6px",
                textDecoration: "none",
                color: c.active ? "white" : "var(--text-primary)",
                fontSize: "0.875rem",
                fontWeight: 600,
                border: c.active ? "1px solid rgba(255,255,255,0.2)" : "1px solid var(--bg-border)",
                transition: "all 200ms ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = c.active ? "rgba(255,255,255,0.25)" : "var(--accent)"; e.currentTarget.style.color = "white"; if (!c.active) e.currentTarget.style.borderColor = "var(--accent)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = c.active ? "rgba(255,255,255,0.15)" : "var(--bg-tertiary)"; e.currentTarget.style.color = c.active ? "white" : "var(--text-primary)"; if (!c.active) e.currentTarget.style.borderColor = "var(--bg-border)"; }}
            >
              Explore Solution <ArrowUpRight size={15} />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
