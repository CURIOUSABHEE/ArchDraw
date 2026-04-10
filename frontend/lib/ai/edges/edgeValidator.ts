import type { ArchitectureNode, ArchitectureEdge } from '../types';
import type { TierType } from '../domain/tiers';
import { TIER_ORDER } from '../domain/tiers';
import { ArchitectureGraph } from '../graph/ArchitectureGraph';

export interface EdgeValidationResult {
  valid: boolean;
  errors: EdgeValidationError[];
  warnings: EdgeValidationError[];
}

export interface EdgeValidationError {
  edgeId: string;
  type: 'self-loop' | 'duplicate' | 'invalid-node' | 'backward-flow' | 'max-edges' | 'invalid-tier';
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

  const nodeTierMap = new Map(nodes.map(n => [n.id, (n.tier || n.layer) as TierType]));

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
  const nodeTierMap = new Map(nodes.map(n => [n.id, (n.tier || n.layer) as TierType]));

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

  const asyncNodes = nodes.filter(n => (n.tier || n.layer) === 'async');
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
