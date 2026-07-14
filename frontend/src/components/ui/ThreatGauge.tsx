"use client";

import React, { useEffect, useRef, useState } from "react";

interface ThreatGaugeProps {
  score: number; // 0-100
  size?: number;
  label?: string;
  animated?: boolean;
}

export function ThreatGauge({ score, size = 160, label = "Threat Score", animated = true }: ThreatGaugeProps) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!animated) { setDisplayScore(score); return; }
    const start = performance.now();
    const duration = 1200;
    const from = displayScore;
    const to = score;

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(from + (to - from) * ease));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) * 0.78;
  const circumference = 2 * Math.PI * r;
  // Arc from -215° to 35° (270° sweep)
  const startAngle = -215;
  const sweepAngle = 270;
  const progress = displayScore / 100;
  const dashOffset = circumference * (1 - (progress * sweepAngle) / 360);

  const getColor = (s: number) => {
    if (s >= 70) return "#E63A1E";
    if (s >= 40) return "#F59E0B";
    return "#10B981";
  };

  const getLabel = (s: number) => {
    if (s >= 70) return "HIGH RISK";
    if (s >= 40) return "MEDIUM";
    return "LOW RISK";
  };

  const color = getColor(displayScore);
  const riskLabel = getLabel(displayScore);

  // Convert angle to SVG arc
  const polarToCartesian = (angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (startDeg: number, endDeg: number) => {
    const start = polarToCartesian(endDeg);
    const end = polarToCartesian(startDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  };

  const trackPath = describeArc(startAngle, startAngle + sweepAngle);
  const fillPath = describeArc(startAngle, startAngle + sweepAngle * progress);

  return (
    <div style={{ position: "relative", width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="var(--bg-border)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={fillPath}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 6px ${color}80)`,
            transition: "stroke 500ms ease",
          }}
        />
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = startAngle + (sweepAngle * tick) / 100;
          const inner = polarToCartesian(angle);
          const outerR = r + 10;
          const outerAngleRad = ((angle - 90) * Math.PI) / 180;
          const outer = {
            x: cx + outerR * Math.cos(outerAngleRad),
            y: cy + outerR * Math.sin(outerAngleRad),
          };
          return (
            <line
              key={tick}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="var(--bg-border)"
              strokeWidth="1"
            />
          );
        })}
      </svg>

      {/* Center display */}
      <div
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: size * 0.22 + "px",
            fontWeight: 800,
            color,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            textShadow: `0 0 20px ${color}60`,
          }}
        >
          {displayScore}
        </span>
        <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {label}
        </span>
        <span
          style={{
            fontSize: "0.625rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color,
          }}
        >
          {riskLabel}
        </span>
      </div>
    </div>
  );
}
