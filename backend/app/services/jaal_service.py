"""JAAL — fraud network graph intelligence (mock data).

Serves a small pre-seeded graph + communities shaped to the frontend
GraphNode / GraphEdge / FraudCommunity types (plan mock strategy references
seed_graph.json, which the real implementation loads).
"""
from __future__ import annotations

from app.models.schemas import GraphEdge, GraphNode

_NODES: list[GraphNode] = [
    GraphNode(id="p1", label="Caller (Mumbai)", type="person", riskScore=0.92),
    GraphNode(id="p2", label="Money Mule", type="mule", riskScore=0.74),
    GraphNode(id="p3", label="Coordinator", type="hub", riskScore=0.88),
    GraphNode(id="ph1", label="+91-98765-43210", type="phone", riskScore=0.95),
    GraphNode(id="ph2", label="+91-98200-11122", type="phone", riskScore=0.61),
    GraphNode(id="a1", label="HDFC **4521", type="account", riskScore=0.83),
    GraphNode(id="a2", label="SBI **7788", type="account", riskScore=0.69),
]

_EDGES: list[GraphEdge] = [
    GraphEdge(id="e1", source="ph1", target="p1", type="OWNS", weight=1.0),
    GraphEdge(id="e2", source="ph2", target="p2", type="OWNS", weight=1.0),
    GraphEdge(id="e3", source="p1", target="ph2", type="CALLED", weight=0.8),
    GraphEdge(id="e4", source="p3", target="p1", type="ASSOCIATED_WITH", weight=0.9),
    GraphEdge(id="e5", source="a1", target="p2", type="OWNS", weight=1.0),
    GraphEdge(id="e6", source="a2", target="p3", type="OWNS", weight=1.0),
    GraphEdge(id="e7", source="a1", target="a2", type="TRANSFERRED_TO", weight=0.7),
]

_COMMUNITIES: list[dict] = [
    {
        "id": "c-07",
        "name": "Mumbai Call Centre Ring",
        "nodeCount": 48,
        "riskScore": 0.86,
        "primaryType": "person",
        "lastActive": "2026-07-14T09:30:00Z",
    },
    {
        "id": "c-12",
        "name": "Pune Counterfeit Corridor",
        "nodeCount": 23,
        "riskScore": 0.71,
        "primaryType": "account",
        "lastActive": "2026-07-14T08:10:00Z",
    },
]


def get_graph(cluster_id: str) -> dict:
    return {
        "clusterId": cluster_id,
        "nodes": [n.model_dump() for n in _NODES],
        "edges": [e.model_dump() for e in _EDGES],
    }


def get_communities() -> list[dict]:
    return _COMMUNITIES
