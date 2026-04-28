import type { ArchitectureNode, ArchitectureEdge } from '../types';
import type { TierType } from '../domain/tiers';
import { TIER_ORDER } from '../domain/tiers';
import { ArchitectureGraph } from '../graph/ArchitectureGraph';
import { validateEdges, validateConnectivity, validateTierHierarchy } from './edgeValidator';
import type { EdgeValidationError } from './edgeValidator';

export interface RepairResult {
  edges: ArchitectureEdge[];
  repaired: EdgeValidationError[];
  removed: string[];
}

const DEFAULT_EDGE_PROPS = {
  sourceHandle: 'right' as const,
  targetHandle: 'left' as const,
  communicationType: 'sync' as const,
  pathType: 'smooth' as const,
  label: '',
  labelPosition: 'center' as const,
  animated: false,
  style: {
    stroke: '#94a3b8',
    strokeDasharray: '',
    strokeWidth: 2,
  },
  markerEnd: 'arrowclosed' as const,
  markerStart: 'none' as const,
};

const DEGREE_CAP_BY_TIER: Partial<Record<TierType, number>> = {
  client: 2,
  edge: 4,
  compute: 5,
  async: 4,
  data: 3,
  observe: 2,
  external: 2,
};

function getTier(node?: ArchitectureNode): TierType {
  return ((node?.tier || node?.layer || 'compute') as TierType);
}

function edgePriority(edge: ArchitectureEdge, nodeMap: Map<string, ArchitectureNode>): number {
  const sourceTier = getTier(nodeMap.get(edge.source));
  const targetTier = getTier(nodeMap.get(edge.target));

  let score = 0;

  // Keep canonical forward flow
  const sourceIdx = TIER_ORDER.indexOf(sourceTier);
  const targetIdx = TIER_ORDER.indexOf(targetTier);
  if (sourceIdx >= 0 && targetIdx >= 0 && sourceIdx <= targetIdx) score += 3;

  // Favor major structural paths
  if (sourceTier === 'client' && targetTier === 'edge') score += 5;
  if (sourceTier === 'edge' && targetTier === 'compute') score += 5;
  if (sourceTier === 'compute' && (targetTier === 'data' || targetTier === 'async')) score += 4;
  if (sourceTier === 'async' && (targetTier === 'compute' || targetTier === 'observe')) score += 3;

  // Penalize spaghetti patterns
  if (sourceTier === targetTier) score -= 3;
  if (sourceTier === 'data' && targetTier !== 'observe') score -= 4;
  if (sourceTier === 'observe') score -= 5;
  if (sourceIdx > targetIdx && sourceTier !== 'external') score -= 2;

  if (edge.communicationType === 'async' || edge.communicationType === 'event') score += 1;

  return score;
}

function pruneSpaghettiEdges(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): { edges: ArchitectureEdge[]; removed: string[] } {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const degree = new Map<string, number>();

  for (const edge of edges) {
    degree.set(edge.source, (degree.get(edge.source) || 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) || 0) + 1);
  }

  const removed = new Set<string>();
  const currentEdges = [...edges].sort((a, b) => edgePriority(a, nodeMap) - edgePriority(b, nodeMap));

  for (const edge of currentEdges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    if (!sourceNode || !targetNode) continue;

    const sourceTier = getTier(sourceNode);
    const targetTier = getTier(targetNode);
    const sourceCap = DEGREE_CAP_BY_TIER[sourceTier] ?? 4;
    const targetCap = DEGREE_CAP_BY_TIER[targetTier] ?? 4;

    const sourceDegree = degree.get(edge.source) || 0;
    const targetDegree = degree.get(edge.target) || 0;
    const overCap = sourceDegree > sourceCap || targetDegree > targetCap;
    const weakEdge = edgePriority(edge, nodeMap) <= 0;

    if (!overCap && !weakEdge) continue;

    // Never isolate endpoints here; connectivity pass can add better bridges later.
    if (sourceDegree <= 1 || targetDegree <= 1) continue;

    removed.add(edge.id);
    degree.set(edge.source, sourceDegree - 1);
    degree.set(edge.target, targetDegree - 1);
  }

  return {
    edges: currentEdges.filter((e) => !removed.has(e.id)),
    removed: Array.from(removed),
  };
}

export function repairEdges(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): RepairResult {
  let currentEdges = [...edges];
  const repaired: EdgeValidationError[] = [];
  const removed: string[] = [];

  const validation = validateEdges(currentEdges, nodes);
  for (const error of validation.errors) {
    if (error.type === 'self-loop') {
      removed.push(error.edgeId);
      currentEdges = currentEdges.filter(e => e.id !== error.edgeId);
    }
    
    if (error.type === 'invalid-node') {
      removed.push(error.edgeId);
      currentEdges = currentEdges.filter(e => e.id !== error.edgeId);
    }
  }

  const graph = ArchitectureGraph.fromArrays(nodes, currentEdges);

  const spaghettiPrune = pruneSpaghettiEdges(nodes, currentEdges);
  if (spaghettiPrune.removed.length > 0) {
    currentEdges = spaghettiPrune.edges;
    removed.push(...spaghettiPrune.removed);
    for (const edgeId of spaghettiPrune.removed) {
      repaired.push({
        edgeId,
        type: 'max-edges',
        severity: 'warning',
        message: `Pruned low-value edge to reduce crossing and clutter`,
      });
    }
  }

  const edgeCountByNode = new Map<string, number>();
  for (const edge of currentEdges) {
    edgeCountByNode.set(edge.source, (edgeCountByNode.get(edge.source) || 0) + 1);
    edgeCountByNode.set(edge.target, (edgeCountByNode.get(edge.target) || 0) + 1);
  }

  for (const [nodeId, count] of edgeCountByNode) {
      const tier = getTier(nodes.find((n) => n.id === nodeId));
      const cap = DEGREE_CAP_BY_TIER[tier] ?? 4;
      if (count > cap) {
        const nodeEdges = currentEdges.filter(e => e.source === nodeId || e.target === nodeId);
       const nodeMap = new Map(nodes.map((n) => [n.id, n]));
       const sorted = nodeEdges.sort((a, b) => edgePriority(a, nodeMap) - edgePriority(b, nodeMap));

       const toRemove = sorted.slice(cap);
       for (const edge of toRemove) {
         removed.push(edge.id);
         currentEdges = currentEdges.filter(e => e.id !== edge.id);
         repaired.push({
           edgeId: edge.id,
           type: 'max-edges',
           severity: 'warning',
           message: `Removed excess edge from "${nodeId}"`,
         });
       }
     }
  }

  const connectivityErrors = validateConnectivity(nodes, currentEdges);
  for (const error of connectivityErrors) {
    if (error.severity === 'warning' && error.message.includes('isolated')) {
      const isolatedNodeId = nodes.find(n => 
        error.message.includes(n.label)
      )?.id;

      if (isolatedNodeId) {
        const node = nodes.find(n => n.id === isolatedNodeId);
        if (node && !node.isGroup) {
          const tier = (node.tier || node.layer) as TierType;
          const tierIndex = TIER_ORDER.indexOf(tier);

          let targetTier: TierType | null = null;
          for (let i = tierIndex + 1; i < TIER_ORDER.length; i++) {
            const candidates = nodes.filter(n => 
              (n.tier || n.layer) === TIER_ORDER[i] && !n.isGroup && n.id !== isolatedNodeId
            );
            if (candidates.length > 0) {
              targetTier = TIER_ORDER[i];
              break;
            }
          }

          if (targetTier) {
            const targets = nodes.filter(n => 
              (n.tier || n.layer) === targetTier && !n.isGroup && n.id !== isolatedNodeId
            );
            if (targets.length > 0) {
              const newEdge: ArchitectureEdge = {
                id: `repair-${isolatedNodeId}-to-${targets[0].id}`,
                source: isolatedNodeId,
                target: targets[0].id,
                ...DEFAULT_EDGE_PROPS,
              };
              currentEdges.push(newEdge);
              repaired.push({
                edgeId: newEdge.id,
                type: 'invalid-node',
                severity: 'warning',
                message: `Connected isolated node "${node.label}" to "${targets[0].label}"`,
              });
            }
          }
        }
      }
    }
  }

  const nodeTierMap = new Map(nodes.map(n => [n.id, (n.tier || n.layer) as TierType]));

  for (const edge of currentEdges) {
    const sourceTier = nodeTierMap.get(edge.source);
    const targetTier = nodeTierMap.get(edge.target);
    
    if (!sourceTier || !targetTier) continue;

    if (sourceTier === 'client' && targetTier === 'data') {
      const edgeTier = nodes.find(n => n.label.toLowerCase().includes('gateway') || n.label.toLowerCase().includes('api'));
      if (edgeTier) {
        removed.push(edge.id);
        const newEdge1: ArchitectureEdge = {
          id: `repair-${edge.source}-to-${edgeTier.id}`,
          source: edge.source,
          target: edgeTier.id,
          ...DEFAULT_EDGE_PROPS,
        };
        const newEdge2: ArchitectureEdge = {
          id: `repair-${edgeTier.id}-to-${edge.target}`,
          source: edgeTier.id,
          target: edge.target,
          ...DEFAULT_EDGE_PROPS,
        };
        currentEdges.push(newEdge1, newEdge2);
        repaired.push({
          edgeId: edge.id,
          type: 'invalid-tier',
          severity: 'critical',
          message: `Replaced invalid client→data edge with client→gateway→data`,
        });
      }
    }
  }

  return {
    edges: currentEdges,
    repaired,
    removed,
  };
}

export function generateMissingEdges(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): ArchitectureEdge[] {
  const graph = ArchitectureGraph.fromArrays(nodes, edges);
  const newEdges: ArchitectureEdge[] = [];

  const tiersPresent = new Set(
    nodes
      .filter(n => !n.isGroup)
      .map(n => (n.tier || n.layer) as TierType)
  );

  const tierOrder = ['client', 'edge', 'compute', 'data'] as TierType[];
  
  const nodeTierMapLocal = new Map(nodes.map(n => [n.id, (n.tier || n.layer) as TierType]));

  const asyncNodes = nodes.filter(n => (n.tier || n.layer) === 'async' && !n.isGroup);
  for (const asyncNode of asyncNodes) {
    const incomingEdges = edges.filter(e => e.target === asyncNode.id);
    const outgoingEdges = edges.filter(e => e.source === asyncNode.id);

    if (incomingEdges.length === 0) {
      const producers = nodes.filter(n => 
        (n.tier || n.layer) === 'compute' && !n.isGroup
      );
      if (producers.length > 0) {
        const newEdge: ArchitectureEdge = {
          id: `auto-${producers[0].id}-to-${asyncNode.id}`,
          source: producers[0].id,
          target: asyncNode.id,
          ...DEFAULT_EDGE_PROPS,
          communicationType: 'async',
        };
        newEdges.push(newEdge);
      }
    }

    if (outgoingEdges.length === 0) {
      const consumers = nodes.filter(n => 
        ((n.tier || n.layer) === 'compute' || (n.tier || n.layer) === 'observe') && !n.isGroup && n.id !== asyncNode.id
      );
      if (consumers.length > 0) {
        const newEdge: ArchitectureEdge = {
          id: `auto-${asyncNode.id}-to-${consumers[0].id}`,
          source: asyncNode.id,
          target: consumers[0].id,
          ...DEFAULT_EDGE_PROPS,
          communicationType: 'async',
        };
        newEdges.push(newEdge);
      }
    }
  }

  return newEdges;
}

export function simplifyEdgeRedundancy(edges: ArchitectureEdge[]): ArchitectureEdge[] {
  const simplified: ArchitectureEdge[] = [];
  const edgePairs = new Set<string>();

  for (const edge of edges) {
    const pairKey = `${edge.source}-${edge.target}`;
    const reverseKey = `${edge.target}-${edge.source}`;

    if (edgePairs.has(pairKey) || edgePairs.has(reverseKey)) {
      continue;
    }

    edgePairs.add(pairKey);
    simplified.push(edge);
  }

  return simplified;
}
