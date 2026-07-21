# Live intelligence integration guide

RAKSHA AI exposes a real-time, vendor-neutral webhook at:

`POST /api/v1/sentinel/ingest/live`

It is designed for an authorised telecom operator, video-conferencing provider,
bank, or payment service provider. It does not scrape calls, intercept video,
or access accounts. The partner must have a lawful data-sharing basis, retain
the original evidence, and transmit only the metadata permitted for the case.

## What the webhook evaluates

- Telecom: asserted caller ID versus network caller, CLI verification,
  attestation, line type, forwarding hops, SIM/port age, and aggregate call
  velocity.
- Video: virtual camera, upstream deepfake probability, A/V desynchronisation,
  identity claim verification, and screen sharing.
- Payments: a PSP's beneficiary mule-risk score, beneficiary-name mismatch,
  account age, and aggregate velocity. No PIN, CVV, account balance, or card
  number is accepted.
- Content: the existing SENTINEL transcript classifier, when a consented or
  otherwise authorised transcript is supplied.

The API returns a 0–100 fused score, the individual signal contributions,
plain-language reasons, immediate safety actions, and an evidence ledger ID.
Scores are leads for analyst review—not proof of a crime and not a reason to
automatically freeze an account or block a subscriber.

## Secure deployment

Set these values in `backend/.env`:

```env
INTEGRATION_HMAC_SECRET=<long random secret shared with one partner>
INTEGRATION_REQUIRE_SIGNATURE=true
INTEGRATION_MAX_EVENT_AGE_SECONDS=300
EVIDENCE_LEDGER_PATH=data_runtime/evidence_ledger.sqlite3
EVIDENCE_PACKAGE_DB_PATH=data_runtime/evidence_packages.sqlite3
```

The partner sends ISO-8601 UTC `X-Raksha-Timestamp` and
`X-Raksha-Signature: sha256=<hex>`. The signature is HMAC-SHA256 of:

```text
<timestamp>.<canonical JSON event>
```

where canonical JSON has sorted keys and compact separators. The helper
`app.services.sentinel_intelligence.expected_signature()` is the reference
implementation for a partner sandbox. Use a dedicated secret per partner in a
production secrets manager, require mTLS/API gateway authentication, and rotate
keys. An unsigned event is labelled `unverified-local-demo`; it can be disabled
entirely with `INTEGRATION_REQUIRE_SIGNATURE=true`.

## Minimal event

```json
{
  "event_id": "operator-event-123",
  "occurred_at": "2026-07-21T10:00:00Z",
  "transcript": "This is CBI. Transfer money immediately.",
  "consent_reference": "case-or-consent-reference",
  "telecom": {
    "provider": "Authorised Telecom Partner",
    "caller": "+919999999999",
    "callee": "+919812345678",
    "asserted_caller_id": "+911800555000",
    "cli_verified": false,
    "stir_shaken_attestation": "failed",
    "line_type": "voip",
    "call_attempts_24h": 25,
    "district": "Mumbai",
    "state": "Maharashtra"
  },
  "video": {
    "provider": "Authorised Video Provider",
    "deepfake_probability": 0.82,
    "virtual_camera_detected": true,
    "identity_claim": "CBI officer",
    "official_identity_verified": false
  },
  "payment": {
    "provider": "Authorised PSP",
    "beneficiary": "masked-or-tokenised-beneficiary",
    "mule_risk_score": 0.91,
    "beneficiary_name_mismatch": true
  }
}
```

## Downstream intelligence and auditability

A high-confidence event creates three linked, reviewable objects:

1. A SENTINEL alert for the command centre.
2. A privacy-minimised JAAL lead in **Signed Live Intelligence Review Queue**;
   it stays separate from confirmed investigations.
3. A DRISHTI live incident for the geospatial feed.

The local evidence ledger creates SHA-256 hash-chained records and fingerprints
caller/callee/beneficiary values before persistence. Verify it through
`GET /api/v1/sentinel/evidence/verify`. For legal proceedings, export original
partner records through the source system, preserve the consent/legal-process
reference, apply agency retention policy, and use approved WORM storage and
digital signatures. A local hash chain alone is not a court-admissibility claim.

## NCRP and agency incidents

Authorised NCRP, NCRB, State Police, bank-FICN, FIU-IND and telecom feeds use
`POST /api/v1/drishti/feeds/agency`. It has the same timestamped HMAC contract
and requires a data-sharing agreement, source-specific credentials and an
agency-approved retention policy. Each accepted delivery is deduplicated by
`source + externalId`, stored in SQLite, linked to the signed ledger, sent to
DRISHTI in real time, and correlated in JAAL. The public NCRP portal is not an
unauthenticated production stream, so this project does not claim a live NCRP
connection without approved credentials.
