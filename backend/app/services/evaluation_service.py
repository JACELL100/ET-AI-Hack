"""Reproducible evaluation utilities for RAKSHA model-governance gates."""
from __future__ import annotations

from typing import Callable


def binary_metrics(labels: list[bool], predictions: list[bool]) -> dict[str, float | int]:
    """Return transparent binary-classification measures without hidden averages."""
    if len(labels) != len(predictions) or not labels:
        raise ValueError("labels and predictions must have the same non-zero length")
    tp = sum(actual and predicted for actual, predicted in zip(labels, predictions))
    tn = sum(not actual and not predicted for actual, predicted in zip(labels, predictions))
    fp = sum(not actual and predicted for actual, predicted in zip(labels, predictions))
    fn = sum(actual and not predicted for actual, predicted in zip(labels, predictions))
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {
        "samples": len(labels), "truePositive": tp, "trueNegative": tn, "falsePositive": fp, "falseNegative": fn,
        "precision": round(precision, 4), "recall": round(recall, 4), "f1": round(f1, 4),
        "falsePositiveRate": round(fp / (fp + tn), 4) if fp + tn else 0.0,
        "accuracy": round((tp + tn) / len(labels), 4),
    }


def evaluate_text_samples(samples: list[dict], analyse: Callable[[str], dict], threshold: float) -> dict:
    """Evaluate SENTINEL on a supplied labelled hold-out dataset."""
    labels = [sample["label"] == "scam" for sample in samples]
    scores = [float(analyse(sample["text"]).get("threat_score", 0)) for sample in samples]
    predictions = [score >= threshold for score in scores]
    return {
        "module": "SENTINEL", "task": "binary scam detection", "threshold": threshold,
        "metrics": binary_metrics(labels, predictions),
        "perSample": [
            {"id": sample["id"], "label": sample["label"], "score": round(score, 2), "prediction": "scam" if prediction else "safe"}
            for sample, score, prediction in zip(samples, scores, predictions)
        ],
        "governance": {
            "publicationRule": "Report these metrics only with a versioned, consented hold-out dataset and model version.",
            "minimumChecks": ["stratify by language and scam type", "review false positives", "measure lead time on replayed event timelines"],
        },
    }
