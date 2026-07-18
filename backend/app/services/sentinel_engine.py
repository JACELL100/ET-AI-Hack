"""SENTINEL Analysis Engine — core orchestrator.

Accepts audio bytes, text, or video frames and runs the full multi-stage
scam detection pipeline, combining STT, NLP classification, voice analysis,
and threat scoring into a single unified result.
"""
from __future__ import annotations

import logging
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Optional

from app.services.stt_service import (
    STTService,
    TranscriptSegment as STTSegment,
    get_stt_service,
)
from app.services.scam_classifier import (
    ClassificationResult,
    ScamClassifier,
    get_classifier,
)
from app.services.voice_analyser import (
    VoiceAnalysisResult,
    VoiceAnalyser,
    get_voice_analyser,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Result data classes
# ---------------------------------------------------------------------------

@dataclass
class TranscriptEntry:
    speaker: str = "CALLER"
    text: str = ""
    start_time: float = 0.0
    end_time: float = 0.0
    language: str = "en"
    intent: str = "NORMAL"
    confidence: float = 0.0

    def to_dict(self) -> dict:
        return {
            "speaker": self.speaker,
            "text": self.text,
            "start_time": round(self.start_time, 2),
            "end_time": round(self.end_time, 2),
            "language": self.language,
            "intent": self.intent,
            "confidence": round(self.confidence, 3),
        }


@dataclass
class AnalysisResult:
    session_id: str = ""
    threat_score: float = 0.0
    verdict: str = "SAFE"  # SCAM | SUSPICIOUS | SAFE
    scam_type: str | None = None
    transcript: list[TranscriptEntry] = field(default_factory=list)
    intents_detected: list[str] = field(default_factory=list)
    voice_analysis: dict | None = None
    script_similarity: float = 0.0
    confidence: float = 0.0
    processing_time_ms: int = 0
    alerts_sent: list[str] = field(default_factory=list)
    language: str = "en"

    def to_dict(self) -> dict:
        return {
            "session_id": self.session_id,
            "threat_score": round(self.threat_score, 1),
            "verdict": self.verdict,
            "scam_type": self.scam_type,
            "transcript": [t.to_dict() for t in self.transcript],
            "intents_detected": self.intents_detected,
            "voice_analysis": self.voice_analysis,
            "script_similarity": round(self.script_similarity, 4),
            "confidence": round(self.confidence, 3),
            "processing_time_ms": self.processing_time_ms,
            "alerts_sent": self.alerts_sent,
            "language": self.language,
        }


@dataclass
class StreamUpdate:
    """Real-time update emitted during streaming analysis."""
    type: str  # transcript | threat_update | intent | voice_analysis | alert | session_complete
    data: dict = field(default_factory=dict)
    timestamp: float = 0.0

    def to_dict(self) -> dict:
        return {
            "type": self.type,
            "data": self.data,
            "timestamp": self.timestamp or time.time(),
        }


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

class SentinelEngine:
    """Orchestrates the full SENTINEL analysis pipeline.

    All three input modes (simulation, WebRTC, PSTN) feed into this engine.
    The engine is stateless per-call — session state is managed externally.
    """

    def __init__(
        self,
        whisper_model: str = "base",
        whisper_device: str = "cpu",
        threat_threshold_high: float = 70.0,
        threat_threshold_medium: float = 40.0,
    ) -> None:
        self._whisper_model = whisper_model
        self._whisper_device = whisper_device
        self._threshold_high = threat_threshold_high
        self._threshold_medium = threat_threshold_medium

        # Lazy-loaded sub-services
        self._stt: STTService | None = None
        self._classifier: ScamClassifier | None = None
        self._voice: VoiceAnalyser | None = None

    # -- lazy init -----------------------------------------------------------

    def _get_stt(self) -> STTService:
        if self._stt is None:
            self._stt = get_stt_service(
                model_size=self._whisper_model,
                device=self._whisper_device,
            )
        return self._stt

    def _get_classifier(self) -> ScamClassifier:
        if self._classifier is None:
            self._classifier = get_classifier()
        return self._classifier

    def _get_voice(self) -> VoiceAnalyser:
        if self._voice is None:
            self._voice = get_voice_analyser()
        return self._voice

    # -- main analysis methods -----------------------------------------------

    def analyse_text(self, text: str, session_id: str | None = None) -> AnalysisResult:
        """Analyse text input (SMS, WhatsApp, email) for scam patterns.

        This is the simplest path — no STT or voice analysis required.
        """
        t0 = time.time()
        sid = session_id or f"txt-{uuid.uuid4().hex[:12]}"

        # Classify
        cls = self._get_classifier().classify(text)

        # Build transcript (single segment)
        transcript = [TranscriptEntry(
            speaker="INPUT",
            text=text,
            intent=cls.intents_detected[0] if cls.intents_detected else "NORMAL",
            confidence=cls.confidence,
        )]

        elapsed = int((time.time() - t0) * 1000)

        return AnalysisResult(
            session_id=sid,
            threat_score=cls.threat_score,
            verdict=cls.verdict,
            scam_type=cls.scam_type,
            transcript=transcript,
            intents_detected=cls.intents_detected,
            voice_analysis=None,
            script_similarity=cls.script_similarity,
            confidence=cls.confidence,
            processing_time_ms=elapsed,
        )

    def analyse_audio(
        self,
        audio_bytes: bytes,
        session_id: str | None = None,
        suffix: str = ".wav",
    ) -> AnalysisResult:
        """Full analysis on an audio file/bytes.

        Runs: STT → Classification → Voice Analysis → Threat Scoring.
        """
        t0 = time.time()
        sid = session_id or f"aud-{uuid.uuid4().hex[:12]}"

        # Stage 1: STT
        stt = self._get_stt()
        transcription = stt.transcribe_bytes(audio_bytes, suffix=suffix)

        # Stage 2: Classification on full text
        cls = self._get_classifier().classify(transcription.full_text)

        # Stage 3: Per-segment intent classification
        transcript_entries: list[TranscriptEntry] = []
        for seg in transcription.segments:
            seg_cls = self._get_classifier().classify(seg.text)
            top_intent = seg_cls.intents_detected[0] if seg_cls.intents_detected else "NORMAL"
            transcript_entries.append(TranscriptEntry(
                speaker=self._guess_speaker(seg, transcription.segments),
                text=seg.text,
                start_time=seg.start_time,
                end_time=seg.end_time,
                language=seg.language or transcription.language,
                intent=top_intent,
                confidence=seg_cls.confidence,
            ))

        # Stage 4: Voice analysis
        voice = self._get_voice()
        voice_result = voice.analyse_bytes(audio_bytes, suffix=suffix)
        voice_dict = {
            "is_scripted": voice_result.is_scripted,
            "scripted_confidence": voice_result.scripted_confidence,
            "speech_rate": voice_result.speech_rate,
            "pitch_mean_hz": voice_result.pitch_mean_hz,
            "pitch_variance": voice_result.pitch_variance,
            "silence_ratio": voice_result.silence_ratio,
            "pause_count": voice_result.pause_count,
            "bg_noise_type": voice_result.bg_noise_type,
        }

        # Stage 5: Combined threat scoring
        # Weights: NLP classification (45%) + script similarity (25%) + voice (20%) + base (10%)
        nlp_component = cls.threat_score * 0.45
        sim_component = (cls.script_similarity * 100) * 0.25
        voice_component = (voice_result.scripted_confidence * 100) * 0.20
        base_component = 5.0 if cls.threat_score > 0 else 0.0  # min baseline when any signal

        combined_score = round(min(100.0, nlp_component + sim_component + voice_component + base_component), 1)

        # Final verdict
        if combined_score >= self._threshold_high:
            verdict = "SCAM"
        elif combined_score >= self._threshold_medium:
            verdict = "SUSPICIOUS"
        else:
            verdict = "SAFE"

        elapsed = int((time.time() - t0) * 1000)

        return AnalysisResult(
            session_id=sid,
            threat_score=combined_score,
            verdict=verdict,
            scam_type=cls.scam_type,
            transcript=transcript_entries,
            intents_detected=cls.intents_detected,
            voice_analysis=voice_dict,
            script_similarity=cls.script_similarity,
            confidence=cls.confidence,
            processing_time_ms=elapsed,
            language=transcription.language,
        )

    def analyse_audio_chunk(
        self,
        audio_bytes: bytes,
        accumulated_text: str = "",
        suffix: str = ".webm",
    ) -> list[StreamUpdate]:
        """Analyse a single audio chunk for streaming mode.

        Returns a list of StreamUpdate events to send to the client.
        """
        updates: list[StreamUpdate] = []

        # STT on chunk
        stt = self._get_stt()
        transcription = stt.transcribe_bytes(audio_bytes, suffix=suffix)

        if not transcription.full_text.strip():
            return updates

        # Transcript update
        for seg in transcription.segments:
            seg_cls = self._get_classifier().classify(seg.text)
            top_intent = seg_cls.intents_detected[0] if seg_cls.intents_detected else "NORMAL"
            updates.append(StreamUpdate(
                type="transcript",
                data={
                    "speaker": "CALLER",
                    "text": seg.text,
                    "start_time": seg.start_time,
                    "end_time": seg.end_time,
                    "language": transcription.language,
                    "intent": top_intent,
                    "confidence": round(seg_cls.confidence, 3),
                },
            ))

            # Intent alert if suspicious
            if top_intent != "NORMAL":
                updates.append(StreamUpdate(
                    type="intent",
                    data={"intent": top_intent, "confidence": round(seg_cls.confidence, 3)},
                ))

        # Running threat score on accumulated text
        combined_text = f"{accumulated_text} {transcription.full_text}".strip()
        cls = self._get_classifier().classify(combined_text)

        updates.append(StreamUpdate(
            type="threat_update",
            data={
                "score": cls.threat_score,
                "verdict": cls.verdict,
                "scam_type": cls.scam_type,
                "intents": cls.intents_detected,
                "script_similarity": cls.script_similarity,
            },
        ))

        # Alert if threshold crossed
        if cls.threat_score >= self._threshold_high:
            updates.append(StreamUpdate(
                type="alert",
                data={
                    "severity": "critical",
                    "message": f"HIGH RISK: Scam probability {cls.threat_score}%",
                    "scam_type": cls.scam_type,
                },
            ))

        return updates

    # -- helpers -------------------------------------------------------------

    @staticmethod
    def _guess_speaker(
        segment: STTSegment,
        all_segments: list[STTSegment],
    ) -> str:
        """Heuristic speaker assignment (simple alternation for prototype).

        In production this would use pyannote speaker diarisation.
        """
        idx = all_segments.index(segment) if segment in all_segments else 0
        return "CALLER" if idx % 2 == 0 else "VICTIM"


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------
_engine: SentinelEngine | None = None


def get_engine(
    whisper_model: str = "base",
    whisper_device: str = "cpu",
) -> SentinelEngine:
    global _engine
    if _engine is None:
        _engine = SentinelEngine(
            whisper_model=whisper_model,
            whisper_device=whisper_device,
        )
    return _engine
