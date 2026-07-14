"use client";

import React from "react";

const stats = [
  "1.14M COMPLAINTS FILED",
  "₹1,776 CR DEFRAUDED",
  "60% YoY GROWTH IN CYBER CRIMES",
  "DIGITAL ARREST SCAMS UP 400%",
  "COUNTERFEIT CURRENCY RISING",
  "AI DETECTION ACCURACY: 95%",
];

export function StatsSection() {
  // Duplicate for seamless loop
  const items = [...stats, ...stats];

  return (
    <div
      style={{
        backgroundColor: "var(--accent)",
        padding: "0.875rem 0",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          animation: "marquee 35s linear infinite",
          width: "max-content",
        }}
      >
        {items.map((stat, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0 2.5rem",
              fontSize: "0.8125rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "white",
              whiteSpace: "nowrap",
            }}
          >
            {stat}
            <span
              style={{
                display: "inline-block",
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.5)",
                marginLeft: "2.5rem",
              }}
            />
          </span>
        ))}
      </div>

      <style jsx>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
