"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

interface ThemeToggleProps {
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function ThemeToggle({ size = "md", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const dim = size === "sm" ? 30 : 36;
  const iconSize = size === "sm" ? 14 : 16;

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        background: "var(--bg-tertiary)",
        border: "1px solid var(--bg-border)",
        borderRadius: "var(--radius-md)",
        width: showLabel ? "auto" : `${dim}px`,
        height: `${dim}px`,
        padding: showLabel ? `0 0.75rem` : "0",
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
      {theme === "dark" ? <Sun size={iconSize} /> : <Moon size={iconSize} />}
      {showLabel && (
        <span style={{ fontSize: "0.8125rem", fontWeight: 500, fontFamily: "var(--font-body)" }}>
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
