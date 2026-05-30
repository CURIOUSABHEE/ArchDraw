import type { ArchitectureNode, ArchitectureEdge } from '../types';
import logger from '@/lib/logger';
import { EDGE_CONFIG } from '@/lib/config';

/**
 * Finds all connected components (islands) in the diagram.
 */
export function findConnectedComponents(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): string[][] {
  const leafNodes = nodes.filter(n => !n.isGroup);
  const nodeIds = leafNodes.map(n => n.id);
  const adj = new Map<string, string[]>();
  
  nodeIds.forEach(id => adj.set(id, []));
  edges.forEach(e => {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source)!.push(e.target);
      adj.get(e.target)!.push(e.source);
    }
  });

  const visited = new Set<string>();
  const components: string[][] = [];

  nodeIds.forEach(id => {
    if (!visited.has(id)) {
      const component: string[] = [];
      const queue = [id];
      visited.add(id);

      while (queue.length > 0) {
        const u = queue.shift()!;
        component.push(u);
        (adj.get(u) || []).forEach(v => {
          if (!visited.has(v)) {
            visited.add(v);
            queue.push(v);
          }
        });
      }
      components.push(component);
    }
  });

  return components;
}

/**
 * Bridges disconnected components with logical edges.
 */
export function bridgeComponents(
  components: string[][],
  nodes: ArchitectureNode[],
  _edges: ArchitectureEdge[]
): ArchitectureEdge[] {
  if (components.length <= 1) return [];

  const bridges: ArchitectureEdge[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  logger.log(`[GraphConnectivity] Bridging ${components.length} components`);

  for (let i = 0; i < components.length - 1; i++) {
    const c1 = components[i];
    const c2 = components[i+1];
    
    // Find best boundary nodes to bridge without creating backend → client arrows.
    const [n1Id, n2Id] = chooseBridgeEndpoints(c1, c2, nodeMap);
    
    if (n1Id && n2Id) {
      const n1 = nodeMap.get(n1Id);
      const n2 = nodeMap.get(n2Id);
      const firstIsSource = getLayerRank(n1?.layer) <= getLayerRank(n2?.layer);

      bridges.push({
        id: `bridge-${n1Id}-${n2Id}`,
        source: firstIsSource ? n1Id : n2Id,
        target: firstIsSource ? n2Id : n1Id,
        sourceHandle: 'right',
        targetHandle: 'left',
        communicationType: 'sync',
        pathType: 'smooth',
        label: '',
        animated: false,
        style: { stroke: EDGE_CONFIG.strokeColor, strokeWidth: EDGE_CONFIG.strokeWidth },
        markerEnd: 'arrowclosed',
      } as ArchitectureEdge);
    }
  }

  return bridges;
}

function chooseBridgeEndpoints(
  c1: string[],
  c2: string[],
  nodeMap: Map<string, ArchitectureNode>
): [string | undefined, string | undefined] {
  const ranked1 = c1
    .map(id => nodeMap.get(id))
    .filter((node): node is ArchitectureNode => Boolean(node))
    .sort((a, b) => getLayerRank(a.layer) - getLayerRank(b.layer));
  const ranked2 = c2
    .map(id => nodeMap.get(id))
    .filter((node): node is ArchitectureNode => Boolean(node))
    .sort((a, b) => getLayerRank(a.layer) - getLayerRank(b.layer));

  const low1 = ranked1[0];
  const high1 = [...ranked1].sort((a, b) => getLayerRank(b.layer) - getLayerRank(a.layer))[0];
  const low2 = ranked2[0];
  const high2 = [...ranked2].sort((a, b) => getLayerRank(b.layer) - getLayerRank(a.layer))[0];

  if (getLayerRank(high1?.layer) <= getLayerRank(low2?.layer)) return [high1?.id || c1[0], low2?.id || c2[0]];
  if (getLayerRank(high2?.layer) <= getLayerRank(low1?.layer)) return [high2?.id || c2[0], low1?.id || c1[0]];
  return [low1?.id || c1[0], low2?.id || c2[0]];
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
