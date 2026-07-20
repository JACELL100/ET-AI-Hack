/**
 * useForceGraph — Pure TypeScript force-directed graph layout simulation.
 * No D3, no external libraries. All physics implemented from scratch.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import type { GraphNode as RawNode, GraphEdge as RawEdge } from "@/types";

// ── Public types ────────────────────────────────────────────────────────────

export interface ForceNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
  // original data
  label: string;
  type: string;
  riskScore: number;
  metadata?: Record<string, unknown>;
  evidenceRefs?: string[];
}

export interface ForceEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  timestamp?: string;
}

export interface UseForceGraphOptions {
  width: number;
  height: number;
  nodeCount?: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const CHARGE = -300;         // repulsion constant
const SPRING_K = 0.05;       // spring attraction strength
const REST_LEN = 120;        // spring rest length (px)
const DAMPING = 0.85;        // velocity decay per tick
const GRAVITY = 0.015;       // pull toward center
const TOTAL_TICKS = 300;     // total ticks before cooling
const TICKS_PER_FRAME = 6;   // physics steps per animation frame

// ── Hook ────────────────────────────────────────────────────────────────────

export function useForceGraph(
  rawNodes: RawNode[],
  rawEdges: RawEdge[],
  options: UseForceGraphOptions
) {
  const { width, height } = options;

  const [simNodes, setSimNodes] = useState<ForceNode[]>([]);
  const [simEdges, setSimEdges] = useState<ForceEdge[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Internal mutable state (not React state, to avoid re-render overhead per tick)
  const nodesRef = useRef<ForceNode[]>([]);
  const edgesRef = useRef<ForceEdge[]>([]);
  const tickCountRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(false);

  // ── Initialise nodes from raw API data ───────────────────────────────────

  const initNodes = useCallback(
    (rNodes: RawNode[], rEdges: RawEdge[]) => {
      const cx = width / 2;
      const cy = height / 2;
      const count = rNodes.length;
      const radius = Math.min(width, height) * 0.32;

      const nodes: ForceNode[] = rNodes.map((n, i) => {
        const angle = (2 * Math.PI * i) / Math.max(count, 1);
        const jitterX = (Math.random() - 0.5) * 60;
        const jitterY = (Math.random() - 0.5) * 60;
        return {
          id: n.id,
          x: cx + radius * Math.cos(angle) + jitterX,
          y: cy + radius * Math.sin(angle) + jitterY,
          vx: 0,
          vy: 0,
          fx: null,
          fy: null,
          label: n.label,
          type: n.type,
          riskScore: n.riskScore ?? 0,
          metadata: (n.data as Record<string, unknown>) ?? {},
          evidenceRefs: [],
        };
      });

      const edges: ForceEdge[] = rEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type ?? "ASSOCIATED_WITH",
        weight: e.weight ?? 1,
        timestamp: e.timestamp,
      }));

      nodesRef.current = nodes;
      edgesRef.current = edges;
      setSimEdges(edges);
    },
    [width, height]
  );

  // ── Single physics tick ───────────────────────────────────────────────────

  const tick = useCallback(() => {
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const cx = width / 2;
    const cy = height / 2;
    const n = nodes.length;

    if (n === 0) return;

    // Accumulators
    const ax = new Float64Array(n);
    const ay = new Float64Array(n);

    // Build id → index map for edge lookups
    const idxMap: Record<string, number> = {};
    for (let i = 0; i < n; i++) idxMap[nodes[i].id] = i;

    // 1. Node–node repulsion
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < 0.01) continue;
        const dist = Math.sqrt(dist2);
        const force = CHARGE / dist2;  // negative = repulsive
        const fx = (force * dx) / dist;
        const fy = (force * dy) / dist;
        ax[i] += fx;
        ay[i] += fy;
        ax[j] -= fx;
        ay[j] -= fy;
      }
    }

    // 2. Edge spring attraction
    for (const edge of edges) {
      const si = idxMap[edge.source];
      const ti = idxMap[edge.target];
      if (si === undefined || ti === undefined) continue;
      const dx = nodes[ti].x - nodes[si].x;
      const dy = nodes[ti].y - nodes[si].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const stretch = dist - REST_LEN;
      const force = SPRING_K * stretch;
      const fx = (force * dx) / dist;
      const fy = (force * dy) / dist;
      ax[si] += fx;
      ay[si] += fy;
      ax[ti] -= fx;
      ay[ti] -= fy;
    }

    // 3. Centre gravity + integrate
    for (let i = 0; i < n; i++) {
      const node = nodes[i];

      // Centre gravity
      ax[i] += (cx - node.x) * GRAVITY;
      ay[i] += (cy - node.y) * GRAVITY;

      // If pinned, override
      if (node.fx != null && node.fy != null) {
        node.x = node.fx;
        node.y = node.fy;
        node.vx = 0;
        node.vy = 0;
        continue;
      }

      // Integrate velocity
      node.vx = (node.vx + ax[i]) * DAMPING;
      node.vy = (node.vy + ay[i]) * DAMPING;
      node.x += node.vx;
      node.y += node.vy;

      // Clamp inside canvas with a margin
      const margin = 40;
      node.x = Math.max(margin, Math.min(width - margin, node.x));
      node.y = Math.max(margin, Math.min(height - margin, node.y));
    }
  }, [width, height]);

  // ── Animation loop ────────────────────────────────────────────────────────

  const loop = useCallback(() => {
    if (!activeRef.current) return;

    for (let t = 0; t < TICKS_PER_FRAME; t++) {
      tick();
      tickCountRef.current++;
      if (tickCountRef.current >= TOTAL_TICKS) {
        activeRef.current = false;
        break;
      }
    }

    // Push a shallow copy to React so canvas re-renders
    setSimNodes([...nodesRef.current]);

    if (activeRef.current) {
      rafRef.current = requestAnimationFrame(loop);
    } else {
      setIsSimulating(false);
      rafRef.current = null;
    }
  }, [tick]);

  // ── Public controls ───────────────────────────────────────────────────────

  const startSimulation = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    activeRef.current = true;
    tickCountRef.current = 0;
    setIsSimulating(true);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const stopSimulation = useCallback(() => {
    activeRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsSimulating(false);
  }, []);

  const pinNode = useCallback((id: string, x: number, y: number) => {
    const node = nodesRef.current.find((n) => n.id === id);
    if (node) {
      node.fx = x;
      node.fy = y;
      node.x = x;
      node.y = y;
      node.vx = 0;
      node.vy = 0;
      setSimNodes([...nodesRef.current]);
    }
  }, []);

  const unpinNode = useCallback((id: string) => {
    const node = nodesRef.current.find((n) => n.id === id);
    if (node) {
      node.fx = null;
      node.fy = null;
    }
  }, []);

  const reheat = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    activeRef.current = true;
    tickCountRef.current = 0;
    setIsSimulating(true);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  // ── Re-initialise when input data changes ────────────────────────────────

  useEffect(() => {
    stopSimulation();
    if (rawNodes.length === 0) {
      nodesRef.current = [];
      edgesRef.current = [];
      setSimNodes([]);
      setSimEdges([]);
      return;
    }
    initNodes(rawNodes, rawEdges);
    // Auto-start once we have data
    activeRef.current = true;
    tickCountRef.current = 0;
    setIsSimulating(true);
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      activeRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawNodes, rawEdges, width, height]);

  return {
    simNodes,
    simEdges,
    isSimulating,
    startSimulation,
    stopSimulation,
    pinNode,
    unpinNode,
    reheat,
  };
}
