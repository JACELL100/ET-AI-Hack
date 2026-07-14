"use client";

import React from "react";

interface GridBackgroundProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  variant?: "default" | "subtle" | "intense";
}

export function GridBackground({
  children,
  style,
  className,
  variant = "default",
}: GridBackgroundProps) {
  const opacities = { default: 0.07, subtle: 0.04, intense: 0.12 };
  const op = opacities[variant];

  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Wire-mesh grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(230,58,30,${op}) 1px, transparent 1px),
            linear-gradient(90deg, rgba(230,58,30,${op}) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          animation: "grid-drift 30s linear infinite",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Radial fade overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, var(--bg-primary) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      {/* Content */}
      <div style={{ position: "relative", zIndex: 2 }}>{children}</div>

      <style jsx>{`
        @keyframes grid-drift {
          from { background-position: 0 0; }
          to   { background-position: 60px 60px; }
        }
      `}</style>
    </div>
  );
}
