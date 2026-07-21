"""Durable JAAL evidence-package store and independent integrity verifier.

The signed event ledger proves chronology.  This store preserves the exported
package that was submitted for review, so its bytes and ledger linkage remain
available after an API-process restart.  It establishes technical integrity;
lawful acquisition, original-source preservation, access logging and agency
procedure are still required for court admissibility.
"""
from __future__ import annotations

import hashlib
import json
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.config import settings
from app.services.evidence_ledger import get_evidence, verify_ledger

_SCHEMA = """
CREATE TABLE IF NOT EXISTS evidence_packages (
  package_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  package_json TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  ledger_evidence_id TEXT NOT NULL,
  ledger_record_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_evidence_packages_created ON evidence_packages(created_at DESC);
"""


def _path() -> Path:
    path = Path(settings.evidence_package_db_path)
    if not path.is_absolute():
        path = Path(__file__).resolve().parents[2] / path
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _canonical(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)


def _connect() -> sqlite3.Connection:
    db = sqlite3.connect(_path(), timeout=15, isolation_level=None)
    db.row_factory = sqlite3.Row
    db.executescript(_SCHEMA)
    return db


def persist_package(package: dict[str, Any]) -> dict[str, str]:
    """Write the exact package once; package IDs are immutable identifiers."""
    integrity = package.get("integrity") or {}
    package_id = package.get("id")
    payload_hash = integrity.get("hash")
    ledger_id = integrity.get("ledgerEvidenceId")
    ledger_hash = integrity.get("ledgerRecordHash")
    if not all(isinstance(value, str) and value for value in (package_id, payload_hash, ledger_id, ledger_hash)):
        raise ValueError("Evidence package is missing immutable integrity metadata")
    package_json = _canonical(package)
    with closing(_connect()) as db:
        existing = db.execute("SELECT package_json FROM evidence_packages WHERE package_id = ?", (package_id,)).fetchone()
        if existing:
            if existing["package_json"] != package_json:
                raise ValueError("Evidence package ID collision with different content")
            return {"packageId": package_id, "status": "already-persisted"}
        db.execute(
            """INSERT INTO evidence_packages
            (package_id,created_at,package_json,payload_hash,ledger_evidence_id,ledger_record_hash)
            VALUES (?,?,?,?,?,?)""",
            (package_id, datetime.now(timezone.utc).isoformat(), package_json, payload_hash, ledger_id, ledger_hash),
        )
    return {"packageId": package_id, "status": "persisted"}


def get_package(package_id: str) -> dict[str, Any] | None:
    with closing(_connect()) as db:
        row = db.execute("SELECT package_json FROM evidence_packages WHERE package_id = ?", (package_id,)).fetchone()
    return json.loads(row["package_json"]) if row else None


def verify_package(package_id: str) -> dict[str, Any]:
    """Verify package bytes, the signed ledger record, and the complete ledger chain."""
    package = get_package(package_id)
    if package is None:
        return {"valid": False, "packageId": package_id, "reason": "package not found"}
    integrity = package.get("integrity") or {}
    payload = package.get("payload")
    calculated_payload_hash = hashlib.sha256(_canonical(payload).encode("utf-8")).hexdigest()
    if integrity.get("hash") != calculated_payload_hash:
        return {"valid": False, "packageId": package_id, "reason": "package payload hash mismatch"}
    ledger_id = integrity.get("ledgerEvidenceId")
    ledger_hash = integrity.get("ledgerRecordHash")
    ledger_record = get_evidence(ledger_id) if isinstance(ledger_id, str) else None
    if ledger_record is None or ledger_record.get("recordHash") != ledger_hash:
        return {"valid": False, "packageId": package_id, "reason": "ledger evidence linkage mismatch"}
    chain = verify_ledger()
    if not chain.get("valid"):
        return {"valid": False, "packageId": package_id, "reason": "signed ledger verification failed", "ledger": chain}
    return {
        "valid": True, "packageId": package_id, "payloadHash": calculated_payload_hash,
        "ledgerEvidenceId": ledger_id, "ledgerRecordHash": ledger_hash,
        "ledger": chain, "verificationScope": "package SHA-256, persisted package bytes, ledger link, Ed25519 ledger chain",
    }
