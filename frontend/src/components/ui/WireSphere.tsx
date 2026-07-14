"use client";

import React from "react";

interface WireSphereProps {
  size?: number;
  variant?: "default" | "active" | "critical" | "network";
  animated?: boolean;
  className?: string;
}

export function WireSphere({
  size = 160,
  variant = "default",
  animated = true,
  className = "",
}: WireSphereProps) {
  const colors = {
    default:  { stroke: "#3a3a3a", accent: "#555555", glow: "none" },
    active:   { stroke: "#E63A1E", accent: "#FF5A3C", glow: "rgba(230,58,30,0.3)" },
    critical: { stroke: "#E63A1E", accent: "#FF5A3C", glow: "rgba(230,58,30,0.5)" },
    network:  { stroke: "#818CF8", accent: "#A5B4FC", glow: "rgba(129,140,248,0.3)" },
  };

  const { stroke, accent, glow } = colors[variant];
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) * 0.82;

  // Generate ellipse arcs to simulate 3D wireframe sphere
  const horizontalEllipses = [-0.85, -0.65, -0.4, -0.15, 0.15, 0.4, 0.65, 0.85];
  const verticalLines = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        filter: glow !== "none" ? `drop-shadow(0 0 ${size * 0.12}px ${glow})` : "none",
        animation: animated ? "sphere-rotate 14s linear infinite" : "none",
        transformStyle: "preserve-3d",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer circle */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={stroke}
          strokeWidth="0.8"
          strokeDasharray={variant === "critical" ? "4 4" : "none"}
          opacity="0.7"
        />

        {/* Horizontal latitude ellipses */}
        {horizontalEllipses.map((t, i) => {
          const ry = Math.abs(r * t);
          const yOffset = cy + r * t * 0.5;
          return (
            <ellipse
              key={`h${i}`}
              cx={cx}
              cy={yOffset}
              rx={r * Math.sqrt(1 - t * t)}
              ry={ry * 0.25}
              stroke={i === 4 ? accent : stroke}
              strokeWidth={i === 4 ? "1" : "0.6"}
              opacity={0.5 + Math.abs(t) * 0.1}
            />
          );
        })}

        {/* Vertical longitude lines */}
        {verticalLines.map((angle, i) => {
          const x1 = cx + r * Math.cos(angle);
          const x2 = cx + r * Math.cos(angle + Math.PI);
          return (
            <path
              key={`v${i}`}
              d={`M ${x1},${cy - 2} Q ${cx},${cy - r * 0.95} ${x2},${cy - 2}`}
              stroke={stroke}
              strokeWidth="0.6"
              fill="none"
              opacity="0.35"
            />
          );
        })}

        {/* Equator highlight */}
        <ellipse
          cx={cx}
          cy={cy}
          rx={r}
          ry={r * 0.1}
          stroke={accent}
          strokeWidth="1"
          opacity="0.6"
        />

        {/* Center highlight dot */}
        <circle cx={cx} cy={cy} r={2.5} fill={accent} opacity="0.8" />

        {/* Highlight arc top */}
        <path
          d={`M ${cx - r * 0.4},${cy - r * 0.7} Q ${cx},${cy - r * 0.9} ${cx + r * 0.4},${cy - r * 0.7}`}
          stroke={accent}
          strokeWidth="0.8"
          fill="none"
          opacity="0.4"
        />

        {/* Network nodes (for network variant) */}
        {variant === "network" && [
          [cx - r * 0.4, cy - r * 0.3],
          [cx + r * 0.4, cy + r * 0.2],
          [cx - r * 0.2, cy + r * 0.5],
          [cx + r * 0.3, cy - r * 0.5],
        ].map(([nx, ny], i) => (
          <g key={`node${i}`}>
            <circle cx={nx} cy={ny} r={3} fill={accent} opacity="0.9" />
            <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={accent} strokeWidth="0.5" opacity="0.4" />
          </g>
        ))}
      </svg>
    </div>
  );
}
