"use client";

import React, { useEffect } from "react";
import { Phone, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";
import { CitizenSidebar } from "@/components/layout/CitizenSidebar";
import { PhoneNumberLookup } from "@/components/sentinel/PhoneNumberLookup";

export default function PhoneSafetyPage() {
  const { user, loading, registerCitizen } = useAuth();
  useEffect(() => {
    if (!loading) {
      if (!user) window.location.href = "/login";
      else if (!user.isCitizen) registerCitizen();
    }
  }, [user, loading, registerCitizen]);

  if (loading || !user || !user.isCitizen) return <div style={{ display: "grid", placeItems: "center", height: "100vh", background: "var(--bg-primary)" }}>Verifying citizen account...</div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <CitizenSidebar />
      <main style={{ marginLeft: 240, flex: 1, padding: "2rem", maxWidth: 1100 }}>
        <div style={{ display: "flex", gap: "0.875rem", alignItems: "center", marginBottom: "0.5rem" }}><div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(249,115,22,0.12)", display: "grid", placeItems: "center" }}><Phone size={21} color="#F97316" /></div><div><h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", margin: 0 }}>Phone Safety Lookup</h1><p style={{ color: "var(--text-secondary)", margin: "0.25rem 0 0" }}>Check a number before you call back, share an OTP, or send money.</p></div></div>
        <div style={{ marginTop: "1.75rem", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-xl)", padding: "1.75rem", maxWidth: 900 }}><PhoneNumberLookup /></div>
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.625rem", alignItems: "center", color: "var(--text-secondary)", fontSize: "0.8125rem" }}><ShieldCheck size={16} color="#10B981" /> Do not share OTPs, UPI PINs, or bank credentials with an unknown caller.</div>
      </main>
    </div>
  );
}
