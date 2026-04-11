import type { ArchitectureNode, ArchitectureEdge } from '../types';
import { TIER_ORDER, type TierType } from '../domain/tiers';

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

function hasNodeWithLabelContaining(
  nodes: ArchitectureNode[],
  patterns: string[]
): boolean {
  return nodes.some((n) => {
    const label = n.label.toLowerCase();
    const subtitle = (n.subtitle || '').toLowerCase();
    return patterns.some(
      (p) => label.includes(p.toLowerCase()) || subtitle.includes(p.toLowerCase())
    );
  });
}

function createCacheNode(): ArchitectureNode {
  return {
    id: `compensating-cache-${Date.now()}`,
    type: 'architectureNode',
    label: 'Cache',
    subtitle: 'Redis / in-memory',
    layer: 'data',
    tier: 'data',
    tierColor: '#3b82f6',
    width: 160,
    height: 70,
    icon: 'gauge',
    metadata: {},
  };
}

function createDLQNode(): ArchitectureNode {
  return {
    id: `compensating-dlq-${Date.now()}`,
    type: 'architectureNode',
    label: 'DLQ',
    subtitle: 'Dead Letter Queue',
    layer: 'async',
    tier: 'async',
    tierColor: '#f59e0b',
    width: 160,
    height: 70,
    icon: 'alert-triangle',
    metadata: {},
  };
}

function createCircuitBreakerNode(): ArchitectureNode {
  return {
    id: `compensating-circuit-breaker-${Date.now()}`,
    type: 'architectureNode',
    label: 'Circuit Breaker',
    subtitle: 'Hystrix / Resilience4j',
    layer: 'compute',
    tier: 'compute',
    tierColor: '#14b8a6',
    width: 180,
    height: 70,
    icon: 'shield-alert',
    metadata: {},
  };
}

function hasEdgeBetween(
  edges: ArchitectureEdge[],
  source: string,
  target: string
): boolean {
  return edges.some((e) => e.source === source && e.target === target);
}

export function autoAddCompensatingComponents(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } {
  let currentNodes = [...nodes];
  let currentEdges = [...edges];

  // Pattern A: Database without cache
  const hasDataTier = currentNodes.some(
    (n) => !n.isGroup && (n.tier || n.layer) === 'data'
  );
  const hasCache = hasNodeWithLabelContaining(currentNodes, [
    'cache',
    'redis',
    'memcache',
  ]);

  if (hasDataTier && !hasCache) {
    const cacheNode = createCacheNode();
    currentNodes.push(cacheNode);

    const dataNodes = currentNodes.filter(
      (n) =>
        !n.isGroup &&
        (n.tier || n.layer) === 'data' &&
        hasNodeWithLabelContaining([n], ['database', 'db', 'postgres', 'mysql', 'mongodb'])
    );

    if (dataNodes.length > 0) {
      const computeNodes = currentNodes.filter(
        (n) =>
          !n.isGroup && (n.tier || n.layer) === 'compute'
      );

      if (computeNodes.length > 0) {
        const computeToDataEdges = currentEdges.filter(
          (e) =>
            computeNodes.some((cn) => cn.id === e.source) &&
            dataNodes.some((dn) => dn.id === e.target)
        );

        if (computeToDataEdges.length > 0) {
          const firstEdge = computeToDataEdges[0];
          if (!hasEdgeBetween(currentEdges, firstEdge.source, cacheNode.id)) {
            currentEdges.push({
              id: `compensating-compute-cache-${Date.now()}`,
              source: firstEdge.source,
              target: cacheNode.id,
              ...DEFAULT_EDGE_PROPS,
              communicationType: 'sync',
            });
          }
        } else {
          currentEdges.push({
            id: `compensating-compute-cache-${Date.now()}`,
            source: computeNodes[0].id,
            target: cacheNode.id,
            ...DEFAULT_EDGE_PROPS,
            communicationType: 'sync',
          });
        }
      }
    }
  }

  // Pattern B: Queue without dead-letter queue
  const hasQueue = hasNodeWithLabelContaining(currentNodes, [
    'queue',
    'kafka',
    'rabbitmq',
    'sns',
    'sqs',
    'message',
  ]);
  const hasDLQ = hasNodeWithLabelContaining(currentNodes, [
    'dlq',
    'dead letter',
    'dead-letter',
    'error queue',
  ]);

  if (hasQueue && !hasDLQ) {
    const dlqNode = createDLQNode();
    currentNodes.push(dlqNode);

    const queueNodes = currentNodes.filter(
      (n) =>
        !n.isGroup &&
        hasNodeWithLabelContaining([n], [
          'queue',
          'kafka',
          'rabbitmq',
          'sns',
          'sqs',
          'message',
        ])
    );

    if (queueNodes.length > 0) {
      if (!hasEdgeBetween(currentEdges, queueNodes[0].id, dlqNode.id)) {
        currentEdges.push({
          id: `compensating-queue-dlq-${Date.now()}`,
          source: queueNodes[0].id,
          target: dlqNode.id,
          ...DEFAULT_EDGE_PROPS,
          communicationType: 'async',
          label: 'on failure',
        });
      }
    }
  }

  // Pattern C: External without circuit breaker
  const hasExternalTier = currentNodes.some(
    (n) => !n.isGroup && (n.tier || n.layer) === 'external'
  );
  const hasCircuitBreaker = hasNodeWithLabelContaining(currentNodes, [
    'circuit breaker',
    'circuit-breaker',
  ]);

  if (hasExternalTier && !hasCircuitBreaker) {
    const cbNode = createCircuitBreakerNode();
    currentNodes.push(cbNode);

    const computeNodes = currentNodes.filter(
      (n) => !n.isGroup && (n.tier || n.layer) === 'compute'
    );
    const externalNodes = currentNodes.filter(
      (n) => !n.isGroup && (n.tier || n.layer) === 'external'
    );

    if (computeNodes.length > 0 && externalNodes.length > 0) {
      const computeToExternalEdges = currentEdges.filter(
        (e) =>
          computeNodes.some((cn) => cn.id === e.source) &&
          externalNodes.some((en) => en.id === e.target)
      );

      if (computeToExternalEdges.length > 0) {
        const firstEdge = computeToExternalEdges[0];
        
        if (!hasEdgeBetween(currentEdges, firstEdge.source, cbNode.id)) {
          currentEdges.push({
            id: `compensating-compute-cb-${Date.now()}`,
            source: firstEdge.source,
            target: cbNode.id,
            ...DEFAULT_EDGE_PROPS,
          });
        }
        
        if (!hasEdgeBetween(currentEdges, cbNode.id, firstEdge.target)) {
          currentEdges.push({
            id: `compensating-cb-external-${Date.now()}`,
            source: cbNode.id,
            target: firstEdge.target,
            ...DEFAULT_EDGE_PROPS,
          });
        }

        // Remove original direct compute -> external edge
        currentEdges = currentEdges.filter(
          (e) => e.id !== firstEdge.id
        );
      }
    }
  }

  return { nodes: currentNodes, edges: currentEdges };
}
