"""Multi-layer scam intent classification.

Layers
------
A – Weighted keyword / pattern scoring (always available, zero-dep).
B – Sentence-Transformer cosine similarity against known scam corpus.
C – HuggingFace zero-shot classification (optional heavy model).

The classifier is designed to degrade gracefully: if ML deps are missing
it still provides a keyword-based score.
"""
from __future__ import annotations

import json
import logging
import math
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class IntentResult:
    """Result of intent classification for a single text segment."""
    intent: str  # IMPERSONATION | LEGAL_THREAT | URGENCY_CREATION | MONEY_DEMAND | INTIMIDATION | IDENTITY_THEFT | NORMAL
    confidence: float = 0.0


@dataclass
class ClassificationResult:
    """Full classification output."""
    threat_score: float = 0.0          # 0–100
    verdict: str = "SAFE"              # SCAM | SUSPICIOUS | SAFE
    scam_type: str | None = None       # DIGITAL_ARREST | CUSTOMS_SCAM | etc
    intents_detected: list[str] = field(default_factory=list)
    intent_details: list[IntentResult] = field(default_factory=list)
    script_similarity: float = 0.0     # 0–1 cosine sim to closest known script
    keyword_score: float = 0.0         # 0–100 from Layer A
    ml_score: float = 0.0             # 0–100 from Layer B+C
    confidence: float = 0.0
    matched_corpus_id: str | None = None


# ---------------------------------------------------------------------------
# Keyword categories with weights  (Layer A)
# ---------------------------------------------------------------------------

_KEYWORD_CATEGORIES: dict[str, tuple[list[str], float]] = {
    "IMPERSONATION": ([
        "cbi", "central bureau", "enforcement directorate", "customs",
        "rbi", "reserve bank", "income tax", "police", "court",
        "supreme court", "magistrate", "officer", "inspector",
        "trai", "ncb", "narcotics", "government", "ministry",
        "edi", "interpol", "cyber crime", "cyber cell",
    ], 15.0),
    "LEGAL_THREAT": ([
        "arrest", "warrant", "fir", "case", "chargesheet", "prison",
        "jail", "court order", "non-bailable", "legal notice",
        "investigation", "prosecution", "blacklist", "cancell",
        "suspend", "seize", "freeze", "block", "ban",
    ], 14.0),
    "URGENCY_CREATION": ([
        "immediately", "urgent", "turant", "abhi", "now",
        "2 hours", "2 ghante", "24 hours", "last chance",
        "time limit", "deadline", "jaldi", "final warning",
        "expire", "today only", "aaj tak", "right now",
    ], 12.0),
    "MONEY_DEMAND": ([
        "transfer", "pay", "payment", "deposit", "upi",
        "rs ", "rupees", "lakh", "fee", "fine",
        "processing fee", "security deposit", "bhejo",
        "jama karo", "account number", "invest",
    ], 16.0),
    "INTIMIDATION": ([
        "mat batao", "do not tell", "disconnect mat",
        "kisi ko", "anyone else", "serious charges",
        "consequence", "cooperate", "surveillance",
        "digital arrest", "leave house", "ghar se",
        "police bhej", "force", "compel",
    ], 13.0),
    "IDENTITY_THEFT": ([
        "aadhaar", "pan card", "otp", "password",
        "bank details", "cvv", "pin", "share your",
        "verify identity", "send documents", "verification",
    ], 11.0),
}


# ---------------------------------------------------------------------------
# Corpus loading  (Layer B prep)
# ---------------------------------------------------------------------------

_CORPUS_PATH = Path(__file__).resolve().parent.parent / "data" / "scam_corpus.json"
_corpus: list[dict] | None = None


def _load_corpus() -> list[dict]:
    global _corpus
    if _corpus is not None:
        return _corpus
    try:
        _corpus = json.loads(_CORPUS_PATH.read_text(encoding="utf-8"))
        logger.info("Loaded %d scam corpus entries", len(_corpus))
    except Exception as exc:
        logger.warning("Could not load scam corpus: %s", exc)
        _corpus = []
    return _corpus


# ---------------------------------------------------------------------------
# Optional ML components (Layer B + C)
# ---------------------------------------------------------------------------

_SBERT_AVAILABLE = False
_sbert_model = None
_corpus_embeddings = None

try:
    from sentence_transformers import SentenceTransformer, util as sbert_util  # type: ignore[import-untyped]
    _SBERT_AVAILABLE = True
    logger.info("sentence-transformers available")
except ImportError:
    sbert_util = None
    logger.warning("sentence-transformers not installed — Layer B disabled")


def _ensure_sbert() -> None:
    """Lazy-load SBERT model and pre-compute corpus embeddings."""
    global _sbert_model, _corpus_embeddings
    if _sbert_model is not None:
        return
    if not _SBERT_AVAILABLE:
        return

    t0 = time.time()
    _sbert_model = SentenceTransformer("all-MiniLM-L6-v2")
    logger.info("SBERT model loaded in %.1f s", time.time() - t0)

    corpus = _load_corpus()
    if corpus:
        texts = [entry["text"] for entry in corpus]
        _corpus_embeddings = _sbert_model.encode(texts, convert_to_tensor=True)
        logger.info("Encoded %d corpus entries", len(texts))


# ---------------------------------------------------------------------------
# Classification layers
# ---------------------------------------------------------------------------

def _layer_a_keywords(text: str) -> tuple[float, list[str], list[IntentResult]]:
    """Keyword-based scoring.  Returns (score_0_100, intents, details)."""
    lowered = text.lower()
    total_weight = 0.0
    intents: list[str] = []
    details: list[IntentResult] = []

    for intent, (keywords, weight) in _KEYWORD_CATEGORIES.items():
        hits = [kw for kw in keywords if kw in lowered]
        if hits:
            intent_conf = min(1.0, len(hits) / max(3, len(keywords) * 0.15))
            total_weight += weight * intent_conf
            intents.append(intent)
            details.append(IntentResult(intent=intent, confidence=round(intent_conf, 3)))

    score = min(100.0, round(total_weight, 1))
    return score, intents, details


def _layer_b_similarity(text: str) -> tuple[float, float, str | None]:
    """Cosine similarity vs scam corpus.

    Returns (ml_score_0_100, max_similarity_0_1, matched_id).
    """
    if not _SBERT_AVAILABLE or _sbert_model is None or _corpus_embeddings is None:
        return 0.0, 0.0, None

    query_emb = _sbert_model.encode(text, convert_to_tensor=True)
    cos_scores = sbert_util.cos_sim(query_emb, _corpus_embeddings)[0]
    max_idx = int(cos_scores.argmax())
    max_sim = float(cos_scores[max_idx])

    corpus = _load_corpus()
    matched_id = corpus[max_idx]["id"] if max_idx < len(corpus) else None

    # Convert similarity to 0–100 score (sigmoid-like scaling)
    if max_sim >= 0.85:
        ml_score = 90 + (max_sim - 0.85) * 66.7
    elif max_sim >= 0.70:
        ml_score = 60 + (max_sim - 0.70) * 200
    elif max_sim >= 0.50:
        ml_score = 25 + (max_sim - 0.50) * 175
    else:
        ml_score = max_sim * 50

    return round(min(100.0, ml_score), 1), round(max_sim, 4), matched_id


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

class ScamClassifier:
    """Facade for multi-layer scam classification."""

    def __init__(self) -> None:
        _load_corpus()
        # Trigger lazy SBERT load in background on first classify
        self._sbert_ready = False

    def classify(self, text: str) -> ClassificationResult:
        """Run full multi-layer classification on *text*."""
        if not text or not text.strip():
            return ClassificationResult(verdict="SAFE", confidence=0.99)

        # Layer A — keywords (always available)
        kw_score, intents, details = _layer_a_keywords(text)

        # Layer B — similarity (if SBERT available)
        if not self._sbert_ready:
            _ensure_sbert()
            self._sbert_ready = True

        ml_score, similarity, matched_id = _layer_b_similarity(text)

        # Combined score — weighted blend
        if ml_score > 0:
            combined = kw_score * 0.45 + ml_score * 0.55
        else:
            combined = kw_score  # no ML fallback

        threat_score = round(min(100.0, combined), 1)

        # Verdict
        if threat_score >= 70:
            verdict = "SCAM"
        elif threat_score >= 40:
            verdict = "SUSPICIOUS"
        else:
            verdict = "SAFE"

        # Scam type — from matched corpus entry
        scam_type = None
        if matched_id and similarity >= 0.60:
            corpus = _load_corpus()
            for entry in corpus:
                if entry["id"] == matched_id:
                    scam_type = entry.get("category")
                    # Merge corpus intents with detected intents
                    for ci in entry.get("intents", []):
                        if ci not in intents:
                            intents.append(ci)
                    break

        confidence = round(min(1.0, threat_score / 100 + 0.05), 3)

        return ClassificationResult(
            threat_score=threat_score,
            verdict=verdict,
            scam_type=scam_type,
            intents_detected=intents,
            intent_details=details,
            script_similarity=similarity,
            keyword_score=kw_score,
            ml_score=ml_score,
            confidence=confidence,
            matched_corpus_id=matched_id,
        )


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
_classifier: ScamClassifier | None = None


def get_classifier() -> ScamClassifier:
    global _classifier
    if _classifier is None:
        _classifier = ScamClassifier()
    return _classifier
