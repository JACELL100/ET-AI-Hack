"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield, Eye, Network, Map, MessageCircle, LayoutDashboard,
  Settings, Sun, Moon, ZoomIn, ZoomOut, RefreshCw, Download,
  AlertTriangle, Users, Phone, CreditCard, LogOut
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAuth } from "@/components/providers/AuthContext";

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
  const { user, logout } = useAuth();
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
      <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--bg-border)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {user && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0 0.5rem" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Account</span>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={user.name}>{user.name}</span>
          </div>
        )}
        <button onClick={toggleTheme} style={{ display: "flex", alignItems: "center", gap: "0.625rem", width: "100%", padding: "0.625rem 0.875rem", background: "none", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.8125rem", fontFamily: "var(--font-body)" }}>
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        {user && (
          <button
            onClick={logout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              width: "100%",
              padding: "0.625rem 0.875rem",
              background: "rgba(230,58,30,0.1)",
              border: "1px solid rgba(230,58,30,0.2)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              color: "var(--accent)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              fontFamily: "var(--font-body)",
            }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}

// Graph data
const nodes = [
  { id: "n1", label: "Rakesh Kumar", type: "person", x: 300, y: 180, risk: 92 },
  { id: "n2", label: "+91-9876543210", type: "phone", x: 180, y: 100, risk: 78 },
  { id: "n3", label: "ACC-4521", type: "account", x: 420, y: 100, risk: 85 },
  { id: "n4", label: "Priya Sharma", type: "person", x: 160, y: 260, risk: 61 },
  { id: "n5", label: "+91-8765432109", type: "phone", x: 80, y: 180, risk: 55 },
  { id: "n6", label: "ACC-7823", type: "account", x: 500, y: 220, risk: 88 },
  { id: "n7", label: "Mule-001", type: "mule", x: 390, y: 300, risk: 96 },
  { id: "n8", label: "Suresh Rao", type: "person", x: 240, y: 340, risk: 44 },
  { id: "n9", label: "ACC-9045", type: "account", x: 560, y: 140, risk: 72 },
  { id: "n10", label: "+91-7654321098", type: "phone", x: 470, y: 360, risk: 67 },
  { id: "n11", label: "Deepak Verma", type: "person", x: 100, y: 320, risk: 38 },
  { id: "n12", label: "Mule-002", type: "mule", x: 310, y: 60, risk: 91 },
];

const edges = [
  { s: "n1", t: "n2" }, { s: "n1", t: "n3" }, { s: "n1", t: "n7" },
  { s: "n2", t: "n4" }, { s: "n2", t: "n5" }, { s: "n3", t: "n6" },
  { s: "n3", t: "n9" }, { s: "n4", t: "n8" }, { s: "n6", t: "n7" },
  { s: "n7", t: "n10" }, { s: "n8", t: "n11" }, { s: "n1", t: "n12" },
  { s: "n9", t: "n12" }, { s: "n5", t: "n11" }, { s: "n10", t: "n6" },
];

const nodeColors: Record<string, string> = {
  person: "#E63A1E",
  phone: "#22D3EE",
  account: "#10B981",
  mule: "#F59E0B",
};

const communities = [
  { id: "c1", name: "Mumbai Investment Scam Ring", nodes: 47, risk: 94 },
  { id: "c2", name: "Delhi Digital Arrest Network", nodes: 31, risk: 88 },
  { id: "c3", name: "Bangalore UPI Fraud Cluster", nodes: 22, risk: 76 },
];

const typeFilters = ["All", "Person", "Phone", "Account", "Mule"];

export default function JaalPage() {
  const { user, loading } = useAuth();

  const [selectedNode, setSelectedNode] = useState(nodes[0]);
  const [zoom, setZoom] = useState(1);
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedCommunity, setSelectedCommunity] = useState("c1");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.href = "/admin";
      } else if (!user.isAdmin) {
        window.location.href = "/admin";
      }
    }
  }, [user, loading]);

  if (loading || !user || !user.isAdmin) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)", color: "var(--text-secondary)" }}>
        <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>Verifying Admin credentials...</div>
      </div>
    );
  }

  const filteredNodes = nodes.filter(n =>
    typeFilter === "All" || n.type === typeFilter.toLowerCase()
  );

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 2000));
    setGenerating(false);
    alert("Evidence package generated! (mock)");
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "var(--bg-primary)" }}>
      <Sidebar />
      <main style={{ marginLeft: "240px", flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "1.5rem 2rem 1rem", borderBottom: "1px solid var(--bg-border)", backgroundColor: "var(--bg-secondary)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(129,140,248,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Network size={20} color="#818CF8" />
              </div>
              <div>
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.375rem", color: "var(--text-primary)" }}>JAAL — Fraud Network Intelligence</h1>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Graph-based fraud detection and community analysis</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              {[{ label: "Communities", value: "12", color: "#818CF8" }, { label: "Nodes", value: "847" }, { label: "Risk Score", value: "87", color: "#E63A1E" }].map(s => (
                <div key={s.label} style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "1.25rem", fontWeight: 800, color: s.color ?? "var(--text-primary)", fontFamily: "var(--font-display)" }}>{s.value}</p>
                  <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            {typeFilters.map(f => (
              <button key={f} onClick={() => setTypeFilter(f)} style={{ padding: "0.3rem 0.875rem", borderRadius: "var(--radius-md)", border: `1px solid ${typeFilter === f ? "#818CF8" : "var(--bg-border)"}`, background: typeFilter === f ? "rgba(129,140,248,0.15)" : "var(--bg-tertiary)", color: typeFilter === f ? "#818CF8" : "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", transition: "all 150ms ease" }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Main area */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Graph canvas */}
          <div style={{ flex: 1, position: "relative", background: "#0A0A0F", overflow: "hidden" }}>
            {/* Zoom controls */}
            <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 10, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[{ icon: <ZoomIn size={16} />, action: () => setZoom(z => Math.min(z + 0.2, 2)) }, { icon: <ZoomOut size={16} />, action: () => setZoom(z => Math.max(z - 0.2, 0.5)) }, { icon: <RefreshCw size={16} />, action: () => setZoom(1) }].map((btn, i) => (
                <button key={i} onClick={btn.action} style={{ width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", cursor: "pointer", color: "var(--text-secondary)" }}>
                  {btn.icon}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div style={{ position: "absolute", bottom: "1rem", left: "1rem", zIndex: 10, background: "rgba(22,22,22,0.9)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", display: "flex", gap: "1rem" }}>
              {Object.entries(nodeColors).map(([type, color]) => (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
                  <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>{type}</span>
                </div>
              ))}
            </div>

            {/* SVG Graph */}
            <svg width="100%" height="100%" viewBox="0 0 680 440" style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 200ms ease" }}>
              {/* Edges */}
              {edges.map((e, i) => {
                const s = nodes.find(n => n.id === e.s)!;
                const t = nodes.find(n => n.id === e.t)!;
                return (
                  <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                    stroke="#2A2A2A" strokeWidth="1.5"
                    strokeDasharray={i % 3 === 0 ? "4 4" : "none"}
                    opacity="0.7" />
                );
              })}
              {/* Nodes */}
              {filteredNodes.map(node => {
                const isSelected = selectedNode.id === node.id;
                const color = nodeColors[node.type];
                return (
                  <g key={node.id} onClick={() => setSelectedNode(node)} style={{ cursor: "pointer" }}>
                    {isSelected && <circle cx={node.x} cy={node.y} r={22} fill={color} opacity="0.2" />}
                    <circle cx={node.x} cy={node.y} r={isSelected ? 14 : 11} fill={color} opacity={isSelected ? 1 : 0.85}
                      style={{ filter: isSelected ? `drop-shadow(0 0 8px ${color})` : "none" }} />
                    <circle cx={node.x} cy={node.y} r={isSelected ? 14 : 11} fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" />
                    <text x={node.x} y={node.y + 26} textAnchor="middle" fill="#888888" fontSize="9" fontFamily="var(--font-body)">{node.label}</text>
                    {node.risk >= 80 && <text x={node.x + 10} y={node.y - 10} fill="#E63A1E" fontSize="10" fontWeight="bold">!</text>}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Node detail panel */}
          <div style={{ width: "280px", flexShrink: 0, background: "var(--bg-secondary)", borderLeft: "1px solid var(--bg-border)", padding: "1.25rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h3 style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>Node Detail</h3>

            {selectedNode && (
              <>
                <div style={{ padding: "1rem", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", border: `1px solid ${nodeColors[selectedNode.type]}30` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: nodeColors[selectedNode.type], display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {selectedNode.type === "person" ? <Users size={15} color="white" /> : selectedNode.type === "phone" ? <Phone size={15} color="white" /> : <CreditCard size={15} color="white" />}
                    </div>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>{selectedNode.label}</p>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0.15rem 0.5rem", borderRadius: "100px", background: `${nodeColors[selectedNode.type]}20`, color: nodeColors[selectedNode.type] }}>{selectedNode.type}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Risk Score</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 800, color: selectedNode.risk >= 70 ? "#E63A1E" : selectedNode.risk >= 40 ? "#F59E0B" : "#10B981" }}>{selectedNode.risk}</span>
                    </div>
                    <div style={{ height: "6px", background: "var(--bg-border)", borderRadius: "100px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${selectedNode.risk}%`, background: selectedNode.risk >= 70 ? "#E63A1E" : selectedNode.risk >= 40 ? "#F59E0B" : "#10B981", borderRadius: "100px", transition: "width 600ms ease" }} />
                    </div>
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Connections</p>
                  {edges.filter(e => e.s === selectedNode.id || e.t === selectedNode.id).slice(0, 4).map((e, i) => {
                    const other = nodes.find(n => n.id === (e.s === selectedNode.id ? e.t : e.s))!;
                    return (
                      <div key={i} onClick={() => setSelectedNode(other)} style={{ padding: "0.5rem 0.625rem", borderRadius: "var(--radius-sm)", marginBottom: "0.25rem", background: "var(--bg-tertiary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", transition: "background 150ms ease" }}
                        onMouseEnter={ev => (ev.currentTarget.style.background = "var(--bg-elevated)")}
                        onMouseLeave={ev => (ev.currentTarget.style.background = "var(--bg-tertiary)")}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: nodeColors[other.type], flexShrink: 0 }} />
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{other.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Evidence Refs</p>
                  {["FIR-2024-0892", "CDR-LOG-0445", "TXN-TRAIL-221"].map(r => (
                    <div key={r} style={{ padding: "0.375rem 0.625rem", borderRadius: "var(--radius-sm)", marginBottom: "0.25rem", background: "var(--bg-tertiary)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "#818CF8" }}>{r}</div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  {[{ label: "First Seen", value: "Mar 12, 2024" }, { label: "Last Active", value: "Jul 13, 2025" }].map(d => (
                    <div key={d.label} style={{ padding: "0.625rem", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)" }}>
                      <p style={{ fontSize: "0.625rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{d.label}</p>
                      <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginTop: "0.2rem" }}>{d.value}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ padding: "1rem 2rem", borderTop: "1px solid var(--bg-border)", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Community:</span>
            <select value={selectedCommunity} onChange={e => setSelectedCommunity(e.target.value)} style={{ padding: "0.5rem 0.875rem", background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "0.8125rem", cursor: "pointer" }}>
              {communities.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.nodes} nodes)</option>
              ))}
            </select>
            {communities.filter(c => c.id === selectedCommunity).map(c => (
              <span key={c.id} style={{ padding: "0.25rem 0.625rem", borderRadius: "100px", background: "rgba(230,58,30,0.15)", color: "#E63A1E", fontSize: "0.7rem", fontWeight: 700 }}>Risk: {c.risk}</span>
            ))}
          </div>
          <button onClick={handleGenerate} disabled={generating} style={{ padding: "0.625rem 1.5rem", background: generating ? "var(--bg-tertiary)" : "var(--accent)", color: "white", border: "none", borderRadius: "var(--radius-md)", fontSize: "0.8125rem", fontWeight: 700, cursor: generating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.5rem", letterSpacing: "0.05em" }}>
            {generating ? <><span style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid white", borderTopColor: "transparent", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> GENERATING...</> : <><Download size={15} /> GENERATE EVIDENCE PACKAGE</>}
          </button>
        </div>
      </main>
      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
