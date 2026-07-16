"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield, Eye, Network, Map, MessageCircle, LayoutDashboard,
  Settings, Sun, Moon, Send, Phone, Hash, LogOut
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

type ChatMsg = { id: string; role: "user" | "bot"; text: string; time: string };

const initialMessages: ChatMsg[] = [
  { id: "m1", role: "bot", text: "Namaste! I'm KAVACH, your digital safety assistant. How can I protect you today?", time: "10:00" },
  { id: "m2", role: "user", text: "I got a call saying I'm involved in money laundering", time: "10:01" },
  { id: "m3", role: "bot", text: "⚠️ This sounds like a Digital Arrest Scam!\n\nReal government agencies NEVER call to demand money. Here's what to do:\n\n1. Hang up immediately\n2. Don't share OTP or bank details\n3. Report at cybercrime.gov.in\n4. Call helpline: 1930", time: "10:01" },
  { id: "m4", role: "user", text: "What should I do now?", time: "10:02" },
];

const botResponses: Record<string, string> = {
  "report scam": "To report a scam:\n• Call cybercrime helpline: 1930\n• File FIR at cybercrime.gov.in\n• Share call recording if available\n• Note the phone number and report it",
  "check number": "Please share the phone number and I'll check it against our fraud database. Format: +91-XXXXXXXXXX",
  "emergency": "🚨 Emergency Contacts:\n• Cybercrime Helpline: 1930\n• Police: 100\n• Women Helpline: 1091\n• RAKSHA Hotline: 1800-XXX-XXXX",
  "safety tips": "Top Safety Tips:\n✅ Never share OTP with anyone\n✅ Real agencies don't arrest over video call\n✅ Verify caller identity through official channels\n✅ Don't transfer money under pressure\n✅ Block suspicious numbers immediately",
};

const quickActions = ["Report Scam", "Check Number", "Emergency Contacts", "Safety Tips"];

type Tab = "webchat" | "whatsapp" | "ivr";

export default function KavachPage() {
  const { user, loading, registerCitizen } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("webchat");
  const [messages, setMessages] = useState<ChatMsg[]>(initialMessages);
  const [waMessages, setWaMessages] = useState<ChatMsg[]>(initialMessages);
  const [input, setInput] = useState("");
  const [waInput, setWaInput] = useState("");
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const waEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.href = "/login";
      } else if (!user.isCitizen) {
        registerCitizen();
      }
    }
  }, [user, loading, registerCitizen]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);
  useEffect(() => { waEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [waMessages]);

  if (loading || !user || !user.isCitizen) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)", color: "var(--text-secondary)" }}>
        <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>Verifying Citizen access...</div>
      </div>
    );
  }

  const getBotReply = (msg: string): string => {
    const lower = msg.toLowerCase();
    for (const [key, val] of Object.entries(botResponses)) {
      if (lower.includes(key)) return val;
    }
    return "I understand your concern. Please remember: Government agencies never demand money over phone calls. Stay safe and report suspicious activities to cybercrime.gov.in or call 1930.";
  };

  const sendMessage = async (text: string, isWa = false) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", text, time: now };

    if (isWa) {
      setWaMessages(prev => [...prev, userMsg]);
      setWaInput("");
    } else {
      setMessages(prev => [...prev, userMsg]);
      setInput("");
    }

    setTyping(true);
    await new Promise(r => setTimeout(r, 1500));
    const botMsg: ChatMsg = { id: Date.now().toString() + "b", role: "bot", text: getBotReply(text), time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) };

    if (isWa) setWaMessages(prev => [...prev, botMsg]);
    else setMessages(prev => [...prev, botMsg]);
    setTyping(false);
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "var(--bg-primary)" }}>
      <Sidebar />
      <main style={{ marginLeft: "240px", flex: 1, padding: "2rem", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(34,211,238,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageCircle size={20} color="#22D3EE" />
            </div>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.5rem", color: "var(--text-primary)" }}>KAVACH — Citizen Shield</h1>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Protection at Your Fingertips</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            {[{ label: "Citizens Helped", value: "12,847", color: "#22D3EE" }, { label: "Scams Blocked", value: "3,241", color: "#10B981" }, { label: "Response Time", value: "< 2s" }].map(s => (
              <div key={s.label} style={{ padding: "0.75rem 1.25rem", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-lg)" }}>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
                <p style={{ fontSize: "1.25rem", fontWeight: 800, color: s.color ?? "var(--text-primary)", fontFamily: "var(--font-display)" }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0", marginBottom: "1.5rem", borderBottom: "1px solid var(--bg-border)" }}>
          {(["webchat", "whatsapp", "ivr"] as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "0.75rem 1.5rem", background: "none", border: "none", borderBottom: `2px solid ${activeTab === tab ? "#22D3EE" : "transparent"}`, color: activeTab === tab ? "#22D3EE" : "var(--text-muted)", fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", transition: "all 150ms ease", marginBottom: "-1px" }}>
              {tab === "webchat" ? "Web Chat" : tab === "whatsapp" ? "WhatsApp Sim" : "IVR Sim"}
            </button>
          ))}
        </div>

        {/* Web Chat */}
        {activeTab === "webchat" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-lg)", overflow: "hidden", maxHeight: "620px" }}>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display: "flex", gap: "0.625rem", flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-end" }}>
                  {msg.role === "bot" && (
                    <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(34,211,238,0.2)", border: "1px solid rgba(34,211,238,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Shield size={14} color="#22D3EE" />
                    </div>
                  )}
                  <div style={{ maxWidth: "70%", padding: "0.75rem 1rem", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: msg.role === "user" ? "var(--accent)" : "var(--bg-tertiary)", color: msg.role === "user" ? "white" : "var(--text-primary)", fontSize: "0.875rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                    {msg.text}
                    <p style={{ fontSize: "0.65rem", opacity: 0.6, marginTop: "0.25rem", textAlign: msg.role === "user" ? "right" : "left" }}>{msg.time}</p>
                  </div>
                </div>
              ))}
              {typing && (
                <div style={{ display: "flex", gap: "0.625rem", alignItems: "flex-end" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(34,211,238,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Shield size={14} color="#22D3EE" />
                  </div>
                  <div style={{ padding: "0.75rem 1rem", borderRadius: "16px 16px 16px 4px", background: "var(--bg-tertiary)", display: "flex", gap: "4px", alignItems: "center" }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22D3EE", display: "inline-block", animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick actions */}
            <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid var(--bg-border)", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {quickActions.map(a => (
                <button key={a} onClick={() => sendMessage(a)} style={{ padding: "0.3rem 0.875rem", borderRadius: "100px", border: "1px solid rgba(34,211,238,0.3)", background: "rgba(34,211,238,0.08)", color: "#22D3EE", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", transition: "all 150ms ease" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(34,211,238,0.18)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(34,211,238,0.08)"; }}>
                  {a}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding: "0.875rem 1.25rem", borderTop: "1px solid var(--bg-border)", display: "flex", gap: "0.75rem" }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }} placeholder="Type your message..." style={{ flex: 1, padding: "0.625rem 1rem", background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "0.875rem", fontFamily: "var(--font-body)", outline: "none" }} />
              <button onClick={() => sendMessage(input)} disabled={!input.trim()} style={{ width: "40px", height: "40px", borderRadius: "var(--radius-md)", background: input.trim() ? "var(--accent)" : "var(--bg-tertiary)", border: "none", color: "white", cursor: input.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 150ms ease", flexShrink: 0 }}>
                <Send size={16} />
              </button>
            </div>
          </div>
        )}

        {/* WhatsApp Sim */}
        {activeTab === "whatsapp" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--bg-border)", maxHeight: "620px", maxWidth: "480px" }}>
            {/* WA Header */}
            <div style={{ padding: "0.75rem 1rem", background: "#075E54", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#128C7E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={18} color="white" />
              </div>
              <div>
                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "white" }}>KAVACH Bot</p>
                <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.7)" }}>Online · Verified Safety Assistant</p>
              </div>
            </div>
            {/* WA Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem", background: "#ECE5DD", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {waMessages.map(msg => (
                <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "75%", padding: "0.625rem 0.875rem", borderRadius: msg.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px", background: msg.role === "user" ? "#DCF8C6" : "white", color: "#111", fontSize: "0.875rem", lineHeight: 1.5, boxShadow: "0 1px 2px rgba(0,0,0,0.15)", whiteSpace: "pre-line" }}>
                    {msg.text}
                    <p style={{ fontSize: "0.65rem", color: "#888", textAlign: "right", marginTop: "0.25rem" }}>{msg.time} {msg.role === "user" ? "✓✓" : ""}</p>
                  </div>
                </div>
              ))}
              <div ref={waEndRef} />
            </div>
            {/* WA Input */}
            <div style={{ padding: "0.625rem", background: "#F0F0F0", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input value={waInput} onChange={e => setWaInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { sendMessage(waInput, true); } }} placeholder="Type a message" style={{ flex: 1, padding: "0.625rem 1rem", borderRadius: "24px", border: "none", background: "white", fontSize: "0.875rem", outline: "none", color: "#111" }} />
              <button onClick={() => sendMessage(waInput, true)} style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#128C7E", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Send size={16} />
              </button>
            </div>
          </div>
        )}

        {/* IVR Sim */}
        {activeTab === "ivr" && (
          <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-xl)", padding: "2rem", width: "280px", flexShrink: 0 }}>
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(34,211,238,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
                  <Phone size={28} color="#22D3EE" />
                </div>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>KAVACH Helpline</p>
                <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "#22D3EE", fontFamily: "var(--font-mono)" }}>1800-000-KAVACH</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                {["1","2","3","4","5","6","7","8","9","*","0","#"].map(k => (
                  <button key={k} style={{ padding: "0.875rem", borderRadius: "var(--radius-md)", background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", color: "var(--text-primary)", fontSize: "1rem", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-mono)", transition: "all 150ms ease" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(34,211,238,0.15)"; e.currentTarget.style.color = "#22D3EE"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-tertiary)"; e.currentTarget.style.color = "var(--text-primary)"; }}>
                    {k === "*" ? <Hash size={16} /> : k === "#" ? "✱" : k}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>IVR Menu Options</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  { key: "1", label: "Report a Scam", desc: "File an immediate report for fraud or scam calls", color: "#E63A1E" },
                  { key: "2", label: "Check Phone Number", desc: "Verify if a number has been reported for fraud", color: "#F59E0B" },
                  { key: "3", label: "Emergency Assistance", desc: "Connect to cybercrime helpline immediately", color: "#10B981" },
                  { key: "4", label: "Safety Tips & Guidance", desc: "Learn how to protect yourself from digital fraud", color: "#22D3EE" },
                  { key: "5", label: "Speak to an Officer", desc: "Get connected to a live law enforcement officer", color: "#818CF8" },
                ].map(item => (
                  <div key={item.key} style={{ display: "flex", gap: "1rem", padding: "1rem", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", alignItems: "center", cursor: "pointer", transition: "all 150ms ease" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.background = `${item.color}08`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bg-border)"; e.currentTarget.style.background = "var(--bg-secondary)"; }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: `${item.color}20`, border: `1px solid ${item.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.125rem", color: item.color }}>
                      {item.key}
                    </div>
                    <div>
                      <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>Press {item.key} — {item.label}</p>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      <style jsx global>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
