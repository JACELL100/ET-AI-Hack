"""Persistent, independently verifiable evidence ledger.

Records are stored in SQLite (transactional, append-only at the application
layer), linked by SHA-256 hashes, and signed with a persistent Ed25519 key.
Anyone holding the exported public key can independently verify the record
chain and signatures. This establishes technical integrity; legal
admissibility still depends on lawful collection, source-system preservation,
access controls, retention, and the applicable court/agency procedure.
"""
from __future__ import annotations

import base64
import hashlib
import json
import sqlite3
import threading
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey

from app.config import settings

_LOCK = threading.Lock()
_SCHEMA = """
CREATE TABLE IF NOT EXISTS evidence_records (
  sequence INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  actor TEXT NOT NULL,
  source TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  previous_hash TEXT NOT NULL,
  record_hash TEXT NOT NULL UNIQUE,
  signature_b64 TEXT NOT NULL,
  key_id TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_evidence_record_id ON evidence_records(record_id);
CREATE INDEX IF NOT EXISTS idx_evidence_hash ON evidence_records(record_hash);
"""


def _runtime_path(configured: str) -> Path:
    path = Path(configured)
    if not path.is_absolute():
        path = Path(__file__).resolve().parents[2] / path
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _database_path() -> Path:
    return _runtime_path(settings.evidence_ledger_path)


def _private_key_path() -> Path:
    return _runtime_path(settings.evidence_signing_private_key_path)


def _public_key_path() -> Path:
    return _runtime_path(settings.evidence_signing_public_key_path)


def _canonical(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)


def _fingerprint(value: str | None) -> str | None:
    if not value:
        return None
    return f"sha256:{hashlib.sha256(value.strip().lower().encode('utf-8')).hexdigest()}"


def _minimise(value: Any, key: str = "") -> Any:
    """Store correlation-safe fingerprints instead of direct personal identifiers."""
    sensitive = {"caller", "callee", "asserted_caller_id", "beneficiary", "phone", "account", "upi", "reporter_name"}
    if key.lower() in sensitive and isinstance(value, str):
        return _fingerprint(value)
    if isinstance(value, dict):
        return {name: _minimise(item, name) for name, item in value.items()}
    if isinstance(value, list):
        return [_minimise(item) for item in value]
    return value


def _connect() -> sqlite3.Connection:
    connection = sqlite3.connect(_database_path(), timeout=15, isolation_level=None)
    connection.row_factory = sqlite3.Row
    connection.executescript(_SCHEMA)
    return connection


def _load_or_create_signing_key() -> tuple[Ed25519PrivateKey, str]:
    private_path, public_path = _private_key_path(), _public_key_path()
    if private_path.exists():
        private_key = serialization.load_pem_private_key(private_path.read_bytes(), password=None)
        if not isinstance(private_key, Ed25519PrivateKey):
            raise RuntimeError("Evidence private key must be Ed25519")
    else:
        private_key = Ed25519PrivateKey.generate()
        private_path.write_bytes(private_key.private_bytes(
            serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption(),
        ))
    public_bytes = private_key.public_key().public_bytes(
        serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    if not public_path.exists() or public_path.read_bytes() != public_bytes:
        public_path.write_bytes(public_bytes)
    key_id = f"ed25519:{hashlib.sha256(public_bytes).hexdigest()[:16]}"
    return private_key, key_id


def public_key_bundle() -> dict[str, str]:
    """Return the public verifier material; never returns a private key."""
    _, key_id = _load_or_create_signing_key()
    return {"algorithm": "Ed25519", "keyId": key_id, "publicKeyPem": _public_key_path().read_text(encoding="utf-8")}


def _record_without_hash(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "recordId": record["record_id"], "eventType": record["event_type"], "recordedAt": record["recorded_at"],
        "actor": record["actor"], "source": record["source"], "payload": json.loads(record["payload_json"]),
        "payloadHash": record["payload_hash"], "previousHash": record["previous_hash"], "keyId": record["key_id"],
    }


def append_evidence(event_type: str, payload: dict[str, Any], *, actor: str, source: str) -> dict[str, str]:
    """Atomically append a minimised, signed evidence record."""
    private_key, key_id = _load_or_create_signing_key()
    minimised_payload = _minimise(payload)
    payload_json = _canonical(minimised_payload)
    payload_hash = hashlib.sha256(payload_json.encode("utf-8")).hexdigest()
    with _LOCK, closing(_connect()) as db:
        db.execute("BEGIN IMMEDIATE")
        previous = db.execute("SELECT record_hash FROM evidence_records ORDER BY sequence DESC LIMIT 1").fetchone()
        record = {
            "record_id": f"EV-{uuid4().hex[:16].upper()}", "event_type": event_type,
            "recorded_at": datetime.now(timezone.utc).isoformat(), "actor": actor, "source": source,
            "payload_json": payload_json, "payload_hash": payload_hash,
            "previous_hash": previous["record_hash"] if previous else "GENESIS", "key_id": key_id,
        }
        canonical_record = _canonical(_record_without_hash(record))
        record_hash = hashlib.sha256(canonical_record.encode("utf-8")).hexdigest()
        signature_b64 = base64.b64encode(private_key.sign(record_hash.encode("ascii"))).decode("ascii")
        db.execute(
            """INSERT INTO evidence_records
            (record_id,event_type,recorded_at,actor,source,payload_json,payload_hash,previous_hash,record_hash,signature_b64,key_id)
            VALUES (:record_id,:event_type,:recorded_at,:actor,:source,:payload_json,:payload_hash,:previous_hash,:record_hash,:signature_b64,:key_id)""",
            {**record, "record_hash": record_hash, "signature_b64": signature_b64},
        )
        db.execute("COMMIT")
    return {"evidence_id": record["record_id"], "evidence_hash": record_hash, "key_id": key_id}


def get_evidence(record_id: str) -> dict[str, Any] | None:
    with closing(_connect()) as db:
        row = db.execute("SELECT * FROM evidence_records WHERE record_id = ?", (record_id,)).fetchone()
    if row is None:
        return None
    record = _record_without_hash(dict(row))
    record.update({"recordHash": row["record_hash"], "signature": row["signature_b64"], "signatureAlgorithm": "Ed25519"})
    return record


def verify_ledger() -> dict[str, Any]:
    """Verify every chain link and Ed25519 signature using only the public key."""
    bundle = public_key_bundle()
    public_key = serialization.load_pem_public_key(bundle["publicKeyPem"].encode("utf-8"))
    if not isinstance(public_key, Ed25519PublicKey):
        raise RuntimeError("Evidence public key must be Ed25519")
    previous, count = "GENESIS", 0
    with closing(_connect()) as db:
        rows = db.execute("SELECT * FROM evidence_records ORDER BY sequence ASC").fetchall()
    for index, row in enumerate(rows, start=1):
        raw = dict(row)
        record = _record_without_hash(raw)
        expected_hash = hashlib.sha256(_canonical(record).encode("utf-8")).hexdigest()
        if raw["previous_hash"] != previous or raw["record_hash"] != expected_hash:
            return {"valid": False, "recordCount": count, "failedAt": index, "reason": "hash-chain mismatch", "keyId": bundle["keyId"]}
        try:
            public_key.verify(base64.b64decode(raw["signature_b64"]), raw["record_hash"].encode("ascii"))
        except Exception:
            return {"valid": False, "recordCount": count, "failedAt": index, "reason": "signature verification failed", "keyId": bundle["keyId"]}
        previous, count = raw["record_hash"], count + 1
    return {"valid": True, "recordCount": count, "lastHash": previous, "algorithm": "Ed25519 + SHA-256", "keyId": bundle["keyId"], "database": str(_database_path())}
