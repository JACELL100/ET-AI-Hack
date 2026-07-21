"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  Shield, MessageCircle, AlertTriangle, FileText, ShieldCheck, LogOut, Sun, Moon, Phone,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";
import { useTheme } from "@/components/providers/ThemeProvider";

const localAlerts = [
  { id: 1, title: "Customs Officer Video Call Scam", desc: "Scammers claiming you have illegal parcels are active in Maharashtra.", date: "Today" },
  { id: 2, title: "Fake Electricity Bill Phishing", desc: "SMS requests asking you to update payment info to avoid power cut.", date: "Yesterday" },
];

const tools = [
  { href: "/kavach", icon: MessageCircle, color: "#22D3EE", title: "Citizen Shield (KAVACH)", description: "Talk to our AI assistant in 12+ regional languages to check if a call or message is a scam.", action: "Launch Chatbot" },
  { href: "/netra", icon: ShieldCheck, color: "#10B981", title: "Verify Banknotes", description: "Use your device camera to check Indian currency notes against official security specifications.", action: "Start Scanner" },
  { href: "/phone-safety", icon: Phone, color: "#F97316", title: "Phone Safety Lookup", description: "Check a mobile number against carrier data and crowd-sourced threat intelligence.", action: "Check Number" },
  { href: "/report-fraud", icon: FileText, color: "var(--accent)", title: "Report Fraud", description: "Submit a fraud report to help protect others and improve incident intelligence.", action: "Submit Report" },
];

export default function CitizenDashboard() {
  const { user, loading, logout, registerCitizen } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!loading) {
      if (!user) window.location.href = "/login";
      else if (!user.isCitizen) registerCitizen();
    }
  }, [user, loading, registerCitizen]);

  if (loading || !user || !user.isCitizen) {
    return <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)" }}>Verifying citizen account...</div>;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", display: "flex", flexDirection: "column" }}>
      <header style={{ height: "64px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--bg-border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 32, height: 32, background: "var(--accent)", borderRadius: 6, display: "grid", placeItems: "center" }}><Shield size={17} color="white" /></div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem" }}>RAKSHA<span style={{ color: "var(--accent)" }}>·AI</span></span>
          <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#10B981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 100, padding: "0.2rem 0.6rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Citizen Portal</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Welcome, <strong>{user.name}</strong></span>
          <button onClick={toggleTheme} aria-label="Toggle theme" style={{ background: "none", border: "1px solid var(--bg-border)", borderRadius: 6, width: 32, height: 32, cursor: "pointer", color: "var(--text-secondary)" }}>{theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}</button>
          <button onClick={() => logout("citizen")} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.75rem", border: "1px solid var(--bg-border)", borderRadius: 6, background: "transparent", color: "var(--text-secondary)", fontSize: "0.8125rem", cursor: "pointer" }}><LogOut size={13} /> Sign Out</button>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem", width: "100%", boxSizing: "border-box" }}>
        <section style={{ textAlign: "center", padding: "1rem 1rem 2rem" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, margin: "0 0 0.5rem" }}>Protecting Your Digital Presence</h1>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>Use the RAKSHA citizen toolbox to verify, report, and stay informed.</p>
        </section>
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
          {tools.map(({ href, icon: Icon, color, title, description, action }) => (
            <Link key={href} href={href} className="card" style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ padding: "1.5rem", minHeight: 220, display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: color === "var(--accent)" ? "rgba(230,58,30,0.12)" : `${color}18`, display: "grid", placeItems: "center" }}><Icon size={20} color={color} /></div>
                <div><h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", margin: "0 0 0.375rem" }}>{title}</h2><p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{description}</p></div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "auto" }}>{action} →</span>
              </div>
            </Link>
          ))}
        </section>

        <section style={{ marginTop: "2rem", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-xl)", padding: "1.5rem" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", margin: "0 0 1rem" }}>⚠️ Active Security Bulletins</h2>
          {localAlerts.map(a => <div key={a.id} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", borderBottom: "1px solid var(--bg-border-subtle)", paddingBottom: "0.75rem", marginBottom: "0.875rem" }}><div><h3 style={{ fontSize: "0.875rem", margin: "0 0 2px" }}>{a.title}</h3><p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0 }}>{a.desc}</p></div><span style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 600, flexShrink: 0 }}>{a.date}</span></div>)}
        </section>
      </main>
    </div>
  );
}
