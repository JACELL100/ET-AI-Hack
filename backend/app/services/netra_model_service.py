"""NETRA's reproducible, data-gated counterfeit classifier registry.

This compact baseline is intentionally transparent: a logistic classifier over
normalised note-image pixels.  It is not presented as an RBI-certified model.
It creates a real trained artefact only from a versioned manifest of authorised
genuine/FICN images and persists a model card with hold-out metrics and hashes.
The same interface can later host a validated EfficientNet/YOLO model.
"""
from __future__ import annotations

import hashlib
import json
import math
import random
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.config import settings

try:
    from PIL import Image
    import io
    _PIL_AVAILABLE = True
except ImportError:
    Image = None  # type: ignore[assignment]
    _PIL_AVAILABLE = False

try:
    import numpy as np
    import tensorflow as tf
    _TENSORFLOW_AVAILABLE = True
except ImportError:
    np = None  # type: ignore[assignment]
    tf = None  # type: ignore[assignment]
    _TENSORFLOW_AVAILABLE = False


FEATURE_WIDTH, FEATURE_HEIGHT = 24, 12


def _canonical(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)


def _base_path(configured: str) -> Path:
    path = Path(configured)
    if not path.is_absolute():
        path = Path(__file__).resolve().parents[2] / path
    return path


def _model_path() -> Path:
    path = _base_path(settings.netra_model_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path / "active_model.json"


def _card_path() -> Path:
    path = _base_path(settings.netra_model_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path / "active_model_card.json"


def _artifact_path(card: dict[str, Any]) -> Path:
    """Resolve a card-declared artefact without permitting path traversal."""
    model_dir = _base_path(settings.netra_model_dir).resolve()
    filename = str(card.get("artifactFile") or "active_model.json")
    candidate = (model_dir / filename).resolve()
    if candidate.parent != model_dir:
        raise ValueError("NETRA model artifact must be stored directly in NETRA_MODEL_DIR")
    return candidate


def _dataset_manifest(name: str) -> Path:
    root = _base_path(settings.netra_dataset_dir).resolve()
    candidate = (root / name / "manifest.jsonl").resolve()
    if root not in candidate.parents:
        raise ValueError("Dataset path is outside NETRA_DATASET_DIR")
    return candidate


def _hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _features(image_bytes: bytes) -> list[float]:
    if not _PIL_AVAILABLE:
        raise RuntimeError("Pillow is required for NETRA model inference")
    image = Image.open(io.BytesIO(image_bytes)).convert("L").resize((FEATURE_WIDTH, FEATURE_HEIGHT))
    pixels = list(image.getdata())
    mean = sum(pixels) / len(pixels)
    variance = sum((value - mean) ** 2 for value in pixels) / len(pixels)
    std = max(1.0, variance ** 0.5)
    # Per-image standardisation makes exposure changes less dominant while
    # preserving microprint/print-texture differences for the baseline.
    return [(value - mean) / std for value in pixels]


def _sigmoid(value: float) -> float:
    return 1 / (1 + math.exp(-max(-40, min(40, value))))


def _load_manifest(name: str) -> tuple[list[tuple[list[float], int, str]], str]:
    manifest = _dataset_manifest(name)
    if not manifest.exists():
        raise ValueError(f"Approved dataset manifest not found: {manifest}")
    examples: list[tuple[list[float], int, str]] = []
    for line_number, line in enumerate(manifest.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        item = json.loads(line)
        label = str(item.get("label", "")).lower()
        if label not in ("authentic", "counterfeit"):
            raise ValueError(f"Manifest line {line_number}: label must be authentic or counterfeit")
        relative = Path(str(item.get("path", "")))
        image_path = (manifest.parent / relative).resolve()
        if manifest.parent.resolve() not in image_path.parents or not image_path.exists():
            raise ValueError(f"Manifest line {line_number}: image path is invalid")
        examples.append((_features(image_path.read_bytes()), 1 if label == "counterfeit" else 0, str(item.get("denomination", "unknown"))))
    if len(examples) < 20:
        raise ValueError("Training requires at least 20 labelled images; use a held-out set with both classes.")
    labels = {label for _, label, _ in examples}
    if labels != {0, 1}:
        raise ValueError("Training requires both authentic and counterfeit labels.")
    return examples, _hash_file(manifest)


def _metrics(labels: list[int], scores: list[float], threshold: float = 0.5) -> dict[str, float | int]:
    predictions = [int(score >= threshold) for score in scores]
    tp = sum(label == 1 and pred == 1 for label, pred in zip(labels, predictions))
    tn = sum(label == 0 and pred == 0 for label, pred in zip(labels, predictions))
    fp = sum(label == 0 and pred == 1 for label, pred in zip(labels, predictions))
    fn = sum(label == 1 and pred == 0 for label, pred in zip(labels, predictions))
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    return {
        "samples": len(labels), "truePositive": tp, "trueNegative": tn, "falsePositive": fp, "falseNegative": fn,
        "accuracy": round((tp + tn) / len(labels), 4), "precision": round(precision, 4), "recall": round(recall, 4),
        "falsePositiveRate": round(fp / (fp + tn), 4) if fp + tn else 0.0,
    }


def _validate_model_card(card: dict[str, Any]) -> tuple[bool, list[str]]:
    metrics = card.get("holdoutMetrics") or {}
    issues: list[str] = []
    if float(metrics.get("accuracy", 0)) < settings.netra_min_validation_accuracy:
        issues.append("hold-out accuracy is below the configured release threshold")
    if float(metrics.get("falsePositiveRate", 1)) > settings.netra_max_false_positive_rate:
        issues.append("hold-out false-positive rate exceeds the configured release threshold")
    if int(metrics.get("samples", 0)) < 10:
        issues.append("hold-out set is too small")
    return not issues, issues


def status() -> dict[str, Any]:
    model_path, card_path = _model_path(), _card_path()
    if not card_path.exists():
        return {"ready": False, "reason": "No trained NETRA model is registered", "required": "Add an approved manifest and call POST /api/v1/netra/model/train."}
    try:
        card = json.loads(card_path.read_text(encoding="utf-8"))
        artifact_path = _artifact_path(card)
        if not artifact_path.exists():
            return {"ready": False, "reason": f"Registered model artifact is missing: {artifact_path.name}"}
        valid, issues = _validate_model_card(card)
        if card.get("modelSha256") != _hash_file(artifact_path):
            issues.append("model artifact hash does not match model card")
        model_format = card.get("format", card.get("version", "NETRA-LINEAR-1"))
        if model_format == "NETRA-KERAS-1" and not _TENSORFLOW_AVAILABLE:
            issues.append("TensorFlow runtime is required for the registered NETRA-KERAS-1 model")
        if model_format not in ("NETRA-LINEAR-1", "NETRA-KERAS-1"):
            issues.append(f"unsupported NETRA model format: {model_format}")
        feature_count = None
        if model_format == "NETRA-LINEAR-1":
            model = json.loads(artifact_path.read_text(encoding="utf-8"))
            feature_count = len(model.get("weights", []))
        return {
            "ready": valid and not issues,
            "model": {k: card.get(k) for k in ("modelName", "version", "format", "trainedAt", "datasetManifestSha256", "holdoutMetrics", "denominations", "datasetProvenance")},
            "issues": issues, "featureCount": feature_count, "artifactFile": artifact_path.name,
        }
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        return {"ready": False, "reason": f"Invalid registered model: {exc}"}


def train(dataset_name: str, model_name: str, epochs: int, learning_rate: float) -> dict[str, Any]:
    examples, manifest_hash = _load_manifest(dataset_name)
    seed = int(manifest_hash[:16], 16)
    rng = random.Random(seed)
    authentic = [example for example in examples if example[1] == 0]
    counterfeit = [example for example in examples if example[1] == 1]
    rng.shuffle(authentic); rng.shuffle(counterfeit)
    holdout_per_class = max(2, int(min(len(authentic), len(counterfeit)) * 0.2))
    if len(authentic) <= holdout_per_class or len(counterfeit) <= holdout_per_class:
        raise ValueError("Each class needs enough images for a separate stratified hold-out set.")
    validation = authentic[:holdout_per_class] + counterfeit[:holdout_per_class]
    training = authentic[holdout_per_class:] + counterfeit[holdout_per_class:]
    rng.shuffle(training); rng.shuffle(validation)
    weights, bias = [0.0] * (FEATURE_WIDTH * FEATURE_HEIGHT), 0.0
    for _ in range(epochs):
        rng.shuffle(training)
        for feature, label, _ in training:
            prediction = _sigmoid(sum(weight * value for weight, value in zip(weights, feature)) + bias)
            error = label - prediction
            for index, value in enumerate(feature):
                weights[index] += learning_rate * error * value
            bias += learning_rate * error
    holdout_labels = [label for _, label, _ in validation]
    holdout_scores = [_sigmoid(sum(weight * value for weight, value in zip(weights, feature)) + bias) for feature, _, _ in validation]
    metrics = _metrics(holdout_labels, holdout_scores)
    denominations = sorted({denomination for _, _, denomination in examples})
    model = {"format": "NETRA-LINEAR-1", "weights": weights, "bias": bias, "featureWidth": FEATURE_WIDTH, "featureHeight": FEATURE_HEIGHT, "counterfeitThreshold": 0.5}
    model_path = _model_path()
    model_path.write_text(_canonical(model), encoding="utf-8")
    card = {
        "modelName": model_name, "version": "NETRA-LINEAR-1", "format": "NETRA-LINEAR-1", "artifactFile": "active_model.json", "trainedAt": datetime.now(timezone.utc).isoformat(),
        "datasetName": dataset_name, "datasetManifestSha256": manifest_hash, "trainingSamples": len(training),
        "holdoutMetrics": metrics, "denominations": denominations, "modelSha256": _hash_file(model_path),
        "limitations": ["Baseline classifier; not RBI-certified.", "Use only with an authorised, representative FICN dataset and post-deployment monitoring."],
    }
    _card_path().write_text(_canonical(card), encoding="utf-8")
    return status()


def classify(image_bytes: bytes) -> dict[str, Any]:
    state = status()
    if not state.get("ready"):
        raise ValueError("NETRA trained model is unavailable: " + "; ".join(state.get("issues") or [state.get("reason", "model is not release-approved")]))
    card = json.loads(_card_path().read_text(encoding="utf-8"))
    model_format = card.get("format", card.get("version", "NETRA-LINEAR-1"))
    artifact_path = _artifact_path(card)
    threshold = float(card.get("counterfeitThreshold", 0.5))
    if model_format == "NETRA-LINEAR-1":
        model = json.loads(artifact_path.read_text(encoding="utf-8"))
        feature = _features(image_bytes)
        probability = _sigmoid(sum(weight * value for weight, value in zip(model["weights"], feature)) + float(model["bias"]))
        threshold = float(model.get("counterfeitThreshold", threshold))
    elif model_format == "NETRA-KERAS-1":
        if not (_TENSORFLOW_AVAILABLE and _PIL_AVAILABLE and np is not None):
            raise RuntimeError("TensorFlow, NumPy and Pillow are required for NETRA-KERAS-1 inference")
        input_size = card.get("inputSize", [224, 224])
        if not isinstance(input_size, list) or len(input_size) != 2:
            raise ValueError("NETRA-KERAS-1 model card has invalid inputSize")
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((int(input_size[0]), int(input_size[1])))
        batch = np.expand_dims(np.asarray(image, dtype="float32") / 255.0, axis=0)
        model = tf.keras.models.load_model(artifact_path, compile=False)
        output = model.predict(batch, verbose=0)
        probability = float(np.ravel(output)[0])
    else:
        raise ValueError(f"Unsupported NETRA model format: {model_format}")
    probability = max(0.0, min(1.0, probability))
    verdict = "COUNTERFEIT" if probability >= threshold else "AUTHENTIC"
    return {"counterfeitProbability": round(probability, 4), "verdict": verdict, "confidence": round(max(probability, 1 - probability), 4), "model": state["model"]}


def evaluate(dataset_name: str) -> dict[str, Any]:
    state = status()
    if not state.get("ready"):
        raise ValueError("NETRA trained model is unavailable")
    card = json.loads(_card_path().read_text(encoding="utf-8"))
    if card.get("format", card.get("version")) == "NETRA-KERAS-1":
        return {"datasetName": dataset_name, "metrics": card.get("holdoutMetrics"), "model": state["model"], "evaluationMode": "Metrics are the signed Colab hold-out report in the imported model card; rerun Colab for an external evaluation set."}
    examples, manifest_hash = _load_manifest(dataset_name)
    model = json.loads(_artifact_path(card).read_text(encoding="utf-8"))
    scores = [_sigmoid(sum(weight * value for weight, value in zip(model["weights"], feature)) + float(model["bias"])) for feature, _, _ in examples]
    return {"datasetName": dataset_name, "datasetManifestSha256": manifest_hash, "metrics": _metrics([label for _, label, _ in examples], scores), "model": state["model"]}
