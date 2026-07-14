"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CodeSnippetProps {
  code: string;
  language?: string;
  filename?: string;
  showCopy?: boolean;
  animated?: boolean;
  style?: React.CSSProperties;
}

// Simple syntax-highlight-like colorizer
function colorize(code: string): React.ReactNode[] {
  const lines = code.split("\n");
  return lines.map((line, i) => {
    const colored = line
      // Strings
      .replace(/(["'`])([^"'`]*)\1/g, '<span style="color:#10B981">$1$2$1</span>')
      // Keywords
      .replace(
        /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|new|typeof|true|false|null|undefined)\b/g,
        '<span style="color:#818CF8">$1</span>'
      )
      // Numbers
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#F59E0B">$1</span>')
      // Comments
      .replace(/(\/\/.*$)/g, '<span style="color:#555555;font-style:italic">$1</span>')
      // Keys/properties
      .replace(/(\w+):/g, '<span style="color:#22D3EE">$1</span>:');

    return (
      <div key={i} style={{ display: "flex", minHeight: "1.5em" }}>
        <span
          style={{
            userSelect: "none",
            marginRight: "1.25rem",
            color: "#3a3a3a",
            minWidth: "1.5rem",
            textAlign: "right",
            fontSize: "0.7rem",
          }}
        >
          {i + 1}
        </span>
        <span
          dangerouslySetInnerHTML={{ __html: colored || "&nbsp;" }}
          style={{ flex: 1 }}
        />
      </div>
    );
  });
}

export function CodeSnippet({
  code,
  language = "json",
  filename,
  showCopy = true,
  animated = false,
  style,
}: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#0D0D0D",
        borderRadius: "var(--radius-lg)",
        border: "1px solid #2A2A2A",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        animation: animated ? "slide-up 700ms ease-out" : "none",
        ...style,
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.625rem 0.875rem",
          borderBottom: "1px solid #1E1E1E",
          backgroundColor: "#141414",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Traffic lights */}
          <div style={{ display: "flex", gap: "6px" }}>
            {["#E63A1E", "#F59E0B", "#10B981"].map((c, i) => (
              <div
                key={i}
                style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: c, opacity: 0.8 }}
              />
            ))}
          </div>
          {filename && (
            <span style={{ fontSize: "0.7rem", color: "#555555", fontFamily: "var(--font-mono)" }}>
              {filename}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <span
            style={{
              fontSize: "0.6rem",
              color: "#444",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontFamily: "var(--font-mono)",
            }}
          >
            {language}
          </span>
          {showCopy && (
            <button
              onClick={handleCopy}
              aria-label="Copy code"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: copied ? "#10B981" : "#555555",
                transition: "color 150ms ease",
                display: "flex",
                alignItems: "center",
                padding: "2px",
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* Code body */}
      <div
        style={{
          padding: "1rem",
          fontFamily: "var(--font-mono)",
          fontSize: "0.78rem",
          lineHeight: 1.7,
          color: "#C9C9C9",
          overflowX: "auto",
          maxHeight: "320px",
          overflowY: "auto",
        }}
      >
        {colorize(code)}
      </div>
    </div>
  );
}
