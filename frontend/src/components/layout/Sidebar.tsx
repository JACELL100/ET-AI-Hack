"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield, Eye, Network, Map, MessageCircle,
  LayoutDashboard, Settings, Sun, Moon,
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "SENTINEL", href: "/sentinel", icon: Shield, color: "#E63A1E" },
  { label: "NETRA", href: "/netra", icon: Eye, color: "#10B981" },
  { label: "JAAL", href: "/jaal", icon: Network, color: "#818CF8" },
  { label: "DRISHTI", href: "/drishti", icon: Map, color: "#F59E0B" },
  { label: "KAVACH", href: "/kavach", icon: MessageCircle, color: "#22D3EE" },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
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
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
            marginBottom: "2rem",
            padding: "0 0.5rem",
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
              flexShrink: 0,
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
              letterSpacing: "-0.02em",
            }}
          >
            RAKSHA<span style={{ color: "var(--accent)" }}>·AI</span>
          </span>
        </Link>

        {/* Section label */}
        <p
          style={{
            fontSize: "0.625rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            padding: "0 0.5rem",
            marginBottom: "0.5rem",
          }}
        >
          Modules
        </p>

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          {navItems.map(({ label, href, icon: Icon, color }) => {
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
                  fontWeight: isActive ? 600 : 500,
                  fontFamily: "var(--font-body)",
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  backgroundColor: isActive ? "var(--bg-tertiary)" : "transparent",
                  borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                  transition: "all 150ms ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
              >
                <Icon
                  size={17}
                  color={isActive ? "var(--accent)" : color ?? "currentColor"}
                  strokeWidth={2}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: "1rem",
            borderTop: "1px solid var(--bg-border)",
          }}
        >
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
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--bg-border)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </aside>

      {/* Sidebar CSS */}
      <style jsx global>{`
        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.625rem 0.875rem;
          border-radius: var(--radius-md);
          text-decoration: none;
          font-size: 0.8125rem;
          font-weight: 500;
          font-family: var(--font-body);
          color: var(--text-secondary);
          border-left: 2px solid transparent;
          transition: all 150ms ease;
        }
        .sidebar-nav-item:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
        }
        .sidebar-nav-item.active {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
          font-weight: 600;
          border-left-color: var(--accent);
        }
      `}</style>
    </>
  );
}
