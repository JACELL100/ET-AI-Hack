"use client";

import React, { forwardRef, useState } from "react";
import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  accentBorder?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  elevated?: boolean;
}

const paddingMap = {
  none: "0",
  sm: "0.75rem",
  md: "1.25rem",
  lg: "1.75rem",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      hover = false,
      accentBorder = false,
      padding = "md",
      elevated = false,
      children,
      style,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref
  ) => {
    const [hovered, setHovered] = useState(false);

    const baseStyle: React.CSSProperties = {
      backgroundColor: elevated ? "var(--bg-elevated)" : "var(--bg-secondary)",
      border: `1px solid ${hovered && hover ? "var(--accent)" : accentBorder ? "rgba(230,58,30,0.4)" : "var(--bg-border)"}`,
      borderRadius: "var(--radius-lg)",
      padding: paddingMap[padding],
      transition: "border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease",
      boxShadow: hovered && hover ? "var(--shadow-accent)" : elevated ? "var(--shadow-md)" : "none",
      transform: hovered && hover ? "translateY(-2px)" : "none",
      ...style,
    };

    return (
      <div
        ref={ref}
        style={baseStyle}
        onMouseEnter={(e) => {
          setHovered(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setHovered(false);
          onMouseLeave?.(e);
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

// ── Card Header ────────────────────────────────────────────────────────────────
interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, icon, action }: CardHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "1rem",
        gap: "0.75rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flex: 1 }}>
        {icon && (
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-tertiary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
        <div>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "0.9375rem",
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}
