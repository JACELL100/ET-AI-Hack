"""Start the WhatsApp sidecar only after the public FastAPI service is ready.

Render detects the first open port in a container.  FastAPI needs longer to
import the computer-vision and speech dependencies than the Node bridge, so
starting both at once can incorrectly expose port 3001 instead of ``$PORT``.
"""

from __future__ import annotations

import os
import time
from urllib.error import URLError
from urllib.request import urlopen


def wait_for_api() -> None:
    port = os.environ.get("BACKEND_PORT", os.environ.get("PORT", "10000"))
    health_url = f"http://127.0.0.1:{port}/health"
    print(f"[WA] Waiting for backend health endpoint at {health_url}", flush=True)

    while True:
        try:
            with urlopen(health_url, timeout=2) as response:
                if response.status == 200:
                    print("[WA] Backend is ready; starting WhatsApp bridge", flush=True)
                    return
        except (OSError, URLError):
            pass
        time.sleep(1)


if __name__ == "__main__":
    wait_for_api()
    os.environ["PORT"] = os.environ.get("BRIDGE_PORT", "3001")
    os.execvp("node", ["node", "index.js"])
