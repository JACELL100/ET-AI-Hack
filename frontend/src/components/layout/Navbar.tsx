"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Menu, X, Sun, Moon, ExternalLink, LogOut } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAuth } from "@/components/providers/AuthContext";

const navLinks = [
  { label: "Modules", href: "#modules" },
  { label: "Resources", href: "#resources" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Company", href: "#company" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hide Navbar on dashboard & admin views — evaluated only after mount
  // so SSR and initial client render always produce the same output (null).
  const hideNavbarPaths = ["/dashboard", "/admin", "/sentinel", "/netra", "/jaal", "/drishti", "/kavach", "/settings", "/phone-safety", "/report-fraud"];
  const shouldHide = mounted && hideNavbarPaths.some(p => pathname.startsWith(p));

  if (!mounted || shouldHide) return null;

  const isDashboard = pathname !== "/";

  // Determine dashboard link dynamically
  const dashboardHref = user
    ? (pathname.startsWith("/admin") || (user.isAdmin && !user.isCitizen) ? "/admin" : "/dashboard")
    : "/login";

  const navLinks = [
    { label: "Modules", href: "/#modules" },
    { label: "Dashboard", href: dashboardHref },
    { label: "Citizen Shield", href: user ? "/kavach" : "/login" },
    { label: "NETRA", href: "/netra" },
    { label: "SENTINEL", href: "/sentinel" },
    ...(user?.isAdmin
      ? [
          { label: "JAAL", href: "/admin/jaal" },
          { label: "DRISHTI", href: "/admin/drishti" },
        ]
      : []),
  ];

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transition: "all 300ms ease",
          backgroundColor: scrolled
            ? "var(--bg-secondary)"
            : isDashboard
            ? "var(--bg-secondary)"
            : "transparent",
          borderBottom: scrolled || isDashboard
            ? "1px solid var(--bg-border)"
            : "1px solid transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            height: "64px",
            gap: "2rem",
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
              flexShrink: 0,
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
              <Shield size={18} color="white" strokeWidth={2.5} />
            </div>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "1.125rem",
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              RAKSHA<span style={{ color: "var(--accent)" }}>·AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              flex: 1,
            }}
            className="hidden-mobile"
          >
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  padding: "0.5rem 0.875rem",
                  borderRadius: "var(--radius-md)",
                  transition: "color 150ms ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--text-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-secondary)")
                }
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginLeft: "auto" }}
          >
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--bg-border)",
                borderRadius: "var(--radius-md)",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--text-secondary)",
                transition: "all 150ms ease",
                flexShrink: 0,
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
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* CTA / Session Actions */}
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                  {user.name}
                </span>
                <Link
                  href={dashboardHref}
                  className="btn btn-secondary btn-sm"
                  style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
                >
                  Portal
                </Link>
                <button
                  onClick={() => logout()}
                  className="btn btn-primary btn-sm"
                  style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.75rem" }}
                >
                  <LogOut size={12} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="btn btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
              >
                Get Started
                <ExternalLink size={13} />
              </Link>
            )}

            {/* Mobile Menu */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              className="mobile-only"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-primary)",
                cursor: "pointer",
                padding: "0.25rem",
              }}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            top: "64px",
            left: 0,
            right: 0,
            bottom: 0,
            background: "var(--bg-secondary)",
            borderTop: "1px solid var(--bg-border)",
            zIndex: 99,
            padding: "1.5rem 2rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                textDecoration: "none",
                padding: "0.875rem 0",
                borderBottom: "1px solid var(--bg-border-subtle)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <button
              onClick={() => { setMobileOpen(false); logout(); }}
              className="btn btn-primary btn-lg"
              style={{ marginTop: "1rem", justifyContent: "center" }}
            >
              Sign Out <LogOut size={14} />
            </button>
          ) : (
            <Link
              href="/login"
              className="btn btn-primary btn-lg"
              style={{ marginTop: "1rem", justifyContent: "center" }}
              onClick={() => setMobileOpen(false)}
            >
              Get Started <ExternalLink size={14} />
            </Link>
          )}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }
      `}</style>
    </>
  );
}
