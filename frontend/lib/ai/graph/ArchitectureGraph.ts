import type { ArchitectureNode, ArchitectureEdge } from '../types';
import type { TierType } from '../domain/tiers';
import { TIER_ORDER } from '../domain/tiers';
import logger from '@/lib/logger';
import { EDGE_CONFIG } from '@/lib/config';

export type NodeIntent = 
  | 'auth'
  | 'payment'
  | 'realtime'
  | 'search'
  | 'media'
  | 'database'
  | 'cache'
  | 'worker'
  | 'general';

export interface GraphIntent {
  primary: NodeIntent[];
  useAWS: boolean;
  useAzure: boolean;
  useGCP: boolean;
}

/**
 * Minimal graph model for architectural reasoning.
 */
export class ArchitectureGraph {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];

  constructor(nodes: ArchitectureNode[], edges: ArchitectureEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  static fromArrays(nodes: ArchitectureNode[], edges: ArchitectureEdge[]): ArchitectureGraph {
    return new ArchitectureGraph(nodes, edges);
  }

  getAllNodes(): ArchitectureNode[] {
    return this.nodes;
  }

  getAllEdges(): ArchitectureEdge[] {
    return this.edges;
  }

  getNeighbors(nodeId: string): ArchitectureNode[] {
    const neighborIds = this.edges
      .filter(e => e.source === nodeId || e.target === nodeId)
      .map(e => (e.source === nodeId ? e.target : e.source));
    return this.nodes.filter(n => neighborIds.includes(n.id));
  }

  getOutgoing(nodeId: string): ArchitectureEdge[] {
    return this.edges.filter(e => e.source === nodeId);
  }

  getIncoming(nodeId: string): ArchitectureEdge[] {
    return this.edges.filter(e => e.target === nodeId);
  }

  getNodeDegree(nodeId: string) {
    const incoming = this.getIncoming(nodeId).length;
    const outgoing = this.getOutgoing(nodeId).length;
    return {
      incoming,
      outgoing,
      total: incoming + outgoing
    };
  }

  validateConnectivity() {
    const issues: { edgeId?: string; severity: 'critical' | 'warning'; message: string }[] = [];
    
    // Check for self-loops
    this.edges.forEach(edge => {
      if (edge.source === edge.target) {
        issues.push({
          edgeId: edge.id,
          severity: 'critical',
          message: `Self-loop detected on ${edge.source}`
        });
      }
    });

    return issues;
  }

  pruneExcessEdges() {
    const maxEdges = 4;
    const nodeEdgeCount = new Map<string, number>();
    const keepEdges: ArchitectureEdge[] = [];

    this.edges.forEach(edge => {
      const sCount = nodeEdgeCount.get(edge.source) || 0;
      const tCount = nodeEdgeCount.get(edge.target) || 0;

      if (sCount < maxEdges && tCount < maxEdges) {
        keepEdges.push(edge);
        nodeEdgeCount.set(edge.source, sCount + 1);
        nodeEdgeCount.set(edge.target, tCount + 1);
      }
    });

    this.edges = keepEdges;
  }

  ensureMinConnections() {
    const isolatedNodes = this.nodes.filter(n => !n.isGroup && this.getNodeDegree(n.id).total === 0);
    
    isolatedNodes.forEach(node => {
      // Find a suitable candidate to connect to
      const tier = (node.tier || node.layer) as TierType;
      const tierIndex = TIER_ORDER.indexOf(tier);
      
      let candidate: ArchitectureNode | undefined;
      
      // Try to connect to a node in the next tier
      if (tierIndex < TIER_ORDER.length - 1) {
        candidate = this.nodes.find(n => (n.tier || n.layer) === TIER_ORDER[tierIndex + 1]);
      }
      
      // If not, try previous tier
      if (!candidate && tierIndex > 0) {
        candidate = this.nodes.find(n => (n.tier || n.layer) === TIER_ORDER[tierIndex - 1]);
      }

      if (candidate) {
        this.edges.push({
          id: `auto-edge-${node.id}-${candidate.id}`,
          source: tierIndex < TIER_ORDER.indexOf((candidate.tier || candidate.layer) as TierType) ? node.id : candidate.id,
          target: tierIndex < TIER_ORDER.indexOf((candidate.tier || candidate.layer) as TierType) ? candidate.id : node.id,
          sourceHandle: 'right',
          targetHandle: 'left',
          communicationType: 'sync',
          pathType: 'smooth',
          label: 'Auto-connected',
          labelPosition: 'center',
          animated: false,
          style: { stroke: EDGE_CONFIG.strokeColor, strokeDasharray: '0', strokeWidth: EDGE_CONFIG.strokeWidth },
          markerEnd: 'arrowclosed',
          markerStart: 'none'
        });
      }
    });
  }
}

/**
 * Detects the architectural intent from the prompt.
 */
export function detectSystemIntent(prompt: string): GraphIntent {
  const p = prompt.toLowerCase();
  const primary: NodeIntent[] = [];
  
  if (p.includes('auth') || p.includes('login') || p.includes('identity')) primary.push('auth');
  if (p.includes('pay') || p.includes('stripe') || p.includes('billing')) primary.push('payment');
  if (p.includes('realtime') || p.includes('socket') || p.includes('live')) primary.push('realtime');
  if (p.includes('search') || p.includes('elastic') || p.includes('vector')) primary.push('search');
  if (p.includes('video') || p.includes('image') || p.includes('stream')) primary.push('media');
  
  if (primary.length === 0) primary.push('general');

  const intent = {
    primary,
    useAWS: p.includes('aws') || p.includes('amazon'),
    useAzure: p.includes('azure') || p.includes('microsoft'),
    useGCP: p.includes('gcp') || p.includes('google cloud'),
  };

  logger.log('[ArchitectureGraph] Intent detected:', intent);
  return intent;
}
