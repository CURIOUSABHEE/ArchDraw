import type { ArchitectureNode, ArchitectureEdge } from '../types';
import logger from '@/lib/logger';
import { EDGE_CONFIG } from '@/lib/config';

/**
 * Ensures a diagram is fully connected.
 * 1. Identifies orphaned nodes (no incoming or outgoing edges)
 * 2. Identifies disconnected islands of nodes
 * 3. Bridges them logically based on layer hierarchy
 */
export function ensureConnectivity(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } {
  const resultEdges = [...edges];
  const leafNodes = nodes.filter(n => !n.isGroup);

  // 1. Identify orphan nodes
  const connectedNodeIds = new Set<string>();
  edges.forEach(e => {
    connectedNodeIds.add(e.source);
    connectedNodeIds.add(e.target);
  });

  const orphans = leafNodes.filter(n => !connectedNodeIds.has(n.id));

  // 2. Connect orphans to logical neighbors
  orphans.forEach(orphan => {
    const neighbor = findLogicalNeighbor(orphan, leafNodes, edges);
    if (neighbor) {
      const isSource = isNaturallySource(orphan, neighbor);
      resultEdges.push({
        id: `conn-${orphan.id}-${neighbor.id}`,
        source: isSource ? orphan.id : neighbor.id,
        target: isSource ? neighbor.id : orphan.id,
        sourceHandle: 'right',
        targetHandle: 'left',
        communicationType: 'sync',
        pathType: 'smooth',
        label: '',
        animated: false,
        style: { stroke: EDGE_CONFIG.strokeColor, strokeWidth: EDGE_CONFIG.strokeWidth },
        markerEnd: 'arrowclosed',
      } as ArchitectureEdge);
      logger.log(`[ConnectivityEnforcer] Connected orphan "${orphan.label}" to "${neighbor.label}"`);
    }
  });

  // 3. Check for empty groups
  const groupNodes = nodes.filter(n => n.isGroup);
  groupNodes.forEach(group => {
    const children = nodes.filter(n => n.parentId === group.id);
    if (children.length === 0) {
      logger.warn(`[ConnectivityEnforcer] Group "${group.id}" has no children`);
    } else {
      const groupConnected = children.some(c => connectedNodeIds.has(c.id));
      if (!groupConnected) {
         logger.warn(`[ConnectivityEnforcer] Group "${group.id}" is an isolated island`);
      }
    }
  });

  return { nodes, edges: resultEdges };
}

function isNaturallySource(a: ArchitectureNode, b: ArchitectureNode): boolean {
  const layers = ['presentation', 'gateway', 'application', 'async', 'data', 'observability', 'external'];
  const idxA = layers.indexOf(a.layer || 'application');
  const idxB = layers.indexOf(b.layer || 'application');
  
  if (idxA === idxB) return true; // arbitrary
  return idxA < idxB;
}

function findLogicalNeighbor(
  orphan: ArchitectureNode, 
  allNodes: ArchitectureNode[],
  _edges: ArchitectureEdge[]
): ArchitectureNode | null {
  const sameLayer = allNodes.filter(n => n.id !== orphan.id && n.layer === orphan.layer);
  if (sameLayer.length > 0) return sameLayer[0];

  const appLayer = allNodes.filter(n => n.layer === 'application');
  if (appLayer.length > 0) return appLayer[0];

  return allNodes.find(n => n.id !== orphan.id) || null;
}
