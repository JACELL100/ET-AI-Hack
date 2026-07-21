from __future__ import annotations

import unittest
import shutil
import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.models.schemas import AgencyFeedIncidentRequest
from app.services.evaluation_service import binary_metrics
from app.services import agency_feed_service


class LiveIntelligenceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.ledger_setting = settings.evidence_ledger_path
        self.package_db_setting = settings.evidence_package_db_path
        self.secret_setting = settings.integration_hmac_secret
        self.require_signature_setting = settings.integration_require_signature
        self.private_key_setting = settings.evidence_signing_private_key_path
        self.public_key_setting = settings.evidence_signing_public_key_path
        self.agency_db_setting = settings.agency_feed_db_path
        self.agency_secret_setting = settings.agency_feed_hmac_secret
        self.agency_require_signature_setting = settings.agency_feed_require_signature
        self.netra_model_dir_setting = settings.netra_model_dir
        self.netra_dataset_dir_setting = settings.netra_dataset_dir
        settings.evidence_ledger_path = "data_runtime/test_live_intelligence_ledger.jsonl"
        settings.evidence_package_db_path = "data_runtime/test_evidence_packages.sqlite3"
        settings.evidence_signing_private_key_path = "data_runtime/test_evidence_private.pem"
        settings.evidence_signing_public_key_path = "data_runtime/test_evidence_public.pem"
        settings.agency_feed_db_path = "data_runtime/test_agency_feeds.sqlite3"
        settings.integration_hmac_secret = ""
        settings.integration_require_signature = False
        settings.agency_feed_hmac_secret = ""
        settings.agency_feed_require_signature = False
        settings.netra_model_dir = "data_runtime/test_netra_models"
        settings.netra_dataset_dir = "data_runtime/test_netra_datasets"
        self.ledger_path = Path(__file__).resolve().parents[1] / settings.evidence_ledger_path
        self.package_db_path = Path(__file__).resolve().parents[1] / settings.evidence_package_db_path
        self.private_key_path = Path(__file__).resolve().parents[1] / settings.evidence_signing_private_key_path
        self.public_key_path = Path(__file__).resolve().parents[1] / settings.evidence_signing_public_key_path
        self.agency_db_path = Path(__file__).resolve().parents[1] / settings.agency_feed_db_path
        self.netra_model_path = Path(__file__).resolve().parents[1] / settings.netra_model_dir
        self.netra_dataset_path = Path(__file__).resolve().parents[1] / settings.netra_dataset_dir
        if self.ledger_path.exists():
            self.ledger_path.unlink()
        for path in (self.ledger_path, self.private_key_path, self.public_key_path, self.agency_db_path, self.package_db_path):
            if path.exists():
                path.unlink()
        if self.netra_model_path.exists():
            shutil.rmtree(self.netra_model_path)
        if self.netra_dataset_path.exists():
            shutil.rmtree(self.netra_dataset_path)
        self.client = TestClient(app)

    def tearDown(self) -> None:
        settings.evidence_ledger_path = self.ledger_setting
        settings.evidence_package_db_path = self.package_db_setting
        settings.evidence_signing_private_key_path = self.private_key_setting
        settings.evidence_signing_public_key_path = self.public_key_setting
        settings.agency_feed_db_path = self.agency_db_setting
        settings.integration_hmac_secret = self.secret_setting
        settings.integration_require_signature = self.require_signature_setting
        settings.agency_feed_hmac_secret = self.agency_secret_setting
        settings.agency_feed_require_signature = self.agency_require_signature_setting
        settings.netra_model_dir = self.netra_model_dir_setting
        settings.netra_dataset_dir = self.netra_dataset_dir_setting
        for path in (self.ledger_path, self.private_key_path, self.public_key_path, self.agency_db_path, self.package_db_path):
            if path.exists():
                path.unlink()
        if self.netra_model_path.exists():
            shutil.rmtree(self.netra_model_path)
        if self.netra_dataset_path.exists():
            shutil.rmtree(self.netra_dataset_path)

    def test_multisignal_event_creates_explainable_alert_and_evidence(self) -> None:
        response = self.client.post("/api/v1/sentinel/ingest/live", json={
            "event_id": "test-consented-event", "transcript": "CBI says you are under arrest. Transfer money immediately.",
            "consent_reference": "TEST-CONSENT", "telecom": {
                "provider": "Test Telecom", "caller": "+919999999999", "callee": "+919812345678",
                "asserted_caller_id": "+911800000000", "cli_verified": False, "stir_shaken_attestation": "failed",
                "line_type": "voip", "call_attempts_24h": 30, "district": "Mumbai", "state": "Maharashtra",
            },
            "video": {"provider": "Test Video", "deepfake_probability": 0.8, "virtual_camera_detected": True,
                      "identity_claim": "CBI officer", "official_identity_verified": False},
            "payment": {"provider": "Test PSP", "beneficiary": "test@upi", "mule_risk_score": 0.9,
                        "beneficiary_name_mismatch": True},
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["verdict"], "SCAM")
        self.assertGreaterEqual(data["threat_score"], 82)
        self.assertTrue(data["alert_created"])
        self.assertTrue(data["evidence_id"].startswith("EV-"))
        verification = self.client.get("/api/v1/sentinel/evidence/verify").json()["data"]
        self.assertTrue(verification["valid"])
        self.assertGreaterEqual(verification["recordCount"], 1)
        key = self.client.get("/api/v1/sentinel/evidence/public-key").json()["data"]
        self.assertEqual(key["algorithm"], "Ed25519")

    def test_signed_agency_contract_deduplicates_external_events(self) -> None:
        settings.agency_feed_hmac_secret = "test-agency-contract-secret"
        settings.agency_feed_require_signature = True
        payload = {
            "source": "NCRP", "externalId": "NCRP-TEST-001", "occurredAt": "2026-07-21T10:00:00Z",
            "type": "scam", "severity": "high", "district": "Mumbai", "state": "Maharashtra",
            "description": "Authorised test complaint for a digital-arrest campaign.", "indicators": ["9999999999"],
        }
        timestamp = datetime.now(timezone.utc).isoformat()
        canonical_payload = AgencyFeedIncidentRequest(**payload).model_dump(mode="json")
        headers = {
            "X-Raksha-Timestamp": timestamp,
            "X-Raksha-Signature": f"sha256={agency_feed_service.expected_signature(canonical_payload, timestamp)}",
        }
        first = self.client.post("/api/v1/drishti/feeds/agency", json=payload, headers=headers)
        self.assertEqual(first.status_code, 200)
        self.assertFalse(first.json()["data"]["feed"]["duplicate"])
        self.assertEqual(first.json()["data"]["trust"], "signed-authorised-feed")
        repeat = self.client.post("/api/v1/drishti/feeds/agency", json=payload, headers=headers)
        self.assertTrue(repeat.json()["data"]["feed"]["duplicate"])
        recent = self.client.get("/api/v1/drishti/feeds/recent").json()["data"]
        self.assertEqual(recent[0]["externalId"], "NCRP-TEST-001")

    def test_jaal_evidence_package_is_durable_and_independently_verifiable(self) -> None:
        created = self.client.post("/api/v1/jaal/evidence-package", json={
            "communityId": "c-mumbai", "selectedNodeIds": ["mum-hub-1", "mum-ph-1"],
            "title": "Test technical integrity package", "investigator": "Test Officer",
        })
        self.assertEqual(created.status_code, 200)
        package = created.json()["data"]
        package_id = package["id"]
        stored = self.client.get(f"/api/v1/jaal/evidence-package/{package_id}")
        self.assertEqual(stored.status_code, 200)
        self.assertEqual(stored.json()["data"]["integrity"]["hash"], package["integrity"]["hash"])
        verification = self.client.get(f"/api/v1/jaal/evidence-package/{package_id}/verify")
        self.assertEqual(verification.status_code, 200)
        self.assertTrue(verification.json()["data"]["valid"], verification.json())

    def test_metrics_are_not_smoothed_or_hidden(self) -> None:
        metrics = binary_metrics([True, True, False, False], [True, False, True, False])
        self.assertEqual(metrics["truePositive"], 1)
        self.assertEqual(metrics["falsePositive"], 1)
        self.assertEqual(metrics["falseNegative"], 1)
        self.assertEqual(metrics["precision"], 0.5)
        self.assertEqual(metrics["recall"], 0.5)
        self.assertEqual(metrics["falsePositiveRate"], 0.5)

    def test_netra_refuses_to_invent_a_verdict_without_a_validated_model(self) -> None:
        status = self.client.get("/api/v1/netra/model/status").json()["data"]
        self.assertFalse(status["ready"])
        response = self.client.post("/api/v1/netra/scan", files={"file": ("note.jpg", b"not-a-banknote", "image/jpeg")})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["success"])
        self.assertIn("trained model is unavailable", response.json()["error"])

    def test_netra_training_registry_trains_and_validates_a_manifest_model(self) -> None:
        dataset = self.netra_dataset_path / "test-ficn" / "images"
        dataset.mkdir(parents=True)
        rows = []
        for label in ("authentic", "counterfeit"):
            for index in range(25):
                image = Image.new("L", (48, 48))
                pixels = image.load()
                for y in range(48):
                    for x in range(48):
                        if label == "authentic":
                            pixels[x, y] = 25 if x < 24 else 230
                        else:
                            pixels[x, y] = 25 if y < 24 else 230
                filename = f"{label}-{index}.png"
                image.save(dataset / filename)
                rows.append({"path": f"images/{filename}", "label": label, "denomination": "500"})
        manifest = dataset.parent / "manifest.jsonl"
        manifest.write_text("\n".join(json.dumps(row) for row in rows), encoding="utf-8")
        trained = self.client.post("/api/v1/netra/model/train", json={"datasetName": "test-ficn", "modelName": "test-ficn-baseline", "epochs": 80})
        self.assertTrue(trained.json()["data"]["ready"], trained.json())
        evaluation = self.client.post("/api/v1/netra/model/evaluate", json={"datasetName": "test-ficn"}).json()["data"]
        self.assertGreaterEqual(evaluation["metrics"]["accuracy"], 0.9)
        scanned = self.client.post(
            "/api/v1/netra/scan",
            files={"file": ("counterfeit.png", (dataset / "counterfeit-0.png").read_bytes(), "image/png")},
            params={"denomination": "500"},
        ).json()["data"]
        self.assertEqual(scanned["verdict"], "COUNTERFEIT")
        self.assertTrue(scanned["requires_manual_security_feature_review"])


if __name__ == "__main__":
    unittest.main()
