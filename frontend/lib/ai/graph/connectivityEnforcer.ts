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
    stroke: '#6366f1',
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
    (e) => e.source === source && e.target === target
  );
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

  for (const node of nodes) {
    if (node.isGroup) continue;

    const degree = getNodeDegree(node.id, currentEdges);
    if (degree.incoming > 0 || degree.outgoing > 0) continue;

    const nodeTier = (node.tier || node.layer) as TierType;
    const tierIndex = TIER_ORDER.indexOf(nodeTier);

    let targetNode: ArchitectureNode | null = null;
    let sourceNode: ArchitectureNode | null = null;

    if (tierIndex < TIER_ORDER.length - 1) {
      for (let i = tierIndex + 1; i < TIER_ORDER.length; i++) {
        const candidates = nodes.filter(
          (n) =>
            !n.isGroup &&
            (n.tier || n.layer) === TIER_ORDER[i] &&
            n.id !== node.id &&
            !hasEdgeBetween(currentEdges, node.id, n.id)
        );
        if (candidates.length > 0) {
          targetNode = candidates[0];
          break;
        }
      }
    }

    if (!targetNode && tierIndex > 0) {
      for (let i = tierIndex - 1; i >= 0; i--) {
        const candidates = nodes.filter(
          (n) =>
            !n.isGroup &&
            (n.tier || n.layer) === TIER_ORDER[i] &&
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

  return { nodes, edges: currentEdges };
}
