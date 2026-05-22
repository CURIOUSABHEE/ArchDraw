import type { ArchitectureNode, ArchitectureEdge } from '../types';
import logger from '@/lib/logger';

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
    
    // Find best nodes to bridge
    const n1Id = c1[0];
    const n2Id = c2[0];
    
    if (n1Id && n2Id) {
      bridges.push({
        id: `bridge-${n1Id}-${n2Id}`,
        source: n1Id,
        target: n2Id,
        sourceHandle: 'right',
        targetHandle: 'left',
        communicationType: 'sync',
        pathType: 'smooth',
        label: '',
        animated: false,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
        markerEnd: 'arrowclosed',
      } as ArchitectureEdge);
    }
  }

  return bridges;
}
