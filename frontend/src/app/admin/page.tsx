"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield, Eye, Network, Map, MessageCircle,
  LayoutDashboard, Settings, Bell, ChevronRight,
  AlertTriangle, Users, Activity, Sun, Moon
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAuth } from "@/components/providers/AuthContext";
import { ThreatGauge } from "@/components/ui/ThreatGauge";
import { AdminSidebar, adminNavItems } from "@/components/layout/AdminSidebar";

const mockAlerts = [
  { id: 1, type: "Digital Arrest Scam", severity: "critical", location: "Mumbai", time: "2m ago", score: 87 },
  { id: 2, type: "Counterfeit ₹500", severity: "high", location: "Delhi", time: "5m ago", score: 0 },
  { id: 3, type: "Fraud Network", severity: "high", location: "Bangalore", time: "12m ago", score: 0 },
  { id: 4, type: "Suspicious UPI", severity: "medium", location: "Pune", time: "18m ago", score: 0 },
  { id: 5, type: "Scam SMS Pattern", severity: "low", location: "Hyderabad", time: "31m ago", score: 0 },
];

const severityColors: Record<string, string> = {
  critical: "#E63A1E",
  high: "#F59E0B",
  medium: "#818CF8",
  low: "#6B7280",
};

export default function AdminPage() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const { user, loading, logout, registerAdmin, loginWithGoogle } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState(0);

  // Auth Protection Check
  useEffect(() => {
    if (!loading && user && !user.isAdmin) {
      registerAdmin();
    }
  }, [user, loading, registerAdmin]);

  useEffect(() => {
    const t = setTimeout(() => setActiveAlerts(3), 500);
    return () => clearTimeout(t);
  }, []);

  const handleAdminGoogleLogin = async () => {
    setLoginError("");
    setLoginLoading(true);
    const result = await loginWithGoogle(`${window.location.origin}/admin`);
    setLoginLoading(false);
    if (!result.success) {
      setLoginError(result.error ?? "Failed to authenticate.");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)", color: "var(--text-secondary)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--accent)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Not logged in: Show Admin Login UI directly on /admin
  if (!user || !user.isAdmin) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative", overflow: "hidden" }}>
        {/* Background grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(230,58,30,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(230,58,30,0.05) 1px,transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(230,58,30,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", marginBottom: "1.5rem" }}>
              <div style={{ width: "44px", height: "44px", background: "var(--accent)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={24} color="white" strokeWidth={2.5} />
              </div>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.375rem", color: "var(--text-primary)" }}>
                RAKSHA<span style={{ color: "var(--accent)" }}>·AI</span>
              </span>
            </Link>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.75rem", color: "var(--text-primary)", marginBottom: "0.375rem" }}>Admin Portal Login</h1>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Access Command Centre Intelligence</p>
          </div>

          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-xl)", padding: "2rem" }}>
            {loginError && <p style={{ fontSize: "0.8125rem", color: "#E63A1E", padding: "0.625rem 0.875rem", background: "rgba(230,58,30,0.1)", borderRadius: "var(--radius-md)", border: "1px solid rgba(230,58,30,0.2)", marginBottom: "1.25rem" }}>{loginError}</p>}

            <button
              onClick={handleAdminGoogleLogin}
              disabled={loginLoading}
              style={{ width: "100%", padding: "0.875rem", background: "white", color: "#111827", border: "1px solid #D1D5DB", borderRadius: "var(--radius-md)", fontSize: "0.9375rem", fontWeight: 700, cursor: loginLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", transition: "all 200ms ease" }}
            >
              {loginLoading ? (
                <><span style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid #E63A1E", borderTopColor: "transparent", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> Signing in...</>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google (Admin Portal)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Active Threat Alerts", value: `${activeAlerts}`, delta: "+3", icon: AlertTriangle, color: "var(--accent)" },
    { label: "Scams Detected Today", value: "47", delta: "+8", icon: Shield, color: "#E63A1E" },
    { label: "Counterfeits Found", value: "6", delta: "+1", icon: Eye, color: "#10B981" },
    { label: "Citizens Protected", value: "1,284", delta: "+142", icon: Users, color: "#818CF8" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Sidebar */}
      <AdminSidebar />

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
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Command Centre</div>
              <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--accent)", background: "rgba(230,58,30,0.1)", border: "1px solid rgba(230,58,30,0.2)", borderRadius: "100px", padding: "0.15rem 0.5rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Admin Portal
              </span>
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Admin Dashboard Overview
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              Logged in as <strong style={{ color: "var(--accent)" }}>{user.name}</strong>
            </div>

            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "white" }}>AD</span>
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
                  {adminNavItems.slice(1).map(({ label, href, icon: Icon, color }) => (
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem" }}>
              {[
                { name: "SENTINEL", icon: Shield, color: "#E63A1E", count: 47, label: "Scams Analysed", bar: 78 },
                { name: "NETRA", icon: Eye, color: "#10B981", count: 23, label: "Notes Scanned", bar: 45 },
                { name: "JAAL", icon: Network, color: "#818CF8", count: 8, label: "Networks Mapped", bar: 30 },
                { name: "DRISHTI", icon: Map, color: "#F59E0B", count: 15, label: "Hotspots Detected", bar: 55 },
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
      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
