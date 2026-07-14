"""WebSocket connection manager.

Keeps track of active client connections so the API can push real-time
updates (live alert feed, analysis streams, graph changes) to the frontend.
For the basic setup this is a single in-process connection registry; it can
later be backed by Redis pub/sub when running multiple workers.
"""
from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        # channel -> set of active websockets
        self._channels: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, channel: str = "global") -> None:
        await websocket.accept()
        async with self._lock:
            self._channels[channel].add(websocket)

    async def disconnect(self, websocket: WebSocket, channel: str = "global") -> None:
        async with self._lock:
            self._channels[channel].discard(websocket)

    async def send_personal(self, message: Any, websocket: WebSocket) -> None:
        await websocket.send_json(message)

    async def broadcast(self, message: Any, channel: str = "global") -> None:
        async with self._lock:
            targets = list(self._channels.get(channel, set()))
        for ws in targets:
            try:
                await ws.send_json(message)
            except Exception:
                # Drop dead connections silently; cleaned up on disconnect.
                self._channels[channel].discard(ws)


# Shared singleton used across the app.
manager = ConnectionManager()
