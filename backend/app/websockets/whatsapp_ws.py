"""WebSocket relay for WhatsApp bridge events.

Connects to the Node.js WhatsApp bridge WebSocket and forwards events
(QR code, authentication, ready, new messages, disconnection) to the
frontend client.  This way the frontend only talks to FastAPI.
"""
from __future__ import annotations

import asyncio
import json
import logging

from fastapi import WebSocket, WebSocketDisconnect

from app.config import settings

logger = logging.getLogger(__name__)


async def whatsapp_ws_handler(websocket: WebSocket) -> None:
    """Relay WhatsApp bridge WebSocket events to the frontend."""
    await websocket.accept()
    logger.info("[WA-WS] Frontend client connected")

    bridge_ws = None

    try:
        # Connect to the Node.js bridge WebSocket
        bridge_url = settings.whatsapp_bridge_url.replace("http://", "ws://").replace("https://", "wss://")
        bridge_ws_url = f"{bridge_url}/ws"

        try:
            import websockets
            bridge_ws = await websockets.connect(bridge_ws_url)
            logger.info("[WA-WS] Connected to bridge WebSocket at %s", bridge_ws_url)
        except ImportError:
            # Fallback: use a simple polling approach if websockets not installed
            logger.warning("[WA-WS] 'websockets' package not installed — using polling fallback")
            await _polling_fallback(websocket)
            return
        except Exception as exc:
            logger.error("[WA-WS] Cannot connect to bridge WS: %s", exc)
            await websocket.send_json({
                "event": "error",
                "data": {"message": f"Cannot connect to WhatsApp bridge: {exc}"},
            })
            await _polling_fallback(websocket)
            return

        # Run two tasks concurrently:
        # 1. Bridge → Frontend (relay bridge events to client)
        # 2. Frontend → Bridge (relay client commands to bridge)
        bridge_to_frontend = asyncio.create_task(
            _relay_bridge_to_frontend(bridge_ws, websocket)
        )
        frontend_to_bridge = asyncio.create_task(
            _relay_frontend_to_bridge(websocket, bridge_ws)
        )

        done, pending = await asyncio.wait(
            [bridge_to_frontend, frontend_to_bridge],
            return_when=asyncio.FIRST_COMPLETED,
        )

        for task in pending:
            task.cancel()

    except WebSocketDisconnect:
        logger.info("[WA-WS] Frontend client disconnected")
    except Exception as exc:
        logger.error("[WA-WS] Error: %s", exc)
    finally:
        if bridge_ws:
            try:
                await bridge_ws.close()
            except Exception:
                pass
        logger.info("[WA-WS] Relay session ended")


async def _relay_bridge_to_frontend(bridge_ws, frontend_ws: WebSocket) -> None:
    """Forward messages from bridge WebSocket to frontend WebSocket."""
    try:
        async for message in bridge_ws:
            try:
                data = json.loads(message)
                await frontend_ws.send_json(data)
            except Exception as exc:
                logger.warning("[WA-WS] Error forwarding bridge→frontend: %s", exc)
    except Exception:
        pass  # Connection closed


async def _relay_frontend_to_bridge(frontend_ws: WebSocket, bridge_ws) -> None:
    """Forward messages from frontend WebSocket to bridge WebSocket."""
    try:
        while True:
            data = await frontend_ws.receive_text()
            await bridge_ws.send(data)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass


async def _polling_fallback(websocket: WebSocket) -> None:
    """Fallback when websockets library is unavailable.

    Polls the bridge HTTP /status endpoint and forwards QR status changes.
    Not as responsive as WebSocket relay but functional.
    """
    import httpx

    last_status = None

    try:
        while True:
            try:
                async with httpx.AsyncClient(timeout=10) as client:
                    r = await client.get(f"{settings.whatsapp_bridge_url}/status")
                    status = r.json()

                if status != last_status:
                    await websocket.send_json({"event": "status", "data": status})
                    last_status = status

                    if status.get("connected"):
                        await websocket.send_json({
                            "event": "ready",
                            "data": {"connected": True, "phone": status.get("phone")},
                        })

            except Exception as exc:
                await websocket.send_json({
                    "event": "error",
                    "data": {"message": f"Bridge poll error: {exc}"},
                })

            await asyncio.sleep(2)  # poll every 2 seconds

    except WebSocketDisconnect:
        pass
