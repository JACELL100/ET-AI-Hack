"""SENTINEL WebSocket handler for real-time streaming analysis.

Supports two modes:
1. **Simulation**: Client sends a scenario ID, server streams pre-built
   scenario transcript + analysis updates.
2. **Live**: Client sends raw audio chunks (binary), server runs STT +
   analysis on each chunk and streams results back.

Protocol
--------
Client → Server (JSON):
    {"action": "start_simulation", "scenario_id": "cbi-hindi-1"}
    {"action": "start_live", "session_id": "..."}
    {"action": "stop"}

Client → Server (binary):
    Raw audio chunk bytes (WebM/Opus or WAV)

Server → Client (JSON):
    {"type": "transcript",     "data": {...}}
    {"type": "threat_update",  "data": {...}}
    {"type": "intent",         "data": {...}}
    {"type": "voice_analysis", "data": {...}}
    {"type": "alert",          "data": {...}}
    {"type": "session_complete","data": {...}}
    {"type": "error",          "data": {"message": "..."}}
"""
from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid

from fastapi import WebSocket, WebSocketDisconnect

from app.services.sentinel_engine import get_engine, AnalysisResult
from app.services.simulation_scenarios import get_scenario_by_id

logger = logging.getLogger(__name__)


async def sentinel_ws_handler(websocket: WebSocket) -> None:
    """Main WebSocket handler for SENTINEL streaming."""
    await websocket.accept()
    session_id = f"ws-{uuid.uuid4().hex[:12]}"

    await websocket.send_json({
        "type": "connected",
        "data": {"session_id": session_id, "message": "SENTINEL stream ready"},
    })

    accumulated_text = ""
    is_active = False

    try:
        while True:
            # Try to receive — could be JSON (control) or bytes (audio)
            try:
                msg = await websocket.receive()
            except RuntimeError:
                # Socket already closed
                break

            if msg.get("type") == "websocket.disconnect":
                break

            if "text" in msg:
                try:
                    data = json.loads(msg["text"])
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "error",
                        "data": {"message": "Invalid JSON"},
                    })
                    continue

                action = data.get("action", "")

                if action == "start_simulation":
                    scenario_id = data.get("scenario_id", "cbi-hindi-1")
                    is_active = True
                    accumulated_text = ""
                    # Run simulation in background so we don't block
                    asyncio.create_task(
                        _run_simulation(websocket, scenario_id, session_id)
                    )

                elif action == "start_live":
                    is_active = True
                    accumulated_text = ""
                    await websocket.send_json({
                        "type": "session_started",
                        "data": {"session_id": session_id, "mode": "live"},
                    })

                elif action == "stop":
                    is_active = False
                    # Run final analysis on accumulated text
                    if accumulated_text.strip():
                        engine = get_engine()
                        result = engine.analyse_text(accumulated_text, session_id)
                        await websocket.send_json({
                            "type": "session_complete",
                            "data": result.to_dict(),
                        })

                elif action == "analyse_text":
                    # One-shot text analysis via WebSocket
                    text = data.get("text", "")
                    if text:
                        engine = get_engine()
                        result = engine.analyse_text(text, session_id)
                        await websocket.send_json({
                            "type": "session_complete",
                            "data": result.to_dict(),
                        })

            elif "bytes" in msg and msg["bytes"] and is_active:
                # Audio chunk from live recording
                audio_bytes = msg["bytes"]
                try:
                    engine = get_engine()
                    updates = engine.analyse_audio_chunk(
                        audio_bytes,
                        accumulated_text=accumulated_text,
                        suffix=".webm",
                    )
                    for update in updates:
                        await websocket.send_json(update.to_dict())
                        # Accumulate transcript text
                        if update.type == "transcript":
                            accumulated_text += " " + update.data.get("text", "")
                except Exception as exc:
                    logger.error("Audio chunk analysis error: %s", exc)
                    await websocket.send_json({
                        "type": "error",
                        "data": {"message": f"Analysis error: {str(exc)}"},
                    })

    except WebSocketDisconnect:
        logger.info("SENTINEL WebSocket disconnected: %s", session_id)
    except Exception as exc:
        logger.error("SENTINEL WebSocket error: %s", exc)


async def _run_simulation(
    websocket: WebSocket,
    scenario_id: str,
    session_id: str,
) -> None:
    """Stream a pre-built scenario as if it's happening in real-time."""
    scenario = get_scenario_by_id(scenario_id)
    if not scenario:
        await websocket.send_json({
            "type": "error",
            "data": {"message": f"Scenario '{scenario_id}' not found"},
        })
        return

    await websocket.send_json({
        "type": "simulation_started",
        "data": {
            "session_id": session_id,
            "scenario": scenario.to_dict(),
        },
    })

    engine = get_engine()
    accumulated = ""
    intents_seen: list[str] = []

    for i, line in enumerate(scenario.script):
        # Simulate real-time delay between lines
        delay = 1.8 if i > 0 else 0.8
        await asyncio.sleep(delay)

        accumulated += " " + line.text

        # Send transcript line
        try:
            await websocket.send_json({
                "type": "transcript",
                "data": {
                    "speaker": line.speaker,
                    "text": line.text,
                    "time": line.time_offset,
                    "intent": line.intent,
                    "language": line.language,
                    "confidence": 0.92 if line.intent != "NORMAL" else 0.45,
                    "line_index": i,
                },
                "timestamp": time.time(),
            })
        except Exception:
            return  # Client disconnected

        # Send intent if not NORMAL
        if line.intent != "NORMAL" and line.intent not in intents_seen:
            intents_seen.append(line.intent)
            try:
                await websocket.send_json({
                    "type": "intent",
                    "data": {"intent": line.intent, "confidence": 0.89},
                    "timestamp": time.time(),
                })
            except Exception:
                return

        # Run classification on accumulated text for threat score
        cls = engine._get_classifier().classify(accumulated.strip())

        try:
            await websocket.send_json({
                "type": "threat_update",
                "data": {
                    "score": cls.threat_score,
                    "verdict": cls.verdict,
                    "scam_type": cls.scam_type,
                    "intents": cls.intents_detected,
                    "script_similarity": cls.script_similarity,
                },
                "timestamp": time.time(),
            })
        except Exception:
            return

        # Alert if threshold crossed
        if cls.threat_score >= 70 and i >= 2:
            try:
                await websocket.send_json({
                    "type": "alert",
                    "data": {
                        "severity": "critical",
                        "message": f"HIGH RISK: Scam probability {cls.threat_score}%",
                        "scam_type": cls.scam_type,
                    },
                    "timestamp": time.time(),
                })
            except Exception:
                return

    # Final voice analysis (mock for simulation)
    await asyncio.sleep(0.5)
    try:
        await websocket.send_json({
            "type": "voice_analysis",
            "data": {
                "is_scripted": True,
                "scripted_confidence": 0.78,
                "speech_rate": 0.072,
                "pitch_mean_hz": 185.3,
                "pitch_variance": 15.7,
                "bg_noise_type": "call_centre",
            },
            "timestamp": time.time(),
        })
    except Exception:
        return

    # Session complete
    full_result = engine.analyse_text(accumulated.strip(), session_id)
    try:
        await websocket.send_json({
            "type": "session_complete",
            "data": full_result.to_dict(),
            "timestamp": time.time(),
        })
    except Exception:
        return
