"""RAKSHA AI — FastAPI application entry point.

Wires CORS for the Next.js frontend, mounts all module routers under the
/api/v1 prefix, exposes a health check, and serves a basic WebSocket hub
(/ws/{module}) for real-time updates.

Run (development):
    uvicorn app.main:app --reload --port 8000
or simply:
    python run.py
"""
from __future__ import annotations

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models.schemas import ok
from app.routes import auth, dashboard, drishti, jaal, kavach, netra, sentinel, whatsapp
from app.websockets.manager import manager
from app.websockets.sentinel_ws import sentinel_ws_handler
from app.websockets.whatsapp_ws import whatsapp_ws_handler

app = FastAPI(
    title="RAKSHA AI API",
    description="AI-Powered Digital Public Safety Intelligence Platform",
    version="0.1.0",
    debug=settings.fastapi_debug,
)

# ── CORS: allow the Next.js frontend dev origin ─────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health check ────────────────────────────────────────────────────────────
@app.get("/health", tags=["system"])
def health():
    return ok({"status": "ok", "service": "raksha-ai-api"})


# ── API routers (all under /api/v1) ─────────────────────────────────────────
API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(dashboard.router, prefix=API_PREFIX)

app.include_router(sentinel.router, prefix=API_PREFIX)
app.include_router(netra.router, prefix=API_PREFIX)
app.include_router(jaal.router, prefix=API_PREFIX)
app.include_router(drishti.router, prefix=API_PREFIX)
app.include_router(kavach.router, prefix=API_PREFIX)
app.include_router(whatsapp.router, prefix=API_PREFIX)


# ── SENTINEL WebSocket: /ws/sentinel/stream ─────────────────────────────────
@app.websocket("/ws/sentinel/stream")
async def ws_sentinel_stream(websocket: WebSocket):
    """Dedicated SENTINEL streaming endpoint for real-time scam analysis."""
    await sentinel_ws_handler(websocket)


# ── WHATSAPP WebSocket: /ws/whatsapp ────────────────────────────────────────
@app.websocket("/ws/whatsapp")
async def ws_whatsapp(websocket: WebSocket):
    """Relay WhatsApp bridge events (QR, auth, messages) to the frontend."""
    await whatsapp_ws_handler(websocket)


# ── Generic WebSocket hub: /ws/{module} ─────────────────────────────────────
@app.websocket("/ws/{module}")
async def ws_module(websocket: WebSocket, module: str):
    channel = f"ws:{module}"
    await manager.connect(websocket, channel)
    await manager.send_personal(
        {"event": "connected", "module": module}, websocket
    )
    try:
        while True:
            # Echo incoming messages back as a broadcast for now.
            data = await websocket.receive_json()
            await manager.broadcast(
                {"event": "message", "module": module, "payload": data}, channel
            )
    except WebSocketDisconnect:
        await manager.disconnect(websocket, channel)
