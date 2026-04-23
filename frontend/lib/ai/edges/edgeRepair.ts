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
    stroke: '#6366f1',
    strokeDasharray: '',
    strokeWidth: 2,
  },
  markerEnd: 'arrowclosed' as const,
  markerStart: 'none' as const,
};

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

  const edgeCountByNode = new Map<string, number>();
  for (const edge of currentEdges) {
    edgeCountByNode.set(edge.source, (edgeCountByNode.get(edge.source) || 0) + 1);
    edgeCountByNode.set(edge.target, (edgeCountByNode.get(edge.target) || 0) + 1);
  }

  for (const [nodeId, count] of edgeCountByNode) {
    if (count > 4) {
      const nodeEdges = currentEdges.filter(e => e.source === nodeId || e.target === nodeId);
      const sorted = nodeEdges.sort((a, b) => {
        const priority: Record<string, number> = { sync: 1, async: 2, event: 3, stream: 4, dep: 5 };
        return (priority[a.communicationType] || 0) - (priority[b.communicationType] || 0);
      });

      const toRemove = sorted.slice(4);
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
