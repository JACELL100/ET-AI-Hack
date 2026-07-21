"""JAAL — fraud network graph intelligence endpoints."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, HTTPException, Path, Query

from app.models.schemas import (
    JaalCitizenReportRequest,
    JaalEvidencePackageRequest,
    JaalModuleSignalRequest,
    JaalTraceRequest,
    ok,
)
from app.services import jaal_service

router = APIRouter(prefix="/jaal", tags=["jaal"])


@router.get("/communities")
def communities():
    return ok(jaal_service.get_communities())


@router.get("/stats")
def stats():
    return ok(jaal_service.get_stats())


@router.get("/search")
def search(
    q: Annotated[str, Query(min_length=2, max_length=160)],
    limit: Annotated[int, Query(ge=1, le=20)] = 10,
):
    """Find a reported phone, account, UPI handle, or known graph entity."""
    return ok(jaal_service.search_entities(q, limit))


@router.post("/citizen-report")
def citizen_report(req: JaalCitizenReportRequest):
    """Ingest a citizen signal and immediately correlate it against the graph."""
    return ok(jaal_service.submit_citizen_report(req.model_dump()))


@router.post("/ingest")
def ingest(req: JaalModuleSignalRequest):
    """Ingest a transaction anomaly or another agent's high-confidence signal."""
    return ok(jaal_service.ingest_module_signal(
        req.sourceModule, req.entityValue, req.description,
        entity_type=req.entityType, risk_score=req.riskScore,
    ))


@router.get("/citizen-reports")
def citizen_reports(limit: Annotated[int, Query(ge=1, le=50)] = 25):
    return ok(jaal_service.get_citizen_reports(limit))


@router.post("/trace")
def trace(req: JaalTraceRequest):
    """Trace the shortest linked money/relationship path between two nodes."""
    return ok(jaal_service.trace_relationships(req.model_dump()))


@router.post("/evidence-package")
def evidence_package(req: JaalEvidencePackageRequest):
    """Create a durable, hash-verified investigation evidence package."""
    return ok(jaal_service.generate_evidence_package(req.model_dump()))


@router.get("/evidence-package/{package_id}")
def get_evidence_package(package_id: str):
    """Retrieve a persisted evidence package after process restart."""
    package = jaal_service.get_evidence_package(package_id)
    if package is None:
        raise HTTPException(status_code=404, detail="Evidence package not found")
    return ok(package)


@router.get("/evidence-package/{package_id}/verify")
def verify_evidence_package(package_id: str):
    """Verify package SHA-256, persisted contents, and its Ed25519 ledger link."""
    verification = jaal_service.verify_evidence_package(package_id)
    if verification.get("reason") == "package not found":
        raise HTTPException(status_code=404, detail="Evidence package not found")
    return ok(verification)


@router.get("/graph/{cluster_id}")
def graph(cluster_id: str = Path(...)):
    return ok(jaal_service.get_graph(cluster_id))
