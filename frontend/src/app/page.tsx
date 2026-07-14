"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield, ArrowUpRight, Eye, Network, Map, MessageCircle,
  AlertTriangle, TrendingUp, CheckCircle, ChevronRight,
  Zap, Users, Globe, Lock
} from "lucide-react";
import { WireSphere } from "@/components/ui/WireSphere";
import { ThreatGauge } from "@/components/ui/ThreatGauge";

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────
function HeroSection() {
  const [visible, setVisible] = useState(false);
  const [threatScore, setThreatScore] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    const t2 = setTimeout(() => setThreatScore(78), 1200);
    return () => { clearTimeout(t); clearTimeout(t2); };
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
      {/* Corner glow */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "50%",
          background: "radial-gradient(ellipse 80% 60% at 50% 120%, rgba(230,58,30,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "20%",
          right: "-10%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(230,58,30,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div className="container" style={{ position: "relative", zIndex: 1, width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>

          {/* Left Content */}
          <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transition: "all 700ms ease" }}>
            {/* Label */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)", animation: "pulse-glow 2s infinite" }} />
              <span className="label-text">AI For Digital Public Safety</span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.5rem, 5vw, 4rem)",
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: "var(--text-primary)",
                marginBottom: "1.5rem",
              }}
            >
              AI-Powered{" "}
              <span style={{ color: "var(--accent)", fontStyle: "italic" }}>Digital Safety.</span>
              <br />
              We Protect{" "}
              <span
                style={{
                  position: "relative",
                  display: "inline-block",
                }}
              >
                What Matters.
                <span
                  style={{
                    position: "absolute",
                    bottom: "4px",
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: "var(--accent)",
                    borderRadius: "2px",
                  }}
                />
              </span>
            </h1>

            {/* Sub */}
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "1.0625rem",
                lineHeight: 1.7,
                marginBottom: "2.5rem",
                maxWidth: "480px",
              }}
            >
              Five specialised AI agents — detecting scams in real-time, identifying counterfeit
              currency, mapping fraud networks, and guiding citizens to safety across 12+ languages.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link href="/dashboard" className="btn btn-primary btn-lg">
                Explore Platform <ArrowUpRight size={16} />
              </Link>
              <Link href="#modules" className="btn btn-secondary btn-lg">
                View Modules
              </Link>
            </div>

            {/* Quick stats */}
            <div
              style={{
                display: "flex",
                gap: "2rem",
                marginTop: "3rem",
                paddingTop: "2rem",
                borderTop: "1px solid var(--bg-border)",
              }}
            >
              {[
                { num: "95%", label: "Detection Accuracy" },
                { num: "< 3s", label: "Response Time" },
                { num: "12+", label: "Languages" },
              ].map(({ num, label }) => (
                <div key={label}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.75rem",
                      fontWeight: 800,
                      color: "var(--accent)",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {num}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "2px" }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visuals */}
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(32px)",
              transition: "all 900ms ease 200ms",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {/* Big orange hero card */}
            <div
              style={{
                background: "linear-gradient(135deg, var(--accent) 0%, #B02D16 100%)",
                borderRadius: "20px",
                padding: "2rem",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Grid overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                  borderRadius: "20px",
                  pointerEvents: "none",
                }}
              />

              {/* Sphere decoration — upper right, clipped by overflow:hidden */}
              <div style={{ position: "absolute", top: "-30px", right: "-30px", opacity: 0.25, pointerEvents: "none" }}>
                <WireSphere size={180} variant="active" animated={true} />
              </div>

              {/* Code snippet — top-left, does NOT overlap bottom text */}
              <div
                className="code-block"
                style={{
                  position: "relative",
                  zIndex: 2,
                  width: "fit-content",
                  maxWidth: "220px",
                  background: "rgba(15,10,30,0.88)",
                  backdropFilter: "blur(8px)",
                  marginBottom: "1.5rem",
                  transform: "rotate(1deg)",
                  fontSize: "0.7rem",
                }}
              >
                <div className="comment"># RAKSHA SENTINEL</div>
                <div><span className="keyword">def</span> <span className="function">detect_scam</span>(audio):</div>
                <div style={{ paddingLeft: "1rem" }}>
                  <span className="variable">score</span> = <span className="function">analyse</span>(audio)
                </div>
                <div style={{ paddingLeft: "1rem" }}>
                  <span className="keyword">if</span> score &gt; <span className="string">0.7</span>:
                </div>
                <div style={{ paddingLeft: "2rem" }}>
                  <span className="function">alert</span>(<span className="string">&quot;SCAM&quot;</span>)
                </div>
              </div>

              {/* Bottom content */}
              <div style={{ position: "relative", zIndex: 2 }}>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.375rem",
                    fontWeight: 800,
                    color: "white",
                    lineHeight: 1.25,
                    marginBottom: "0.625rem",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Focused AI Services That Deliver Results. We Secure What Matters.
                </p>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.8125rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
                  Five specialised modules providing unparalleled AI protection — giving users confidence and safety.
                </p>
                <Link
                  href="/dashboard"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "white",
                    color: "#111",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "0.75rem 1.25rem",
                    borderRadius: "6px",
                    textDecoration: "none",
                    transition: "transform 200ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  Explore Dashboard <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>

            {/* Threat gauge card — now sits below the orange card in flow */}
            <div
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--bg-border)",
                borderRadius: "16px",
                padding: "1rem 1.25rem",
                boxShadow: "var(--shadow-lg)",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <ThreatGauge score={threatScore} size={72} label="Live Score" />
              <div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Active Detection
                </div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "2px" }}>
                  Digital Arrest Scam
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--accent)", marginTop: "2px", fontWeight: 500 }}>
                  ⚠ Alert Triggered
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS MARQUEE
// ─────────────────────────────────────────────────────────────────────────────
const stats = [
  "1.14M COMPLAINTS IN 2023",
  "₹1,776 CR DEFRAUDED IN 9 MONTHS",
  "60% YoY GROWTH IN CYBERCRIME",
  "RAKSHA AI — PROTECTING INDIA'S DIGITAL FUTURE",
  "5 AI AGENTS · 12+ LANGUAGES · < 3s RESPONSE",
  "95% DETECTION ACCURACY",
];

function StatsMarquee() {
  return (
    <div
      style={{
        background: "var(--accent)",
        padding: "0.875rem 0",
        overflow: "hidden",
        position: "relative",
        zIndex: 2,
      }}
    >
      <div className="marquee-track">
        {[...stats, ...stats].map((s, i) => (
          <span
            key={i}
            style={{
              color: "white",
              fontWeight: 700,
              fontSize: "0.8125rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "0 3rem",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: "3rem",
            }}
          >
            {s}
            <span style={{ opacity: 0.5 }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULES GRID
// ─────────────────────────────────────────────────────────────────────────────
const modules = [
  {
    codename: "SENTINEL",
    name: "Digital Arrest Scam Detection",
    desc: "Real-time AI detection of phone/video call scams. Multilingual NLP, voice analysis, deepfake detection, and instant alerting.",
    icon: Shield,
    color: "#E63A1E",
    href: "/sentinel",
    sphere: "active" as const,
  },
  {
    codename: "NETRA",
    name: "Counterfeit Currency ID",
    desc: "AI-powered security feature analysis for all Indian denominations. Camera scanning with 95%+ accuracy.",
    icon: Eye,
    color: "#10B981",
    href: "/netra",
    sphere: "default" as const,
  },
  {
    codename: "JAAL",
    name: "Fraud Network Intelligence",
    desc: "Graph AI mapping entire criminal ecosystems. Community detection, money flow tracing, and court-admissible evidence packages.",
    icon: Network,
    color: "#818CF8",
    href: "/jaal",
    sphere: "network" as const,
  },
  {
    codename: "DRISHTI",
    name: "Geospatial Crime Patterns",
    desc: "Crime heatmaps, predictive hotspot detection, and patrol route optimisation for command centres.",
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

function ModulesSection() {
  return (
    <section className="section-gap" id="modules">
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span className="label-text" style={{ display: "block", marginBottom: "0.75rem" }}>
              Our Modules
            </span>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.75rem, 3.5vw, 3rem)",
                fontWeight: 800,
                color: "var(--text-primary)",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                maxWidth: "540px",
              }}
            >
              Five Specialised AI Agents Working in Concert
            </h2>
          </div>
          <Link href="/dashboard" className="btn btn-secondary">
            View All <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Grid: 3 top, 2 bottom */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
          {modules.slice(0, 3).map((mod) => (
            <ModuleCard key={mod.codename} mod={mod} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginTop: "1.25rem" }}>
          {modules.slice(3).map((mod) => (
            <ModuleCard key={mod.codename} mod={mod} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ModuleCard({ mod }: { mod: typeof modules[0] }) {
  const Icon = mod.icon;
  return (
    <Link
      href={mod.href}
      className="card"
      style={{
        padding: "1.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        textDecoration: "none",
        position: "relative",
        overflow: "hidden",
        minHeight: "240px",
      }}
    >
      {/* Subtle background glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "120px",
          height: "120px",
          background: `radial-gradient(circle, ${mod.color}15 0%, transparent 70%)`,
          borderRadius: "0 12px 0 100%",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div
          style={{
            background: `${mod.color}18`,
            border: `1px solid ${mod.color}30`,
            borderRadius: "10px",
            width: "44px",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={20} color={mod.color} strokeWidth={2} />
        </div>
        <span
          style={{
            fontSize: "0.625rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: mod.color,
            background: `${mod.color}18`,
            border: `1px solid ${mod.color}30`,
            padding: "0.25rem 0.625rem",
            borderRadius: "100px",
          }}
        >
          {mod.codename}
        </span>
      </div>

      <div style={{ flex: 1 }}>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1.3,
            marginBottom: "0.625rem",
          }}
        >
          {mod.name}
        </h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.65 }}>
          {mod.desc}
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: mod.color,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
          }}
        >
          Explore Module <ChevronRight size={13} />
        </span>
        <WireSphere size={56} variant={mod.sphere} animated={false} />
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHALLENGES SECTION (key CY·FOCUS inspired 3-col)
// ─────────────────────────────────────────────────────────────────────────────
const challenges = [
  {
    title: "Undetected Scam Calls",
    desc: "Automated screening and generic alerts miss sophisticated digital arrest scams with scripted coercion, making citizens vulnerable to catastrophic financial loss.",
    sphere: "default" as const,
    href: "/sentinel",
    active: false,
  },
  {
    title: "Slow Incident Response",
    desc: "Without real-time intelligence correlation, attackers can escalate operations across multiple victims before law enforcement identifies the pattern.",
    sphere: "active" as const,
    href: "/drishti",
    active: true,
  },
  {
    title: "Counterfeit Currency Gaps",
    desc: "Incomplete detection relying on UV lamps and manual inspection means sophisticated FICN notes enter circulation undetected at every point of sale.",
    sphere: "network" as const,
    href: "/netra",
    active: false,
  },
];

function ChallengesSection() {
  return (
    <section
      className="section-gap wire-bg"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="container">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3rem", flexWrap: "wrap", gap: "1rem" }}>
          <span className="label-text">Case Studies</span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              fontWeight: 800,
              color: "var(--text-primary)",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              textAlign: "right",
              maxWidth: "500px",
            }}
          >
            Key Challenges<br />We Solve.
          </h2>
        </div>

        {/* 3-column cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "var(--bg-border)" }}>
          {challenges.map((c) => (
            <div
              key={c.title}
              style={{
                background: c.active ? "var(--accent)" : "var(--bg-secondary)",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                minHeight: "400px",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: c.active ? "white" : "var(--text-primary)",
                  letterSpacing: "-0.01em",
                }}
              >
                {c.title}
              </h3>
              <p
                style={{
                  color: c.active ? "rgba(255,255,255,0.8)" : "var(--text-secondary)",
                  fontSize: "0.875rem",
                  lineHeight: 1.7,
                  flex: 1,
                }}
              >
                {c.desc}
              </p>

              {/* Sphere visual */}
              <div style={{ display: "flex", justifyContent: "center", padding: "1rem 0", opacity: c.active ? 0.9 : 0.6 }}>
                <WireSphere
                  size={120}
                  variant={c.active ? "critical" : c.sphere}
                  animated={c.active}
                />
              </div>

              {/* CTA */}
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
                  border: c.active ? "1px solid rgba(255,255,255,0.2)" : "1px solid var(--bg-border)",
                  transition: "all 200ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = c.active ? "rgba(255,255,255,0.25)" : "var(--accent)";
                  if (!c.active) e.currentTarget.style.borderColor = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = c.active ? "rgba(255,255,255,0.15)" : "var(--bg-tertiary)";
                  if (!c.active) e.currentTarget.style.borderColor = "var(--bg-border)";
                }}
              >
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: c.active ? "white" : "var(--text-secondary)",
                  }}
                >
                  Look How We Solve This
                </span>
                <ArrowUpRight size={14} color={c.active ? "white" : "var(--text-muted)"} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOW IT WORKS
// ─────────────────────────────────────────────────────────────────────────────
const steps = [
  { n: "01", title: "Detect", desc: "Multi-modal AI scans calls, video, text, and images in real-time." },
  { n: "02", title: "Analyse", desc: "5 specialised agents correlate signals across audio, visual, and network patterns." },
  { n: "03", title: "Alert", desc: "Instant alerts via SMS, dashboard, and WebSocket to LEOs and citizens." },
  { n: "04", title: "Investigate", desc: "Evidence packages auto-generated with blockchain-anchored audit trails." },
];

function HowItWorksSection() {
  return (
    <section className="section-gap" style={{ backgroundColor: "var(--bg-secondary)", borderTop: "1px solid var(--bg-border)", borderBottom: "1px solid var(--bg-border)" }}>
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <span className="label-text" style={{ display: "block", marginBottom: "0.75rem" }}>Process</span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.75rem, 3vw, 2.75rem)",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.03em",
            }}
          >
            How RAKSHA AI Works
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0", position: "relative" }}>
          {/* Connecting line */}
          <div
            style={{
              position: "absolute",
              top: "2rem",
              left: "12.5%",
              right: "12.5%",
              height: "1px",
              background: "linear-gradient(90deg, var(--accent), var(--bg-border), var(--accent))",
              zIndex: 0,
            }}
          />
          {steps.map((step, i) => (
            <div
              key={step.n}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "0 1.5rem",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: i === 0 ? "var(--accent)" : "var(--bg-tertiary)",
                  border: i === 0 ? "none" : "1px solid var(--bg-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-display)",
                  fontSize: "1.125rem",
                  fontWeight: 800,
                  color: i === 0 ? "white" : "var(--text-secondary)",
                  marginBottom: "1.5rem",
                  flexShrink: 0,
                }}
              >
                {step.n}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "0.625rem",
                }}
              >
                {step.title}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.65 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPACT NUMBERS
// ─────────────────────────────────────────────────────────────────────────────
const impactStats = [
  { num: "> 92%", label: "Scam Detection Precision", icon: Zap },
  { num: "> 95%", label: "Currency Accuracy", icon: CheckCircle },
  { num: "< 30s", label: "Alert Latency", icon: TrendingUp },
  { num: "12+", label: "Indian Languages", icon: Globe },
  { num: "> 24h", label: "Early Warning Lead Time", icon: AlertTriangle },
  { num: "5", label: "AI Agents in Concert", icon: Users },
];

function ImpactSection() {
  return (
    <section className="section-gap">
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <span className="label-text" style={{ display: "block", marginBottom: "0.75rem" }}>Impact Metrics</span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.75rem, 3vw, 2.75rem)",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.03em",
            }}
          >
            Built for Scale. Measured by Results.
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
          {impactStats.map(({ num, label, icon: Icon }) => (
            <div
              key={label}
              className="stat-card"
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  background: "var(--accent-glow)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={18} color="var(--accent)" strokeWidth={2} />
              </div>
              <div>
                <div
                  className="stat-number"
                  style={{ color: "var(--accent)", marginBottom: "0.375rem" }}
                >
                  {num}
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CTA SECTION
// ─────────────────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section
      className="section-gap wire-bg"
      style={{ background: "linear-gradient(135deg, var(--accent) 0%, #8B1D0E 100%)", position: "relative", overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: "-5%",
          transform: "translateY(-50%)",
          opacity: 0.15,
        }}
      >
        <WireSphere size={400} variant="active" />
      </div>

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
          <div>
            <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: "1rem" }}>
              Get Started
            </span>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 3.5vw, 3rem)",
                fontWeight: 900,
                color: "white",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                marginBottom: "1.5rem",
              }}
            >
              Let&apos;s Strengthen Security — Get in Touch
            </h2>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1rem", lineHeight: 1.7 }}>
              Whether you&apos;re law enforcement, a financial institution, or want to protect citizens —
              RAKSHA AI is ready to deploy.
            </p>
          </div>

          {/* Mini form */}
          <div
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "16px",
              padding: "2rem",
              backdropFilter: "blur(12px)",
            }}
          >
            <div style={{ marginBottom: "0.875rem" }}>
              <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Who is this for?
              </span>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                {["Law Enforcement", "Financial Institution", "Government Agency"].map((r) => (
                  <label key={r} style={{ display: "flex", alignItems: "center", gap: "0.375rem", cursor: "pointer" }}>
                    <input type="radio" name="role" style={{ accentColor: "white" }} />
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.8125rem" }}>{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {[
              { placeholder: "Full Name", type: "text" },
              { placeholder: "Organisation Name", type: "text" },
              { placeholder: "Official Email Address", type: "email" },
            ].map((field) => (
              <input
                key={field.placeholder}
                type={field.type}
                placeholder={field.placeholder}
                style={{
                  display: "block",
                  width: "100%",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "6px",
                  padding: "0.75rem 1rem",
                  color: "white",
                  fontSize: "0.9375rem",
                  marginBottom: "0.75rem",
                  outline: "none",
                  fontFamily: "var(--font-body)",
                }}
              />
            ))}

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem", cursor: "pointer" }}>
              <input type="checkbox" style={{ accentColor: "var(--accent-light)" }} />
              <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)" }}>
                I accept the <span style={{ color: "white", textDecoration: "underline" }}>RAKSHA Terms of Service</span>
              </span>
            </label>

            <button className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center", background: "white", color: "#111" }}>
              Book a Demo <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      style={{
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--bg-border)",
        padding: "3rem 0",
      }}
    >
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "28px", height: "28px", background: "var(--accent)", borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={15} color="white" />
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>
              RAKSHA<span style={{ color: "var(--accent)" }}>·AI</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: "2rem" }}>
            {["SENTINEL", "NETRA", "JAAL", "DRISHTI", "KAVACH"].map((m) => (
              <Link key={m} href={`/${m.toLowerCase()}`} style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none", letterSpacing: "0.1em", fontWeight: 500 }}>{m}</Link>
            ))}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            © 2026 RAKSHA AI · ET AI Hackathon 2.0
          </span>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE ASSEMBLY
// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsMarquee />
      <ModulesSection />
      <ChallengesSection />
      <HowItWorksSection />
      <ImpactSection />
      <CTASection />
      <Footer />
    </>
  );
}
