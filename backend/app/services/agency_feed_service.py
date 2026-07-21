"""Authorised NCRP/NCRB/state/bank feed gateway for DRISHTI.

The public NCRP portal does not expose an unauthenticated production incident
stream. This gateway therefore accepts only an agency-approved, signed feed
contract and records every delivery/deduplication decision persistently.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.config import settings
from app.services.evidence_ledger import append_evidence

_SCHEMA = """
CREATE TABLE IF NOT EXISTS agency_feed_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  received_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  trust TEXT NOT NULL,
  evidence_id TEXT NOT NULL,
  evidence_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  UNIQUE(source, external_id)
);
CREATE INDEX IF NOT EXISTS idx_agency_feed_received ON agency_feed_events(received_at DESC);
"""


def _path() -> Path:
    configured = Path(settings.agency_feed_db_path)
    if not configured.is_absolute():
        configured = Path(__file__).resolve().parents[2] / configured
    configured.parent.mkdir(parents=True, exist_ok=True)
    return configured


def _canonical(data: dict[str, Any]) -> str:
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)


def _connect() -> sqlite3.Connection:
    db = sqlite3.connect(_path(), timeout=15, isolation_level=None)
    db.row_factory = sqlite3.Row
    db.executescript(_SCHEMA)
    return db


def _minimise(payload: dict[str, Any]) -> dict[str, Any]:
    data = dict(payload)
    # Indicators may contain phone/UPI/account values.  Persist a stable hash
    # for correlation; the source agency retains original evidence.
    data["indicators"] = [f"sha256:{hashlib.sha256(item.strip().lower().encode('utf-8')).hexdigest()}" for item in payload.get("indicators", [])]
    return data


def expected_signature(payload: dict[str, Any], timestamp: str) -> str:
    message = f"{timestamp}.{_canonical(payload)}".encode("utf-8")
    return hmac.new(settings.agency_feed_hmac_secret.encode("utf-8"), message, hashlib.sha256).hexdigest()


def verify_delivery(payload: dict[str, Any], timestamp: str | None, signature: str | None) -> str:
    if not settings.agency_feed_hmac_secret:
        return "unverified-local-sandbox"
    if not timestamp or not signature:
        if settings.agency_feed_require_signature:
            raise ValueError("Missing X-Raksha-Timestamp or X-Raksha-Signature")
        return "unverified-local-sandbox"
    try:
        sent_at = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        if abs((datetime.now(timezone.utc) - sent_at).total_seconds()) > settings.agency_feed_max_event_age_seconds:
            raise ValueError("Feed timestamp is outside the permitted replay window")
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError("Invalid X-Raksha-Timestamp") from exc
    supplied = signature.removeprefix("sha256=")
    if not hmac.compare_digest(supplied, expected_signature(payload, timestamp)):
        raise ValueError("Invalid X-Raksha-Signature")
    return "signed-authorised-feed"


def ingest(payload: dict[str, Any], *, trust: str) -> dict[str, Any]:
    """Persist once, link an independently verifiable evidence record, dedupe retries."""
    minimised = _minimise(payload)
    payload_json = _canonical(minimised)
    payload_hash = hashlib.sha256(payload_json.encode("utf-8")).hexdigest()
    with closing(_connect()) as db:
        existing = db.execute(
            "SELECT * FROM agency_feed_events WHERE source=? AND external_id=?", (payload["source"], payload["externalId"])
        ).fetchone()
        if existing:
            return {
                "duplicate": True, "status": existing["status"], "source": existing["source"],
                "externalId": existing["external_id"], "evidenceId": existing["evidence_id"], "evidenceHash": existing["evidence_hash"],
            }
        evidence = append_evidence("AUTHORISED_AGENCY_FEED", {"event": minimised, "payloadHash": payload_hash}, actor="DRISHTI", source=trust)
        db.execute(
            """INSERT INTO agency_feed_events
            (source,external_id,occurred_at,received_at,payload_json,payload_hash,trust,evidence_id,evidence_hash,status)
            VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (payload["source"], payload["externalId"], payload["occurredAt"], datetime.now(timezone.utc).isoformat(), payload_json,
             payload_hash, trust, evidence["evidence_id"], evidence["evidence_hash"], "accepted"),
        )
    return {"duplicate": False, "status": "accepted", "source": payload["source"], "externalId": payload["externalId"], "evidenceId": evidence["evidence_id"], "evidenceHash": evidence["evidence_hash"]}


def recent(limit: int = 50) -> list[dict[str, Any]]:
    with closing(_connect()) as db:
        rows = db.execute("SELECT * FROM agency_feed_events ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    return [
        {"source": row["source"], "externalId": row["external_id"], "occurredAt": row["occurred_at"], "receivedAt": row["received_at"],
         "trust": row["trust"], "status": row["status"], "evidenceId": row["evidence_id"], "evidenceHash": row["evidence_hash"]}
        for row in rows
    ]


def status() -> dict[str, Any]:
    with closing(_connect()) as db:
        count = db.execute("SELECT COUNT(*) AS n FROM agency_feed_events").fetchone()["n"]
    return {
        "endpoint": "/api/v1/drishti/feeds/agency", "acceptedEvents": count,
        "signatureRequired": settings.agency_feed_require_signature, "secretConfigured": bool(settings.agency_feed_hmac_secret),
        "supportedSources": ["NCRP", "NCRB", "STATE_POLICE", "BANK_FICN", "FIU_IND", "TELECOM_PARTNER"],
        "deploymentNote": "Connect only after an agency data-sharing agreement, source-specific credentials and retention policy are approved.",
    }
