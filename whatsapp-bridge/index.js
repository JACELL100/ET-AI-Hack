/**
 * RAKSHA AI — WhatsApp Bridge (Baileys)
 *
 * Uses @whiskeysockets/baileys to connect directly to WhatsApp's WebSocket.
 * Exposes REST API + WebSocket for the FastAPI backend.
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidGroup,
  isJidUser,
  isJidBroadcast,
  isJidNewsletter,
} = require("@whiskeysockets/baileys");
const QRCode   = require("qrcode");
const express  = require("express");
const cors     = require("cors");
const { WebSocketServer } = require("ws");
const http     = require("http");
const path     = require("path");
const fs       = require("fs");
const pino     = require("pino");

try { require("dotenv").config({ path: path.join(__dirname, ".env") }); } catch {}

const PORT            = parseInt(process.env.PORT || "3001", 10);
const AUTH_DIR        = path.join(__dirname, ".baileys_auth");
const MAX_CHATS       = 40;   // cap returned to the backend
const MAX_MSGS_STORED = 40;   // cap per-chat in-memory
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://localhost:8000")
  .split(",").map((o) => o.trim());

const logger = pino({ level: "warn" });

// ── Express + WebSocket ────────────────────────────────────────────────────
const app    = express();
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());
const server = http.createServer(app);
const wss    = new WebSocketServer({ server, path: "/ws" });
const wsClients = new Set();

wss.on("connection", (ws) => {
  wsClients.add(ws);
  ws.send(JSON.stringify({
    event: "status",
    data: { connected: clientReady, qrReady: !!lastQrDataUrl, phone: connectedPhone },
  }));
  if (lastQrDataUrl && !clientReady) {
    ws.send(JSON.stringify({ event: "qr", data: { qr: lastQrDataUrl } }));
  }
  ws.on("close", () => wsClients.delete(ws));
});

function broadcast(event, data) {
  const payload = JSON.stringify({ event, data });
  for (const ws of wsClients) if (ws.readyState === 1) ws.send(payload);
}

// ── Global state ───────────────────────────────────────────────────────────
let clientReady    = false;
let connectedPhone = null;
let lastQrDataUrl  = null;
let sock           = null;
let chatStore      = {};   // jid → chat metadata
let messageStore   = {};   // jid → Message[]
let syncRetryTimer = null;

// ── JID helpers ────────────────────────────────────────────────────────────
function isRealChat(jid) {
  if (!jid) return false;
  if (isJidBroadcast(jid))   return false;
  if (isJidNewsletter(jid))  return false;
  if (jid === "status@broadcast") return false;
  if (jid.endsWith("@lid"))  return false;
  return isJidUser(jid) || isJidGroup(jid);
}

// ── Extract text from any message type ────────────────────────────────────
function extractBody(msg) {
  if (!msg) return "";
  return (
    msg.conversation                                          ||
    msg.extendedTextMessage?.text                            ||
    msg.imageMessage?.caption                                ||
    msg.videoMessage?.caption                                ||
    msg.documentMessage?.caption                             ||
    msg.buttonsMessage?.contentText                          ||
    msg.buttonsResponseMessage?.selectedDisplayText          ||
    msg.listMessage?.description                             ||
    msg.listResponseMessage?.title                           ||
    msg.templateMessage?.hydratedTemplate?.hydratedContentText ||
    msg.ephemeralMessage?.message?.conversation              ||
    ""
  );
}

// ── Upsert helpers ─────────────────────────────────────────────────────────
function upsertChat(chat) {
  if (!chat?.id || !isRealChat(chat.id)) return;
  chatStore[chat.id] = { ...(chatStore[chat.id] || {}), ...chat };
}

function upsertMessage(raw) {
  if (!raw?.message) return;
  const body   = extractBody(raw.message);
  if (!body)   return;
  const chatId = raw.key.remoteJid || "";
  if (!isRealChat(chatId)) return;

  if (!messageStore[chatId]) messageStore[chatId] = [];
  const arr = messageStore[chatId];

  if (arr.some((m) => m.id === raw.key.id)) return; // dedup

  arr.push({
    id:        raw.key.id,
    from:      chatId,
    author:    raw.key.participant || (raw.key.fromMe ? "me" : chatId),
    body,
    timestamp: typeof raw.messageTimestamp === "number"
      ? raw.messageTimestamp
      : parseInt(raw.messageTimestamp?.toString() || "0"),
    fromMe:    raw.key.fromMe || false,
    type:      "chat",
  });

  // Keep only the MAX_MSGS_STORED most recent
  if (arr.length > MAX_MSGS_STORED * 2) {
    arr.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    arr.splice(MAX_MSGS_STORED);
  }
}

function getMessages(chatId, limit = MAX_MSGS_STORED) {
  const arr = messageStore[chatId] || [];
  return [...arr]
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, Math.min(limit, MAX_MSGS_STORED));
}

function logStats(label = "") {
  const all      = Object.values(chatStore);
  const personal = all.filter((c) => isJidUser(c.id)).length;
  const groups   = all.filter((c) => isJidGroup(c.id)).length;
  const msgs     = Object.values(messageStore).reduce((s, a) => s + a.length, 0);
  console.log(`[WA]${label ? " " + label + " |" : ""} Store: ${all.length} chats (${personal} personal, ${groups} groups), ${msgs} messages`);
}

// ── Attempt AppState resync to recover chats without full re-auth ──────────
async function trySyncChats(attempt = 1) {
  if (!clientReady || !sock) return;
  const chatCount = Object.keys(chatStore).filter(
    (id) => isJidUser(chatStore[id]?.id)
  ).length;

  if (chatCount > 0) {
    console.log(`[WA] Already have ${chatCount} personal chats — skip resync`);
    return;
  }

  console.log(`[WA] Personal chats missing, requesting AppState resync (attempt ${attempt}/3)...`);
  try {
    await sock.resyncAppState(
      ["critical_block", "critical_unblock_low", "regular_high", "regular_low"],
      false
    );
    console.log("[WA] AppState resync requested — waiting for chats.set event...");
  } catch (err) {
    console.error("[WA] resyncAppState error:", err.message);
  }

  if (attempt < 3) {
    syncRetryTimer = setTimeout(() => trySyncChats(attempt + 1), 15000);
  }
}

// ── Fetch all participating groups and merge ───────────────────────────────
async function fetchGroups() {
  if (!sock || !clientReady) return 0;
  try {
    const groups = await sock.groupFetchAllParticipating();
    let added = 0;
    for (const [id, meta] of Object.entries(groups)) {
      if (!chatStore[id]) {
        chatStore[id] = {
          id,
          name: meta.subject || id.split("@")[0],
          conversationTimestamp: meta.creation || 0,
          unreadCount: 0,
        };
        added++;
      }
    }
    if (added) console.log(`[WA] groupFetchAllParticipating: ${added} new groups added`);
    return added;
  } catch (err) {
    console.error("[WA] groupFetchAllParticipating error:", err.message);
    return 0;
  }
}

// ── Clear session files ────────────────────────────────────────────────────
function clearAuthFiles() {
  try {
    if (!fs.existsSync(AUTH_DIR)) return;
    const files = fs.readdirSync(AUTH_DIR);
    for (const f of files) fs.unlinkSync(path.join(AUTH_DIR, f));
    console.log(`[WA] Cleared ${files.length} auth file(s) — fresh session required`);
  } catch (err) {
    console.error("[WA] Failed to clear auth files:", err.message);
  }
}

// ── Baileys connection ─────────────────────────────────────────────────────
async function startWhatsApp() {
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version }          = await fetchLatestBaileysVersion();
  console.log(`[WA] Baileys version: ${version.join(".")}`);

  sock = makeWASocket({
    version,
    auth: state,
    logger,
    browser: ["RAKSHA AI", "Chrome", "1.0.0"],
    // false = skip full history, still gets recent chats on a clean session
    syncFullHistory: false,
    // Suppress SessionError / MessageCounterError for stale messages
    getMessage: async (key) => {
      const msgs = messageStore[key.remoteJid || ""] || [];
      const found = msgs.find((m) => m.id === key.id);
      return found ? { conversation: found.body } : undefined;
    },
  });

  // ── Connection lifecycle ────────────────────────────────────────────────
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        lastQrDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
        broadcast("qr", { qr: lastQrDataUrl });
        console.log("[WA] QR ready — scan with your phone");
      } catch {}
    }

    if (connection === "open") {
      clientReady = true;
      lastQrDataUrl = null;
      try {
        const me   = sock.user;
        connectedPhone = me?.id?.split(":")[0] || me?.id?.split("@")[0] || null;
        console.log(`[WA] ✅ Connected! Phone: +${connectedPhone}`);
      } catch { connectedPhone = "unknown"; }

      broadcast("ready", { connected: true, phone: connectedPhone });

      // Give Baileys 3 s to fire chats.set from its own init, then try manual resync
      syncRetryTimer = setTimeout(() => trySyncChats(1), 3000);
      // Log stats after delays regardless
      setTimeout(() => logStats("5s after connect"), 5000);
      setTimeout(() => logStats("15s after connect"), 15000);
    }

    if (connection === "close") {
      const code          = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      clientReady = false;
      if (syncRetryTimer) { clearTimeout(syncRetryTimer); syncRetryTimer = null; }

      console.log(`[WA] Disconnected (code: ${code}). Reconnect: ${shouldReconnect}`);

      if (code === DisconnectReason.loggedOut) {
        connectedPhone = null; lastQrDataUrl = null;
        chatStore = {}; messageStore = {};
        broadcast("disconnected", { reason: "logged_out" });
        setTimeout(() => startWhatsApp(), 2000);
      } else if (shouldReconnect) {
        broadcast("loading", { percent: 0, message: "Reconnecting…" });
        setTimeout(() => startWhatsApp(), 3000);
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // ── Chat events ─────────────────────────────────────────────────────────
  sock.ev.on("chats.set", ({ chats = [], isLatest }) => {
    let added = 0;
    for (const c of chats) { upsertChat(c); added++; }
    logStats(`chats.set (${added} chats, isLatest=${isLatest})`);
  });

  sock.ev.on("chats.upsert",  (chats = [])   => chats.forEach(upsertChat));
  sock.ev.on("chats.update",  (updates = [])  => updates.forEach(upsertChat));

  sock.ev.on("contacts.upsert", (contacts = []) => {
    for (const c of contacts) {
      if (!c.id || !isRealChat(c.id)) continue;
      if (!chatStore[c.id]) {
        upsertChat({
          id:   c.id,
          name: c.notify || c.name || c.verifiedName || c.id.split("@")[0],
          conversationTimestamp: 0,
          unreadCount: 0,
        });
      }
    }
  });

  // ── History / message events ────────────────────────────────────────────
  sock.ev.on("messaging-history.set", ({ chats = [], contacts = [], messages = [], isLatest }) => {
    chats.forEach(upsertChat);

    for (const c of contacts) {
      if (!c.id || !isRealChat(c.id)) continue;
      if (!chatStore[c.id]) {
        upsertChat({
          id: c.id,
          name: c.notify || c.name || c.id.split("@")[0],
          conversationTimestamp: 0,
          unreadCount: 0,
        });
      }
    }

    messages.forEach(upsertMessage);
    logStats(`messaging-history.set (isLatest=${isLatest})`);
  });

  sock.ev.on("messages.set", ({ messages = [] }) => {
    messages.forEach(upsertMessage);
    const total = Object.values(messageStore).reduce((s, a) => s + a.length, 0);
    console.log(`[WA] messages.set: ${total} messages total`);
  });

  sock.ev.on("messages.upsert", ({ messages = [], type }) => {
    for (const msg of messages) {
      upsertMessage(msg);
      if (type === "notify" && msg.message) {
        const chatId = msg.key.remoteJid || "";
        if (isRealChat(chatId)) {
          const body = extractBody(msg.message);
          if (body) {
            broadcast("message", {
              id: msg.key.id, from: chatId,
              chatName: chatId.split("@")[0], body,
              timestamp: msg.messageTimestamp,
              fromMe: msg.key.fromMe || false, type: "chat",
            });
          }
        }
      }
    }
  });
}

// ── REST endpoints ─────────────────────────────────────────────────────────

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/status", (_req, res) => res.json({
  connected: clientReady,
  qrReady:   !!lastQrDataUrl,
  phone:     connectedPhone,
}));

app.get("/chats", async (_req, res) => {
  if (!clientReady || !sock)
    return res.status(503).json({ error: "WhatsApp not connected" });

  try {
    // Always refresh group list (direct API call, always works)
    await fetchGroups();

    const all = Object.values(chatStore);

    // Sort by most-recently-active then cap
    const sorted = all
      .sort((a, b) => {
        const ta = typeof a.conversationTimestamp === "number" ? a.conversationTimestamp
          : parseInt(a.conversationTimestamp?.toString() || "0");
        const tb = typeof b.conversationTimestamp === "number" ? b.conversationTimestamp
          : parseInt(b.conversationTimestamp?.toString() || "0");
        return tb - ta;
      })
      .slice(0, MAX_CHATS);

    const result = sorted.map((chat) => ({
      id:           chat.id,
      name:         chat.name || chat.subject || chat.id?.split("@")[0] || "Unknown",
      isGroup:      isJidGroup(chat.id),
      timestamp:    typeof chat.conversationTimestamp === "number"
        ? chat.conversationTimestamp
        : parseInt(chat.conversationTimestamp?.toString() || "0") || null,
      unreadCount:  chat.unreadCount || 0,
      lastMessage:  null,
      messageCount: (messageStore[chat.id] || []).length,
    }));

    logStats(`/chats → returning ${result.length} of ${all.length}`);
    res.json(result);
  } catch (err) {
    console.error("[API] /chats error:", err.message?.slice(0, 120));
    res.status(500).json({ error: err.message });
  }
});

app.get("/chats/:chatId/messages", (req, res) => {
  if (!clientReady || !sock)
    return res.status(503).json({ error: "WhatsApp not connected" });

  const { chatId } = req.params;
  const limit = Math.min(parseInt(req.query.limit || "40", 10), MAX_MSGS_STORED);
  const messages  = getMessages(chatId, limit);
  const chatMeta  = chatStore[chatId];

  console.log(`[API] /chats/${chatId.slice(0, 20)}/messages → ${messages.length} messages`);

  res.json({
    chatId,
    chatName: chatMeta?.name || chatMeta?.subject || chatId.split("@")[0] || "Unknown",
    isGroup:  isJidGroup(chatId),
    messages,
    totalFetched: messages.length,
  });
});

app.post("/disconnect", async (_req, res) => {
  if (!sock) return res.json({ disconnected: true });
  try { await sock.logout(); } catch {}
  clientReady = false; connectedPhone = null; lastQrDataUrl = null;
  chatStore = {}; messageStore = {};
  broadcast("disconnected", { reason: "user_requested" });
  res.json({ disconnected: true });
});

// Clear the auth session → user will need to re-scan QR
app.post("/clear-session", async (_req, res) => {
  console.log("[WA] 🔄 Clear session requested");
  if (syncRetryTimer) { clearTimeout(syncRetryTimer); syncRetryTimer = null; }
  if (sock) { try { sock.end(undefined); } catch {} sock = null; }
  clientReady = false; connectedPhone = null; lastQrDataUrl = null;
  chatStore = {}; messageStore = {};

  broadcast("disconnected", { reason: "session_cleared" });

  clearAuthFiles();
  setTimeout(() => startWhatsApp(), 1500);
  res.json({ cleared: true, message: "Session cleared — new QR code will appear shortly" });
});

app.post("/reinit", async (_req, res) => {
  if (sock) { try { sock.end(undefined); } catch {} }
  clientReady = false; connectedPhone = null; lastQrDataUrl = null;
  chatStore = {}; messageStore = {};
  startWhatsApp();
  res.json({ message: "Re-initializing — watch for QR via WebSocket" });
});

// Debug snapshot
app.get("/debug", (_req, res) => {
  const all = Object.values(chatStore);
  res.json({
    connected:        clientReady,
    phone:            connectedPhone,
    totalChats:       all.length,
    personal:         all.filter((c) => isJidUser(c.id)).length,
    groups:           all.filter((c) => isJidGroup(c.id)).length,
    chatsWithMessages: Object.keys(messageStore).filter((id) => messageStore[id].length > 0).length,
    totalMessages:    Object.values(messageStore).reduce((s, a) => s + a.length, 0),
    sampleChats:      all.slice(0, 8).map((c) => ({
      id: c.id, name: c.name,
      isGroup: isJidGroup(c.id),
      messages: (messageStore[c.id] || []).length,
    })),
  });
});

// ── Start ──────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🟢 WhatsApp Bridge running on http://localhost:${PORT}`);
  console.log(`   Status:  GET  http://localhost:${PORT}/status`);
  console.log(`   Chats:   GET  http://localhost:${PORT}/chats`);
  console.log(`   Reset:   POST http://localhost:${PORT}/clear-session`);
  console.log(`   Debug:   GET  http://localhost:${PORT}/debug\n`);
  startWhatsApp();
});
