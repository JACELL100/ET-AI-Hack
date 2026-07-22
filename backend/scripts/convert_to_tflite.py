#!/usr/bin/env python3
"""Convert a NETRA-KERAS-1 model to TFLite format.

Used at Docker build time so the runtime image only needs ``tflite-runtime``
(~2 MB) instead of the full ``tensorflow-cpu`` (~450 MB).

Usage (inside Dockerfile build stage):
    python convert_to_tflite.py /tmp/models

The script expects ``active_model.keras`` and ``active_model_card.json``
to already exist in the supplied directory.  It writes
``active_model.tflite`` alongside them and patches the card to declare
format ``NETRA-TFLITE-1``.
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def convert(model_dir: str) -> None:
    model_dir_path = Path(model_dir)
    keras_path = model_dir_path / "active_model.keras"
    card_path = model_dir_path / "active_model_card.json"
    tflite_path = model_dir_path / "active_model.tflite"

    if not keras_path.exists():
        print(f"[convert] No .keras model found at {keras_path} — skipping conversion")
        return

    # ── Load Keras model ────────────────────────────────────────────────
    import tensorflow as tf  # noqa: E402  (only available in build stage)

    print(f"[convert] Loading Keras model from {keras_path} ...")
    model = tf.keras.models.load_model(str(keras_path), compile=False)
    model.summary()

    # ── Convert to TFLite ───────────────────────────────────────────────
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()

    tflite_path.write_bytes(tflite_model)
    print(f"[convert] Wrote TFLite model: {tflite_path}  ({len(tflite_model):,} bytes)")

    # ── Patch model card ────────────────────────────────────────────────
    if card_path.exists():
        card = json.loads(card_path.read_text(encoding="utf-8"))
        card["format"] = "NETRA-TFLITE-1"
        card["version"] = "NETRA-TFLITE-1"
        card["artifactFile"] = "active_model.tflite"
        card["modelSha256"] = _sha256(tflite_path)
        card["convertedFrom"] = "NETRA-KERAS-1"
        card_path.write_text(
            json.dumps(card, indent=2, ensure_ascii=False, default=str),
            encoding="utf-8",
        )
        print(f"[convert] Updated model card → NETRA-TFLITE-1")
    else:
        print(f"[convert] WARNING: no model card found at {card_path}")


if __name__ == "__main__":
    directory = sys.argv[1] if len(sys.argv) > 1 else "/tmp/models"
    convert(directory)
