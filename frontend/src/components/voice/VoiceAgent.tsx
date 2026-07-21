"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Volume2, X } from "lucide-react";
import { usePathname } from "next/navigation";

type Recognition = { continuous: boolean; interimResults: boolean; lang: string; start: () => void; stop: () => void; onresult: ((event: any) => void) | null; onend: (() => void) | null; onerror: ((event: any) => void) | null };
type FieldInfo = { id: string; label: string; placeholder: string; type: string; value: string; options: string[] };
type VoicePlan = { reply: string; navigate_to: string | null; fields: { field: string; value: string }[]; action: string | null; requires_confirmation: boolean; source?: string };

const ROUTES = [
  ["admin drishti", "/admin/drishti"], ["drishti", "/admin/drishti"], ["admin sentinel", "/admin/sentinel"], ["admin netra", "/admin/netra"], ["admin jaal", "/admin/jaal"], ["admin dashboard", "/admin"],
  ["report fraud", "/report-fraud"], ["file a report", "/report-fraud"], ["phone safety", "/phone-safety"], ["phone lookup", "/phone-safety"], ["check number", "/phone-safety"], ["whatsapp scan", "/kavach/whatsapp-scan"], ["kavach", "/kavach"], ["netra", "/netra"], ["sentinel", "/sentinel"], ["jaal", "/jaal"], ["dashboard", "/dashboard"],
] as const;

function readableLabel(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
  const label = element.id ? document.querySelector(`label[for="${CSS.escape(element.id)}"]`)?.textContent : "";
  const parentText = element.parentElement?.innerText?.replace(/\s+/g, " ").slice(0, 160) ?? "";
  return (label || element.getAttribute("aria-label") || parentText || "").trim();
}

function getControls() {
  const elements = [...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input:not([type=file]):not([type=hidden]), textarea, select")].filter((element) => !element.disabled && !!(element.offsetWidth || element.offsetHeight));
  const fields: FieldInfo[] = elements.map((element, index) => ({
    id: `field_${index}`,
    label: readableLabel(element),
    placeholder: element.getAttribute("placeholder") || "",
    type: element.type || element.tagName.toLowerCase(),
    value: element.value || "",
    options: element instanceof HTMLSelectElement ? [...element.options].map((option) => option.text).filter(Boolean) : [],
  }));
  const actions = [...document.querySelectorAll<HTMLButtonElement>("button")].filter((button) => !button.disabled && !!(button.offsetWidth || button.offsetHeight)).map((button) => button.innerText.replace(/\s+/g, " ").trim()).filter((text) => text && text.length < 100);
  return { elements, fields, actions: [...new Set(actions)] };
}

function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function sensitive(action: string | null) {
  return !!action && /submit|send|disconnect|clear|delete|report|freeze/i.test(action);
}

function localPlan(transcript: string, path: string, controls: ReturnType<typeof getControls>): VoicePlan {
  const lower = transcript.toLowerCase();
  const route = ROUTES.find(([phrase]) => lower.includes(phrase))?.[1] ?? null;
  const fields: VoicePlan["fields"] = [];
  const setField = (aliases: string[], value: string | undefined) => {
    if (!value) return;
    const field = controls.fields.find((item) => aliases.some((alias) => `${item.label} ${item.placeholder}`.toLowerCase().includes(alias)));
    if (field) fields.push({ field: field.id, value: value.trim() });
  };
  const phone = transcript.match(/(?:phone|number|mobile|identifier)(?:\s+is|\s*:)?\s*([+\d][\d\s-]{7,})/i)?.[1];
  setField(["phone", "mobile", "number", "identifier"], phone);
  const extract = (pattern: RegExp) => transcript.match(pattern)?.[1]?.trim();
  setField(["district", "city"], extract(/(?:district|city)(?:\s+is|\s*:)?\s+(.+?)(?=\s+(?:and\s+)?(?:state|phone|number|name|description|details)\b|$)/i));
  setField(["state"], extract(/state(?:\s+is|\s*:)?\s+(.+?)(?=\s+(?:and\s+)?(?:district|phone|number|name|description|details)\b|$)/i));
  setField(["reporter", "your name", "name"], extract(/(?:my name is|reporter name is|name is)\s+(.+?)(?=\s+(?:and\s+)?(?:district|state|phone|number|description|details)\b|$)/i));
  const explicitDescription = extract(/(?:description|details|what happened)(?:\s+is|\s+are|\s*:)?\s+(.+)/i);
  if (explicitDescription) setField(["description", "what happened", "message", "paste"], explicitDescription);
  else if ((path === "/sentinel" || path === "/jaal" || path === "/report-fraud") && /scam|fraud|otp|upi|caller|bank|message/i.test(lower) && transcript.length > 18) {
    const field = controls.fields.find((item) => /description|what happened|message|paste/i.test(`${item.label} ${item.placeholder}`)) || controls.fields.find((item) => item.type === "textarea");
    if (field) fields.push({ field: field.id, value: transcript });
  }
  const action = controls.actions.find((item) => /submit|send|disconnect|clear|delete|report/i.test(item) && /submit|send|disconnect|clear|delete|report/i.test(lower)) || controls.actions.find((item) => /verify|check/i.test(item) && /verify|check/i.test(lower)) || controls.actions.find((item) => /analyse|analyze/i.test(item) && /analyse|analyze/i.test(lower)) || null;
  return { reply: fields.length ? "I filled the details I recognised." : "I can work with the controls currently visible on this page.", navigate_to: route, fields, action, requires_confirmation: sensitive(action), source: "local" };
}

export function VoiceAgent() {
  const pathname = usePathname();
  const recognition = useRef<Recognition | null>(null);
  const keepListening = useRef(false);
  const commandRef = useRef<(command: string) => void>(() => undefined);
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [message, setMessage] = useState("Ask me to navigate, fill a form, check a number, or run a visible tool.");
  const [confirmation, setConfirmation] = useState<{ action: string; fields: { field: string; value: string }[] } | null>(null);
  const speechApi = useMemo(() => typeof window === "undefined" ? null : ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition), []);

  const announce = (text: string) => {
    setMessage(text);
    if ("speechSynthesis" in window) { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.rate = 1.05; window.speechSynthesis.speak(utterance); }
  };

  const applyPlan = (plan: VoicePlan, controls = getControls()) => {
    for (const update of plan.fields) {
      const index = controls.fields.findIndex((field) => field.id === update.field);
      if (index >= 0) setNativeValue(controls.elements[index], update.value);
    }
    if (!plan.action) {
      if (plan.fields.length) announce(plan.reply || "I filled the recognised fields.");
      return;
    }
    if (plan.requires_confirmation || sensitive(plan.action)) {
      setConfirmation({ action: plan.action, fields: plan.fields });
      announce(`${plan.reply} Say “confirm” to ${plan.action.toLowerCase()}.`);
      return;
    }
    const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.innerText.replace(/\s+/g, " ").trim().toLowerCase() === plan.action?.toLowerCase());
    if (button) { button.click(); announce(plan.reply || `${plan.action} started.`); }
    else announce(plan.reply);
  };

  const interpret = async (command: string, afterNavigation = false) => {
    const controls = getControls();
    const plan = localPlan(command, pathname, controls);

    if (plan.navigate_to && plan.navigate_to !== pathname) {
      sessionStorage.setItem("raksha_voice_followup", JSON.stringify({ transcript: command, target: plan.navigate_to }));
      // A hard navigation is deliberate here. It is more reliable than a
      // client-side transition when a voice event fires while another React
      // update is in flight, and the follow-up command survives in sessionStorage.
      announce(`Redirecting to ${plan.navigate_to.replace("/", "").replace(/-/g, " ") || "the home page"}.`);
      window.location.assign(plan.navigate_to);
      return;
    }
    applyPlan(plan, controls);
    if (!plan.action && !plan.fields.length && !afterNavigation) announce(plan.reply || "I could not find a matching control. Say help for examples.");
  };

  const processCommand = (raw: string) => {
    const command = raw.trim();
    if (!command) return;
    setTranscript(command);
    if (/^(help|what can you do|commands)/i.test(command)) { announce("I can open any RAKSHA module, fill visible form fields, check a phone number, search JAAL, analyse SENTINEL text, and operate page buttons. I will always ask before submitting, sending, disconnecting, or deleting."); return; }
    if (/^(cancel|stop|never ?mind)$/i.test(command)) { setConfirmation(null); announce("Cancelled."); return; }
    if (/^(confirm|confirm action|yes confirm)$/i.test(command)) {
      if (!confirmation) { announce("There is no pending sensitive action to confirm."); return; }
      const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.innerText.replace(/\s+/g, " ").trim().toLowerCase() === confirmation.action.toLowerCase()) || [...document.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.type === "submit");
      setConfirmation(null);
      if (button) { button.click(); announce(`${confirmation.action} started.`); } else announce("That action is no longer available on this page.");
      return;
    }
    void interpret(command);
  };
  commandRef.current = processCommand;

  // The full Chrome companion forwards its recognised utterance here, so it
  // receives the same Groq-powered, page-aware behaviour as the in-site mic.
  useEffect(() => {
    document.documentElement.dataset.rakshaVoiceAgent = "ready";
    const handleExternalCommand = (event: Event) => {
      const command = (event as CustomEvent<{ command?: string }>).detail?.command;
      if (command) processCommand(command);
    };
    window.addEventListener("raksha:voice-command", handleExternalCommand);
    return () => {
      delete document.documentElement.dataset.rakshaVoiceAgent;
      window.removeEventListener("raksha:voice-command", handleExternalCommand);
    };
  });

  useEffect(() => {
    const saved = sessionStorage.getItem("raksha_voice_followup");
    if (!saved) return;
    try {
      const followup = JSON.parse(saved);
      if (followup.target !== pathname) return;
      sessionStorage.removeItem("raksha_voice_followup");
      let attempts = 0;
      const retry = () => { if (getControls().fields.length || attempts++ >= 8) void interpret(followup.transcript, true); else window.setTimeout(retry, 250); };
      window.setTimeout(retry, 250);
    } catch { sessionStorage.removeItem("raksha_voice_followup"); }
  }, [pathname]);

  const startListening = () => {
    if (!speechApi) { setSupported(false); return; }
    if (!recognition.current) {
      const instance: Recognition = new speechApi();
      instance.continuous = true; instance.interimResults = false; instance.lang = "en-IN";
      instance.onresult = (event) => { const result = event.results[event.results.length - 1]; if (result?.isFinal) commandRef.current(result[0].transcript); };
      instance.onend = () => { if (keepListening.current) { try { instance.start(); } catch { /* Browser restart. */ } } else setListening(false); };
      instance.onerror = (event) => { if (/not-allowed/.test(event.error)) { keepListening.current = false; setListening(false); announce("Please allow microphone access to use voice commands."); } };
      recognition.current = instance;
    }
    keepListening.current = true; setListening(true); try { recognition.current.start(); } catch { /* Already started. */ }
  };
  const stopListening = () => { keepListening.current = false; recognition.current?.stop(); setListening(false); };
  useEffect(() => () => { keepListening.current = false; recognition.current?.stop(); }, []);

  return <div style={{ position: "fixed", right: "1.25rem", bottom: "1.25rem", zIndex: 200 }}>
    {open && <div role="dialog" aria-label="RAKSHA voice assistant" style={{ width: "min(380px, calc(100vw - 2.5rem))", marginBottom: "0.75rem", padding: "1rem", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", borderRadius: 16, boxShadow: "0 16px 44px rgba(0,0,0,.25)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}><div><strong style={{ fontFamily: "var(--font-display)" }}>RAKSHA Voice Agent</strong><div style={{ color: listening ? "#10B981" : "var(--text-muted)", fontSize: "0.72rem", marginTop: 2 }}>{listening ? "Listening across the active feature" : "Ready to operate this page"}</div></div><button onClick={() => setOpen(false)} aria-label="Close voice agent" style={iconButton}><X size={17} /></button></div>
      <p aria-live="polite" style={{ color: "var(--text-secondary)", fontSize: "0.83rem", lineHeight: 1.45, margin: "0.9rem 0" }}>{message}</p>
      {transcript && <div style={{ fontSize: "0.76rem", background: "var(--bg-tertiary)", borderRadius: 8, padding: "0.6rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>Heard: “{transcript}”</div>}
      {confirmation && <div style={{ fontSize: "0.76rem", color: "#F59E0B", marginBottom: "0.75rem" }}>Pending confirmation: {confirmation.action}</div>}
      {!supported ? <div style={{ color: "var(--accent)", fontSize: "0.8rem" }}>Use Chrome or Edge for browser voice recognition.</div> : <button onClick={listening ? stopListening : startListening} style={{ width: "100%", border: "none", borderRadius: 9, padding: "0.75rem", cursor: "pointer", color: "white", background: listening ? "#475569" : "var(--accent)", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", fontWeight: 700 }}>{listening ? <MicOff size={16} /> : <Mic size={16} />}{listening ? "Stop listening" : "Start voice command"}</button>}
      <div style={{ marginTop: "0.7rem", color: "var(--text-muted)", fontSize: "0.7rem" }}>Examples: “check number 9876543210”, “set the JAAL identifier to…”, or “analyse this message…”</div>
    </div>}
    <button onClick={() => setOpen((value) => !value)} aria-label="Open RAKSHA voice agent" style={{ width: 54, height: 54, borderRadius: "50%", border: "1px solid rgba(255,255,255,.25)", background: listening ? "#10B981" : "var(--accent)", color: "white", display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 8px 24px rgba(230,58,30,.35)" }}><Volume2 size={23} /></button>
  </div>;
}

const iconButton: React.CSSProperties = { border: "none", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", display: "grid", placeItems: "center", padding: 4 };
