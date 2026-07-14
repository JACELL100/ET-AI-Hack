"use client";

import React from "react";
import Link from "next/link";
import { Shield, Eye, Network, Map, MessageCircle, ArrowUpRight } from "lucide-react";
import { WireSphere } from "@/components/ui/WireSphere";

const modules = [
  {
    codename: "SENTINEL",
    name: "Digital Arrest Scam Detector",
    desc: "Real-time audio/video/text analysis to detect impersonation scams and digital arrest fraud using multi-modal AI.",
    icon: Shield,
    color: "#E63A1E",
    href: "/sentinel",
    sphere: "active" as const,
  },
  {
    codename: "NETRA",
    name: "Currency Authenticity Scanner",
    desc: "10-point AI-driven security feature verification for Indian currency notes, detecting counterfeits in under 3 seconds.",
    icon: Eye,
    color: "#10B981",
    href: "/netra",
    sphere: "default" as const,
  },
  {
    codename: "JAAL",
    name: "Fraud Network Explorer",
    desc: "Graph intelligence revealing hidden connections between fraudsters, money mules, and shell accounts across India.",
    icon: Network,
    color: "#818CF8",
    href: "/jaal",
    sphere: "network" as const,
  },
  {
    codename: "DRISHTI",
    name: "Geospatial Command Centre",
    desc: "Live crime heatmaps, hotspot prediction, and patrol coordination for law enforcement across districts.",
    icon: Map,
    color: "#F59E0B",
    href: "/drishti",
    sphere: "default" as const,
  },
  {
    codename: "KAVACH",
    name: "Citizen Fraud Shield",
    desc: "Multilingual AI chatbot for real-time fraud assessment, report filing, and safety advisories across 12+ regional languages.",
    icon: MessageCircle,
    color: "#22D3EE",
    href: "/kavach",
    sphere: "default" as const,
  },
];

function ModuleCard({ mod }: { mod: typeof modules[0] }) {
  const Icon = mod.icon;
  const [hovered, setHovered] = React.useState(false);

  return (
    <Link
      href={mod.href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        padding: "1.75rem",
        textDecoration: "none",
        backgroundColor: "var(--bg-secondary)",
        border: `1px solid ${hovered ? mod.color : "var(--bg-border)"}`,
        borderRadius: "var(--radius-lg)",
        position: "relative",
        overflow: "hidden",
        minHeight: "240px",
        transition: "border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease",
        boxShadow: hovered ? `0 0 30px ${mod.color}20` : "none",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
    >
      {/* Background glow */}
      <div style={{ position: "absolute", top: 0, right: 0, width: "120px", height: "120px", background: `radial-gradient(circle, ${mod.color}12 0%, transparent 70%)`, borderRadius: "0 12px 0 100%", pointerEvents: "none" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ background: `${mod.color}18`, border: `1px solid ${mod.color}30`, borderRadius: "10px", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={20} color={mod.color} strokeWidth={2} />
        </div>
        <WireSphere size={52} variant={hovered ? "active" : mod.sphere} animated={hovered} />
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.2rem 0.6rem", borderRadius: "var(--radius-sm)", background: `${mod.color}18`, color: mod.color, border: `1px solid ${mod.color}30` }}>
            {mod.codename}
          </span>
        </div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.625rem", lineHeight: 1.2 }}>{mod.name}</h3>
        <p style={{ fontSize: "0.8375rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>{mod.desc}</p>
      </div>

      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", fontWeight: 600, color: hovered ? mod.color : "var(--text-muted)", transition: "color 200ms ease" }}>
        Explore Module <ArrowUpRight size={14} />
      </div>
    </Link>
  );
}

export function ModulesGrid() {
  return (
    <section className="section-gap" id="modules">
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span className="label-text" style={{ display: "block", marginBottom: "0.75rem" }}>Our Modules</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 3.5vw, 3rem)", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1, letterSpacing: "-0.03em", maxWidth: "540px" }}>
              Five Specialised AI Agents Working in Concert
            </h2>
          </div>
          <Link href="/dashboard" className="btn btn-secondary">View All <ArrowUpRight size={14} /></Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
          {modules.slice(0, 3).map(mod => <ModuleCard key={mod.codename} mod={mod} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginTop: "1.25rem" }}>
          {modules.slice(3).map(mod => <ModuleCard key={mod.codename} mod={mod} />)}
        </div>
      </div>
    </section>
  );
}
