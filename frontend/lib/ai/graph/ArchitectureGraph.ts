import type { ArchitectureNode, ArchitectureEdge } from '../types';
import type { TierType } from '../domain/tiers';
import { TIER_ORDER } from '../domain/tiers';

export type NodeIntent = 
  | 'auth'
  | 'payment'
  | 'realtime'
  | 'storage'
  | 'analytics'
  | 'api'
  | 'worker'
  | 'client'
  | 'gateway'
  | 'database'
  | 'cache'
  | 'queue'
  | 'monitor';

export type GraphValidationError = {
  type: 'connectivity' | 'structure' | 'invariant';
  severity: 'critical' | 'warning';
  message: string;
  nodeId?: string;
  edgeId?: string;
};

export class ArchitectureGraph {
  private nodes: Map<string, ArchitectureNode>;
  private edges: Map<string, ArchitectureEdge>;
  private adjacencyList: Map<string, Set<string>>;
  private reverseAdjacencyList: Map<string, Set<string>>;

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.adjacencyList = new Map();
    this.reverseAdjacencyList = new Map();
  }

  addNode(node: ArchitectureNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, new Set());
    }
    if (!this.reverseAdjacencyList.has(node.id)) {
      this.reverseAdjacencyList.set(node.id, new Set());
    }
  }

  addEdge(edge: ArchitectureEdge): void {
    this.edges.set(edge.id, edge);
    
    if (!this.adjacencyList.has(edge.source)) {
      this.adjacencyList.set(edge.source, new Set());
    }
    this.adjacencyList.get(edge.source)!.add(edge.target);
    
    if (!this.reverseAdjacencyList.has(edge.target)) {
      this.reverseAdjacencyList.set(edge.target, new Set());
    }
    this.reverseAdjacencyList.get(edge.target)!.add(edge.source);
  }

  getNode(id: string): ArchitectureNode | undefined {
    return this.nodes.get(id);
  }

  getEdge(id: string): ArchitectureEdge | undefined {
    return this.edges.get(id);
  }

  getAllNodes(): ArchitectureNode[] {
    return Array.from(this.nodes.values());
  }

  getAllEdges(): ArchitectureEdge[] {
    return Array.from(this.edges.values());
  }

  getNeighbors(nodeId: string): ArchitectureNode[] {
    const neighborIds = this.adjacencyList.get(nodeId) || new Set();
    return Array.from(neighborIds)
      .map(id => this.nodes.get(id))
      .filter((n): n is ArchitectureNode => n !== undefined);
  }

  getIncoming(nodeId: string): ArchitectureNode[] {
    const sourceIds = this.reverseAdjacencyList.get(nodeId) || new Set();
    return Array.from(sourceIds)
      .map(id => this.nodes.get(id))
      .filter((n): n is ArchitectureNode => n !== undefined);
  }

  getOutgoing(nodeId: string): ArchitectureNode[] {
    const targetIds = this.adjacencyList.get(nodeId) || new Set();
    return Array.from(targetIds)
      .map(id => this.nodes.get(id))
      .filter((n): n is ArchitectureNode => n !== undefined);
  }

  getNodeDegree(nodeId: string): { in: number; out: number; total: number } {
    const incoming = this.reverseAdjacencyList.get(nodeId)?.size || 0;
    const outgoing = this.adjacencyList.get(nodeId)?.size || 0;
    return { in: incoming, out: outgoing, total: incoming + outgoing };
  }

  getNodesByTier(tier: TierType): ArchitectureNode[] {
    return this.getAllNodes().filter(
      node => (node.tier || node.layer) === tier && !node.isGroup
    );
  }

  getGroups(): ArchitectureNode[] {
    return this.getAllNodes().filter(node => node.isGroup === true);
  }

  detectCycles(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (nodeId: string): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const neighbors = this.adjacencyList.get(nodeId) || new Set();
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          dfs(neighborId);
        } else if (recursionStack.has(neighborId)) {
          const cycleStart = path.indexOf(neighborId);
          cycles.push(path.slice(cycleStart));
        }
      }

      path.pop();
      recursionStack.delete(nodeId);
    };

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    }

    return cycles;
  }

  validateConnectivity(): GraphValidationError[] {
    const errors: GraphValidationError[] = [];

    for (const node of this.getAllNodes()) {
      if (node.isGroup) continue;
      
      const degree = this.getNodeDegree(node.id);
      if (degree.total === 0) {
        errors.push({
          type: 'connectivity',
          severity: 'warning',
          message: `Node "${node.label}" is isolated (no connections)`,
          nodeId: node.id,
        });
      }
    }

    return errors;
  }

  validateInvariantMaxEdgesPerNode(): GraphValidationError[] {
    const errors: GraphValidationError[] = [];

    for (const node of this.getAllNodes()) {
      if (node.isGroup) continue;
      
      const degree = this.getNodeDegree(node.id);
      if (degree.total > 4) {
        errors.push({
          type: 'invariant',
          severity: 'critical',
          message: `Node "${node.label}" has ${degree.total} edges (max 4 allowed)`,
          nodeId: node.id,
        });
      }
    }

    return errors;
  }

  validateTierFlow(): GraphValidationError[] {
    const errors: GraphValidationError[] = [];

    for (const edge of this.getAllEdges()) {
      const sourceNode = this.getNode(edge.source);
      const targetNode = this.getNode(edge.target);
      
      if (!sourceNode || !targetNode) continue;
      if (sourceNode.isGroup || targetNode.isGroup) continue;

      const sourceTier = (sourceNode.tier || sourceNode.layer) as TierType;
      const targetTier = (targetNode.tier || targetNode.layer) as TierType;

      const sourceIndex = TIER_ORDER.indexOf(sourceTier);
      const targetIndex = TIER_ORDER.indexOf(targetTier);

      if (sourceTier === 'client' && targetTier === 'data') {
        errors.push({
          type: 'structure',
          severity: 'critical',
          message: `Client cannot connect directly to data tier`,
          edgeId: edge.id,
        });
      }

      if (sourceIndex > targetIndex && sourceTier !== 'external' && targetTier !== 'client') {
        if (sourceTier !== 'observe' && targetTier !== 'async') {
          errors.push({
            type: 'structure',
            severity: 'warning',
            message: `Edge flows backward: ${sourceTier} → ${targetTier}`,
            edgeId: edge.id,
          });
        }
      }
    }

    return errors;
  }

  validateAsyncSeparation(): GraphValidationError[] {
    const errors: GraphValidationError[] = [];
    const asyncNodes = this.getNodesByTier('async');
    
    for (const asyncNode of asyncNodes) {
      const neighbors = this.getNeighbors(asyncNode.id);
      const computeNeighbors = neighbors.filter(
        n => (n.tier || n.layer) === 'compute'
      );
      
      if (computeNeighbors.length > 0) {
        errors.push({
          type: 'structure',
          severity: 'warning',
          message: `Async node "${asyncNode.label}" shares tier with compute nodes`,
          nodeId: asyncNode.id,
        });
      }
    }

    return errors;
  }

  validateAll(): GraphValidationError[] {
    return [
      ...this.validateConnectivity(),
      ...this.validateInvariantMaxEdgesPerNode(),
      ...this.validateTierFlow(),
      ...this.validateAsyncSeparation(),
    ];
  }

  ensureMinConnections(): void {
    const nodesNeedingConnections: string[] = [];

    for (const node of this.getAllNodes()) {
      if (node.isGroup) continue;
      const degree = this.getNodeDegree(node.id);
      if (degree.total === 0) {
        nodesNeedingConnections.push(node.id);
      }
    }

    for (const nodeId of nodesNeedingConnections) {
      const node = this.getNode(nodeId);
      if (!node) continue;

      const tier = (node.tier || node.layer) as TierType;
      const tierIndex = TIER_ORDER.indexOf(tier);

      let targetTier: TierType | null = null;
      for (let i = tierIndex + 1; i < TIER_ORDER.length; i++) {
        const candidates = this.getNodesByTier(TIER_ORDER[i]);
        if (candidates.length > 0) {
          targetTier = TIER_ORDER[i];
          break;
        }
      }

      if (targetTier) {
        const targets = this.getNodesByTier(targetTier);
        if (targets.length > 0) {
          const target = targets[0];
          const newEdge: ArchitectureEdge = {
            id: `auto-edge-${nodeId}-${target.id}`,
            source: nodeId,
            target: target.id,
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
          };
          this.addEdge(newEdge);
        }
      }
    }
  }

  pruneExcessEdges(): void {
    for (const node of this.getAllNodes()) {
      if (node.isGroup) continue;
      
      const degree = this.getNodeDegree(node.id);
      if (degree.total > 4) {
        const edgesToRemove: string[] = [];
        const nodeEdges = this.getAllEdges().filter(
          e => e.source === node.id || e.target === node.id
        );

        const sorted = nodeEdges.sort((a, b) => {
          const priorityMap: Record<string, number> = {
            sync: 1,
            async: 2,
            event: 3,
            stream: 4,
            dep: 5,
          };
          return (priorityMap[a.communicationType] || 0) - (priorityMap[b.communicationType] || 0);
        });

        const edgesToKeep = sorted.slice(0, 4);
        const edgesToDrop = sorted.slice(4);

        for (const edge of edgesToDrop) {
          this.edges.delete(edge.id);
        }
      }
    }
  }

  static fromArrays(
    nodes: ArchitectureNode[],
    edges: ArchitectureEdge[]
  ): ArchitectureGraph {
    const graph = new ArchitectureGraph();
    for (const node of nodes) {
      graph.addNode(node);
    }
    for (const edge of edges) {
      graph.addEdge(edge);
    }
    return graph;
  }
}

export function inferNodeIntent(node: ArchitectureNode): NodeIntent {
  const label = node.label.toLowerCase();
  const subtitle = (node.subtitle || '').toLowerCase();
  const tech = (node.metadata?.technology as string || '').toLowerCase();
  const combined = `${label} ${subtitle} ${tech}`;

  if (combined.includes('auth') || combined.includes('login') || combined.includes('cognito') || combined.includes('jwt')) {
    return 'auth';
  }
  if (combined.includes('payment') || combined.includes('stripe') || combined.includes('billing')) {
    return 'payment';
  }
  if (combined.includes('websocket') || combined.includes('realtime') || combined.includes('live')) {
    return 'realtime';
  }
  if (combined.includes('s3') || combined.includes('storage') || combined.includes('file') || combined.includes('blob')) {
    return 'storage';
  }
  if (combined.includes('analytics') || combined.includes('kpi') || combined.includes('metrics')) {
    return 'analytics';
  }
  if (combined.includes('queue') || combined.includes('sqs') || combined.includes('rabbit') || combined.includes('kafka')) {
    return 'queue';
  }
  if (combined.includes('cache') || combined.includes('redis') || combined.includes('memcache')) {
    return 'cache';
  }
  if (combined.includes('monitor') || combined.includes('cloudwatch') || combined.includes('prometheus')) {
    return 'monitor';
  }
  if (combined.includes('database') || combined.includes('rds') || combined.includes('postgres') || combined.includes('mysql')) {
    return 'database';
  }
  if (combined.includes('api') || combined.includes('gateway') || combined.includes('endpoint')) {
    return 'api';
  }
  if (combined.includes('worker') || combined.includes('consumer') || combined.includes('processor')) {
    return 'worker';
  }
  if (combined.includes('client') || combined.includes('browser') || combined.includes('mobile') || combined.includes('app')) {
    return 'client';
  }

  return 'api';
}

export function detectSystemIntent(description: string): {
  primary: NodeIntent[];
  useAWS: boolean;
  useAzure: boolean;
  useGCP: boolean;
} {
  const lower = description.toLowerCase();
  
  const intents: NodeIntent[] = [];
  
  if (lower.includes('auth') || lower.includes('login') || lower.includes('user management')) {
    intents.push('auth');
  }
  if (lower.includes('payment') || lower.includes('transaction') || lower.includes('checkout')) {
    intents.push('payment');
  }
  if (lower.includes('realtime') || lower.includes('websocket') || lower.includes('chat')) {
    intents.push('realtime');
  }
  if (lower.includes('storage') || lower.includes('upload') || lower.includes('file')) {
    intents.push('storage');
  }
  if (lower.includes('analytics') || lower.includes('dashboard') || lower.includes('reporting')) {
    intents.push('analytics');
  }
  
  const awsKeywords = ['aws', 'lambda', 's3', 'rds', 'dynamodb', 'ec2', 'cloudfront'];
  const azureKeywords = ['azure', 'blob', 'cosmos'];
  const gcpKeywords = ['gcp', 'bigquery', 'cloud storage'];
  
  return {
    primary: intents.length > 0 ? intents : ['api'],
    useAWS: awsKeywords.some(k => lower.includes(k)),
    useAzure: azureKeywords.some(k => lower.includes(k)),
    useGCP: gcpKeywords.some(k => lower.includes(k)),
  };
}

// ============================================================================
// ROBUST INTENT DETECTION (for pipeline)
// ============================================================================

export interface IntentSignals {
  systemType: string[];
  confidence: number;
  ambiguous: boolean;
  clarifyPrompt: string | null;
}

const INTENT_PATTERNS: Record<string, RegExp[]> = {
  'realtime-messaging': [/\bchat\b/i, /\bmessag/i, /\bwebsocket/i, /\blive\b/i, /\bpresence\b/i],
  'async-messaging': [/\bnotif/i, /\bemail/i, /\bqueue/i, /\bworker/i, /\bjob\b/i],
  'ecommerce': [/\bcheckout\b/i, /\bcart\b/i, /\border\b/i, /\bpayment\b/i, /\bproduct\b/i],
  'data-pipeline': [/\bingestion\b/i, /\betl\b/i, /\bpipeline\b/i, /\bbatch\b/i, /\bstream\b/i],
  'auth-platform': [/\bauth\b/i, /\blogin\b/i, /\bsso\b/i, /\boauth\b/i, /\bidentity\b/i],
  'fintech': [/\bpayment\b/i, /\bwallet\b/i, /\btransaction\b/i, /\bledger\b/i, /\bsettle/i],
  'content-platform': [/\bfeed\b/i, /\bpost\b/i, /\bupload\b/i, /\bmedia\b/i, /\bcontent\b/i],
  'generic-web-app': [/\bweb\b/i, /\bapp\b/i, /\bservice\b/i, /\bsystem\b/i, /\bapi\b/i],
};

export function robustDetectIntent(description: string): IntentSignals {
  const scores: Record<string, number> = {};

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    scores[intent] = patterns.filter(p => p.test(description)).length;
  }

  const ranked = Object.entries(scores)
    .filter(([, s]) => s > 0)
    .sort(([, a], [, b]) => b - a);

  // If no patterns matched, default to generic-web-app with full confidence
  if (ranked.length === 0) {
    return {
      systemType: ['generic-web-app'],
      confidence: 1.0, // Changed from 0.3 - no longer ambiguous
      ambiguous: false,
      clarifyPrompt: null
    };
  }

  const [topIntent, topScore] = ranked[0];
  const [, secondScore] = ranked[1] ?? ['', 0];
  
  // Lowered confidence threshold and made less strict
  const confidence = Math.min(topScore / 3, 1.0);
  const ambiguous = secondScore >= topScore && topScore < 3; // Only ambiguous if exact tie and low score

  return {
    systemType: ranked.map(([intent]) => intent),
    confidence,
    ambiguous,
    clarifyPrompt: ambiguous
      ? `Your description matches both "${topIntent}" and "${ranked[1]?.[0]}". Which best describes your system?`
      : null
  };
}
