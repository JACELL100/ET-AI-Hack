"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield, Eye, Network, Map, MessageCircle, LayoutDashboard,
  Settings, Sun, Moon, ZoomIn, ZoomOut, Layers, Activity,
  AlertTriangle, MapPin, Clock,
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "SENTINEL", href: "/sentinel", icon: Shield, color: "#E63A1E" },
  { label: "NETRA", href: "/netra", icon: Eye, color: "#10B981" },
  { label: "JAAL", href: "/jaal", icon: Network, color: "#818CF8" },
  { label: "DRISHTI", href: "/drishti", icon: Map, color: "#F59E0B" },
  { label: "KAVACH", href: "/kavach", icon: MessageCircle, color: "#22D3EE" },
  { label: "Settings", href: "/settings", icon: Settings },
];

function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  return (
    <aside style={{ width: "240px", flexShrink: 0, backgroundColor: "var(--bg-secondary)", borderRight: "1px solid var(--bg-border)", display: "flex", flexDirection: "column", padding: "1.5rem 1rem", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50, overflowY: "auto" }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", marginBottom: "2rem", padding: "0 0.5rem" }}>
        <div style={{ width: "32px", height: "32px", background: "var(--accent)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shield size={17} color="white" strokeWidth={2.5} />
        </div>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>
          RAKSHA<span style={{ color: "var(--accent)" }}>·AI</span>
        </span>
      </Link>
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {navItems.map(({ label, href, icon: Icon, color }) => {
          const isActive = pathname === href;
          return (
            <Link key={label} href={href} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0.875rem", borderRadius: "var(--radius-md)", textDecoration: "none", fontSize: "0.8125rem", fontWeight: isActive ? 600 : 500, color: isActive ? "var(--text-primary)" : "var(--text-secondary)", backgroundColor: isActive ? "var(--bg-tertiary)" : "transparent", borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent", transition: "all 150ms ease" }}>
              <Icon size={17} color={isActive ? "var(--accent)" : (color || "currentColor")} strokeWidth={2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--bg-border)" }}>
        <button onClick={toggleTheme} style={{ display: "flex", alignItems: "center", gap: "0.625rem", width: "100%", padding: "0.625rem 0.875rem", background: "none", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "var(--font-body)" }}>
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    </aside>
  );
}

// Hotspot city data (approximate SVG coords on India map 400x480)
const hotspots = [
  { id: "h1", city: "Mumbai", x: 120, y: 280, intensity: 95, count: 142 },
  { id: "h2", city: "Delhi", x: 185, y: 145, intensity: 88, count: 128 },
  { id: "h3", city: "Bangalore", x: 165, y: 345, intensity: 72, count: 89 },
  { id: "h4", city: "Hyderabad", x: 185, y: 305, intensity: 68, count: 76 },
  { id: "h5", city: "Chennai", x: 195, y: 370, intensity: 61, count: 54 },
  { id: "h6", city: "Kolkata", x: 295, y: 230, intensity: 55, count: 47 },
  { id: "h7", city: "Ahmedabad", x: 110, y: 235, intensity: 49, count: 38 },
  { id: "h8", city: "Pune", x: 130, y: 295, intensity: 58, count: 61 },
];

const liveIncidents = [
  { id: "I001", time: "10:28", type: "Digital Arrest Scam", location: "Mumbai, MH", severity: "critical" },
  { id: "I002", time: "10:25", type: "Counterfeit ₹500", location: "Delhi, DL", severity: "high" },
  { id: "I003", time: "10:21", type: "UPI Fraud", location: "Bangalore, KA", severity: "high" },
  { id: "I004", time: "10:19", type: "Digital Arrest Scam", location: "Chennai, TN", severity: "critical" },
  { id: "I005", time: "10:15", type: "Money Mule Activity", location: "Kolkata, WB", severity: "medium" },
  { id: "I006", time: "10:11", type: "Investment Scam", location: "Hyderabad, TS", severity: "high" },
  { id: "I007", time: "10:08", type: "Scam SMS Pattern", location: "Pune, MH", severity: "medium" },
  { id: "I008", time: "10:04", type: "Counterfeit ₹200", location: "Ahmedabad, GJ", severity: "high" },
  { id: "I009", time: "09:58", type: "UPI Fraud", location: "Mumbai, MH", severity: "medium" },
  { id: "I010", time: "09:51", type: "Digital Arrest Scam", location: "Delhi, DL", severity: "critical" },
];

const severityColors: Record<string, string> = {
  critical: "#E63A1E",
  high: "#F59E0B",
  medium: "#818CF8",
  low: "#6B7280",
};

const layers = ["Heatmap", "Hotspots", "Patrol", "Incidents"];

// Simplified India SVG path (very approximate outline)
const INDIA_PATH = "M185,60 L210,55 L245,70 L280,65 L310,85 L330,110 L320,135 L335,155 L325,180 L340,205 L330,235 L310,255 L300,285 L280,300 L265,330 L245,355 L220,375 L200,385 L180,375 L165,360 L150,340 L140,310 L125,295 L110,275 L100,250 L95,225 L105,200 L95,175 L100,150 L115,130 L120,105 L135,90 L155,75 Z";

export default function DrishtiPage() {
  const [activeLayers, setActiveLayers] = useState(["Heatmap", "Hotspots"]);
  const [newIncidents, setNewIncidents] = useState<typeof liveIncidents>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<typeof hotspots[0] | null>(null);

  const toggleLayer = (layer: string) => {
    setActiveLayers(prev =>
      prev.includes(layer) ? prev.filter(l => l !== layer) : [...prev, layer]
    );
  };

  // Simulate live incoming incidents
  useEffect(() => {
    const timer = setInterval(() => {
      setNewIncidents(prev => [
        { id: `LIVE-${Date.now()}`, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }), type: ["Digital Arrest Scam", "UPI Fraud", "Counterfeit"][Math.floor(Math.random() * 3)], location: ["Mumbai", "Delhi", "Bangalore"][Math.floor(Math.random() * 3)], severity: ["critical", "high", "medium"][Math.floor(Math.random() * 3)] },
        ...prev.slice(0, 2),
      ]);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const allIncidents = [...newIncidents, ...liveIncidents].slice(0, 10);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "var(--bg-primary)" }}>
      <Sidebar />
      <main style={{ marginLeft: "240px", flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--bg-border)", background: "var(--bg-secondary)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Map size={18} color="#F59E0B" />
            </div>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.25rem", color: "var(--text-primary)" }}>DRISHTI — Geospatial Command Centre</h1>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Real-time crime heatmap and patrol coordination</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", display: "inline-block", animation: "pulse-glow 2s infinite" }} />
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#10B981" }}>{liveIncidents.length + newIncidents.length} Live Incidents</span>
          </div>
        </div>

        {/* Map + Feed */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Map area */}
          <div style={{ flex: 1, position: "relative", background: "#060D1A", overflow: "hidden" }}>
            {/* Grid overlay */}
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(245,158,11,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(245,158,11,0.04) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

            {/* Layer controls */}
            <div style={{ position: "absolute", top: "1rem", left: "1rem", zIndex: 10, background: "rgba(22,22,22,0.92)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-lg)", padding: "0.875rem", display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: "160px" }}>
              <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <Layers size={12} /> Layers
              </p>
              {layers.map(layer => (
                <button key={layer} onClick={() => toggleLayer(layer)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 0.5rem", borderRadius: "var(--radius-sm)", background: activeLayers.includes(layer) ? "rgba(245,158,11,0.15)" : "transparent", border: `1px solid ${activeLayers.includes(layer) ? "rgba(245,158,11,0.4)" : "transparent"}`, cursor: "pointer", color: activeLayers.includes(layer) ? "#F59E0B" : "var(--text-muted)", fontSize: "0.75rem", fontWeight: 500, transition: "all 150ms ease" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: activeLayers.includes(layer) ? "#F59E0B" : "var(--bg-border)", transition: "background 150ms ease" }} />
                  {layer}
                </button>
              ))}
            </div>

            {/* Zoom controls */}
            <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 10, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[<ZoomIn size={16} key="zi" />, <ZoomOut size={16} key="zo" />].map((icon, i) => (
                <button key={i} style={{ width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(22,22,22,0.9)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", cursor: "pointer", color: "var(--text-secondary)" }}>{icon}</button>
              ))}
            </div>

            {/* SVG Map */}
            <svg width="100%" height="100%" viewBox="0 0 440 480" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0 }}>
              {/* India outline */}
              <path d={INDIA_PATH} fill="rgba(245,158,11,0.04)" stroke="rgba(245,158,11,0.3)" strokeWidth="1.5" />

              {/* Heatmap blobs */}
              {activeLayers.includes("Heatmap") && hotspots.map(h => (
                <circle key={`heat-${h.id}`} cx={h.x} cy={h.y} r={h.intensity * 0.4 + 20} fill={`rgba(230,58,30,${h.intensity / 500})`} />
              ))}

              {/* Hotspot markers */}
              {activeLayers.includes("Hotspots") && hotspots.map(h => (
                <g key={h.id} onClick={() => setSelectedHotspot(selectedHotspot?.id === h.id ? null : h)} style={{ cursor: "pointer" }}>
                  <circle cx={h.x} cy={h.y} r={18} fill="transparent" />
                  <circle cx={h.x} cy={h.y} r={h.intensity >= 80 ? 10 : 7} fill="#F59E0B" opacity={0.9}
                    style={{ filter: h.intensity >= 80 ? "drop-shadow(0 0 6px #F59E0B)" : "none" }} />
                  <circle cx={h.x} cy={h.y} r={h.intensity >= 80 ? 16 : 12} fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.4" />
                  {selectedHotspot?.id === h.id && (
                    <g>
                      <rect x={h.x + 14} y={h.y - 30} width={110} height={38} rx={6} fill="rgba(22,22,22,0.95)" stroke="rgba(245,158,11,0.5)" strokeWidth="1" />
                      <text x={h.x + 20} y={h.y - 16} fill="#F5F5F5" fontSize="10" fontWeight="700">{h.city}</text>
                      <text x={h.x + 20} y={h.y - 4} fill="#888" fontSize="9">{h.count} incidents · Risk {h.intensity}</text>
                    </g>
                  )}
                </g>
              ))}

              {/* Live incident dots */}
              {activeLayers.includes("Incidents") && newIncidents.map((inc, i) => {
                const base = hotspots[i % hotspots.length];
                return (
                  <circle key={inc.id} cx={base.x + (Math.random() * 20 - 10)} cy={base.y + (Math.random() * 20 - 10)} r={4}
                    fill={severityColors[inc.severity] ?? "#888"} opacity="0.9"
                    style={{ animation: "pulse-glow 1.5s infinite" }} />
                );
              })}

              {/* Patrol routes */}
              {activeLayers.includes("Patrol") && (
                <>
                  <polyline points={`${hotspots[0].x},${hotspots[0].y} ${hotspots[1].x},${hotspots[1].y} ${hotspots[5].x},${hotspots[5].y}`} fill="none" stroke="#22D3EE" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5" />
                  <polyline points={`${hotspots[2].x},${hotspots[2].y} ${hotspots[3].x},${hotspots[3].y} ${hotspots[4].x},${hotspots[4].y}`} fill="none" stroke="#22D3EE" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5" />
                </>
              )}
            </svg>

            {/* Legend */}
            <div style={{ position: "absolute", bottom: "1rem", left: "1rem", zIndex: 10, background: "rgba(22,22,22,0.9)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", padding: "0.625rem 0.875rem", display: "flex", gap: "1rem", alignItems: "center" }}>
              {[{ color: "#E63A1E", label: "Critical" }, { color: "#F59E0B", label: "Hotspot" }, { color: "#22D3EE", label: "Patrol" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: l.color }} />
                  <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live feed */}
          <div style={{ width: "300px", flexShrink: 0, background: "var(--bg-secondary)", borderLeft: "1px solid var(--bg-border)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--bg-border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Activity size={15} color="#10B981" />
              <h3 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-primary)" }}>Live Incident Feed</h3>
              <span style={{ marginLeft: "auto", fontSize: "0.65rem", padding: "0.15rem 0.5rem", borderRadius: "100px", background: "rgba(16,185,129,0.15)", color: "#10B981", fontWeight: 700 }}>LIVE</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
              {allIncidents.map((incident, i) => (
                <div key={incident.id} style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", marginBottom: "0.375rem", background: "var(--bg-tertiary)", borderLeft: `3px solid ${severityColors[incident.severity] ?? "#888"}`, transition: "all 300ms ease", opacity: i < newIncidents.length ? 1 : 0.85 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>{incident.type}</p>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", flexShrink: 0 }}>{incident.time}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginTop: "0.375rem" }}>
                    <MapPin size={11} color="var(--text-muted)" />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{incident.location}</span>
                    <span style={{ marginLeft: "auto", fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", padding: "0.1rem 0.4rem", borderRadius: "100px", background: `${severityColors[incident.severity]}20`, color: severityColors[incident.severity] }}>{incident.severity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bottom strip */}
        <div style={{ padding: "0.875rem 1.5rem", borderTop: "1px solid var(--bg-border)", background: "var(--bg-secondary)", display: "flex", gap: "1.5rem", flexShrink: 0 }}>
          {[
            { label: "Total Incidents Today", value: "247", icon: <AlertTriangle size={14} color="#E63A1E" />, color: "#E63A1E" },
            { label: "Critical Zones", value: "8", icon: <MapPin size={14} color="#F59E0B" />, color: "#F59E0B" },
            { label: "Active Patrols", value: "34", icon: <Activity size={14} color="#10B981" />, color: "#10B981" },
            { label: "Avg Response Time", value: "4.2 min", icon: <Clock size={14} color="#22D3EE" />, color: "#22D3EE" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "0.625rem", flex: 1 }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</div>
              <div>
                <p style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>{s.value}</p>
                <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <style jsx global>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
