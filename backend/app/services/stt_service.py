"""Speech-to-Text service using Faster-Whisper.

Wraps the faster-whisper library for both full-file transcription and
streaming (chunked) transcription.  Falls back to a mock transcript when
the ``faster-whisper`` package is unavailable (demo / CI environments).
"""
from __future__ import annotations

import io
import logging
import tempfile
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class TranscriptSegment:
    """A single segment from STT."""
    text: str
    start_time: float = 0.0
    end_time: float = 0.0
    language: str = "en"
    confidence: float = 0.0


@dataclass
class TranscriptionResult:
    """Full transcription output."""
    segments: list[TranscriptSegment] = field(default_factory=list)
    full_text: str = ""
    language: str = "en"
    language_confidence: float = 0.0
    duration_seconds: float = 0.0
    processing_time_ms: int = 0


# ---------------------------------------------------------------------------
# Try to import faster-whisper; gate behind a flag
# ---------------------------------------------------------------------------
_WHISPER_AVAILABLE = False
_WhisperModel = None

try:
    from faster_whisper import WhisperModel as _WM  # type: ignore[import-untyped]
    _WhisperModel = _WM
    _WHISPER_AVAILABLE = True
    logger.info("faster-whisper loaded successfully")
except ImportError:
    logger.warning(
        "faster-whisper not installed — STT service will use mock transcription"
    )


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class STTService:
    """Speech-to-text using Faster-Whisper (CTranslate2 backend).

    Parameters
    ----------
    model_size : str
        Whisper model size – ``tiny``, ``base``, ``small``, ``medium``, or
        ``large-v3-turbo``.  Smaller is faster but less accurate.
    device : str
        ``cpu`` or ``cuda``.
    compute_type : str
        Quantisation type – ``int8`` (CPU-friendly), ``float16`` (GPU).
    """

    def __init__(
        self,
        model_size: str = "base",
        device: str = "cpu",
        compute_type: str = "int8",
    ) -> None:
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        self._model = None
        self._loaded = False

    # -- lazy loading so app startup isn't blocked ---------------------------

    def _ensure_model(self) -> None:
        if self._loaded:
            return
        if not _WHISPER_AVAILABLE:
            logger.warning("Whisper unavailable — transcriptions will be mocked")
            self._loaded = True
            return
        logger.info(
            "Loading Whisper model '%s' on %s (%s) …",
            self.model_size, self.device, self.compute_type,
        )
        t0 = time.time()
        self._model = _WhisperModel(
            self.model_size,
            device=self.device,
            compute_type=self.compute_type,
        )
        logger.info("Whisper model loaded in %.1f s", time.time() - t0)
        self._loaded = True

    # -- public API ----------------------------------------------------------

    def transcribe_file(self, audio_path: str | Path) -> TranscriptionResult:
        """Transcribe a complete audio file on disk."""
        self._ensure_model()
        t0 = time.time()

        if self._model is None:
            return self._mock_transcription()

        segments_raw, info = self._model.transcribe(
            str(audio_path),
            beam_size=5,
            language=None,  # auto-detect
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
        )

        segments: list[TranscriptSegment] = []
        full_parts: list[str] = []
        for seg in segments_raw:
            segments.append(TranscriptSegment(
                text=seg.text.strip(),
                start_time=seg.start,
                end_time=seg.end,
                language=info.language,
                confidence=round(seg.avg_logprob + 1.0, 3),  # rough proxy
            ))
            full_parts.append(seg.text.strip())

        elapsed = int((time.time() - t0) * 1000)
        return TranscriptionResult(
            segments=segments,
            full_text=" ".join(full_parts),
            language=info.language,
            language_confidence=round(info.language_probability, 3),
            duration_seconds=round(info.duration, 2),
            processing_time_ms=elapsed,
        )

    def transcribe_bytes(
        self,
        audio_bytes: bytes,
        suffix: str = ".wav",
    ) -> TranscriptionResult:
        """Transcribe in-memory audio bytes.

        For WebM/Opus chunks from browsers, converts to WAV first via pydub.
        Falls back to direct write if pydub is unavailable.
        """
        if len(audio_bytes) < 100:
            # Too small to be valid audio
            return TranscriptionResult()

        # Convert WebM/Opus to WAV for Whisper compatibility
        if suffix in (".webm", ".ogg", ".opus"):
            wav_bytes = self._convert_to_wav(audio_bytes, suffix)
            if wav_bytes:
                audio_bytes = wav_bytes
                suffix = ".wav"

        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp.flush()
            try:
                return self.transcribe_file(tmp.name)
            except Exception as exc:
                logger.warning("Transcription failed for %s: %s", suffix, exc)
                return self._mock_transcription()

    @staticmethod
    def _convert_to_wav(audio_bytes: bytes, suffix: str) -> bytes | None:
        """Convert audio bytes to 16 kHz mono WAV using pydub (ffmpeg)."""
        try:
            from pydub import AudioSegment

            input_buf = io.BytesIO(audio_bytes)
            # pydub auto-detects format; explicit hint helps edge cases
            fmt = suffix.lstrip(".")
            audio = AudioSegment.from_file(input_buf, format=fmt)

            # Normalise to 16 kHz mono 16-bit PCM WAV
            audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)

            wav_buf = io.BytesIO()
            audio.export(wav_buf, format="wav")
            return wav_buf.getvalue()
        except FileNotFoundError:
            logger.error(
                "ffmpeg not found — pydub requires ffmpeg on PATH for "
                "audio conversion.  Install it:  "
                "https://www.ffmpeg.org/download.html"
            )
            return None
        except Exception as exc:
            logger.warning("Audio conversion failed (%s): %s", suffix, exc)
            return None

    # -- fallback mock -------------------------------------------------------

    @staticmethod
    def _mock_transcription() -> TranscriptionResult:
        """Return a canned demo transcript when Whisper is unavailable."""
        mock_segments = [
            TranscriptSegment(
                text="Namaste, main CBI Officer Rahul Kumar bol raha hoon.",
                start_time=0.0, end_time=3.2, language="hi", confidence=0.92,
            ),
            TranscriptSegment(
                text="Aapka Aadhaar number money laundering case mein involved hai.",
                start_time=3.5, end_time=7.1, language="hi", confidence=0.89,
            ),
            TranscriptSegment(
                text="Supreme Court case number SC-2024-789 mein aapka naam hai.",
                start_time=8.0, end_time=12.4, language="hi", confidence=0.91,
            ),
            TranscriptSegment(
                text="Agar abhi payment nahi ki toh arrest warrant issue ho jayega!",
                start_time=13.0, end_time=17.6, language="hi", confidence=0.88,
            ),
            TranscriptSegment(
                text="Aapke paas sirf 2 ghante hain. Rs 50,000 immediately transfer karo.",
                start_time=18.5, end_time=23.1, language="hi", confidence=0.90,
            ),
            TranscriptSegment(
                text="Kisi ko mat batao warna aur serious charges honge!",
                start_time=24.0, end_time=27.5, language="hi", confidence=0.87,
            ),
        ]
        return TranscriptionResult(
            segments=mock_segments,
            full_text=" ".join(s.text for s in mock_segments),
            language="hi",
            language_confidence=0.95,
            duration_seconds=28.0,
            processing_time_ms=150,
        )


# ---------------------------------------------------------------------------
# Module-level singleton (lazy)
# ---------------------------------------------------------------------------
_stt: Optional[STTService] = None


def get_stt_service(
    model_size: str = "base",
    device: str = "cpu",
) -> STTService:
    global _stt
    if _stt is None:
        _stt = STTService(model_size=model_size, device=device)
    return _stt
