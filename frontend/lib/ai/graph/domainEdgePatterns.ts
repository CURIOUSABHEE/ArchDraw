import type { ArchitectureNode, ArchitectureEdge } from '../types';

interface EdgePattern {
  from: string[];
  to: string[];
  type: 'sync' | 'async' | 'stream' | 'event';
  path: 'smooth' | 'bezier' | 'step';
  priority: number;
}

const DOMAIN_EDGE_PATTERNS: Record<string, EdgePattern[]> = {
  chat: [
    { from: ['client'], to: ['gateway', 'loadbalancer'], type: 'sync', path: 'smooth', priority: 10 },
    { from: ['gateway'], to: ['compute'], type: 'sync', path: 'smooth', priority: 10 },
    { from: ['gateway'], to: ['api'], type: 'sync', path: 'smooth', priority: 10 },
    { from: ['compute'], to: ['database'], type: 'sync', path: 'smooth', priority: 9 },
    { from: ['compute'], to: ['cache'], type: 'sync', path: 'smooth', priority: 8 },
    { from: ['compute'], to: ['queue'], type: 'async', path: 'step', priority: 7 },
    { from: ['queue'], to: ['storage'], type: 'async', path: 'step', priority: 6 },
    { from: ['compute'], to: ['storage'], type: 'sync', path: 'smooth', priority: 5 },
  ],
  'video streaming': [
    { from: ['client'], to: ['cdn'], type: 'stream', path: 'bezier', priority: 10 },
    { from: ['client'], to: ['gateway'], type: 'sync', path: 'smooth', priority: 9 },
    { from: ['gateway'], to: ['compute'], type: 'sync', path: 'smooth', priority: 9 },
    { from: ['compute'], to: ['storage'], type: 'sync', path: 'smooth', priority: 8 },
    { from: ['storage'], to: ['cdn'], type: 'stream', path: 'bezier', priority: 8 },
    { from: ['cdn'], to: ['client'], type: 'stream', path: 'bezier', priority: 10 },
    { from: ['compute'], to: ['cache'], type: 'sync', path: 'smooth', priority: 6 },
  ],
  ecommerce: [
    { from: ['client'], to: ['gateway'], type: 'sync', path: 'smooth', priority: 10 },
    { from: ['client'], to: ['cdn'], type: 'sync', path: 'smooth', priority: 9 },
    { from: ['gateway'], to: ['loadbalancer'], type: 'sync', path: 'smooth', priority: 10 },
    { from: ['loadbalancer'], to: ['compute'], type: 'sync', path: 'smooth', priority: 10 },
    { from: ['loadbalancer'], to: ['api'], type: 'sync', path: 'smooth', priority: 10 },
    { from: ['compute'], to: ['database'], type: 'sync', path: 'smooth', priority: 9 },
    { from: ['api'], to: ['database'], type: 'sync', path: 'smooth', priority: 9 },
    { from: ['compute'], to: ['cache'], type: 'sync', path: 'smooth', priority: 8 },
    { from: ['compute'], to: ['queue'], type: 'async', path: 'step', priority: 7 },
    { from: ['queue'], to: ['compute'], type: 'async', path: 'step', priority: 7 },
  ],
  'social media': [
    { from: ['client'], to: ['gateway'], type: 'sync', path: 'smooth', priority: 10 },
    { from: ['gateway'], to: ['compute'], type: 'sync', path: 'smooth', priority: 10 },
    { from: ['gateway'], to: ['api'], type: 'sync', path: 'smooth', priority: 10 },
    { from: ['compute'], to: ['database'], type: 'sync', path: 'smooth', priority: 9 },
    { from: ['compute'], to: ['cache'], type: 'sync', path: 'smooth', priority: 8 },
    { from: ['compute'], to: ['storage'], type: 'sync', path: 'smooth', priority: 7 },
    { from: ['compute'], to: ['queue'], type: 'async', path: 'step', priority: 6 },
  ],
  'ml ai': [
    { from: ['client'], to: ['gateway'], type: 'sync', path: 'smooth', priority: 10 },
    { from: ['gateway'], to: ['compute'], type: 'sync', path: 'smooth', priority: 10 },
    { from: ['compute'], to: ['storage'], type: 'sync', path: 'smooth', priority: 9 },
    { from: ['compute'], to: ['queue'], type: 'async', path: 'step', priority: 8 },
    { from: ['queue'], to: ['compute'], type: 'async', path: 'step', priority: 8 },
    { from: ['storage'], to: ['compute'], type: 'sync', path: 'smooth', priority: 7 },
  ],
  general: [
    { from: ['client'], to: ['gateway'], type: 'sync', path: 'smooth', priority: 10 },
    { from: ['client'], to: ['loadbalancer'], type: 'sync', path: 'smooth', priority: 9 },
    { from: ['gateway'], to: ['compute'], type: 'sync', path: 'smooth', priority: 10 },
    { from: ['gateway'], to: ['api'], type: 'sync', path: 'smooth', priority: 10 },
    { from: ['loadbalancer'], to: ['compute'], type: 'sync', path: 'smooth', priority: 9 },
    { from: ['loadbalancer'], to: ['api'], type: 'sync', path: 'smooth', priority: 9 },
    { from: ['compute'], to: ['database'], type: 'sync', path: 'smooth', priority: 8 },
    { from: ['api'], to: ['database'], type: 'sync', path: 'smooth', priority: 8 },
    { from: ['compute'], to: ['cache'], type: 'sync', path: 'smooth', priority: 7 },
    { from: ['compute'], to: ['storage'], type: 'sync', path: 'smooth', priority: 6 },
    { from: ['compute'], to: ['queue'], type: 'async', path: 'step', priority: 5 },
  ],
};

const EDGE_COLORS: Record<string, string> = {
  sync: '#94a3b8',
  async: '#f59e0b',
  stream: '#10b981',
  event: '#ec4899',
};

export function getDomainEdgePatterns(domain: string): EdgePattern[] {
  return DOMAIN_EDGE_PATTERNS[domain] || DOMAIN_EDGE_PATTERNS['general'];
}

function getEdgeColor(type: string): string {
  return EDGE_COLORS[type] || EDGE_COLORS['sync'];
}

function hasEdge(nodes: ArchitectureNode[], edges: ArchitectureEdge[], sourceId: string, targetId: string): boolean {
  return edges.some(e => e.source === sourceId && e.target === targetId);
}

function getNodesByServiceType(nodes: ArchitectureNode[], serviceTypes: string[]): ArchitectureNode[] {
  return nodes.filter(n => 
    !n.isGroup && 
    serviceTypes.some(t => n.serviceType === t || n.layer === t)
  );
}

export function applyDomainEdgePatterns(
  nodes: ArchitectureNode[],
  domain: string,
  existingEdges: ArchitectureEdge[] = []
): { edges: ArchitectureEdge[]; added: number } {
  const patterns = getDomainEdgePatterns(domain);
  const newEdges: ArchitectureEdge[] = [];
  const sorted = [...patterns].sort((a, b) => b.priority - a.priority);
  
  for (const pattern of sorted) {
    const sources = getNodesByServiceType(nodes, pattern.from);
    const targets = getNodesByServiceType(nodes, pattern.to);
    
    if (sources.length === 0 || targets.length === 0) {
      continue;
    }
    
    const source = sources[0];
    const target = targets[0];
    
    if (!hasEdge(nodes, existingEdges, source.id, target.id) && 
        !hasEdge(nodes, newEdges, source.id, target.id)) {
      const isAsync = pattern.type === 'async' || pattern.type === 'stream';
      newEdges.push({
        id: `domain-${source.id}-${target.id}-${Date.now()}`,
        source: source.id,
        target: target.id,
        sourceHandle: 'right' as const,
        targetHandle: 'left' as const,
        communicationType: pattern.type,
        pathType: pattern.path,
        label: '',
        labelPosition: 'center' as const,
        animated: isAsync,
        style: {
          stroke: getEdgeColor(pattern.type),
          strokeDasharray: isAsync ? '8,4' : '',
          strokeWidth: 2,
        },
        markerEnd: 'arrowclosed' as const,
        markerStart: 'none' as const,
      });
    }
  }
  
  const added = newEdges.length;
  if (added > 0) {
    console.log(`[DomainEdgePatterns] Added ${added} domain-specific edges for ${domain}`);
  }
  
  return { edges: newEdges, added };
}

export function getTotalConnections(
  nodeId: string,
  edges: ArchitectureEdge[]
): { incoming: number; outgoing: number } {
  return {
    incoming: edges.filter(e => e.target === nodeId).length,
    outgoing: edges.filter(e => e.source === nodeId).length,
  };
}

export function getNodeWithMostConnections(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[],
  direction: 'incoming' | 'outgoing' | 'both' = 'both'
): ArchitectureNode | null {
  let bestNode: ArchitectureNode | null = null;
  let bestCount = 0;
  
  for (const node of nodes) {
    if (node.isGroup) continue;
    
    const { incoming, outgoing } = getTotalConnections(node.id, edges);
    const total = direction === 'incoming' ? incoming : 
                direction === 'outgoing' ? outgoing : 
                incoming + outgoing;
    
    if (total > bestCount) {
      bestCount = total;
      bestNode = node;
    }
  }
  
  return bestNode;
}
