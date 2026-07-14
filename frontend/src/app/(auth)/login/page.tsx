"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Shield, Eye, EyeOff, ArrowRight, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    // Mock: redirect to dashboard
    window.location.href = "/dashboard";
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem 1rem 0.75rem 2.75rem",
    background: "var(--bg-tertiary)",
    border: "1px solid var(--bg-border)",
    borderRadius: "var(--radius-md)",
    color: "var(--text-primary)",
    fontSize: "0.9rem",
    fontFamily: "var(--font-body)",
    outline: "none",
    transition: "border-color 150ms ease",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative", overflow: "hidden" }}>
      {/* Background grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(230,58,30,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(230,58,30,0.05) 1px,transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(230,58,30,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", marginBottom: "1.5rem" }}>
            <div style={{ width: "44px", height: "44px", background: "var(--accent)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={24} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.375rem", color: "var(--text-primary)" }}>
              RAKSHA<span style={{ color: "var(--accent)" }}>·AI</span>
            </span>
          </Link>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.75rem", color: "var(--text-primary)", marginBottom: "0.375rem" }}>Welcome back</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Sign in to the command centre</p>
        </div>

        {/* Card */}
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-xl)", padding: "2rem" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)" }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="officer@police.gov.in" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = "var(--accent)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--bg-border)"; }} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)" }} />
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ ...inputStyle, paddingRight: "2.75rem" }}
                  onFocus={e => { e.target.style.borderColor = "var(--accent)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--bg-border)"; }} />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot */}
            <div style={{ textAlign: "right", marginTop: "-0.5rem" }}>
              <Link href="#" style={{ fontSize: "0.8125rem", color: "var(--accent)", textDecoration: "none" }}>Forgot password?</Link>
            </div>

            {/* Error */}
            {error && <p style={{ fontSize: "0.8125rem", color: "#E63A1E", padding: "0.625rem 0.875rem", background: "rgba(230,58,30,0.1)", borderRadius: "var(--radius-md)", border: "1px solid rgba(230,58,30,0.2)" }}>{error}</p>}

            {/* Submit */}
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "0.875rem", background: loading ? "var(--bg-tertiary)" : "var(--accent)", color: "white", border: "none", borderRadius: "var(--radius-md)", fontSize: "0.9375rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.04em", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", transition: "all 200ms ease" }}>
              {loading ? <><span style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid white", borderTopColor: "transparent", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> Signing in...</> : <>Sign In <ArrowRight size={17} /></>}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.5rem 0" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--bg-border)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>or continue with</span>
            <div style={{ flex: 1, height: "1px", background: "var(--bg-border)" }} />
          </div>

          {/* Demo login */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {[{ role: "Officer", email: "officer@police.gov.in" }, { role: "Admin", email: "admin@raksha.ai" }].map(r => (
              <button key={r.role} onClick={() => { setEmail(r.email); setPassword("demo1234"); }} style={{ padding: "0.625rem", background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", color: "var(--text-secondary)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", transition: "all 150ms ease" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bg-border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
                Demo {r.role}
              </button>
            ))}
          </div>
        </div>

        {/* Register link */}
        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Don't have an account?{" "}
          <Link href="/register" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Register here</Link>
        </p>
      </div>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
