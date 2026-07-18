"use client";
import React, { useRef, useEffect } from "react";

interface AudioVisualizerProps {
  isActive: boolean;
  threatLevel?: number; // 0-100
  mode?: "waveform" | "bars";
  height?: number;
}

export function AudioVisualizer({
  isActive,
  threatLevel = 0,
  mode = "bars",
  height = 64,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const barsRef = useRef<number[]>(Array.from({ length: 32 }, () => 0.1));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const bars = barsRef.current;
      const barCount = bars.length;
      const barWidth = (w / barCount) * 0.7;
      const gap = (w / barCount) * 0.3;

      // Color based on threat level
      let color: string;
      if (threatLevel >= 70) color = "#E63A1E";
      else if (threatLevel >= 40) color = "#F59E0B";
      else color = "#10B981";

      for (let i = 0; i < barCount; i++) {
        if (isActive) {
          // Animate bars
          const target = 0.15 + Math.random() * 0.85;
          bars[i] += (target - bars[i]) * 0.15;
        } else {
          bars[i] += (0.05 - bars[i]) * 0.1;
        }

        const barH = bars[i] * h * 0.9;
        const x = i * (barWidth + gap) + gap / 2;
        const y = (h - barH) / 2;

        const gradient = ctx.createLinearGradient(x, y, x, y + barH);
        gradient.addColorStop(0, color + "CC");
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, color + "CC");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isActive, threatLevel]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={height}
      style={{
        width: "100%",
        height: `${height}px`,
        borderRadius: "8px",
        opacity: isActive ? 1 : 0.3,
        transition: "opacity 300ms ease",
      }}
    />
  );
}
