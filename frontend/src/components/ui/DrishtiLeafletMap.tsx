"use client";

// DrishtiLeafletMap — rendered client-side only (dynamic import, no SSR)
// Uses OpenStreetMap tiles via react-leaflet. Leaflet CSS is imported here.

import "leaflet/dist/leaflet.css";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  MapContainer, TileLayer, CircleMarker, Circle,
  Polyline, Popup, useMap,
} from "react-leaflet";
import L from "leaflet";

// Fix default marker icon paths broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Types (mirrors drishti/page.tsx) ─────────────────────────────────────────
interface Incident {
  id: string; lat: number; lng: number;
  type: string; severity: string; timestamp: string;
  district: string; state: string; description: string;
}
interface HotspotDetailed {
  id: string; lat: number; lng: number; intensity: number;
  type: string; district: string; state: string;
  incidentCount: number; criticalCount: number;
  riskTrend: string; predictedRisk72h: number; topCrimeType: string;
  breakdown: Record<string, number>;
}
interface PredictionZone {
  gridId: string; lat: number; lng: number;
  riskScore: number; confidence: number;
  timeframe: string; predictedType: string; district: string; state: string;
}
interface PatrolRoute {
  routeId: string; unitName: string;
  waypoints: Array<{ lat: number; lng: number; label: string }>;
  coverageKm: number; estimatedMinutes: number; priority: string;
}
interface CitizenReport {
  id: string; type: string; description: string;
  district: string; state: string; lat: number; lng: number;
  phone?: string; reporterName?: string; timestamp: string; status: string;
}

interface Props {
  incidents: Incident[];
  hotspots: HotspotDetailed[];
  predictions: PredictionZone[];
  patrolRoutes: PatrolRoute[];
  citizenReports: CitizenReport[];
  showHeatmap: boolean;
  onHotspotClick: (h: HotspotDetailed) => void;
  focusedCoords?: { lat: number; lng: number } | null;
}

// ── Colour helpers ────────────────────────────────────────────────────────────
const SEV_COLOR: Record<string, string> = {
  critical: "#E63A1E", high: "#F59E0B", medium: "#818CF8", low: "#6B7280",
};
const TYPE_COLOR: Record<string, string> = {
  scam: "#E63A1E", counterfeit: "#F59E0B", upi: "#818CF8",
  network: "#22D3EE", other: "#10B981",
};
const riskColor = (s: number) => s >= 0.7 ? "#E63A1E" : s >= 0.5 ? "#F59E0B" : "#10B981";

// Keeps the map view at India on first load
function SetIndiaBounds() {
  const map = useMap();
  useEffect(() => {
    map.setView([22.0, 82.0], 5);
  }, [map]);
  return null;
}

function MapFlyTo({ coords }: { coords?: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords && typeof coords.lat === "number" && typeof coords.lng === "number") {
      map.flyTo([coords.lat, coords.lng], 9, { duration: 1.2 });
    }
  }, [coords, map]);
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DrishtiLeafletMap({
  incidents, hotspots, predictions, patrolRoutes,
  citizenReports, showHeatmap, onHotspotClick, focusedCoords,
}: Props) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#060D1A", flexDirection: "column", gap: "0.75rem" }}>
        <span style={{ fontSize: "0.8rem", color: "#888" }}>Initializing map...</span>
      </div>
    );
  }

  return (
    <MapContainer
      center={[22.0, 82.0]}
      zoom={5}
      minZoom={4}
      maxZoom={14}
      style={{ width: "100%", height: "100%", background: "#0B1220" }}
      zoomControl={true}
    >
      <SetIndiaBounds />
      <MapFlyTo coords={focusedCoords} />

      {/* Dark OSM tile layer */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      {/* ── Heatmap blobs (soft radial glow per incident & report) ── */}
      {showHeatmap && [
        ...incidents.map(inc => ({ id: `inc-${inc.id}`, lat: inc.lat, lng: inc.lng, color: SEV_COLOR[inc.severity] ?? "#888", r: inc.severity === "critical" ? 28000 : inc.severity === "high" ? 20000 : 13000 })),
        ...citizenReports.map(cr => ({ id: `cr-${cr.id}`, lat: cr.lat, lng: cr.lng, color: TYPE_COLOR[cr.type] ?? "#818CF8", r: 18000 })),
      ].map(point => (
        <Circle
          key={`heat-${point.id}`}
          center={[point.lat, point.lng]}
          radius={point.r}
          pathOptions={{ color: point.color, fillColor: point.color, fillOpacity: 0.1, weight: 0 }}
        />
      ))}

      {/* ── Prediction zones ── */}
      {predictions.map(p => (
        <Circle
          key={p.gridId}
          center={[p.lat, p.lng]}
          radius={18000}
          pathOptions={{ color: riskColor(p.riskScore), fillColor: riskColor(p.riskScore), fillOpacity: 0.12, weight: 1, dashArray: "5 4" }}
        >
          <Popup>
            <strong>{p.district}, {p.state}</strong><br />
            Predicted: {p.predictedType.toUpperCase()}<br />
            Risk: {Math.round(p.riskScore * 100)}% · Confidence: {Math.round(p.confidence * 100)}%
          </Popup>
        </Circle>
      ))}

      {/* ── Patrol routes ── */}
      {patrolRoutes.map(route => {
        const pts: [number, number][] = route.waypoints.map(w => [w.lat, w.lng]);
        return (
          <Polyline
            key={route.routeId}
            positions={pts}
            pathOptions={{ color: route.priority === "high" ? "#22D3EE" : "#818CF8", weight: 2, dashArray: "8 5", opacity: 0.7 }}
          >
            <Popup>
              <strong>{route.unitName}</strong><br />
              {route.coverageKm} km · {route.estimatedMinutes < 60 ? `${route.estimatedMinutes}m` : `${Math.floor(route.estimatedMinutes / 60)}h ${route.estimatedMinutes % 60}m`}
            </Popup>
          </Polyline>
        );
      })}

      {/* ── Live incident dots ── */}
      {incidents.map(inc => (
        <CircleMarker
          key={`inc-${inc.id}`}
          center={[inc.lat, inc.lng]}
          radius={inc.severity === "critical" ? 7 : inc.severity === "high" ? 5 : 4}
          pathOptions={{ color: SEV_COLOR[inc.severity] ?? "#888", fillColor: SEV_COLOR[inc.severity] ?? "#888", fillOpacity: 0.9, weight: 1 }}
        >
          <Popup>
            <div style={{ minWidth: 200 }}>
              <strong style={{ color: SEV_COLOR[inc.severity] }}>[{inc.severity.toUpperCase()}]</strong> {inc.description}<br />
              <span style={{ color: "#888", fontSize: "0.8em" }}>{inc.district}, {inc.state}</span>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* ── Hotspot markers ── */}
      {hotspots.map(h => {
        const r = h.intensity >= 0.85 ? 14 : h.intensity >= 0.65 ? 10 : 7;
        return (
          <React.Fragment key={h.id}>
            {/* Outer pulse ring */}
            <CircleMarker
              center={[h.lat, h.lng]}
              radius={r + 10}
              pathOptions={{ color: "#F59E0B", fillColor: "transparent", fillOpacity: 0, weight: 1, opacity: h.intensity >= 0.75 ? 0.4 : 0.2 }}
            />
            {/* Core */}
            <CircleMarker
              center={[h.lat, h.lng]}
              radius={r}
              pathOptions={{ color: "#F59E0B", fillColor: "#F59E0B", fillOpacity: 0.85, weight: 2 }}
              eventHandlers={{ click: () => onHotspotClick(h) }}
            >
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <strong>{h.district}</strong>, {h.state}<br />
                  Risk: <strong style={{ color: riskColor(h.intensity) }}>{Math.round(h.intensity * 100)}</strong> · {h.riskTrend}<br />
                  {h.incidentCount} incidents · {h.criticalCount} critical<br />
                  Top: {h.topCrimeType}
                </div>
              </Popup>
            </CircleMarker>
          </React.Fragment>
        );
      })}

      {/* ── Citizen report pins ── */}
      {citizenReports.map(cr => (
        <CircleMarker
          key={`cr-${cr.id}`}
          center={[cr.lat, cr.lng]}
          radius={6}
          pathOptions={{ color: "white", fillColor: TYPE_COLOR[cr.type] ?? "#818CF8", fillOpacity: 0.95, weight: 1.5 }}
        >
          <Popup>
            <div style={{ minWidth: 180 }}>
              <strong style={{ color: TYPE_COLOR[cr.type] ?? "#818CF8", textTransform: "uppercase" }}>{cr.type}</strong> — Citizen Report<br />
              {cr.description}<br />
              <span style={{ color: "#888", fontSize: "0.8em" }}>{cr.district}, {cr.state}</span>
              {cr.reporterName && <><br /><span style={{ color: "#888", fontSize: "0.8em" }}>By: {cr.reporterName}</span></>}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
