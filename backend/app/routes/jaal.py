"""JAAL — fraud network graph intelligence endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Path

from app.models.schemas import ok
from app.services import jaal_service

router = APIRouter(prefix="/jaal", tags=["jaal"])


@router.get("/communities")
def communities():
    return ok(jaal_service.get_communities())


@router.get("/stats")
def stats():
    return ok(jaal_service.get_stats())


@router.get("/graph/{cluster_id}")
def graph(cluster_id: str = Path(...)):
    return ok(jaal_service.get_graph(cluster_id))
