import type { ArchitectureNode, ArchitectureEdge } from '../types';

const NODE_CONNECTION_RULES: Record<string, {
  minOutgoing: number;
  minIncoming: number;
  mustConnectTo: string[];
  preferredSource: string[];
}> = {
  gateway: {
    minOutgoing: 1,
    minIncoming: 1,
    mustConnectTo: ['api', 'compute'],
    preferredSource: ['client', 'loadbalancer'],
  },
  loadbalancer: {
    minOutgoing: 1,
    minIncoming: 1,
    mustConnectTo: ['compute', 'api'],
    preferredSource: ['client', 'gateway'],
  },
  database: {
    minOutgoing: 0,
    minIncoming: 1,
    mustConnectTo: ['compute', 'api'],
    preferredSource: ['compute', 'api'],
  },
  cache: {
    minOutgoing: 1,
    minIncoming: 1,
    mustConnectTo: ['compute', 'api'],
    preferredSource: ['compute', 'api'],
  },
  storage: {
    minOutgoing: 0,
    minIncoming: 1,
    mustConnectTo: ['compute'],
    preferredSource: ['compute', 'api'],
  },
  queue: {
    minOutgoing: 1,
    minIncoming: 1,
    mustConnectTo: ['compute', 'async'],
    preferredSource: ['compute'],
  },
  client: {
    minOutgoing: 1,
    minIncoming: 0,
    mustConnectTo: ['gateway', 'loadbalancer'],
    preferredSource: [],
  },
  compute: {
    minOutgoing: 1,
    minIncoming: 1,
    mustConnectTo: ['database', 'cache', 'storage'],
    preferredSource: ['gateway', 'loadbalancer'],
  },
  api: {
    minOutgoing: 1,
    minIncoming: 1,
    mustConnectTo: ['database', 'cache'],
    preferredSource: ['gateway', 'loadbalancer'],
  },
};

export function getNodeConnectionRules(serviceType: string) {
  return NODE_CONNECTION_RULES[serviceType] || NODE_CONNECTION_RULES['compute'];
}

export function detectOrphans(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): { orphans: ArchitectureNode[]; partiallyConnected: ArchitectureNode[]; wellConnected: ArchitectureNode[] } {
  const orphans: ArchitectureNode[] = [];
  const partiallyConnected: ArchitectureNode[] = [];
  const wellConnected: ArchitectureNode[] = [];
  
  for (const node of nodes) {
    if (node.isGroup) continue;
    
    const outgoing = edges.filter(e => e.source === node.id);
    const incoming = edges.filter(e => e.target === node.id);
    const total = outgoing.length + incoming.length;
    
    if (total === 0) {
      orphans.push(node);
    } else if (total < 2) {
      partiallyConnected.push(node);
    } else {
      wellConnected.push(node);
    }
  }
  
  return { orphans, partiallyConnected, wellConnected };
}

function createEdge(source: string, target: string, isAsync: boolean = false): ArchitectureEdge {
  return {
    id: `fix-${source}-${target}-${Date.now()}`,
    source,
    target,
    sourceHandle: 'right' as const,
    targetHandle: 'left' as const,
    communicationType: isAsync ? 'async' : 'sync',
    pathType: 'smooth' as const,
    label: '',
    labelPosition: 'center' as const,
    animated: isAsync,
    style: {
      stroke: isAsync ? '#f59e0b' : '#6366f1',
      strokeDasharray: isAsync ? '8,4' : '',
      strokeWidth: 2,
    },
    markerEnd: 'arrowclosed' as const,
    markerStart: 'none' as const,
  };
}

export function enforceMinimumConnections(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): { edges: ArchitectureEdge[]; fixes: string[] } {
  const fixes: string[] = [];
  let enhancedEdges = [...edges];
  
  for (const node of nodes) {
    if (node.isGroup) continue;
    
    const rules = getNodeConnectionRules(node.serviceType || 'compute');
    
    const outgoing = enhancedEdges.filter(e => e.source === node.id);
    const incoming = enhancedEdges.filter(e => e.target === node.id);
    
    if (outgoing.length < rules.minOutgoing && rules.minOutgoing > 0) {
      const needed = rules.minOutgoing - outgoing.length;
      const candidates = nodes.filter(n => 
        n.id !== node.id && 
        !n.isGroup &&
        rules.mustConnectTo.some(t => n.serviceType === t || n.layer === t)
      );
      
      for (let i = 0; i < needed && i < candidates.length; i++) {
        const isAsync = candidates[i].serviceType === 'queue' || candidates[i].layer === 'async';
        enhancedEdges.push(createEdge(node.id, candidates[i].id, isAsync));
        fixes.push(`Added outgoing: ${node.label} → ${candidates[i].label}`);
        console.log(`[EdgeValidator] Adding missing edge: ${node.label} → ${candidates[i].label}`);
      }
    }
    
    if (incoming.length < rules.minIncoming && rules.minIncoming > 0) {
      const needed = rules.minIncoming - incoming.length;
      const candidates = nodes.filter(n => 
        n.id !== node.id && 
        !n.isGroup &&
        rules.preferredSource.some(t => n.serviceType === t || n.layer === t)
      );
      
      for (let i = 0; i < needed && i < candidates.length; i++) {
        enhancedEdges.push(createEdge(candidates[i].id, node.id, false));
        fixes.push(`Added incoming: ${candidates[i].label} → ${node.label}`);
        console.log(`[EdgeValidator] Adding missing edge: ${candidates[i].label} → ${node.label}`);
      }
    }
  }
  
  return { edges: enhancedEdges, fixes };
}

export function detectDisconnectedGroups(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): { groupId: string; label: string }[] {
  const groupsWithIssues: { groupId: string; label: string }[] = [];
  
  const groups = nodes.filter(n => n.isGroup);
  const childNodes = nodes.filter(n => !n.isGroup && n.parentId);
  
  for (const group of groups) {
    const children = childNodes.filter(n => n.parentId === group.id);
    const hasConnections = children.some(childId => 
      edges.some(e => e.source === childId.id || e.target === childId.id)
    );
    
    if (!hasConnections && children.length > 0) {
      groupsWithIssues.push({ groupId: group.id, label: group.label });
    }
  }
  
  return groupsWithIssues;
}

export function ensureGroupConnectivity(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): { edges: ArchitectureEdge[]; fixes: string[] } {
  const fixes: string[] = [];
  let enhancedEdges = [...edges];
  
  const groups = nodes.filter(n => n.isGroup);
  const children = nodes.filter(n => !n.isGroup && n.parentId);
  
  for (const group of groups) {
    const groupChildren = children.filter(c => c.parentId === group.id);
    
    if (groupChildren.length === 0) {
      continue;
    }
    
    let hasConnection = false;
    let connectedChild: string | null = null;
    
    for (const child of groupChildren) {
      const hasEdge = enhancedEdges.some(
        e => e.source === child.id || e.target === child.id
      );
      if (hasEdge) {
        hasConnection = true;
        connectedChild = child.id;
        break;
      }
    }
    
    if (!hasConnection && groupChildren.length > 0) {
      const firstChild = groupChildren[0];
      const externalTargets = nodes.filter(n => 
        !n.isGroup && 
        n.id !== firstChild.id &&
        (n.layer === 'compute' || n.serviceType === 'compute')
      );
      
      if (externalTargets.length > 0) {
        const target = externalTargets[0];
        enhancedEdges.push(createEdge(firstChild.id, target.id, false));
        fixes.push(`Connected group child: ${firstChild.label} → ${target.label}`);
        console.log(`[EdgeValidator] Connecting group: ${firstChild.label} → ${target.label}`);
      }
    }
  }
  
  return { edges: enhancedEdges, fixes };
}

export function validateEdgeConnectivity(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  for (const edge of edges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    
    if (!sourceNode) {
      errors.push(`Edge "${edge.id}" has invalid source: ${edge.source}`);
    }
    if (!targetNode) {
      errors.push(`Edge "${edge.id}" has invalid target: ${edge.target}`);
    }
  }
  
  const { orphans } = detectOrphans(nodes, edges);
  if (orphans.length > 0) {
    errors.push(`${orphans.length} orphaned node(s): ${orphans.map(n => n.label).join(', ')}`);
  }
  
  return { valid: errors.length === 0, errors };
}