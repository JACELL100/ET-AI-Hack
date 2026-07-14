"use client";

import React from "react";
import type { Severity, NetraVerdict } from "@/types";

type BadgeVariant =
  | "default"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted"
  | Severity
  | NetraVerdict;

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  pulse?: boolean;
  dot?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles: Record<string, { bg: string; color: string; border?: string }> = {
  default: { bg: "var(--bg-tertiary)", color: "var(--text-secondary)" },
  accent: { bg: "rgba(230,58,30,0.15)", color: "#E63A1E", border: "rgba(230,58,30,0.3)" },
  success: { bg: "rgba(16,185,129,0.15)", color: "#10B981", border: "rgba(16,185,129,0.3)" },
  warning: { bg: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "rgba(245,158,11,0.3)" },
  danger: { bg: "rgba(239,68,68,0.15)", color: "#EF4444", border: "rgba(239,68,68,0.3)" },
  info: { bg: "rgba(34,211,238,0.15)", color: "#22D3EE", border: "rgba(34,211,238,0.3)" },
  muted: { bg: "rgba(107,114,128,0.15)", color: "#9CA3AF", border: "rgba(107,114,128,0.3)" },
  // Severity
  critical: { bg: "rgba(230,58,30,0.15)", color: "#E63A1E", border: "rgba(230,58,30,0.3)" },
  high: { bg: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "rgba(245,158,11,0.3)" },
  medium: { bg: "rgba(129,140,248,0.15)", color: "#818CF8", border: "rgba(129,140,248,0.3)" },
  low: { bg: "rgba(107,114,128,0.15)", color: "#9CA3AF", border: "rgba(107,114,128,0.3)" },
  // NETRA verdicts
  AUTHENTIC: { bg: "rgba(16,185,129,0.15)", color: "#10B981", border: "rgba(16,185,129,0.3)" },
  SUSPICIOUS: { bg: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "rgba(245,158,11,0.3)" },
  COUNTERFEIT: { bg: "rgba(230,58,30,0.15)", color: "#E63A1E", border: "rgba(230,58,30,0.3)" },
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
  pulse = false,
  dot = false,
  style,
}: BadgeProps) {
  const vs = variantStyles[variant as string] ?? variantStyles.default;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        padding: size === "sm" ? "0.175rem 0.6rem" : "0.3rem 0.875rem",
        fontSize: size === "sm" ? "0.65rem" : "0.75rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        borderRadius: "100px",
        backgroundColor: vs.bg,
        color: vs.color,
        border: `1px solid ${vs.border ?? "transparent"}`,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: vs.color,
            flexShrink: 0,
            animation: pulse ? "pulse-glow 2s infinite" : "none",
          }}
        />
      )}
      {children}
    </span>
  );
}

// ── Severity Badge ────────────────────────────────────────────────────────────
export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge variant={severity} dot pulse={severity === "critical"}>
      {severity}
    </Badge>
  );
}

// ── Module Badge ──────────────────────────────────────────────────────────────
const moduleColors: Record<string, string> = {
  SENTINEL: "#E63A1E",
  NETRA: "#10B981",
  JAAL: "#818CF8",
  DRISHTI: "#F59E0B",
  KAVACH: "#22D3EE",
};

export function ModuleBadge({ module }: { module: string }) {
  const color = moduleColors[module] ?? "#9CA3AF";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.175rem 0.6rem",
        fontSize: "0.625rem",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        borderRadius: "var(--radius-sm)",
        backgroundColor: `${color}20`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {module}
    </span>
  );
}
