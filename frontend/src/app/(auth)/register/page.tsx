"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { loginWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    const result = await loginWithGoogle();
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Failed to sign up with Google.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative", overflow: "hidden" }}>
      {/* Background */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(230,58,30,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(230,58,30,0.04) 1px,transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "40%", right: "20%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(230,58,30,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "480px", position: "relative", zIndex: 1 }}>
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
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.75rem", color: "var(--text-primary)", marginBottom: "0.375rem" }}>Citizen Signup</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Join the digital safety network</p>
        </div>

        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-xl)", padding: "2rem" }}>
          {/* Error */}
          {error && <p style={{ fontSize: "0.8125rem", color: "#E63A1E", padding: "0.625rem 0.875rem", background: "rgba(230,58,30,0.1)", borderRadius: "var(--radius-md)", border: "1px solid rgba(230,58,30,0.2)", marginBottom: "1.25rem" }}>{error}</p>}

          <button 
            onClick={handleGoogleLogin} 
            disabled={loading} 
            style={{ width: "100%", padding: "0.875rem", background: "white", color: "#111827", border: "1px solid #D1D5DB", borderRadius: "var(--radius-md)", fontSize: "0.9375rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", transition: "all 200ms ease", marginBottom: "1.5rem" }}
          >
            {loading ? (
              <><span style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid #E63A1E", borderTopColor: "transparent", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> Creating account...</>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign up with Google
              </>
            )}
          </button>

          {/* Terms */}
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.6, textAlign: "center" }}>
            By registering, you agree to our{" "}
            <Link href="#" style={{ color: "var(--accent)", textDecoration: "none" }}>Terms of Service</Link>{" "}
            and{" "}
            <Link href="#" style={{ color: "var(--accent)", textDecoration: "none" }}>Privacy Policy</Link>.
          </p>

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
