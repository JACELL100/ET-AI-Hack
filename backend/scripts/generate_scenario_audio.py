"""Generate TTS audio files for simulation scenarios.

Uses gTTS (Google Text-to-Speech) to create MP3 audio files from
the scenario scripts. Run this once to populate the scenarios/ directory.

Usage:
    cd backend
    python -m scripts.generate_scenario_audio
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

# Ensure the backend app is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "app" / "data" / "scenarios"


def generate_all() -> None:
    """Generate audio for all built-in scenarios."""
    try:
        from gtts import gTTS  # type: ignore[import-untyped]
    except ImportError:
        print("ERROR: gTTS not installed. Run: pip install gTTS")
        sys.exit(1)

    from app.services.simulation_scenarios import SCENARIOS

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    lang_map = {"hi": "hi", "en": "en", "mr": "mr"}

    for scenario in SCENARIOS:
        filename = scenario.audio_filename
        if not filename:
            print(f"  SKIP {scenario.id} — no audio_filename set")
            continue

        out_path = OUTPUT_DIR / filename
        if out_path.exists():
            print(f"  EXISTS {out_path.name} — skipping")
            continue

        # Build full script text (caller lines only for TTS)
        caller_lines = [
            line.text
            for line in scenario.script
            if line.speaker == "CALLER"
        ]
        full_text = ". ".join(caller_lines)

        lang = lang_map.get(scenario.language, "en")

        print(f"  Generating {filename} ({lang}, {len(full_text)} chars) ...")
        t0 = time.time()

        try:
            tts = gTTS(text=full_text, lang=lang, slow=False)
            tts.save(str(out_path))
            elapsed = time.time() - t0
            size_kb = out_path.stat().st_size / 1024
            print(f"    ✓ Saved {filename} ({size_kb:.0f} KB, {elapsed:.1f}s)")
        except Exception as exc:
            print(f"    ✗ Failed: {exc}")


if __name__ == "__main__":
    print("=== SENTINEL Scenario Audio Generator ===\n")
    generate_all()
    print("\nDone!")
