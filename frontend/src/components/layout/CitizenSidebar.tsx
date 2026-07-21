"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield, Eye, MessageCircle, LayoutDashboard, FileText, Phone, Network,
  Sun, Moon, LogOut
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAuth } from "@/components/providers/AuthContext";

export const citizenNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Citizen Shield (KAVACH)", href: "/kavach", icon: MessageCircle, color: "#22D3EE" },
  { label: "Verify Banknotes (NETRA)", href: "/netra", icon: Eye, color: "#10B981" },
  { label: "SENTINEL", href: "/sentinel", icon: Shield, color: "#E63A1E" },
  { label: "Phone Safety", href: "/phone-safety", icon: Phone, color: "#F97316" },
  { label: "JAAL Network Check", href: "/jaal", icon: Network, color: "#818CF8" },
  { label: "Report Fraud", href: "/report-fraud", icon: FileText, color: "#E63A1E" },
];

export function CitizenSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
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
      {/* Brand Logo & Portal Badge */}
      <div style={{ marginBottom: "2rem", padding: "0 0.5rem" }}>
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
            marginBottom: "0.5rem",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "var(--accent)",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield size={17} color="white" strokeWidth={2.5} />
          </div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "1rem",
              color: "var(--text-primary)",
            }}
          >
            RAKSHA<span style={{ color: "var(--accent)" }}>·AI</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <span
            style={{
              fontSize: "0.625rem",
              fontWeight: 700,
              color: "#10B981",
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: "100px",
              padding: "0.15rem 0.5rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Citizen Protection Portal
          </span>
        </div>
      </div>

      {/* Navigation Items (STRICTLY CITIZEN) */}
      <nav
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
        }}
      >
        {citizenNavItems.map(({ label, href, icon: Icon, color }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: "0.625rem 0.875rem",
                borderRadius: "var(--radius-md)",
                textDecoration: "none",
                fontSize: "0.8125rem",
                fontWeight: isActive ? 700 : 500,
                color: isActive
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
                backgroundColor: isActive
                  ? "var(--bg-tertiary)"
                  : "transparent",
                borderLeft: `3px solid ${isActive ? "#10B981" : "transparent"}`,
                transition: "all 150ms ease",
              }}
            >
              <Icon
                size={17}
                color={isActive ? "#10B981" : color || "currentColor"}
                strokeWidth={2}
              />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && (
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#10B981",
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Account Controls */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: "1rem",
          borderTop: "1px solid var(--bg-border)",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {user && (
          <div style={{ padding: "0 0.5rem 0.5rem" }}>
            <div
              style={{
                fontSize: "0.65rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Citizen Account
            </div>
            <div
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={user.name}
            >
              {user.name}
            </div>
          </div>
        )}



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
            borderRadius: "var(--radius-md)",
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

        {user && (
          <button
            onClick={() => logout("citizen")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              width: "100%",
              padding: "0.625rem 0.875rem",
              background: "rgba(230,58,30,0.08)",
              border: "1px solid rgba(230,58,30,0.2)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              color: "var(--accent)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              fontFamily: "var(--font-body)",
            }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}
