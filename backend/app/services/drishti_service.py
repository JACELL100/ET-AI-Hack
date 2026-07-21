"""DRISHTI — geospatial public-safety intelligence.

Historical scenario data is retained only as clearly separated development
baseline data. Operational events arrive through the authorised agency-feed
gateway or other signed module integrations; random incidents are never
emitted as a live operational event.
"""
from __future__ import annotations

import logging
import random
from datetime import datetime, timedelta

from app.config import settings
from supabase import create_client, Client

from app.models.schemas import (
    DrishtiStats, HotspotDetailed, Incident, PatrolRoute,
    PredictionZone, DistrictStat, Waypoint,
)

logger = logging.getLogger("raksha.drishti")
_supabase_client: Client | None = None
_seeded = False

# ── Table names in public schema ──────────────────────────────────────────────
_TBL_INCIDENTS = "drishti_incidents"
_TBL_REPORTS   = "drishti_citizen_reports"


def _get_supabase() -> Client | None:
    """Return a Supabase client and auto-seed the incidents table if empty."""
    global _supabase_client, _seeded
    if _supabase_client is None:
        if settings.supabase_url and settings.supabase_service_key:
            try:
                _supabase_client = create_client(settings.supabase_url, settings.supabase_service_key)
                logger.info("Supabase client initialized for DRISHTI (public schema).")
            except Exception as e:
                logger.warning("Supabase init failed for DRISHTI: %s", e)
                _supabase_client = None

    if _supabase_client and not _seeded:
        _seeded = True
        try:
            res = _supabase_client.table(_TBL_INCIDENTS).select("id", count="exact").limit(1).execute()
            count = res.count if res.count is not None else len(res.data)
            if count == 0:
                logger.info("drishti_incidents table is empty — auto-seeding historical incidents...")
                seed_rows = []
                for inc in _INCIDENTS:
                    seed_rows.append({
                        "id": inc.id,
                        "lat": inc.lat,
                        "lng": inc.lng,
                        "type": inc.type,
                        "severity": inc.severity,
                        "timestamp": inc.timestamp,
                        "district": inc.district,
                        "state": inc.state,
                        "description": inc.description,
                        "source_module": inc.sourceModule,
                    })
                _supabase_client.table(_TBL_INCIDENTS).insert(seed_rows).execute()
                logger.info("Seeded %d historical incidents into Supabase.", len(seed_rows))
        except Exception as e:
            logger.warning("Failed to auto-seed drishti_incidents: %s", e)

    return _supabase_client


# ── India bounding box for coordinate projection ──────────────────────────────
# lat: 8.0°N – 37.0°N  |  lng: 67.0°E – 97.5°E
_LAT_MIN, _LAT_MAX = 8.0, 37.0
_LNG_MIN, _LNG_MAX = 67.0, 97.5
SVG_W, SVG_H = 500, 560


def _proj(lat: float, lng: float) -> tuple[float, float]:
    """Project lat/lng to SVG pixel coordinates."""
    x = (lng - _LNG_MIN) / (_LNG_MAX - _LNG_MIN) * SVG_W
    y = (_LAT_MAX - lat) / (_LAT_MAX - _LAT_MIN) * SVG_H
    return round(x, 1), round(y, 1)


# ── Master incident dataset ───────────────────────────────────────────────────
_INCIDENTS: list[Incident] = [
    # Mumbai cluster
    Incident(id="I001", lat=18.9388, lng=72.8354, type="scam", severity="critical",
             timestamp="2026-07-16T09:45:00", district="Mumbai South", state="Maharashtra",
             description="Digital arrest scam — CBI impersonation, Rs 3.2L demanded"),
    Incident(id="I002", lat=19.0760, lng=72.8777, type="scam", severity="critical",
             timestamp="2026-07-16T09:28:00", district="Mumbai Central", state="Maharashtra",
             description="Digital arrest — Customs officer deepfake video call"),
    Incident(id="I003", lat=19.1136, lng=72.8697, type="upi", severity="high",
             timestamp="2026-07-16T09:15:00", district="Bandra", state="Maharashtra",
             description="QR code payment scam, victim lost Rs 48,000"),
    Incident(id="I004", lat=19.2183, lng=72.9781, type="counterfeit", severity="high",
             timestamp="2026-07-16T08:51:00", district="Navi Mumbai", state="Maharashtra",
             description="Fake Rs 500 FICN detected at Vashi POS terminal"),
    Incident(id="I005", lat=19.0330, lng=73.0297, type="network", severity="medium",
             timestamp="2026-07-16T08:30:00", district="Thane", state="Maharashtra",
             description="Money mule activity — 12 linked accounts flagged by JAAL"),

    # Delhi cluster
    Incident(id="I006", lat=28.6139, lng=77.2090, type="scam", severity="critical",
             timestamp="2026-07-16T09:52:00", district="New Delhi", state="Delhi",
             description="ED officer impersonation — Rs 7.8L transferred to mule"),
    Incident(id="I007", lat=28.7041, lng=77.1025, type="scam", severity="critical",
             timestamp="2026-07-16T09:33:00", district="Rohini", state="Delhi",
             description="Digital arrest scam targeting retired government officer"),
    Incident(id="I008", lat=28.5355, lng=77.3910, type="upi", severity="high",
             timestamp="2026-07-16T09:10:00", district="Noida", state="Uttar Pradesh",
             description="Fake loan app fraud, 47 victims identified in cluster"),
    Incident(id="I009", lat=28.4595, lng=77.0266, type="counterfeit", severity="medium",
             timestamp="2026-07-16T08:45:00", district="Gurugram", state="Haryana",
             description="Counterfeit Rs 200 batch — 23 notes at petrol station"),

    # Bangalore cluster
    Incident(id="I010", lat=12.9716, lng=77.5946, type="scam", severity="critical",
             timestamp="2026-07-16T09:48:00", district="Bangalore Central", state="Karnataka",
             description="Tech support scam impersonating Microsoft — Rs 1.1L lost"),
    Incident(id="I011", lat=13.0359, lng=77.5970, type="upi", severity="high",
             timestamp="2026-07-16T09:22:00", district="Yelahanka", state="Karnataka",
             description="Investment scam app — 89 victims across Bangalore North"),
    Incident(id="I012", lat=12.9165, lng=77.6229, type="network", severity="medium",
             timestamp="2026-07-16T08:58:00", district="Koramangala", state="Karnataka",
             description="JAAL: 3 fraud rings linked across MH-KA corridor"),

    # Hyderabad cluster
    Incident(id="I013", lat=17.3850, lng=78.4867, type="scam", severity="high",
             timestamp="2026-07-16T09:40:00", district="Hyderabad Central", state="Telangana",
             description="CBI arrest threat — victim transferred Rs 2.4L before alert"),
    Incident(id="I014", lat=17.4065, lng=78.4772, type="counterfeit", severity="high",
             timestamp="2026-07-16T09:05:00", district="Secunderabad", state="Telangana",
             description="High-quality FICN Rs 500 — 18 notes at Kacheguda railway"),
    Incident(id="I015", lat=17.4900, lng=78.3900, type="upi", severity="medium",
             timestamp="2026-07-16T08:20:00", district="Kukatpally", state="Telangana",
             description="Paytm impersonation SMS phishing — 31 victims"),

    # Chennai cluster
    Incident(id="I016", lat=13.0827, lng=80.2707, type="scam", severity="critical",
             timestamp="2026-07-16T09:55:00", district="Chennai Central", state="Tamil Nadu",
             description="Digital arrest — TRAI officer impersonation, Tamil language"),
    Incident(id="I017", lat=13.1067, lng=80.2206, type="upi", severity="high",
             timestamp="2026-07-16T09:18:00", district="Ambattur", state="Tamil Nadu",
             description="Electricity dept impersonation phishing — Rs 82,000 lost"),

    # Kolkata
    Incident(id="I018", lat=22.5726, lng=88.3639, type="scam", severity="high",
             timestamp="2026-07-16T09:35:00", district="Kolkata Central", state="West Bengal",
             description="NCB officer deepfake call — targeting WB senior citizens"),
    Incident(id="I019", lat=22.6520, lng=88.4300, type="counterfeit", severity="medium",
             timestamp="2026-07-16T08:55:00", district="Barrackpore", state="West Bengal",
             description="Counterfeit Rs 2000 seizure — smuggled from border corridor"),

    # Ahmedabad
    Incident(id="I020", lat=23.0225, lng=72.5714, type="scam", severity="high",
             timestamp="2026-07-16T09:25:00", district="Ahmedabad West", state="Gujarat",
             description="ED impersonation targeting textile merchants — 3 victims"),
    Incident(id="I021", lat=23.0732, lng=72.6750, type="upi", severity="medium",
             timestamp="2026-07-16T08:40:00", district="Gandhinagar", state="Gujarat",
             description="Fake SBI alert SMS — account freeze scam"),

    # Pune
    Incident(id="I022", lat=18.5204, lng=73.8567, type="scam", severity="high",
             timestamp="2026-07-16T09:42:00", district="Pune City", state="Maharashtra",
             description="CBI digital arrest — IT professional victim, Rs 5.6L"),
    Incident(id="I023", lat=18.5922, lng=73.7399, type="network", severity="medium",
             timestamp="2026-07-16T09:08:00", district="Pimpri-Chinchwad", state="Maharashtra",
             description="Fraud mule network — JAAL flagged 8 linked UPI IDs"),

    # Jaipur
    Incident(id="I024", lat=26.9124, lng=75.7873, type="scam", severity="high",
             timestamp="2026-07-16T09:15:00", district="Jaipur Central", state="Rajasthan",
             description="Customs officer scam — gold import fraud threat"),
    Incident(id="I025", lat=26.8467, lng=75.8000, type="counterfeit", severity="medium",
             timestamp="2026-07-16T08:50:00", district="Sanganer", state="Rajasthan",
             description="Counterfeit Rs 500 at wholesale market — 41 notes"),
]

# ── Hotspot profiles ──────────────────────────────────────────────────────────
_HOTSPOTS_DETAILED: list[HotspotDetailed] = [
    HotspotDetailed(
        id="hs1", lat=19.0760, lng=72.8777, intensity=0.95,
        type="scam", district="Mumbai", state="Maharashtra",
        incidentCount=142, criticalCount=38,
        riskTrend="rising", predictedRisk72h=0.97,
        topCrimeType="Digital Arrest Scam",
        breakdown={"scam": 89, "counterfeit": 18, "upi": 28, "network": 7},
    ),
    HotspotDetailed(
        id="hs2", lat=28.6139, lng=77.2090, intensity=0.88,
        type="scam", district="New Delhi", state="Delhi",
        incidentCount=128, criticalCount=31,
        riskTrend="rising", predictedRisk72h=0.91,
        topCrimeType="Digital Arrest Scam",
        breakdown={"scam": 72, "counterfeit": 21, "upi": 30, "network": 5},
    ),
    HotspotDetailed(
        id="hs3", lat=12.9716, lng=77.5946, intensity=0.74,
        type="network", district="Bangalore", state="Karnataka",
        incidentCount=89, criticalCount=17,
        riskTrend="stable", predictedRisk72h=0.76,
        topCrimeType="Investment Scam",
        breakdown={"scam": 38, "counterfeit": 9, "upi": 31, "network": 11},
    ),
    HotspotDetailed(
        id="hs4", lat=17.3850, lng=78.4867, intensity=0.71,
        type="scam", district="Hyderabad", state="Telangana",
        incidentCount=76, criticalCount=14,
        riskTrend="stable", predictedRisk72h=0.72,
        topCrimeType="Counterfeit Currency",
        breakdown={"scam": 34, "counterfeit": 22, "upi": 15, "network": 5},
    ),
    HotspotDetailed(
        id="hs5", lat=13.0827, lng=80.2707, intensity=0.65,
        type="scam", district="Chennai", state="Tamil Nadu",
        incidentCount=54, criticalCount=12,
        riskTrend="rising", predictedRisk72h=0.70,
        topCrimeType="TRAI Impersonation",
        breakdown={"scam": 29, "counterfeit": 7, "upi": 14, "network": 4},
    ),
    HotspotDetailed(
        id="hs6", lat=22.5726, lng=88.3639, intensity=0.58,
        type="counterfeit", district="Kolkata", state="West Bengal",
        incidentCount=47, criticalCount=8,
        riskTrend="falling", predictedRisk72h=0.54,
        topCrimeType="Counterfeit ₹500/₹2000",
        breakdown={"scam": 19, "counterfeit": 21, "upi": 5, "network": 2},
    ),
    HotspotDetailed(
        id="hs7", lat=23.0225, lng=72.5714, intensity=0.52,
        type="upi", district="Ahmedabad", state="Gujarat",
        incidentCount=38, criticalCount=6,
        riskTrend="stable", predictedRisk72h=0.51,
        topCrimeType="UPI/Payment Fraud",
        breakdown={"scam": 14, "counterfeit": 4, "upi": 18, "network": 2},
    ),
    HotspotDetailed(
        id="hs8", lat=18.5204, lng=73.8567, intensity=0.61,
        type="scam", district="Pune", state="Maharashtra",
        incidentCount=61, criticalCount=11,
        riskTrend="rising", predictedRisk72h=0.65,
        topCrimeType="Digital Arrest Scam",
        breakdown={"scam": 33, "counterfeit": 8, "upi": 14, "network": 6},
    ),
]

# ── Prediction zones ──────────────────────────────────────────────────────────
_PREDICTIONS: dict[str, list[PredictionZone]] = {
    "24h": [
        PredictionZone(gridId="p1", lat=19.1500, lng=72.9200, riskScore=0.88,
                       confidence=0.91, timeframe="24h", predictedType="scam",
                       district="Borivali", state="Maharashtra"),
        PredictionZone(gridId="p2", lat=28.7500, lng=77.1500, riskScore=0.81,
                       confidence=0.87, timeframe="24h", predictedType="scam",
                       district="Rohini North", state="Delhi"),
        PredictionZone(gridId="p3", lat=13.0600, lng=80.2300, riskScore=0.72,
                       confidence=0.83, timeframe="24h", predictedType="scam",
                       district="Anna Nagar", state="Tamil Nadu"),
        PredictionZone(gridId="p4", lat=17.4400, lng=78.3600, riskScore=0.68,
                       confidence=0.79, timeframe="24h", predictedType="counterfeit",
                       district="Kukatpally", state="Telangana"),
        PredictionZone(gridId="p5", lat=22.5200, lng=88.4100, riskScore=0.61,
                       confidence=0.74, timeframe="24h", predictedType="counterfeit",
                       district="Barrackpore", state="West Bengal"),
    ],
    "48h": [
        PredictionZone(gridId="p6", lat=19.2800, lng=73.0500, riskScore=0.79,
                       confidence=0.82, timeframe="48h", predictedType="network",
                       district="Kalyan", state="Maharashtra"),
        PredictionZone(gridId="p7", lat=28.4300, lng=77.4200, riskScore=0.74,
                       confidence=0.78, timeframe="48h", predictedType="upi",
                       district="Faridabad", state="Haryana"),
        PredictionZone(gridId="p8", lat=12.8600, lng=77.6500, riskScore=0.70,
                       confidence=0.75, timeframe="48h", predictedType="scam",
                       district="Electronic City", state="Karnataka"),
        PredictionZone(gridId="p9", lat=18.4600, lng=73.7800, riskScore=0.65,
                       confidence=0.72, timeframe="48h", predictedType="scam",
                       district="Pimpri", state="Maharashtra"),
        PredictionZone(gridId="p10", lat=26.8500, lng=75.7500, riskScore=0.58,
                       confidence=0.68, timeframe="48h", predictedType="counterfeit",
                       district="Jaipur South", state="Rajasthan"),
    ],
    "72h": [
        PredictionZone(gridId="p11", lat=19.4500, lng=72.8200, riskScore=0.71,
                       confidence=0.76, timeframe="72h", predictedType="scam",
                       district="Vasai-Virar", state="Maharashtra"),
        PredictionZone(gridId="p12", lat=28.9000, lng=77.0800, riskScore=0.68,
                       confidence=0.73, timeframe="72h", predictedType="counterfeit",
                       district="Sonipat", state="Haryana"),
        PredictionZone(gridId="p13", lat=13.3400, lng=77.5600, riskScore=0.63,
                       confidence=0.70, timeframe="72h", predictedType="upi",
                       district="Tumkur", state="Karnataka"),
        PredictionZone(gridId="p14", lat=17.6900, lng=78.3900, riskScore=0.59,
                       confidence=0.66, timeframe="72h", predictedType="network",
                       district="Medak", state="Telangana"),
        PredictionZone(gridId="p15", lat=22.3500, lng=73.1700, riskScore=0.54,
                       confidence=0.63, timeframe="72h", predictedType="scam",
                       district="Vadodara", state="Gujarat"),
    ],
}

# ── Patrol routes ─────────────────────────────────────────────────────────────
_PATROL_ROUTES: list[PatrolRoute] = [
    PatrolRoute(
        routeId="R1", unitName="Cyber Cell Alpha — Mumbai",
        waypoints=[
            Waypoint(lat=18.9388, lng=72.8354, label="Mumbai South"),
            Waypoint(lat=19.0760, lng=72.8777, label="Mumbai Central"),
            Waypoint(lat=19.1136, lng=72.8697, label="Bandra"),
            Waypoint(lat=19.2183, lng=72.9781, label="Navi Mumbai"),
        ],
        coverageKm=48.2, estimatedMinutes=120, priority="high",
    ),
    PatrolRoute(
        routeId="R2", unitName="Cyber Cell Bravo — Delhi NCR",
        waypoints=[
            Waypoint(lat=28.7041, lng=77.1025, label="Rohini"),
            Waypoint(lat=28.6139, lng=77.2090, label="New Delhi"),
            Waypoint(lat=28.5355, lng=77.3910, label="Noida"),
            Waypoint(lat=28.4595, lng=77.0266, label="Gurugram"),
        ],
        coverageKm=62.5, estimatedMinutes=150, priority="high",
    ),
    PatrolRoute(
        routeId="R3", unitName="Cyber Cell Charlie — South India",
        waypoints=[
            Waypoint(lat=12.9716, lng=77.5946, label="Bangalore"),
            Waypoint(lat=17.3850, lng=78.4867, label="Hyderabad"),
            Waypoint(lat=13.0827, lng=80.2707, label="Chennai"),
        ],
        coverageKm=718.0, estimatedMinutes=840, priority="medium",
    ),
]

# ── District stats ────────────────────────────────────────────────────────────
_DISTRICT_STATS: list[DistrictStat] = [
    DistrictStat(district="Mumbai", state="Maharashtra", totalIncidents=142,
                 criticalCount=38, changePercent=+12.4, riskRank=1, dominantType="scam"),
    DistrictStat(district="New Delhi", state="Delhi", totalIncidents=128,
                 criticalCount=31, changePercent=+8.7, riskRank=2, dominantType="scam"),
    DistrictStat(district="Bangalore", state="Karnataka", totalIncidents=89,
                 criticalCount=17, changePercent=+3.2, riskRank=3, dominantType="network"),
    DistrictStat(district="Hyderabad", state="Telangana", totalIncidents=76,
                 criticalCount=14, changePercent=-2.1, riskRank=4, dominantType="counterfeit"),
    DistrictStat(district="Pune", state="Maharashtra", totalIncidents=61,
                 criticalCount=11, changePercent=+15.3, riskRank=5, dominantType="scam"),
    DistrictStat(district="Chennai", state="Tamil Nadu", totalIncidents=54,
                 criticalCount=12, changePercent=+6.8, riskRank=6, dominantType="scam"),
    DistrictStat(district="Kolkata", state="West Bengal", totalIncidents=47,
                 criticalCount=8, changePercent=-5.4, riskRank=7, dominantType="counterfeit"),
    DistrictStat(district="Ahmedabad", state="Gujarat", totalIncidents=38,
                 criticalCount=6, changePercent=+1.1, riskRank=8, dominantType="upi"),
    DistrictStat(district="Jaipur", state="Rajasthan", totalIncidents=29,
                 criticalCount=5, changePercent=-1.8, riskRank=9, dominantType="counterfeit"),
    DistrictStat(district="Noida", state="Uttar Pradesh", totalIncidents=24,
                 criticalCount=4, changePercent=+4.2, riskRank=10, dominantType="upi"),
]

# ── Service functions ─────────────────────────────────────────────────────────

def get_stats() -> dict:
    live_critical = sum(1 for incident in _LIVE_INTELLIGENCE_INCIDENTS if incident.severity == "critical")
    return DrishtiStats(
        totalToday=247 + len(_LIVE_INTELLIGENCE_INCIDENTS),
        criticalZones=8 + live_critical,
        activePatrols=34,
        avgResponseMin=4.2,
        hotspotCount=len(_HOTSPOTS_DETAILED),
        totalThisWeek=1483,
    ).model_dump()


def get_hotspots() -> list[dict]:
    """Original simple format — kept for backwards compat."""
    return [
        {"id": h.id, "lat": h.lat, "lng": h.lng,
         "intensity": h.intensity, "type": h.type, "district": h.district}
        for h in _HOTSPOTS_DETAILED
    ]


def get_hotspots_detailed(type_filter: str | None = None) -> list[dict]:
    data = _HOTSPOTS_DETAILED
    if type_filter and type_filter != "all":
        data = [h for h in data if h.type == type_filter]
    return [h.model_dump() for h in data]


def get_heatmap() -> list[dict]:
    sb = _get_supabase()
    stored: list[dict] = []
    if sb:
        try:
            res = sb.table(_TBL_INCIDENTS).select("lat,lng,type,severity").execute()
            stored = [
                {"lat": r["lat"], "lng": r["lng"], "weight": 1.0, "type": r["type"], "severity": r["severity"]}
                for r in res.data
            ]
        except Exception as e:
            logger.warning("Failed to query heatmap from Supabase: %s", e)
    if not stored:
        stored = [
            {"lat": inc.lat, "lng": inc.lng, "weight": 1.0, "type": inc.type,
             "severity": inc.severity}
            for inc in _INCIDENTS
        ]
    return [
        {"lat": inc.lat, "lng": inc.lng, "weight": 1.0, "type": inc.type,
         "severity": inc.severity, "sourceModule": inc.sourceModule}
        for inc in _LIVE_INTELLIGENCE_INCIDENTS
    ] + stored


def get_incidents(
    severity: str | None = None,
    type_filter: str | None = None,
    hours: int = 24,
) -> list[dict]:
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    all_incidents: list[dict] = []

    # 0. Authorised cross-module feed, explicitly separate from synthetic demo
    # data and citizen reports but included in operational map/heatmap queries.
    for incident in _LIVE_INTELLIGENCE_INCIDENTS:
        if severity and incident.severity != severity:
            continue
        if type_filter and type_filter != "all" and incident.type != type_filter:
            continue
        item = incident.model_dump()
        item["isCitizenReport"] = False
        item["isLiveIntelligence"] = True
        all_incidents.append(item)

    # 1. Include in-memory citizen reports
    for r in _CITIZEN_REPORTS:
        r_type = r.get("type", "scam")
        if type_filter and type_filter != "all" and r_type != type_filter:
            continue
        sev = "critical" if r_type == "scam" else "high" if r_type in ("upi", "counterfeit") else "medium"
        if severity and sev != severity:
            continue
        lat, lng = _resolve_coords(r.get("district", "India"), r.get("state", "India"), r.get("lat"), r.get("lng"))
        all_incidents.append({
            "id": r["id"],
            "lat": lat,
            "lng": lng,
            "type": r_type,
            "severity": sev,
            "timestamp": r.get("timestamp", datetime.utcnow().isoformat()),
            "district": r.get("district", "India"),
            "state": r.get("state", "India"),
            "description": f"Citizen Report: {r.get('description', '')}",
            "sourceModule": "CITIZEN_PORTAL",
            "isCitizenReport": True,
        })

    # 2. Fetch from Supabase DB (both drishti_citizen_reports and drishti_incidents)
    sb = _get_supabase()
    if sb:
        try:
            # Query citizen reports from DB
            rep_res = sb.table(_TBL_REPORTS).select("*").order("timestamp", desc=True).limit(50).execute()
            for r in rep_res.data:
                r_type = r.get("type", "scam")
                if type_filter and type_filter != "all" and r_type != type_filter:
                    continue
                sev = "critical" if r_type == "scam" else "high" if r_type in ("upi", "counterfeit") else "medium"
                if severity and sev != severity:
                    continue
                lat, lng = _resolve_coords(r["district"], r["state"], r.get("lat"), r.get("lng"))
                all_incidents.append({
                    "id": r["id"],
                    "lat": lat,
                    "lng": lng,
                    "type": r_type,
                    "severity": sev,
                    "timestamp": r.get("timestamp", datetime.utcnow().isoformat()),
                    "district": r["district"],
                    "state": r["state"],
                    "description": f"Citizen Report: {r.get('description', '')}",
                    "sourceModule": "CITIZEN_PORTAL",
                    "isCitizenReport": True,
                })
        except Exception as e:
            logger.warning("Failed to query citizen reports from DB in get_incidents: %s", e)

        try:
            # Query incidents from DB
            inc_res = sb.table(_TBL_INCIDENTS).select("*").order("timestamp", desc=True).limit(50).execute()
            for r in inc_res.data:
                if severity and r.get("severity") != severity:
                    continue
                if type_filter and type_filter != "all" and r.get("type") != type_filter:
                    continue
                lat, lng = _resolve_coords(r["district"], r["state"], r.get("lat"), r.get("lng"))
                all_incidents.append({
                    "id": r["id"],
                    "lat": lat,
                    "lng": lng,
                    "type": r.get("type", "scam"),
                    "severity": r.get("severity", "medium"),
                    "timestamp": r.get("timestamp", datetime.utcnow().isoformat()),
                    "district": r["district"],
                    "state": r["state"],
                    "description": r.get("description", ""),
                    "sourceModule": r.get("source_module", "DRISHTI"),
                    "isCitizenReport": False,
                })
        except Exception as e:
            logger.warning("Failed to query incidents from DB in get_incidents: %s", e)

    # 3. Add historical baseline incidents
    for inc in _INCIDENTS:
        if severity and inc.severity != severity:
            continue
        if type_filter and type_filter != "all" and inc.type != type_filter:
            continue
        lat, lng = _resolve_coords(inc.district, inc.state, inc.lat, inc.lng)
        d = inc.model_dump()
        d["lat"] = lat
        d["lng"] = lng
        d["isCitizenReport"] = False
        all_incidents.append(d)

    # Deduplicate by ID
    seen = set()
    deduped = []
    for item in all_incidents:
        if item["id"] not in seen:
            seen.add(item["id"])
            deduped.append(item)

    # Sort by timestamp descending (newest reported issues first)
    def parse_ts(ts_str: str) -> float:
        try:
            return datetime.fromisoformat(ts_str.replace("Z", "+00:00")).timestamp()
        except Exception:
            return 0.0

    deduped.sort(key=lambda x: parse_ts(x.get("timestamp", "")), reverse=True)
    return deduped


def get_predictions(timeframe: str = "24h") -> list[dict]:
    zones = _PREDICTIONS.get(timeframe, _PREDICTIONS["24h"])
    return [z.model_dump() for z in zones]


def get_patrol_routes() -> list[dict]:
    return [r.model_dump() for r in _PATROL_ROUTES]


def get_district_stats() -> list[dict]:
    return [d.model_dump() for d in _DISTRICT_STATS]


def stream_incident() -> dict | None:
    """Return the newest authorised event; never fabricate an operational incident."""
    events = get_live_incidents(limit=1)
    return events[0] if events else None


# ── Authorised cross-module intelligence feed ───────────────────────────────
# Kept independently from demo-generated data so command-centre clients can
# distinguish actual partner/citizen signals from scenarios and baselines.
_LIVE_INTELLIGENCE_INCIDENTS: list[Incident] = []
_LIVE_INTELLIGENCE_METADATA: dict[str, dict] = {}


def ingest_intelligence_incident(signal: dict) -> dict:
    """Add an authorised SENTINEL/NETRA/JAAL event to the live map feed."""
    import uuid
    district = signal.get("district") or "India"
    state = signal.get("state") or "India"
    lat, lng = _resolve_coords(district, state, signal.get("lat"), signal.get("lng"))
    event_type = signal.get("type", "scam")
    if event_type not in ("scam", "counterfeit", "upi", "network"):
        event_type = "scam"
    incident = Incident(
        id=f"LI-{uuid.uuid4().hex[:10].upper()}", lat=lat, lng=lng, type=event_type,
        severity=signal.get("severity", "medium"), timestamp=signal.get("timestamp") or datetime.utcnow().isoformat(),
        district=district, state=state, description=signal.get("description", "Live intelligence event"),
        sourceModule=signal.get("sourceModule") or "SENTINEL_LIVE",
    )
    _LIVE_INTELLIGENCE_INCIDENTS.insert(0, incident)
    _LIVE_INTELLIGENCE_METADATA[incident.id] = {
        "eventId": signal.get("eventId"), "evidenceRef": signal.get("evidenceRef"), "riskScore": signal.get("score"),
    }
    del _LIVE_INTELLIGENCE_INCIDENTS[100:]
    return {**incident.model_dump(), **_LIVE_INTELLIGENCE_METADATA[incident.id]}


def get_live_incidents(limit: int = 50) -> list[dict]:
    """Return only authorised, non-simulated cross-module events."""
    return [{**incident.model_dump(), **_LIVE_INTELLIGENCE_METADATA.get(incident.id, {})} for incident in _LIVE_INTELLIGENCE_INCIDENTS[:limit]]


# ── In-memory citizen report store ───────────────────────────────────────────
_CITIZEN_REPORTS: list[dict] = []

# District → (lat, lng) default coordinate lookup
_DISTRICT_COORDS: dict[str, tuple[float, float]] = {
    "Mumbai": (19.0760, 72.8777),
    "Mumbai South": (18.9388, 72.8354),
    "Mumbai Central": (19.0760, 72.8777),
    "Bandra": (19.1136, 72.8697),
    "Navi Mumbai": (19.2183, 72.9781),
    "Thane": (19.0330, 73.0297),
    "Pune": (18.5204, 73.8567),
    "New Delhi": (28.6139, 77.2090),
    "Delhi": (28.6139, 77.2090),
    "Rohini": (28.7041, 77.1025),
    "Noida": (28.5355, 77.3910),
    "Gurugram": (28.4595, 77.0266),
    "Bangalore": (12.9716, 77.5946),
    "Bangalore Central": (12.9716, 77.5946),
    "Yelahanka": (13.0359, 77.5970),
    "Koramangala": (12.9165, 77.6229),
    "Whitefield": (12.9698, 77.7499),
    "Hyderabad": (17.3850, 78.4867),
    "Hyderabad Central": (17.3850, 78.4867),
    "Secunderabad": (17.4065, 78.4772),
    "Kukatpally": (17.4900, 78.3900),
    "Chennai": (13.0827, 80.2707),
    "Chennai Central": (13.0827, 80.2707),
    "Egmore": (13.0827, 80.2707),
    "T. Nagar": (13.0418, 80.2341),
    "Adyar": (13.0012, 80.2565),
    "Anna Nagar": (13.0878, 80.2170),
    "Kolkata": (22.5726, 88.3639),
    "Kolkata Central": (22.5726, 88.3639),
    "Ahmedabad": (23.0225, 72.5714),
    "Jaipur": (26.9124, 75.7873),
    "Lucknow": (26.8467, 80.9462),
    "Bhopal": (23.2599, 77.4126),
    "Patna": (25.5941, 85.1376),
    "Chandigarh": (30.7333, 76.7794),
    "Surat": (21.1702, 72.8311),
    "Nagpur": (21.1458, 79.0882),
    "Indore": (22.7196, 75.8577),
    "Coimbatore": (11.0168, 76.9558),
    "Kochi": (9.9312, 76.2673),
    "Visakhapatnam": (17.6868, 83.2185),
}

# State → (lat, lng) default centroid lookup
_STATE_COORDS: dict[str, tuple[float, float]] = {
    "Andhra Pradesh": (16.5062, 80.6480),
    "Arunachal Pradesh": (27.0844, 93.6053),
    "Assam": (26.1408, 91.7904),
    "Bihar": (25.5941, 85.1376),
    "Chhattisgarh": (21.2514, 81.6296),
    "Goa": (15.2993, 74.1240),
    "Gujarat": (23.0225, 72.5714),
    "Haryana": (28.4595, 77.0266),
    "Himachal Pradesh": (31.1048, 77.1734),
    "Jharkhand": (23.3441, 85.3096),
    "Karnataka": (12.9716, 77.5946),
    "Kerala": (8.5241, 76.9366),
    "Madhya Pradesh": (23.2599, 77.4126),
    "Maharashtra": (19.0760, 72.8777),
    "Manipur": (24.8170, 93.9368),
    "Meghalaya": (25.5788, 91.8933),
    "Mizoram": (23.7271, 92.7176),
    "Nagaland": (25.6751, 94.1086),
    "Odisha": (20.2961, 85.8245),
    "Punjab": (30.9010, 75.8573),
    "Rajasthan": (26.9124, 75.7873),
    "Sikkim": (27.3389, 88.6065),
    "Tamil Nadu": (13.0827, 80.2707),
    "Telangana": (17.3850, 78.4867),
    "Tripura": (23.8315, 91.2868),
    "Uttar Pradesh": (26.8467, 80.9462),
    "Uttarakhand": (30.3165, 78.0322),
    "West Bengal": (22.5726, 88.3639),
    "Delhi": (28.6139, 77.2090),
    "Chandigarh": (30.7333, 76.7794),
    "Jammu & Kashmir": (34.0837, 74.7973),
    "Ladakh": (34.1526, 77.5771),
}


def _resolve_coords(district: str, state: str, raw_lat: float | None = None, raw_lng: float | None = None) -> tuple[float, float]:
    """Accurately resolve (lat, lng) for a district and state, fixing fallback mismatches."""
    # Check if raw_lat/raw_lng are valid non-centroid coordinates
    if raw_lat and raw_lng and not (19.5 < raw_lat < 21.5 and 77.5 < raw_lng < 80.0 and "Maharashtra" not in state and "Nagpur" not in district):
        return round(raw_lat, 4), round(raw_lng, 4)

    # 1. Exact district match
    if district in _DISTRICT_COORDS:
        base_lat, base_lng = _DISTRICT_COORDS[district]
        return round(base_lat + random.uniform(-0.02, 0.02), 4), round(base_lng + random.uniform(-0.02, 0.02), 4)

    # 2. Substring district match
    d_lower = district.lower()
    for key, (base_lat, base_lng) in _DISTRICT_COORDS.items():
        if key.lower() in d_lower or d_lower in key.lower():
            return round(base_lat + random.uniform(-0.02, 0.02), 4), round(base_lng + random.uniform(-0.02, 0.02), 4)

    # 3. State centroid match
    if state in _STATE_COORDS:
        base_lat, base_lng = _STATE_COORDS[state]
        return round(base_lat + random.uniform(-0.04, 0.04), 4), round(base_lng + random.uniform(-0.04, 0.04), 4)

    # 4. India centroid fallback
    return 20.5937, 78.9629


def submit_citizen_report(req: dict) -> dict:
    """Accept a citizen-submitted incident report and add to live feed."""
    from app.models.schemas import CitizenReport
    import uuid

    district = req.get("district", "Unknown")
    state = req.get("state", "India")

    # Resolve accurate coordinates
    lat, lng = _resolve_coords(district, state, req.get("lat"), req.get("lng"))

    report_id = f"CR-{uuid.uuid4().hex[:8].upper()}"
    report_type = req.get("type", "scam")
    description = req.get("description", "")
    phone = req.get("phone")
    reporter_name = req.get("reporterName")
    timestamp = datetime.utcnow().isoformat()

    report_data = {
        "id": report_id,
        "type": report_type,
        "description": description,
        "district": district,
        "state": state,
        "lat": round(lat, 4),
        "lng": round(lng, 4),
        "phone": phone,
        "reporterName": reporter_name,
        "timestamp": timestamp,
        "status": "received",
    }

    # Save to Supabase if available
    sb = _get_supabase()
    if sb:
        try:
            # 1. Insert into drishti_citizen_reports (public schema)
            sb.table(_TBL_REPORTS).insert({
                "id": report_id,
                "type": report_type,
                "description": description,
                "district": district,
                "state": state,
                "lat": round(lat, 4),
                "lng": round(lng, 4),
                "phone": phone,
                "reporter_name": reporter_name,
                "timestamp": timestamp,
                "status": "received"
            }).execute()

            # 2. Map report to an incident so it updates the heatmap dynamically
            severity_map = {
                "scam": "critical",
                "upi": "high",
                "counterfeit": "high",
                "network": "medium",
            }
            severity = severity_map.get(report_type, "medium")

            incident_id = f"I-CR-{uuid.uuid4().hex[:6].upper()}"
            sb.table(_TBL_INCIDENTS).insert({
                "id": incident_id,
                "lat": round(lat, 4),
                "lng": round(lng, 4),
                "type": report_type if report_type in ("scam", "counterfeit", "upi", "network") else "scam",
                "severity": severity,
                "timestamp": timestamp,
                "district": district,
                "state": state,
                "description": f"Citizen Report: {description}",
                "source_module": "DRISHTI"
            }).execute()

            logger.info("Persisted citizen report + incident in Supabase public schema.")
        except Exception as e:
            logger.warning("Failed to save report to Supabase: %s. Storing in-memory fallback.", e)
            _CITIZEN_REPORTS.insert(0, report_data)
            
            # Map mock incident
            severity_map = {
                "scam": "critical",
                "upi": "high",
                "counterfeit": "high",
                "network": "medium",
            }
            severity = severity_map.get(report_type, "medium")
            incident_id = f"I-CR-{uuid.uuid4().hex[:6].upper()}"
            mock_inc = Incident(
                id=incident_id,
                lat=round(lat, 4),
                lng=round(lng, 4),
                type=report_type if report_type in ("scam", "counterfeit", "upi", "network") else "scam",
                severity=severity,
                timestamp=timestamp,
                district=district,
                state=state,
                description=f"Citizen Report: {description}",
                sourceModule="DRISHTI"
            )
            _INCIDENTS.insert(0, mock_inc)
    else:
        _CITIZEN_REPORTS.insert(0, report_data)
        
        # Map mock incident
        severity_map = {
            "scam": "critical",
            "upi": "high",
            "counterfeit": "high",
            "network": "medium",
        }
        severity = severity_map.get(report_type, "medium")
        incident_id = f"I-CR-{uuid.uuid4().hex[:6].upper()}"
        mock_inc = Incident(
            id=incident_id,
            lat=round(lat, 4),
            lng=round(lng, 4),
            type=report_type if report_type in ("scam", "counterfeit", "upi", "network") else "scam",
            severity=severity,
            timestamp=timestamp,
            district=district,
            state=state,
            description=f"Citizen Report: {description}",
            sourceModule="DRISHTI"
        )
        _INCIDENTS.insert(0, mock_inc)

    return report_data


def get_citizen_reports(limit: int = 50) -> list[dict]:
    reports = list(_CITIZEN_REPORTS)
    sb = _get_supabase()
    if sb:
        try:
            res = sb.table(_TBL_REPORTS).select("*").order("timestamp", desc=True).limit(limit).execute()
            for r in res.data:
                lat, lng = _resolve_coords(r["district"], r["state"], r.get("lat"), r.get("lng"))
                reports.insert(0, {
                    "id": r["id"],
                    "type": r["type"],
                    "description": r["description"],
                    "district": r["district"],
                    "state": r["state"],
                    "lat": lat,
                    "lng": lng,
                    "phone": r.get("phone"),
                    "reporterName": r.get("reporter_name"),
                    "timestamp": r["timestamp"],
                    "status": r["status"]
                })
        except Exception as e:
            logger.warning("Failed to query citizen reports from Supabase: %s", e)

    seen = set()
    deduped = []
    for r in reports:
        if r["id"] not in seen:
            seen.add(r["id"])
            lat, lng = _resolve_coords(r["district"], r["state"], r.get("lat"), r.get("lng"))
            r["lat"] = lat
            r["lng"] = lng
            deduped.append(r)

    return deduped[:limit]
