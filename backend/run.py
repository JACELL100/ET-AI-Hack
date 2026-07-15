"""Convenience launcher for the FastAPI backend (uvicorn).

Usage:
    python run.py                 # starts uvicorn on host:port from settings
    python run.py --reload        # enable auto-reload for development
"""
from __future__ import annotations

import argparse

import uvicorn

from app.config import settings


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the RAKSHA AI FastAPI backend")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    parser.add_argument("--host", default=settings.backend_host)
    parser.add_argument("--port", type=int, default=settings.backend_port)
    args = parser.parse_args()

    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info",
        timeout_keep_alive=120,   # keep connections alive for slow OCR scans
    )


if __name__ == "__main__":
    main()
