"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield, Eye, Network, Map, MessageCircle,
  LayoutDashboard, Settings, Bell, ChevronRight,
  AlertTriangle, TrendingUp, Users, CheckCircle,
  Activity, Zap
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { ThreatGauge } from "@/components/ui/ThreatGauge";
import { WireSphere } from "@/components/ui/WireSphere";
import { Sun, Moon } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "SENTINEL", href: "/sentinel", icon: Shield, color: "#E63A1E" },
  { label: "NETRA", href: "/netra", icon: Eye, color: "#10B981" },
  { label: "JAAL", href: "/jaal", icon: Network, color: "#818CF8" },
  { label: "DRISHTI", href: "/drishti", icon: Map, color: "#F59E0B" },
  { label: "KAVACH", href: "/kavach", icon: MessageCircle, color: "#22D3EE" },
  { label: "Settings", href: "/settings", icon: Settings },
];

const mockAlerts = [
  { id: 1, type: "Digital Arrest Scam", severity: "critical", location: "Mumbai", time: "2m ago", score: 87 },
  { id: 2, type: "Counterfeit ₹500", severity: "high", location: "Delhi", time: "5m ago", score: 0 },
  { id: 3, type: "Fraud Network", severity: "high", location: "Bangalore", time: "12m ago", score: 0 },
  { id: 4, type: "Suspicious UPI", severity: "medium", location: "Pune", time: "18m ago", score: 0 },
  { id: 5, type: "Scam SMS Pattern", severity: "low", location: "Hyderabad", time: "31m ago", score: 0 },
  { id: 6, type: "Digital Arrest Scam", severity: "critical", location: "Chennai", time: "45m ago", score: 0 },
  { id: 7, type: "Counterfeit ₹200", severity: "medium", location: "Kolkata", time: "1h ago", score: 0 },
  { id: 8, type: "Money Mule Activity", severity: "high", location: "Ahmedabad", time: "1.5h ago", score: 0 },
];

const severityColors: Record<string, string> = {
  critical: "#E63A1E",
  high: "#F59E0B",
  medium: "#818CF8",
  low: "#6B7280",
};

export default function DashboardPage() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [activeAlerts, setActiveAlerts] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setActiveAlerts(3), 500);
    return () => clearTimeout(t);
  }, []);

  const stats = [
    { label: "Active Alerts", value: "12", delta: "+3", icon: AlertTriangle, color: "#E63A1E" },
    { label: "Scams Detected Today", value: "47", delta: "+8", icon: Shield, color: "#E63A1E" },
    { label: "Counterfeits Found", value: "6", delta: "+1", icon: Eye, color: "#10B981" },
    { label: "Citizens Protected", value: "1,284", delta: "+142", icon: Users, color: "#818CF8" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "var(--bg-primary)" }}>

      {/* Sidebar */}
      <aside
        style={{
          width: "240px",
          flexShrink: 0,
          backgroundColor: "var(--bg-secondary)",
          borderRight: "1px solid var(--bg-border)",
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem 1rem",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          overflowY: "auto",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", marginBottom: "2rem", padding: "0 0.5rem" }}>
          <div style={{ width: "32px", height: "32px", background: "var(--accent)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Shield size={17} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            RAKSHA<span style={{ color: "var(--accent)" }}>·AI</span>
          </span>
        </Link>

        {/* Live status */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 0.875rem", background: "rgba(230,58,30,0.08)", border: "1px solid rgba(230,58,30,0.2)", borderRadius: "8px", marginBottom: "1.5rem" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", animation: "pulse-glow 2s infinite" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 600, letterSpacing: "0.06em" }}>
            {activeAlerts} ACTIVE ALERTS
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {navItems.map(({ label, href, icon: Icon, color }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={label}
                href={href}
                className={`sidebar-nav-item ${isActive ? "active" : ""}`}
              >
                <Icon size={17} color={isActive ? "var(--accent)" : color || "currentColor"} strokeWidth={2} />
                <span>{label}</span>
                {isActive && <div style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)" }} />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--bg-border)" }}>
          <button
            onClick={toggleTheme}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              width: "100%",
              padding: "0.625rem 0.875rem",
              background: "none",
              border: "1px solid var(--bg-border)",
              borderRadius: "8px",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: "0.8125rem",
              fontWeight: 500,
              fontFamily: "var(--font-body)",
            }}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ marginLeft: "240px", flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Top bar */}
        <header
          style={{
            height: "64px",
            backgroundColor: "var(--bg-secondary)",
            borderBottom: "1px solid var(--bg-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 2rem",
            position: "sticky",
            top: 0,
            zIndex: 40,
          }}
        >
          <div>
            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Command Centre</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Dashboard Overview
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <button style={{ background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", borderRadius: "8px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
              <Bell size={16} color="var(--text-secondary)" />
              <div style={{ position: "absolute", top: "8px", right: "8px", width: "7px", height: "7px", borderRadius: "50%", background: "var(--accent)", border: "1px solid var(--bg-secondary)" }} />
            </button>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "white" }}>JG</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem", marginBottom: "1.75rem" }}>
            {stats.map(({ label, value, delta, icon: Icon, color }) => (
              <div key={label} className="stat-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={17} color={color} strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#10B981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "100px", padding: "0.2rem 0.5rem" }}>
                    {delta}
                  </span>
                </div>
                <div className="stat-number" style={{ marginBottom: "0.25rem" }}>{value}</div>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Main grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.25rem", marginBottom: "1.75rem" }}>

            {/* Alert feed */}
            <div className="card-static" style={{ overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--bg-border)" }}>
                <div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>Live Feed</div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>Active Alerts</h2>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", animation: "pulse-glow 2s infinite" }} />
                  <span style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: 600 }}>LIVE</span>
                </div>
              </div>

              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {mockAlerts.map((alert) => (
                  <div key={alert.id} className="alert-item">
                    <div className={`alert-dot alert-dot-${alert.severity}`} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {alert.type}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0 }}>{alert.time}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginTop: "3px" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{alert.location}</span>
                        <span
                          className={`badge badge-${alert.severity}`}
                          style={{ padding: "0.15rem 0.5rem", fontSize: "0.625rem" }}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {alert.score > 0 && (
                      <ThreatGauge score={alert.score} size={52} label="" animated={false} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Threat overview panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              {/* Live threat */}
              <div className="card-static" style={{ padding: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
                  Highest Active Threat
                </div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                  <ThreatGauge score={87} size={140} label="Threat Score" />
                </div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                  Digital Arrest Scam
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>Mumbai · 2 min ago</div>
                <Link href="/sentinel" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  View in SENTINEL <ChevronRight size={14} />
                </Link>
              </div>

              {/* Quick module links */}
              <div className="card-static" style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.875rem" }}>
                  Quick Access
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  {navItems.slice(1, 6).map(({ label, href, icon: Icon, color }) => (
                    <Link
                      key={label}
                      href={href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.625rem",
                        padding: "0.625rem 0.75rem",
                        borderRadius: "8px",
                        background: "var(--bg-tertiary)",
                        textDecoration: "none",
                        transition: "all 150ms ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-glow)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
                    >
                      <Icon size={15} color={color} strokeWidth={2} />
                      <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)", flex: 1 }}>{label}</span>
                      <ChevronRight size={13} color="var(--text-muted)" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Module activity */}
          <div className="card-static" style={{ padding: "1.5rem" }}>
            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.25rem" }}>
              Module Activity (Last 24h)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1.25rem" }}>
              {[
                { name: "SENTINEL", icon: Shield, color: "#E63A1E", count: 47, label: "Scams Analysed", bar: 78 },
                { name: "NETRA", icon: Eye, color: "#10B981", count: 23, label: "Notes Scanned", bar: 45 },
                { name: "JAAL", icon: Network, color: "#818CF8", count: 8, label: "Networks Mapped", bar: 30 },
                { name: "DRISHTI", icon: Map, color: "#F59E0B", count: 15, label: "Hotspots Detected", bar: 55 },
                { name: "KAVACH", icon: MessageCircle, color: "#22D3EE", count: 312, label: "Citizens Assisted", bar: 92 },
              ].map(({ name, icon: Icon, color, count, label, bar }) => (
                <div key={name} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "6px", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={14} color={color} strokeWidth={2} />
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.06em" }}>{name}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.625rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, marginBottom: "2px" }}>{count}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{label}</div>
                  </div>
                  <div style={{ height: "4px", background: "var(--bg-border)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${bar}%`, background: color, borderRadius: "2px", transition: "width 1s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
