"use client";

import React, { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: "var(--accent)",
    color: "#ffffff",
    border: "1px solid var(--accent)",
  },
  secondary: {
    backgroundColor: "transparent",
    color: "var(--accent)",
    border: "1px solid var(--accent)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid transparent",
  },
  danger: {
    backgroundColor: "#EF4444",
    color: "#ffffff",
    border: "1px solid #EF4444",
  },
  outline: {
    backgroundColor: "transparent",
    color: "var(--text-primary)",
    border: "1px solid var(--bg-border)",
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "0.375rem 0.875rem", fontSize: "0.75rem", borderRadius: "var(--radius-sm)" },
  md: { padding: "0.5rem 1.25rem", fontSize: "0.8125rem", borderRadius: "var(--radius-md)" },
  lg: { padding: "0.75rem 1.75rem", fontSize: "0.9375rem", borderRadius: "var(--radius-md)" },
};

const hoverMap: Record<ButtonVariant, React.CSSProperties> = {
  primary: { backgroundColor: "var(--accent-dark)", borderColor: "var(--accent-dark)" },
  secondary: { backgroundColor: "rgba(230,58,30,0.1)" },
  ghost: { color: "var(--text-primary)", backgroundColor: "var(--bg-tertiary)" },
  danger: { backgroundColor: "#DC2626", borderColor: "#DC2626" },
  outline: { borderColor: "var(--accent)", color: "var(--accent)" },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "right",
      fullWidth = false,
      children,
      disabled,
      style,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref
  ) => {
    const [hovered, setHovered] = React.useState(false);

    const baseStyle: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.375rem",
      fontFamily: "var(--font-body)",
      fontWeight: 600,
      letterSpacing: "0.03em",
      cursor: disabled || loading ? "not-allowed" : "pointer",
      transition: "all 150ms ease",
      textDecoration: "none",
      whiteSpace: "nowrap",
      outline: "none",
      opacity: disabled || loading ? 0.55 : 1,
      width: fullWidth ? "100%" : undefined,
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...(hovered && !disabled && !loading ? hoverMap[variant] : {}),
      ...style,
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
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
        {loading ? (
          <span
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              border: "2px solid currentColor",
              borderTopColor: "transparent",
              animation: "spin 0.7s linear infinite",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
        ) : (
          <>
            {icon && iconPosition === "left" && icon}
            {children}
            {icon && iconPosition === "right" && icon}
          </>
        )}
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </button>
    );
  }
);

Button.displayName = "Button";
