'use client';

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { Network, Download, RefreshCw, Search, AlertTriangle, Shield, ZoomIn, ZoomOut, LocateFixed } from 'lucide-react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { useAuth } from '@/components/providers/AuthContext';
import { generateJaalEvidencePackage, getJaalCommunities, getJaalGraph, getJaalStats, traceJaalRelationships } from '@/lib/api';
import { useForceGraph } from '@/hooks/useForceGraph';
import type { FraudCommunity, GraphNode, GraphEdge, JaalTraceResult } from '@/types';
import type { ForceNode, ForceEdge } from '@/hooks/useForceGraph';

// ── Constants ────────────────────────────────────────────────────────────────

const NODE_COLORS: Record<string, string> = {
  person:  '#E63A1E',
  mule:    '#F59E0B',
  hub:     '#818CF8',
  phone:   '#22D3EE',
  account: '#10B981',
};

const EDGE_COLORS: Record<string, string> = {
  OWNS:            '#334455',
  CALLED:          '#3D5A80',
  TRANSFERRED_TO:  'rgba(230,58,30,0.33)',
  ASSOCIATED_WITH: '#444455',
  RECRUITED:       'rgba(139,92,246,0.33)',
  COMMANDS:        'rgba(245,158,11,0.33)',
};

const TYPE_FILTERS = ['All', 'Person', 'Mule', 'Hub', 'Phone', 'Account'] as const;

// ── Small helpers ────────────────────────────────────────────────────────────

function nodeRadius(riskScore: number): number {
  return 10 + Math.round(riskScore * 8); // 10–18
}

function riskColor(score: number): string {
  if (score >= 0.7) return '#E63A1E';
  if (score >= 0.4) return '#F59E0B';
  return '#10B981';
}

function riskLabel(score: number): string {
  if (score >= 0.7) return 'HIGH';
  if (score >= 0.4) return 'MEDIUM';
  return 'LOW';
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

// ── Canvas draw function ─────────────────────────────────────────────────────

function drawGraph(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  nodes: ForceNode[],
  edges: ForceEdge[],
  pan: { x: number; y: number },
  scale: number,
  selectedId: string | null,
  searchTerm: string,
  typeFilter: string,
  pulsePhase: number,
) {
  ctx.clearRect(0, 0, width, height);

  // Background
  ctx.fillStyle = '#080810';
  ctx.fillRect(0, 0, width, height);

  // Grid dots
  const gridSize = 32 * scale;
  const offsetX = ((pan.x % gridSize) + gridSize) % gridSize;
  const offsetY = ((pan.y % gridSize) + gridSize) % gridSize;
  ctx.fillStyle = '#111120';
  for (let gx = offsetX; gx < width; gx += gridSize) {
    for (let gy = offsetY; gy < height; gy += gridSize) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (nodes.length === 0) return;

  // Build id → node map
  const nodeMap: Record<string, ForceNode> = {};
  for (const n of nodes) nodeMap[n.id] = n;

  // Determine visible node set
  const filterLower = typeFilter === 'All' ? '' : typeFilter.toLowerCase();
  const visibleIds = new Set(
    nodes
      .filter(n => !filterLower || n.type === filterLower)
      .map(n => n.id)
  );

  // World → screen transform
  const wx = (x: number) => x * scale + pan.x;
  const wy = (y: number) => y * scale + pan.y;

  // ── Draw edges ────────────────────────────────────────────────────────────
  ctx.save();
  for (const edge of edges) {
    const src = nodeMap[edge.source];
    const tgt = nodeMap[edge.target];
    if (!src || !tgt) continue;
    if (!visibleIds.has(src.id) || !visibleIds.has(tgt.id)) continue;

    const sx = wx(src.x);
    const sy = wy(src.y);
    const tx = wx(tgt.x);
    const ty = wy(tgt.y);

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.strokeStyle = EDGE_COLORS[edge.type] ?? '#333344';
    ctx.lineWidth = Math.max(0.5, (edge.weight ?? 1) * scale * 0.8);
    ctx.stroke();

    // Edge label at midpoint (only when zoomed in enough)
    if (scale > 0.75) {
      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2;
      ctx.fillStyle = 'rgba(160,160,180,0.6)';
      ctx.font = `${Math.round(9 * scale)}px "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(edge.type, mx, my);
    }
  }
  ctx.restore();

  // ── Draw nodes ────────────────────────────────────────────────────────────
  const searchLower = searchTerm.trim().toLowerCase();

  for (const node of nodes) {
    if (!visibleIds.has(node.id)) continue;

    const sx = wx(node.x);
    const sy = wy(node.y);
    const r = nodeRadius(node.riskScore) * scale;
    const color = NODE_COLORS[node.type] ?? '#888';
    const isSelected = node.id === selectedId;
    const isHighlighted = searchLower && node.label.toLowerCase().includes(searchLower);
    const isHighRisk = node.riskScore > 0.7;

    // High-risk pulsing ring
    if (isHighRisk && !isSelected) {
      const pulseR = r + 5 * scale + Math.sin(pulsePhase) * 3 * scale;
      ctx.beginPath();
      ctx.arc(sx, sy, pulseR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(230,58,30,${0.35 + 0.25 * Math.sin(pulsePhase)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Selected: two glow rings
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(sx, sy, r + 10 * scale, 0, Math.PI * 2);
      ctx.strokeStyle = `${color}33`;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(sx, sy, r + 5 * scale, 0, Math.PI * 2);
      ctx.strokeStyle = `${color}88`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Search highlight
    if (isHighlighted) {
      ctx.beginPath();
      ctx.arc(sx, sy, r + 7 * scale, 0, Math.PI * 2);
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Node fill
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = isSelected ? 1 : 0.88;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Node border
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.strokeStyle = isSelected ? color : `${color}66`;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.stroke();

    // Label below node
    if (scale > 0.45) {
      const fontSize = Math.max(8, Math.round(10 * scale));
      ctx.font = `${fontSize}px "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isSelected ? '#F2F2F2' : '#909090';
      ctx.fillText(node.label, sx, sy + r + 3 * scale);
    }
  }
}



// ── Sub-components ───────────────────────────────────────────────────────────

interface JaalStats {
  total_nodes: number;
  total_edges: number;
  total_communities: number;
  high_risk_nodes: number;
  frozen_accounts: number;
  active_investigations: number;
}

function SkeletonPulse({ w, h, radius = 6 }: { w: string; h: number; radius?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-elevated, #242424) 50%, var(--bg-tertiary) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-shimmer 1.4s infinite',
    }} />
  );
}

function CommunityCard({
  community, isActive, isLoading, onClick,
}: {
  community: FraudCommunity;
  isActive: boolean;
  isLoading: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '0.875rem 1rem',
        borderRadius: 8,
        border: `1px solid ${isActive ? '#818CF8' : 'var(--bg-border)'}`,
        background: isActive ? 'rgba(129,140,248,0.08)' : 'var(--bg-tertiary)',
        cursor: 'pointer',
        transition: 'all 150ms ease',
        position: 'relative',
        flexShrink: 0,
        minWidth: 180,
      }}
    >
      {isLoading && isActive && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 8,
          background: 'rgba(8,8,16,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            border: '2px solid #818CF8', borderTopColor: 'transparent',
            animation: 'spin 0.7s linear infinite',
          }} />
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <span style={{
          fontSize: '0.72rem', fontWeight: 700, color: isActive ? '#818CF8' : 'var(--text-secondary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160,
        }}>
          {community.name}
        </span>
        <span style={{
          fontSize: '0.6rem', fontWeight: 800, padding: '0.1rem 0.4rem',
          borderRadius: 100, marginLeft: '0.4rem', flexShrink: 0,
          background: community.riskScore >= 0.7 ? 'rgba(230,58,30,0.15)' : community.riskScore >= 0.4 ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
          color: community.riskScore >= 0.7 ? '#E63A1E' : community.riskScore >= 0.4 ? '#F59E0B' : '#10B981',
        }}>
          {Math.round(community.riskScore * 100)}
        </span>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        {community.nodeCount} nodes · {formatDate(community.lastActive)}
      </div>
    </div>
  );
}

function NodeDetailPanel({
  node,
  connectedEdges,
  allNodes,
  onSelectNode,
}: {
  node: ForceNode | null;
  connectedEdges: ForceEdge[];
  allNodes: ForceNode[];
  onSelectNode: (id: string) => void;
}) {
  if (!node) {
    return (
      <div style={{
        width: 300, flexShrink: 0,
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--bg-border)',
        padding: '1.25rem',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '0.75rem',
      }}>
        <Network size={32} color="var(--text-muted)" strokeWidth={1.5} />
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Click any node on the graph to inspect it
        </p>
      </div>
    );
  }

  const color = NODE_COLORS[node.type] ?? '#888';
  const nodeMap: Record<string, ForceNode> = {};
  for (const n of allNodes) nodeMap[n.id] = n;

  const connectedNodeIds = Array.from(new Set(
    connectedEdges.flatMap(e => [e.source, e.target]).filter(id => id !== node.id)
  ));

  const metaEntries = node.metadata ? Object.entries(node.metadata) : [];

  return (
    <div style={{
      width: 300, flexShrink: 0,
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--bg-border)',
      padding: '1.25rem',
      overflowY: 'auto',
      display: 'flex', flexDirection: 'column', gap: '1rem',
    }}>
      {/* Type badge + label */}
      <div style={{
        padding: '1rem',
        background: 'var(--bg-tertiary)',
        borderRadius: 8,
        border: `1px solid ${color}30`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: 'white', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase' }}>
              {node.type.slice(0, 2)}
            </span>
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{
              fontSize: '0.9rem', fontWeight: 700,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {node.label}
            </p>
            <span style={{
              fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', padding: '0.1rem 0.4rem',
              borderRadius: 100, background: `${color}20`, color,
            }}>
              {node.type}
            </span>
          </div>
        </div>

        {/* Risk score bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Risk Score</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 800, color: riskColor(node.riskScore) }}>
            {Math.round(node.riskScore * 100)} — {riskLabel(node.riskScore)}
          </span>
        </div>
        <div style={{ height: 6, background: 'var(--bg-border)', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${node.riskScore * 100}%`,
            background: riskColor(node.riskScore),
            borderRadius: 100,
            transition: 'width 600ms ease',
          }} />
        </div>
      </div>

      {/* Metadata */}
      {metaEntries.length > 0 && (
        <div>
          <p style={{
            fontSize: '0.65rem', color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem',
          }}>
            Intelligence Data
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {metaEntries.map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between', gap: '0.5rem',
                padding: '0.4rem 0.625rem',
                background: 'var(--bg-tertiary)', borderRadius: 6,
                fontSize: '0.75rem',
              }}>
                <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize', flexShrink: 0 }}>
                  {k.replace(/_/g, ' ')}
                </span>
                <span style={{ color: 'var(--text-secondary)', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                  {String(v)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evidence refs */}
      {node.evidenceRefs && node.evidenceRefs.length > 0 && (
        <div>
          <p style={{
            fontSize: '0.65rem', color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem',
          }}>
            Evidence References
          </p>
          {node.evidenceRefs.map(ref => (
            <div key={ref} style={{
              padding: '0.375rem 0.625rem',
              borderRadius: 6, marginBottom: '0.25rem',
              background: 'rgba(129,140,248,0.08)',
              border: '1px solid rgba(129,140,248,0.2)',
              fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
              color: '#818CF8',
            }}>
              {ref}
            </div>
          ))}
        </div>
      )}

      {/* Connected nodes */}
      {connectedNodeIds.length > 0 && (
        <div>
          <p style={{
            fontSize: '0.65rem', color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem',
          }}>
            Connected Nodes ({connectedNodeIds.length})
          </p>
          {connectedNodeIds.slice(0, 8).map(id => {
            const n = nodeMap[id];
            if (!n) return null;
            const c = NODE_COLORS[n.type] ?? '#888';
            return (
              <div
                key={id}
                onClick={() => onSelectNode(id)}
                style={{
                  padding: '0.45rem 0.625rem',
                  borderRadius: 6, marginBottom: '0.25rem',
                  background: 'var(--bg-tertiary)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated, #242424)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {n.label}
                </span>
                <span style={{ fontSize: '0.6rem', color: c, fontWeight: 700 }}>{n.type}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* First / last seen from metadata */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {[
          { label: 'First Seen', value: formatDate(node.metadata?.first_seen as string | undefined) },
          { label: 'Last Active', value: formatDate(node.metadata?.last_active as string | undefined) },
        ].map(d => (
          <div key={d.label} style={{
            padding: '0.625rem',
            background: 'var(--bg-tertiary)',
            borderRadius: 6,
          }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {d.label}
            </p>
            <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {d.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}



// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminJaalPage() {
  const { user } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [communities, setCommunities] = useState<FraudCommunity[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [rawNodes, setRawNodes] = useState<GraphNode[]>([]);
  const [rawEdges, setRawEdges] = useState<GraphEdge[]>([]);
  const [stats, setStats] = useState<JaalStats | null>(null);

  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [traceSourceId, setTraceSourceId] = useState('');
  const [traceTargetId, setTraceTargetId] = useState('');
  const [traceResult, setTraceResult] = useState<JaalTraceResult | null>(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // The force layout uses canvas coordinates and already starts at its centre.
  // Pan is therefore a user-controlled offset, not another centring offset.
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const isPanning = useRef(false);
  const draggedNodeId = useRef<string | null>(null);
  const lastMouse = useRef({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const canvasSizeRef = useRef({ width: 800, height: 600 });

  const pulseRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // ── Force graph ────────────────────────────────────────────────────────────
  const { simNodes, simEdges, isSimulating, reheat, pinNode } = useForceGraph(
    rawNodes,
    rawEdges,
    { width: canvasSize.width, height: canvasSize.height },
  );

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedNode = useMemo(
    () => simNodes.find(n => n.id === selectedNodeId) ?? null,
    [simNodes, selectedNodeId],
  );

  const connectedEdges = useMemo(() => {
    if (!selectedNodeId) return [];
    return simEdges.filter(
      e => e.source === selectedNodeId || e.target === selectedNodeId,
    );
  }, [simEdges, selectedNodeId]);

  // ── Data fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingCommunities(true);
    getJaalCommunities()
      .then(res => {
        const list = res.data ?? [];
        setCommunities(list);
        if (list.length > 0) setSelectedCommunity(list[0].id);
      })
      .catch(console.error)
      .finally(() => setLoadingCommunities(false));

    setLoadingStats(true);
    getJaalStats()
      .then(res => setStats(res.data ?? null))
      .catch(console.error)
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    if (!selectedCommunity) return;
    setLoadingGraph(true);
    setRawNodes([]);
    setRawEdges([]);
    setSelectedNodeId(null);
    setTraceSourceId('');
    setTraceTargetId('');
    setTraceResult(null);
    getJaalGraph(selectedCommunity)
      .then(res => {
        const d = res.data;
        setRawNodes(d?.nodes ?? []);
        setRawEdges(d?.edges ?? []);
        // Nodes are initialised around the canvas centre by useForceGraph.
        setPan({ x: 0, y: 0 });
        setScale(1);
      })
      .catch(console.error)
      .finally(() => setLoadingGraph(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCommunity]);

  // ── Canvas resize observer ─────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        canvasSizeRef.current = { width, height };
        setCanvasSize({ width, height });
        // Keep a user's pan during resize; a newly loaded graph starts at 0,0.
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Canvas render loop ─────────────────────────────────────────────────────
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    pulseRef.current += 0.05;
    drawGraph(
      ctx,
      canvasSize.width,
      canvasSize.height,
      simNodes,
      simEdges,
      pan,
      scale,
      selectedNodeId,
      searchTerm,
      typeFilter,
      pulseRef.current,
    );
  }, [canvasSize, simNodes, simEdges, pan, scale, selectedNodeId, searchTerm, typeFilter]);

  useEffect(() => {
    const loop = () => {
      renderCanvas();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [renderCanvas]);

  // ── Canvas interaction (pan, zoom, click) ─────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale(s => Math.min(4, Math.max(0.15, s * factor)));
  }, []);

  const hitNode = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    for (const node of [...simNodes].reverse()) {
      const sx = node.x * scale + pan.x;
      const sy = node.y * scale + pan.y;
      const r = nodeRadius(node.riskScore) * scale + 5;
      if ((mx - sx) ** 2 + (my - sy) ** 2 <= r * r) return { id: node.id, mx, my };
    }
    return null;
  }, [simNodes, pan, scale]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const hit = hitNode(e.clientX, e.clientY);
    if (hit) {
      draggedNodeId.current = hit.id;
      setSelectedNodeId(hit.id);
      pinNode(hit.id, (hit.mx - pan.x) / scale, (hit.my - pan.y) / scale);
      return;
    }
    isPanning.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, [hitNode, pan, pinNode, scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggedNodeId.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      pinNode(draggedNodeId.current, (mx - pan.x) / scale, (my - pan.y) / scale);
      return;
    }
    if (!isPanning.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
  }, [pan, pinNode, scale]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (draggedNodeId.current) {
      draggedNodeId.current = null; // pinned position persists; edges follow the node
      return;
    }
    if (isPanning.current && Math.abs(e.movementX) < 3 && Math.abs(e.movementY) < 3) {
      // It was a click — hit-test nodes
      const canvas = canvasRef.current;
      if (!canvas) { isPanning.current = false; return; }
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let hit: string | null = null;
      for (const node of simNodes) {
        const sx = node.x * scale + pan.x;
        const sy = node.y * scale + pan.y;
        const r = nodeRadius(node.riskScore) * scale + 4;
        if ((mx - sx) ** 2 + (my - sy) ** 2 <= r * r) {
          hit = node.id;
          break;
        }
      }
      setSelectedNodeId(hit);
    }
    isPanning.current = false;
  }, [simNodes, pan, scale]);

  const exportEvidence = async () => {
    if (!selectedCommunity) return;
    setExporting(true);
    try {
      const response = await generateJaalEvidencePackage({
        communityId: selectedCommunity,
        selectedNodeIds: selectedNodeId ? [selectedNodeId] : [],
        investigator: user?.name,
      });
      if (!response.data) return;
      const file = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${response.data.id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  };

  const runTrace = async () => {
    if (!traceSourceId || !traceTargetId || traceSourceId === traceTargetId) return;
    setTraceLoading(true);
    try { const response = await traceJaalRelationships(traceSourceId, traceTargetId); setTraceResult(response.data ?? null); }
    finally { setTraceLoading(false); }
  };

  // ── Stat card helper ───────────────────────────────────────────────────────
  const statCards = useMemo(() => [
    { label: 'Total Nodes', value: stats?.total_nodes ?? '—', color: '#818CF8' },
    { label: 'Total Edges', value: stats?.total_edges ?? '—', color: '#22D3EE' },
    { label: 'Communities', value: stats?.total_communities ?? '—', color: '#F59E0B' },
    { label: 'High Risk Nodes', value: stats?.high_risk_nodes ?? '—', color: '#E63A1E' },
    { label: 'Frozen Accounts', value: stats?.frozen_accounts ?? '—', color: '#10B981' },
    { label: 'Investigations', value: stats?.active_investigations ?? '—', color: '#A78BFA' },
  ], [stats]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <AdminSidebar />

      <main style={{ marginLeft: 240, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          padding: '1.25rem 2rem',
          borderBottom: '1px solid var(--bg-border)',
          background: 'var(--bg-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'rgba(129,140,248,0.15)',
              border: '1px solid rgba(129,140,248,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Network size={18} color="#818CF8" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.01em', margin: 0 }}>
                JAAL — Fraud Network Intelligence
              </h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Interactive force-directed fraud ring visualisation
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isSimulating && (
              <span style={{
                fontSize: '0.7rem', color: '#10B981', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '0.375rem',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#10B981',
                  animation: 'pulse-dot 1s infinite',
                  display: 'inline-block',
                }} />
                SIMULATING
              </span>
            )}
            <button
              onClick={() => reheat()}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 0.875rem',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--bg-border)',
                borderRadius: 6, cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: '0.8rem',
              }}
            >
              <RefreshCw size={13} />
              Reheat
            </button>
            <button
              onClick={exportEvidence}
              disabled={!selectedCommunity || exporting}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 0.875rem',
                background: 'rgba(129,140,248,0.1)',
                border: '1px solid rgba(129,140,248,0.3)',
                borderRadius: 6, cursor: exporting ? 'wait' : 'pointer',
                color: '#818CF8', fontSize: '0.8rem', fontWeight: 700,
                opacity: !selectedCommunity || exporting ? 0.65 : 1,
              }}
            >
              <Download size={13} />
              {exporting ? 'Packaging…' : 'Evidence package'}
            </button>
          </div>
        </div>

        {/* Stat strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          borderBottom: '1px solid var(--bg-border)',
          flexShrink: 0,
        }}>
          {statCards.map((s, i) => (
            <div key={s.label} style={{
              padding: '0.75rem 1rem',
              background: 'var(--bg-secondary)',
              borderRight: i < statCards.length - 1 ? '1px solid var(--bg-border)' : 'none',
              display: 'flex', flexDirection: 'column', gap: '0.125rem',
            }}>
              {loadingStats ? (
                <SkeletonPulse w="60%" h={20} />
              ) : (
                <span style={{ fontSize: '1.125rem', fontWeight: 800, color: s.color }}>{s.value}</span>
              )}
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Community selector */}
        <div style={{
          padding: '0.875rem 1.5rem',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--bg-border)',
          display: 'flex', alignItems: 'center', gap: '1rem',
          flexShrink: 0, minWidth: 0,
        }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
            FRAUD RINGS
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', flex: 1, paddingBottom: '2px' }}>
            {loadingCommunities
              ? [1, 2, 3].map(i => <SkeletonPulse key={i} w="160px" h={56} radius={8} />)
              : communities.map(c => (
                <CommunityCard
                  key={c.id}
                  community={c}
                  isActive={selectedCommunity === c.id}
                  isLoading={loadingGraph && selectedCommunity === c.id}
                  onClick={() => setSelectedCommunity(c.id)}
                />
              ))
            }
          </div>
        </div>

        {/* Graph workspace */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, minWidth: 0 }}>

          {/* Toolbar sidebar */}
          <div style={{
            width: 220, flexShrink: 0,
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--bg-border)',
            padding: '1rem',
            display: 'flex', flexDirection: 'column', gap: '1rem',
            overflowY: 'auto',
          }}>
            {/* Search */}
            <div>
              <p style={{
                fontSize: '0.65rem', color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem',
              }}>
                Search Nodes
              </p>
              <div style={{ position: 'relative' }}>
                <Search size={12} color="var(--text-muted)" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Label or ID…"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.5rem 0.5rem 1.75rem',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--bg-border)',
                    borderRadius: 6, color: 'var(--text-primary)',
                    fontSize: '0.8rem', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Type filter */}
            <div>
              <p style={{
                fontSize: '0.65rem', color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem',
              }}>
                Node Type
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {TYPE_FILTERS.map(f => (
                  <button
                    key={f}
                    onClick={() => setTypeFilter(f)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: 6,
                      border: `1px solid ${typeFilter === f ? '#818CF8' : 'var(--bg-border)'}`,
                      background: typeFilter === f ? 'rgba(129,140,248,0.1)' : 'var(--bg-tertiary)',
                      color: typeFilter === f ? '#818CF8' : 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: '0.78rem', textAlign: 'left',
                      fontWeight: typeFilter === f ? 700 : 400,
                      transition: 'all 100ms ease',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div>
              <p style={{
                fontSize: '0.65rem', color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem',
              }}>
                Node Legend
              </p>
              {Object.entries(NODE_COLORS).map(([type, color]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{type}</span>
                </div>
              ))}
            </div>

            {/* Risk indicators */}
            <div>
              <p style={{
                fontSize: '0.65rem', color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem',
              }}>
                Risk Level
              </p>
              {[
                { label: 'High ≥ 70', color: '#E63A1E' },
                { label: 'Medium ≥ 40', color: '#F59E0B' },
                { label: 'Low < 40', color: '#10B981' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                  <div style={{ width: 10, height: 6, borderRadius: 3, background: r.color }} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.label}</span>
                </div>
              ))}
            </div>

            {/* Relationship / money-flow trace */}
            <div style={{ paddingTop: '0.875rem', borderTop: '1px solid var(--bg-border)' }}>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Trace Money Flow
              </p>
              <select value={traceSourceId} onChange={e => setTraceSourceId(e.target.value)} style={{ width: '100%', marginBottom: '0.4rem', padding: '0.4rem', background: 'var(--bg-tertiary)', border: '1px solid var(--bg-border)', borderRadius: 5, color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                <option value="">From entity…</option>
                {simNodes.map(node => <option key={node.id} value={node.id}>{node.label}</option>)}
              </select>
              <select value={traceTargetId} onChange={e => setTraceTargetId(e.target.value)} style={{ width: '100%', marginBottom: '0.4rem', padding: '0.4rem', background: 'var(--bg-tertiary)', border: '1px solid var(--bg-border)', borderRadius: 5, color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                <option value="">To entity…</option>
                {simNodes.map(node => <option key={node.id} value={node.id}>{node.label}</option>)}
              </select>
              <button onClick={runTrace} disabled={!traceSourceId || !traceTargetId || traceLoading} style={{ width: '100%', padding: '0.42rem', border: '1px solid rgba(34,211,238,.3)', background: 'rgba(34,211,238,.08)', borderRadius: 5, color: '#67E8F9', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, opacity: !traceSourceId || !traceTargetId ? .5 : 1 }}>
                {traceLoading ? 'Tracing…' : 'Trace path'}
              </button>
              {traceResult && <p style={{ margin: '.5rem 0 0', fontSize: '.68rem', color: traceResult.found ? '#86EFAC' : '#FBBF24', lineHeight: 1.4 }}>{traceResult.message}{traceResult.found ? ` ${traceResult.hops} hops.` : ''}</p>}
            </div>

            {/* Zoom */}
            <div>
              <p style={{
                fontSize: '0.65rem', color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem',
              }}>
                Zoom: {Math.round(scale * 100)}%
              </p>
              <input
                type="range" min="15" max="400" step="5"
                value={Math.round(scale * 100)}
                onChange={e => setScale(Number(e.target.value) / 100)}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem' }}>
                {[50, 100, 150].map(z => (
                  <button
                    key={z}
                    onClick={() => setScale(z / 100)}
                    style={{
                      flex: 1, padding: '0.3rem',
                      background: Math.round(scale * 100) === z ? 'rgba(129,140,248,0.1)' : 'var(--bg-tertiary)',
                      border: `1px solid ${Math.round(scale * 100) === z ? '#818CF8' : 'var(--bg-border)'}`,
                      borderRadius: 4, cursor: 'pointer',
                      color: Math.round(scale * 100) === z ? '#818CF8' : 'var(--text-muted)',
                      fontSize: '0.7rem',
                    }}
                  >
                    {z}%
                  </button>
                ))}
              </div>
            </div>

            {/* Alert if no data */}
            {!loadingGraph && rawNodes.length === 0 && selectedCommunity && (
              <div style={{
                padding: '0.75rem',
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: 6,
                display: 'flex', gap: '0.5rem',
              }}>
                <AlertTriangle size={14} color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: '0.72rem', color: '#F59E0B' }}>No graph data for this community.</span>
              </div>
            )}
          </div>

          {/* Canvas */}
          <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: draggedNodeId.current ? 'grabbing' : 'grab' }}>
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              style={{ display: 'block' }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => { isPanning.current = false; draggedNodeId.current = null; }}
            />

            {/* Always-visible graph controls — useful even when the left toolbar is scrolled. */}
            <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={() => setScale(value => Math.min(4, value * 1.2))} title="Zoom in" style={graphControlStyle}>
                <ZoomIn size={16} />
              </button>
              <button onClick={() => setScale(value => Math.max(0.15, value / 1.2))} title="Zoom out" style={graphControlStyle}>
                <ZoomOut size={16} />
              </button>
              <button onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }} title="Centre and reset graph" style={graphControlStyle}>
                <LocateFixed size={16} />
              </button>
            </div>

            {/* Loading overlay */}
            {loadingGraph && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(8,8,16,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: '1rem',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '3px solid #818CF8', borderTopColor: 'transparent',
                  animation: 'spin 0.7s linear infinite',
                }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Loading graph…
                </span>
              </div>
            )}

            {/* Empty state */}
            {!loadingGraph && rawNodes.length === 0 && !selectedCommunity && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: '1rem',
              }}>
                <Shield size={48} color="var(--text-muted)" strokeWidth={1} />
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Select a fraud ring community to visualise
                </p>
              </div>
            )}

            {/* Node count badge */}
            {simNodes.length > 0 && (
              <div style={{
                position: 'absolute', top: 12, left: 12,
                padding: '0.3rem 0.625rem',
                background: 'rgba(8,8,16,0.7)',
                border: '1px solid var(--bg-border)',
                borderRadius: 6, backdropFilter: 'blur(4px)',
                fontSize: '0.72rem', color: 'var(--text-muted)',
              }}>
                {simNodes.length} nodes · {simEdges.length} edges
              </div>
            )}
            {simNodes.length > 0 && (
              <div style={{ position: 'absolute', bottom: 12, left: 12, padding: '0.3rem 0.625rem', background: 'rgba(8,8,16,.72)', border: '1px solid var(--bg-border)', borderRadius: 6, backdropFilter: 'blur(4px)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Drag nodes to arrange the investigation view · drag the canvas to pan
              </div>
            )}
          </div>

          {/* Node detail panel */}
          <NodeDetailPanel
            node={selectedNode}
            connectedEdges={connectedEdges}
            allNodes={simNodes}
            onSelectNode={setSelectedNodeId}
          />
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

const graphControlStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(16,16,28,.92)',
  border: '1px solid rgba(129,140,248,.38)',
  borderRadius: 8,
  color: '#C7D2FE',
  cursor: 'pointer',
  boxShadow: '0 8px 20px rgba(0,0,0,.24)',
};
