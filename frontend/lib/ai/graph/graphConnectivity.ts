import type { ArchitectureNode, ArchitectureEdge } from '../types';

export function findConnectedComponents(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): string[][] {
  const adjacency = new Map<string, Set<string>>();

  for (const node of nodes) {
    if (!node.isGroup) {
      adjacency.set(node.id, new Set());
    }
  }

  for (const edge of edges) {
    if (!adjacency.has(edge.source) || !adjacency.has(edge.target)) {
      continue;
    }
    adjacency.get(edge.source)!.add(edge.target);
    adjacency.get(edge.target)!.add(edge.source);
  }

  const visited = new Set<string>();
  const components: string[][] = [];

  for (const nodeId of adjacency.keys()) {
    if (visited.has(nodeId)) continue;

    const component: string[] = [];
    const queue: string[] = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;

      visited.add(current);
      component.push(current);

      for (const neighbor of adjacency.get(current) || []) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }

    if (component.length > 0) {
      components.push(component);
    }
  }

  return components;
}

function chooseMainAnchor(mainComponent: string[], nodesById: Map<string, ArchitectureNode>): string {
  const preferred = mainComponent.find((id) => {
    const node = nodesById.get(id);
    const tier = node?.tier || node?.layer;
    return tier === 'edge' || tier === 'compute';
  });

  return preferred || mainComponent[0];
}

function chooseComponentAnchor(component: string[], nodesById: Map<string, ArchitectureNode>): string {
  const preferred = component.find((id) => {
    const node = nodesById.get(id);
    const tier = node?.tier || node?.layer;
    return tier === 'edge' || tier === 'client' || tier === 'compute';
  });

  return preferred || component[0];
}

export function bridgeComponents(
  components: string[][],
  nodes: ArchitectureNode[],
  existingEdges: ArchitectureEdge[]
): ArchitectureEdge[] {
  if (components.length <= 1) return [];

  const sorted = [...components].sort((a, b) => b.length - a.length);
  const [main, ...isolated] = sorted;

  if (!main || main.length === 0) return [];

  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const mainAnchor = chooseMainAnchor(main, nodesById);
  const existingPairs = new Set(
    existingEdges.map((e) => `${e.source}->${e.target}`)
  );

  const bridges: ArchitectureEdge[] = [];

  for (const component of isolated) {
    if (!component || component.length === 0) continue;
    const componentAnchor = chooseComponentAnchor(component, nodesById);

    const edgeKey = `${componentAnchor}->${mainAnchor}`;
    const reverseKey = `${mainAnchor}->${componentAnchor}`;
    if (existingPairs.has(edgeKey) || existingPairs.has(reverseKey)) {
      continue;
    }

    bridges.push({
      id: `bridge-${componentAnchor}-${mainAnchor}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      source: componentAnchor,
      target: mainAnchor,
      sourceHandle: 'right',
      targetHandle: 'left',
      communicationType: 'sync',
      pathType: 'smooth',
      label: '',
      labelPosition: 'center',
      animated: false,
      style: {
        stroke: '#94a3b8',
        strokeDasharray: '',
        strokeWidth: 2,
      },
      markerEnd: 'arrowclosed',
      markerStart: 'none',
      edgeVariant: 'feedback',
    });

    existingPairs.add(edgeKey);
  }

  return bridges;
}
