import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#E63A1E",
          dark: "#B02D16",
          light: "#FF5A3C",
        },
        bg: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          tertiary: "var(--bg-tertiary)",
          elevated: "var(--bg-elevated)",
          border: "var(--bg-border)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      fontSize: {
        hero: "clamp(2.5rem, 6vw, 5rem)",
        h1: "clamp(2rem, 4vw, 3.5rem)",
        h2: "clamp(1.5rem, 3vw, 2.5rem)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s infinite",
        "sphere-rotate": "sphere-rotate 14s linear infinite",
        "grid-drift": "grid-drift 20s linear infinite",
        "marquee": "marquee 30s linear infinite",
        "fade-in": "fadeIn 600ms ease-out forwards",
        "slide-up": "slideUp 600ms ease-out forwards",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.2)" },
        },
        "sphere-rotate": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "grid-drift": {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "60px 60px" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        accent: "0 0 40px rgba(230, 58, 30, 0.25)",
        "accent-sm": "0 0 20px rgba(230, 58, 30, 0.15)",
        glow: "0 0 30px rgba(230, 58, 30, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
