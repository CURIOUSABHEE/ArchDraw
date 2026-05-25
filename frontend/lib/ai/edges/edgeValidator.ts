import type { ArchitectureNode, ArchitectureEdge } from '../types';
import type { TierType } from '../domain/tiers';
import { getTierFromLayer, TIER_ORDER } from '../domain/tiers';
import { ArchitectureGraph } from '../graph/ArchitectureGraph';

export interface EdgeValidationResult {
  valid: boolean;
  errors: EdgeValidationError[];
  warnings: EdgeValidationError[];
}

export interface EdgeValidationError {
  edgeId: string;
  type: 'self-loop' | 'duplicate' | 'invalid-node' | 'backward-flow' | 'max-edges' | 'invalid-tier' | 'orphan-node' | 'spaghetti' | 'disconnected-node';
  severity: 'critical' | 'warning';
  message: string;
}

export const EDGE_INVARIANTS = {
  MAX_EDGES_PER_NODE: 4,
  FORBIDDEN_PATTERNS: [
    { source: 'client', target: 'data', reason: 'Client cannot access data directly' },
    { source: 'client', target: 'async', reason: 'Client cannot access queues directly' },
  ],
  REQUIRED_PATTERNS: [
    { from: 'client', to: 'edge', reason: 'Client should connect to edge tier' },
    { from: 'edge', to: 'compute', reason: 'Edge should connect to compute tier' },
  ],
} as const;

export function validateEdges(
  edges: ArchitectureEdge[],
  nodes: ArchitectureNode[]
): EdgeValidationResult {
  const errors: EdgeValidationError[] = [];
  const warnings: EdgeValidationError[] = [];
  
  const nodeIds = new Set(nodes.map(n => n.id));
  const edgePairs = new Set<string>();

  for (const edge of edges) {
    if (edge.source === edge.target) {
      errors.push({
        edgeId: edge.id,
        type: 'self-loop',
        severity: 'critical',
        message: `Self-loop detected on node "${edge.source}"`,
      });
      continue;
    }

    if (!nodeIds.has(edge.source)) {
      errors.push({
        edgeId: edge.id,
        type: 'invalid-node',
        severity: 'critical',
        message: `Edge "${edge.id}" has invalid source: ${edge.source}`,
      });
    }

    if (!nodeIds.has(edge.target)) {
      errors.push({
        edgeId: edge.id,
        type: 'invalid-node',
        severity: 'critical',
        message: `Edge "${edge.id}" has invalid target: ${edge.target}`,
      });
    }

    const pairKey = `${edge.source}-${edge.target}`;
    const reverseKey = `${edge.target}-${edge.source}`;
    if (edgePairs.has(pairKey) || edgePairs.has(reverseKey)) {
      warnings.push({
        edgeId: edge.id,
        type: 'duplicate',
        severity: 'warning',
        message: `Duplicate edge detected between "${edge.source}" and "${edge.target}"`,
      });
    }
    edgePairs.add(pairKey);
  }

  const edgeCountByNode = new Map<string, number>();
  for (const edge of edges) {
    edgeCountByNode.set(edge.source, (edgeCountByNode.get(edge.source) || 0) + 1);
    edgeCountByNode.set(edge.target, (edgeCountByNode.get(edge.target) || 0) + 1);
  }

  for (const [nodeId, count] of edgeCountByNode) {
    if (count > EDGE_INVARIANTS.MAX_EDGES_PER_NODE) {
      warnings.push({
        edgeId: nodeId,
        type: 'max-edges',
        severity: 'warning',
        message: `Node "${nodeId}" has ${count} edges (max ${EDGE_INVARIANTS.MAX_EDGES_PER_NODE})`,
      });
    }
  }

  const nodeTierMap = new Map(nodes.map(n => [n.id, getNodeTier(n)]));

  for (const edge of edges) {
    const sourceTier = nodeTierMap.get(edge.source);
    const targetTier = nodeTierMap.get(edge.target);
    
    if (!sourceTier || !targetTier) continue;

    const sourceIndex = TIER_ORDER.indexOf(sourceTier);
    const targetIndex = TIER_ORDER.indexOf(targetTier);

    if (sourceIndex > targetIndex) {
      if (sourceTier !== 'external' && targetTier !== 'client' && sourceTier !== 'observe') {
        warnings.push({
          edgeId: edge.id,
          type: 'backward-flow',
          severity: 'warning',
          message: `Edge flows backward: ${sourceTier} → ${targetTier}`,
        });
      }
    }
  }

  for (const forbidden of EDGE_INVARIANTS.FORBIDDEN_PATTERNS) {
    const matchingEdges = edges.filter(e => {
      const sourceTier = nodeTierMap.get(e.source);
      const targetTier = nodeTierMap.get(e.target);
      return sourceTier === forbidden.source && targetTier === forbidden.target;
    });

    for (const edge of matchingEdges) {
      errors.push({
        edgeId: edge.id,
        type: 'invalid-tier',
        severity: 'critical',
        message: forbidden.reason,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateConnectivity(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): EdgeValidationError[] {
  const errors: EdgeValidationError[] = [];
  const graph = ArchitectureGraph.fromArrays(nodes, edges);

  const edgeErrors = graph.validateConnectivity();
  for (const err of edgeErrors) {
    errors.push({
      edgeId: err.edgeId || '',
      type: 'invalid-node',
      severity: err.severity,
      message: err.message,
    });
  }

  const isolatedNodes = nodes.filter(node => {
    if (node.isGroup) return false;
    const degree = graph.getNodeDegree(node.id);
    return degree.total === 0;
  });

  if (isolatedNodes.length > 0 && nodes.length > 1) {
    errors.push({
      edgeId: '',
      type: 'invalid-node',
      severity: 'warning',
      message: `${isolatedNodes.length} isolated node(s): ${isolatedNodes.map(n => n.label).join(', ')}`,
    });
  }

  return errors;
}

export function validateTierHierarchy(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): EdgeValidationError[] {
  const errors: EdgeValidationError[] = [];
  const nodeTierMap = new Map(nodes.map(n => [n.id, getNodeTier(n)]));

  const tiersPresent = new Set(Array.from(nodeTierMap.values()));
  const expectedFlow = ['client', 'edge', 'compute', 'data'];
  
  for (let i = 0; i < expectedFlow.length - 1; i++) {
    const current = expectedFlow[i] as TierType;
    const next = expectedFlow[i + 1] as TierType;
    
    if (tiersPresent.has(current) && tiersPresent.has(next)) {
      const hasConnection = edges.some(e => {
        return nodeTierMap.get(e.source) === current && nodeTierMap.get(e.target) === next;
      });

      if (!hasConnection) {
        errors.push({
          edgeId: '',
          type: 'invalid-tier',
          severity: 'warning',
          message: `Missing connection: ${current} → ${next}`,
        });
      }
    }
  }

  const asyncNodes = nodes.filter(n => getNodeTier(n) === 'async');
  for (const asyncNode of asyncNodes) {
    const incoming = edges.filter(e => e.target === asyncNode.id);
    const outgoing = edges.filter(e => e.source === asyncNode.id);

    if (incoming.length === 0) {
      errors.push({
        edgeId: '',
        type: 'invalid-tier',
        severity: 'warning',
        message: `Async node "${asyncNode.label}" has no producer`,
      });
    }
    if (outgoing.length === 0) {
      errors.push({
        edgeId: '',
        type: 'invalid-tier',
        severity: 'warning',
        message: `Async node "${asyncNode.label}" has no consumer`,
      });
    }
  }

  return errors;
}

function getNodeTier(node: ArchitectureNode): TierType {
  if (node.tier) return node.tier as TierType;
  return getTierFromLayer(node.layer) || 'compute';
}

/**
 * Enforces minimum connections per node.
 */
export function enforceMinimumConnections(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): { edges: ArchitectureEdge[]; fixes: string[] } {
  const resultEdges = [...edges];
  const fixes: string[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  for (const node of nodes) {
    if (node.isGroup) continue;

    const connections = resultEdges.filter(
      e => e.source === node.id || e.target === node.id
    );

    if (connections.length === 0) {
      const candidate = findDirectionalPartner(node, nodes);
      if (candidate) {
        const nodeRank = getLayerRank(node.layer);
        const candidateRank = getLayerRank(candidate.layer);
        const nodeIsSource = nodeRank <= candidateRank;

        const newEdge: ArchitectureEdge = {
          id: `auto-fix-${node.id}`,
          source: nodeIsSource ? node.id : candidate.id,
          target: nodeIsSource ? candidate.id : node.id,
          sourceHandle: 'right',
          targetHandle: 'left',
          communicationType: node.layer === 'async' || node.layer === 'queue' || candidate.layer === 'async' || candidate.layer === 'queue' ? 'async' : 'sync',
          pathType: 'smooth',
          label: '',
          animated: node.layer === 'async' || node.layer === 'queue' || candidate.layer === 'async' || candidate.layer === 'queue',
          style: { stroke: '#94a3b8', strokeWidth: 2 },
          markerEnd: 'arrowclosed',
        } as ArchitectureEdge;

        resultEdges.push(newEdge);
        fixes.push(`Connected orphan node: ${node.label}`);
      }
    }
  }

  return { edges: resultEdges, fixes };
}

function findDirectionalPartner(node: ArchitectureNode, nodes: ArchitectureNode[]): ArchitectureNode | undefined {
  const candidates = nodes.filter(n => !n.isGroup && n.id !== node.id);
  const nodeRank = getLayerRank(node.layer);
  const downstream = candidates
    .filter(candidate => getLayerRank(candidate.layer) >= nodeRank)
    .sort((a, b) => getLayerRank(a.layer) - getLayerRank(b.layer));
  const upstream = candidates
    .filter(candidate => getLayerRank(candidate.layer) < nodeRank)
    .sort((a, b) => getLayerRank(b.layer) - getLayerRank(a.layer));

  if (nodeRank === 0) return downstream.find(candidate => getLayerRank(candidate.layer) > nodeRank) || downstream[0];
  if (nodeRank >= 4) return upstream[0] || downstream[0];
  return downstream.find(candidate => getLayerRank(candidate.layer) > nodeRank) || upstream[0] || downstream[0];
}

function getLayerRank(layer?: string): number {
  const normalized = normalizeLayer(layer);
  const order = ['client', 'edge', 'gateway', 'application', 'compute', 'async', 'queue', 'data', 'infrastructure', 'observe', 'observability', 'external'];
  const idx = order.indexOf(normalized);
  return idx >= 0 ? idx : 3;
}

function normalizeLayer(layer?: string): string {
  if (!layer) return 'application';
  if (layer === 'presentation') return 'client';
  return layer;
}

