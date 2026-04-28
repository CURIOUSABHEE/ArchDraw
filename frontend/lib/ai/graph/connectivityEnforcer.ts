import type { ArchitectureNode, ArchitectureEdge } from '../types';
import type { TierType } from '../domain/tiers';
import { TIER_ORDER } from '../domain/tiers';

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

function createEdge(source: string, target: string): ArchitectureEdge {
  return {
    id: `connectivity-${source}-${target}-${Date.now()}`,
    source,
    target,
    ...DEFAULT_EDGE_PROPS,
  };
}

function hasEdgeBetween(
  edges: ArchitectureEdge[],
  source: string,
  target: string
): boolean {
  return edges.some(
    (e) => (e.source === source && e.target === target) || (e.source === target && e.target === source)
  );
}

const OUTBOUND_TIER_PREFERENCES: Record<TierType, TierType[]> = {
  client: ['edge', 'compute'],
  edge: ['compute', 'async', 'data'],
  compute: ['async', 'data', 'observe'],
  async: ['compute', 'data', 'observe'],
  data: [],
  observe: [],
  external: [],
};

const INBOUND_TIER_PREFERENCES: Record<TierType, TierType[]> = {
  client: [],
  edge: ['client', 'external'],
  compute: ['edge', 'client', 'async'],
  async: ['compute', 'edge'],
  data: ['compute', 'async', 'edge'],
  observe: ['compute', 'async', 'data'],
  external: ['compute', 'edge'],
};

function inferTier(node: ArchitectureNode): TierType {
  if (node.tier) return node.tier;
  const layer = node.layer as TierType | undefined;
  if (layer && TIER_ORDER.includes(layer)) return layer;

  const serviceType = (node.serviceType || '').toLowerCase();
  if (serviceType.includes('client')) return 'client';
  if (serviceType.includes('gateway') || serviceType.includes('cdn') || serviceType.includes('loadbalancer') || serviceType.includes('load_balancer')) return 'edge';
  if (serviceType.includes('queue') || serviceType.includes('stream')) return 'async';
  if (serviceType.includes('database') || serviceType.includes('cache') || serviceType.includes('storage')) return 'data';
  if (serviceType.includes('monitor') || serviceType.includes('observ')) return 'observe';
  if (serviceType.includes('external')) return 'external';
  return 'compute';
}

function isSinkTier(tier: TierType): boolean {
  return tier === 'data' || tier === 'observe' || tier === 'external';
}

function findCandidateByTierPreference(
  nodes: ArchitectureNode[],
  currentEdges: ArchitectureEdge[],
  nodeId: string,
  preferredTiers: TierType[],
  direction: 'outbound' | 'inbound'
): ArchitectureNode | null {
  for (const tier of preferredTiers) {
    const candidate = nodes.find((n) => {
      if (n.isGroup || n.id === nodeId) return false;
      if (inferTier(n) !== tier) return false;
      return direction === 'outbound'
        ? !hasEdgeBetween(currentEdges, nodeId, n.id)
        : !hasEdgeBetween(currentEdges, n.id, nodeId);
    });

    if (candidate) return candidate;
  }

  return null;
}

function getNodeDegree(
  nodeId: string,
  edges: ArchitectureEdge[]
): { incoming: number; outgoing: number } {
  const incoming = edges.filter((e) => e.target === nodeId).length;
  const outgoing = edges.filter((e) => e.source === nodeId).length;
  return { incoming, outgoing };
}

export function ensureConnectivity(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } {
  const currentEdges = [...edges];
  const nodeIds = new Set(nodes.map((n) => n.id));
  
  const groupChildren = new Map<string, string[]>();
  for (const node of nodes) {
    if (node.parentId) {
      if (!groupChildren.has(node.parentId)) {
        groupChildren.set(node.parentId, []);
      }
      groupChildren.get(node.parentId)!.push(node.id);
    }
  }

  const connectedGroups = new Set<string>();
  
  for (const node of nodes) {
    if (node.isGroup) continue;

    const degree = getNodeDegree(node.id, currentEdges);
    if (degree.incoming > 0 || degree.outgoing > 0) {
      if (node.parentId) {
        connectedGroups.add(node.parentId);
      }
      continue;
    }

    const nodeTier = inferTier(node);
    const tierIndex = TIER_ORDER.indexOf(nodeTier);

    let targetNode: ArchitectureNode | null = null;
    let sourceNode: ArchitectureNode | null = null;

    if (!isSinkTier(nodeTier)) {
      targetNode = findCandidateByTierPreference(
        nodes,
        currentEdges,
        node.id,
        OUTBOUND_TIER_PREFERENCES[nodeTier],
        'outbound'
      );
    } else {
      sourceNode = findCandidateByTierPreference(
        nodes,
        currentEdges,
        node.id,
        INBOUND_TIER_PREFERENCES[nodeTier],
        'inbound'
      );
    }

    if (!targetNode && !sourceNode && tierIndex < TIER_ORDER.length - 1) {
      for (let i = tierIndex + 1; i < TIER_ORDER.length; i++) {
        const candidates = nodes.filter(
          (n) =>
            !n.isGroup &&
            inferTier(n) === TIER_ORDER[i] &&
            n.id !== node.id &&
            !hasEdgeBetween(currentEdges, node.id, n.id)
        );
        if (candidates.length > 0) {
          targetNode = candidates[0];
          break;
        }
      }
    }

    if (!targetNode && !sourceNode && tierIndex > 0) {
      for (let i = tierIndex - 1; i >= 0; i--) {
        const candidates = nodes.filter(
          (n) =>
            !n.isGroup &&
            inferTier(n) === TIER_ORDER[i] &&
            n.id !== node.id &&
            !hasEdgeBetween(currentEdges, n.id, node.id)
        );
        if (candidates.length > 0) {
          sourceNode = candidates[0];
          break;
        }
      }
    }

    if (targetNode) {
      const newEdge = createEdge(node.id, targetNode.id);
      currentEdges.push(newEdge);
    } else if (sourceNode) {
      const newEdge = createEdge(sourceNode.id, node.id);
      currentEdges.push(newEdge);
    } else {
      console.warn(
        `[ConnectivityEnforcer] Cannot connect orphaned node "${node.label}" (id: ${node.id}) - no suitable target found`
      );
    }
  }

  for (const [groupId, childIds] of groupChildren) {
    if (connectedGroups.has(groupId)) continue;
    
    const hasChildConnection = childIds.some(childId => 
      currentEdges.some(e => e.source === childId || e.target === childId)
    );
    
    if (!hasChildConnection) {
      console.warn(`[ConnectivityEnforcer] Group "${groupId}" has no connected children`);
    }
  }

  return { nodes, edges: currentEdges };
}
