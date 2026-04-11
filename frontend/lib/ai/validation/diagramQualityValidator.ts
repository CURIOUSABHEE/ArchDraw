import type { ArchitectureNode, ArchitectureEdge } from '../types';

export interface DiagramQualityReport {
  passed: boolean;
  checks: {
    structural: { passed: boolean; issues: string[] };
    connectivity: { passed: boolean; issues: string[] };
    edgeQuality: { passed: boolean; issues: string[] };
    resilienceCoverage: { passed: boolean; issues: string[] };
  };
}

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

function getNodeDegree(
  nodeId: string,
  edges: ArchitectureEdge[]
): number {
  const incoming = edges.filter((e) => e.target === nodeId).length;
  const outgoing = edges.filter((e) => e.source === nodeId).length;
  return incoming + outgoing;
}

export function validateDiagramQuality(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): DiagramQualityReport {
  const structuralIssues: string[] = [];
  const connectivityIssues: string[] = [];
  const edgeQualityIssues: string[] = [];
  const resilienceIssues: string[] = [];

  // Check 1: Structural integrity
  const hasClientOrEdge = nodes.some(
    (n) => !n.isGroup && ((n.tier || n.layer) === 'client' || (n.tier || n.layer) === 'edge')
  );
  const hasCompute = nodes.some(
    (n) => !n.isGroup && (n.tier || n.layer) === 'compute'
  );
  const hasData = nodes.some(
    (n) => !n.isGroup && (n.tier || n.layer) === 'data'
  );

  if (!hasClientOrEdge) {
    structuralIssues.push('Missing entry point tier (client or edge)');
  }
  if (!hasCompute) {
    structuralIssues.push('Missing compute tier');
  }
  if (!hasData) {
    structuralIssues.push('Missing data tier');
  }

  const structuralPassed = structuralIssues.length === 0;

  // Check 2: Connectivity
  const orphanedNodes = nodes.filter((n) => {
    if (n.isGroup) return false;
    return getNodeDegree(n.id, edges) === 0;
  });

  for (const node of orphanedNodes) {
    connectivityIssues.push(
      `Orphaned node: "${node.label}" (id: ${node.id}) has no connections`
    );
  }

  const connectivityPassed = orphanedNodes.length === 0;

  // Check 3: Edge quality
  const asyncNodeIds = new Set(
    nodes
      .filter((n) => !n.isGroup && (n.tier || n.layer) === 'async')
      .map((n) => n.id)
  );

  for (const edge of edges) {
    if (!edge.label || edge.label.trim() === '') {
      edgeQualityIssues.push(
        `Edge "${edge.id}" is missing a label`
      );
    }

    if (asyncNodeIds.has(edge.source) || asyncNodeIds.has(edge.target)) {
      if (edge.communicationType !== 'async' && edge.communicationType !== 'event') {
        edgeQualityIssues.push(
          `Edge "${edge.id}" connects to/from async node but is not marked as async/event`
        );
      }
    }
  }

  const edgeQualityPassed = edgeQualityIssues.length === 0;

  // Check 4: Resilience coverage
  const hasDataTier = nodes.some(
    (n) => !n.isGroup && (n.tier || n.layer) === 'data'
  );
  const hasCache = hasNodeWithLabelContaining(nodes, [
    'cache',
    'redis',
    'memcache',
  ]);

  if (hasDataTier && !hasCache) {
    resilienceIssues.push('Data tier exists but no cache component found');
  }

  const hasQueue = hasNodeWithLabelContaining(nodes, [
    'queue',
    'kafka',
    'rabbitmq',
    'sns',
    'sqs',
  ]);
  const hasDLQ = hasNodeWithLabelContaining(nodes, [
    'dlq',
    'dead letter',
    'dead-letter',
  ]);

  if (hasQueue && !hasDLQ) {
    resilienceIssues.push('Queue exists but no dead-letter queue found');
  }

  const hasExternalTier = nodes.some(
    (n) => !n.isGroup && (n.tier || n.layer) === 'external'
  );
  const hasCircuitBreaker = hasNodeWithLabelContaining(nodes, [
    'circuit breaker',
    'circuit-breaker',
  ]);

  if (hasExternalTier && !hasCircuitBreaker) {
    resilienceIssues.push('External tier exists but no circuit breaker found');
  }

  const resiliencePassed = resilienceIssues.length === 0;

  const allPassed =
    structuralPassed &&
    connectivityPassed &&
    edgeQualityPassed &&
    resiliencePassed;

  return {
    passed: allPassed,
    checks: {
      structural: { passed: structuralPassed, issues: structuralIssues },
      connectivity: { passed: connectivityPassed, issues: connectivityIssues },
      edgeQuality: { passed: edgeQualityPassed, issues: edgeQualityIssues },
      resilienceCoverage: { passed: resiliencePassed, issues: resilienceIssues },
    },
  };
}
