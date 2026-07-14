"""NETRA — counterfeit currency identification (mock logic).

Returns a deterministic mock verdict + feature checklist shaped to the
frontend NetraScanResult / NetraStats types. The real EfficientNet / YOLOv11
models are wired in later (plan mock strategy).
"""
from __future__ import annotations

import hashlib

from app.models.schemas import SecurityFeature

_FEATURES = [
    "Security Thread", "Watermark", "Latent Image", "Micro Lettering",
    "Intaglio Print", "Colour-shift Ink", "See-through Register",
    "Serial Number", "Bleed Lines", "Denomination Numeral",
]


def _score(seed: str) -> float:
    digest = hashlib.sha256(seed.encode()).hexdigest()
    return (int(digest[:4], 16) % 100) / 100.0


def scan_image(seed: str = "note") -> dict:
    score = _score(seed)
    verdict = "COUNTERFEIT" if score > 0.7 else "SUSPICIOUS" if score > 0.4 else "AUTHENTIC"
    features = [
        SecurityFeature(name=f, status="pass" if score > 0.35 else "fail")
        for f in _FEATURES
    ]
    return {
        "verdict": verdict,
        "confidence": round(score * 100, 1),
        "features": [f.model_dump() for f in features],
        "denomination": "₹500",
    }


def get_stats() -> dict:
    return {"total_scans": 1280, "counterfeits": 34, "authentic": 1246}
