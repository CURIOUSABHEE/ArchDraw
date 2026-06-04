import { describe, it, expect } from 'vitest';
import {
  shouldRetryGeneration,
  mergeFeedbackForRetry,
  getRetryableSemanticIssues,
} from './stage5-validate';
import type { ValidationFeedback, PipelineDiagnostics } from './types';
import { validateDiagramQuality } from '../validation/diagramQualityValidator';
import type { ArchitectureNode, ArchitectureEdge } from '../types';

describe('semantic quality gate', () => {
  const baseFeedback: ValidationFeedback = {
    isValid: true,
    score: 90,
    issues: [],
    injectedNodes: [],
    prunedNodes: [],
    orphansFixed: 0,
    tiersRepaired: [],
  };

  const baseDiagnostics: PipelineDiagnostics = {
    style: 'monolith',
    productionDepth: 'conceptual',
    semanticIssues: [
      {
        severity: 'warning',
        type: 'orphan_node',
        nodeId: 'monitoring',
        message: 'Node Monitoring has no connections',
      },
    ],
    mechanicalRepairs: [],
    removedInvalidEdgeIds: [],
    rejectedAutoInjection: true,
  };

  it('shouldRetryGeneration when orphan warnings exist', () => {
    expect(shouldRetryGeneration(baseFeedback, baseDiagnostics)).toBe(true);
  });

  it('mergeFeedbackForRetry marks invalid and merges issues', () => {
    const merged = mergeFeedbackForRetry(baseFeedback, baseDiagnostics);
    expect(merged.isValid).toBe(false);
    expect(merged.issues.some((i) => i.type === 'orphan_node')).toBe(true);
  });

  it('getRetryableSemanticIssues filters non-retryable types', () => {
    const issues = getRetryableSemanticIssues([
      { severity: 'warning', type: 'orphan_node', message: 'orphan' },
      { severity: 'warning', type: 'style_mismatch', message: 'style' },
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe('orphan_node');
  });
});

describe('diagramQualityValidator blockingPassed', () => {
  it('fails blocking when orphans exist but may pass full report on tier rules', () => {
    const nodes: ArchitectureNode[] = [
      {
        id: 'orphan',
        type: 'architectureNode',
        label: 'Monitoring',
        layer: 'observability',
        width: 180,
        height: 70,
        icon: 'box',
        metadata: {},
      } as ArchitectureNode,
    ];
    const edges: ArchitectureEdge[] = [];

    const report = validateDiagramQuality(nodes, edges);
    expect(report.blockingPassed).toBe(false);
    expect(report.checks.connectivity.passed).toBe(false);
  });
});
