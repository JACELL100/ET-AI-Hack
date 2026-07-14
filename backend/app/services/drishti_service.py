"""DRISHTI — geospatial crime pattern intelligence (mock data).

Pre-seeded incident points around Mumbai / Delhi shaped to the frontend
HotspotData type. Real implementation uses Mapbox + live incident feeds.
"""
from __future__ import annotations

from app.models.schemas import HotspotData

_HOTSPOTS: list[HotspotData] = [
    HotspotData(id="h1", lat=19.0760, lng=72.8777, intensity=0.91, type="scam", district="Mumbai Central"),
    HotspotData(id="h2", lat=19.2183, lng=72.9781, intensity=0.74, type="counterfeit", district="Navi Mumbai"),
    HotspotData(id="h3", lat=28.6139, lng=77.2090, intensity=0.82, type="scam", district="New Delhi"),
    HotspotData(id="h4", lat=19.0880, lng=72.8800, intensity=0.63, type="network", district="Bandra"),
    HotspotData(id="h5", lat=28.5355, lng=77.3910, intensity=0.55, type="counterfeit", district="Noida"),
]


def get_hotspots() -> list[dict]:
    return [h.model_dump() for h in _HOTSPOTS]


def get_heatmap() -> list[dict]:
    return [
        {"lat": h.lat, "lng": h.lng, "weight": h.intensity, "type": h.type}
        for h in _HOTSPOTS
    ]
