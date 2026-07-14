"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Shield, Eye, EyeOff, ArrowRight, User, Mail, Lock, Phone, Badge } from "lucide-react";

type Role = "citizen" | "officer" | "admin";

const roles: { value: Role; label: string; desc: string }[] = [
  { value: "citizen", label: "Citizen", desc: "Report scams, get safety tips" },
  { value: "officer", label: "LEO / Officer", desc: "Investigate cases, view dashboard" },
  { value: "admin", label: "Admin", desc: "Full system access" },
];

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", badgeId: "", password: "", confirmPassword: "" });
  const [role, setRole] = useState<Role>("officer");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.includes("@")) e.email = "Valid email required";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (role === "officer" && !form.badgeId.trim()) e.badgeId = "Badge ID required for officers";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    window.location.href = "/dashboard";
  };

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "0.75rem 1rem 0.75rem 2.75rem",
    background: "var(--bg-tertiary)",
    border: `1px solid ${hasError ? "#E63A1E" : "var(--bg-border)"}`,
    borderRadius: "var(--radius-md)",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    fontFamily: "var(--font-body)",
    outline: "none",
    transition: "border-color 150ms ease",
  });

  const FieldWrapper = ({ label, icon, error, children }: { label: string; icon: React.ReactNode; error?: string; children: React.ReactNode }) => (
    <div>
      <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>{icon}</span>
        {children}
      </div>
      {error && <p style={{ fontSize: "0.75rem", color: "#E63A1E", marginTop: "0.375rem" }}>{error}</p>}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative", overflow: "hidden" }}>
      {/* Background */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(230,58,30,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(230,58,30,0.04) 1px,transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "40%", right: "20%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(230,58,30,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "520px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", marginBottom: "1rem" }}>
            <div style={{ width: "44px", height: "44px", background: "var(--accent)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={24} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.375rem", color: "var(--text-primary)" }}>
              RAKSHA<span style={{ color: "var(--accent)" }}>·AI</span>
            </span>
          </Link>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.75rem", color: "var(--text-primary)", marginBottom: "0.375rem" }}>Create Account</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Join the digital safety network</p>
        </div>

        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-xl)", padding: "2rem" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
            {/* Role selector */}
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Account Type</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                {roles.map(r => (
                  <button key={r.value} type="button" onClick={() => setRole(r.value)} style={{ padding: "0.75rem 0.5rem", borderRadius: "var(--radius-md)", border: `1px solid ${role === r.value ? "var(--accent)" : "var(--bg-border)"}`, background: role === r.value ? "rgba(230,58,30,0.12)" : "var(--bg-tertiary)", color: role === r.value ? "var(--accent)" : "var(--text-secondary)", cursor: "pointer", transition: "all 150ms ease", textAlign: "center" }}>
                    <p style={{ fontSize: "0.8rem", fontWeight: 700 }}>{r.label}</p>
                    <p style={{ fontSize: "0.65rem", marginTop: "0.2rem", opacity: 0.75, lineHeight: 1.3 }}>{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <FieldWrapper label="Full Name" icon={<User size={15} />} error={errors.name}>
              <input type="text" value={form.name} onChange={e => update("name", e.target.value)} placeholder="Rajesh Kumar" style={inputStyle(!!errors.name)}
                onFocus={e => { e.target.style.borderColor = "var(--accent)"; }}
                onBlur={e => { e.target.style.borderColor = errors.name ? "#E63A1E" : "var(--bg-border)"; }} />
            </FieldWrapper>

            {/* Email */}
            <FieldWrapper label="Email Address" icon={<Mail size={15} />} error={errors.email}>
              <input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="officer@police.gov.in" style={inputStyle(!!errors.email)}
                onFocus={e => { e.target.style.borderColor = "var(--accent)"; }}
                onBlur={e => { e.target.style.borderColor = errors.email ? "#E63A1E" : "var(--bg-border)"; }} />
            </FieldWrapper>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {/* Phone */}
              <FieldWrapper label="Phone" icon={<Phone size={15} />} error={errors.phone}>
                <input type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+91-XXXXXXXXXX" style={inputStyle(!!errors.phone)}
                  onFocus={e => { e.target.style.borderColor = "var(--accent)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--bg-border)"; }} />
              </FieldWrapper>

              {/* Badge ID (officer only) */}
              <FieldWrapper label={role === "officer" ? "Badge ID *" : "Badge ID"} icon={<Badge size={15} />} error={errors.badgeId}>
                <input type="text" value={form.badgeId} onChange={e => update("badgeId", e.target.value)} placeholder="IPS-12345" disabled={role === "citizen"} style={{ ...inputStyle(!!errors.badgeId), opacity: role === "citizen" ? 0.5 : 1 }}
                  onFocus={e => { if (role !== "citizen") e.target.style.borderColor = "var(--accent)"; }}
                  onBlur={e => { e.target.style.borderColor = errors.badgeId ? "#E63A1E" : "var(--bg-border)"; }} />
              </FieldWrapper>
            </div>

            {/* Password */}
            <FieldWrapper label="Password" icon={<Lock size={15} />} error={errors.password}>
              <input type={showPassword ? "text" : "password"} value={form.password} onChange={e => update("password", e.target.value)} placeholder="Min. 8 characters" style={{ ...inputStyle(!!errors.password), paddingRight: "2.75rem" }}
                onFocus={e => { e.target.style.borderColor = "var(--accent)"; }}
                onBlur={e => { e.target.style.borderColor = errors.password ? "#E63A1E" : "var(--bg-border)"; }} />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </FieldWrapper>

            {/* Confirm password */}
            <FieldWrapper label="Confirm Password" icon={<Lock size={15} />} error={errors.confirmPassword}>
              <input type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={e => update("confirmPassword", e.target.value)} placeholder="Repeat password" style={inputStyle(!!errors.confirmPassword)}
                onFocus={e => { e.target.style.borderColor = "var(--accent)"; }}
                onBlur={e => { e.target.style.borderColor = errors.confirmPassword ? "#E63A1E" : "var(--bg-border)"; }} />
            </FieldWrapper>

            {/* Terms */}
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              By registering, you agree to our{" "}
              <Link href="#" style={{ color: "var(--accent)", textDecoration: "none" }}>Terms of Service</Link>{" "}
              and{" "}
              <Link href="#" style={{ color: "var(--accent)", textDecoration: "none" }}>Privacy Policy</Link>.
            </p>

            {/* Submit */}
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "0.875rem", background: loading ? "var(--bg-tertiary)" : "var(--accent)", color: "white", border: "none", borderRadius: "var(--radius-md)", fontSize: "0.9375rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", transition: "all 200ms ease" }}>
              {loading ? <><span style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid white", borderTopColor: "transparent", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> Creating account...</> : <>Create Account <ArrowRight size={17} /></>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
