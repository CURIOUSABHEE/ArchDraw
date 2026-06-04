import { describe, it, expect } from 'vitest';
import { validateAndRepair, flowsToEdges } from './stage5-validate';
import { inferStylePlan } from './stage2-reasoning';

describe('stage5-validate (custom-first)', () => {
  it('reports orphan nodes without auto-connecting', () => {
    const { diagram, diagnostics } = validateAndRepair(
      {
        nodes: [
          { id: 'a', label: 'Blog App', layer: 'application' },
          { id: 'b', label: 'Orphan DB', layer: 'data' },
          { id: 'c', label: 'Primary DB', layer: 'data' },
        ],
        flows: [{ path: ['a', 'c'], label: 'uses', async: false }],
      },
      'simple monolith blog'
    );

    // Orphans are now dropped mechanically (no auto-edge invention).
    expect(diagram.nodes).toHaveLength(2);
    expect(diagnostics.rejectedAutoInjection).toBe(true);
    expect(diagnostics.mechanicalRepairs.some((i) => i.type === 'dropped_orphan_node')).toBe(true);
    expect(diagram.nodes.some((n) => n.id === 'b')).toBe(false);
  });

  it('does not inject API Gateway when client connects to multiple apps', () => {
    const flows = [
      { path: ['client', 'svc1'], label: 'req', async: false },
      { path: ['client', 'svc2'], label: 'req', async: false },
      { path: ['client', 'svc3'], label: 'req', async: false },
    ];
    const { diagram, diagnostics } = validateAndRepair(
      {
        nodes: [
          { id: 'client', label: 'Web Client', layer: 'client' },
          { id: 'svc1', label: 'Posts API', layer: 'application' },
          { id: 'svc2', label: 'Comments API', layer: 'application' },
          { id: 'svc3', label: 'Users API', layer: 'application' },
        ],
        flows,
      },
      'monolith blog app'
    );

    expect(diagram.nodes.some((n) => /gateway/i.test(n.label))).toBe(false);
    expect(diagnostics.mechanicalRepairs.filter((i) => i.type === 'injected_node')).toHaveLength(0);
  });

  it('does not merge duplicate payment concept nodes', () => {
    const { diagram } = validateAndRepair(
      {
        nodes: [
          { id: 'p1', label: 'Payment Service', layer: 'application' },
          { id: 'p2', label: 'Payment Handler', layer: 'application' },
        ],
        flows: [{ path: ['p1', 'p2'], label: 'charge', async: false }],
      },
      'checkout flow'
    );

    expect(diagram.nodes).toHaveLength(2);
  });

  it('removes dangling edges mechanically with diagnostics', () => {
    const { diagram, diagnostics } = validateAndRepair(
      {
        nodes: [{ id: 'only', label: 'Service', layer: 'application' }],
        flows: [{ path: ['only', 'missing'], label: 'call', async: false }],
      },
      'simple service'
    );

    expect(diagram.edges).toHaveLength(0);
    expect(diagnostics.removedInvalidEdgeIds.length).toBeGreaterThan(0);
    expect(diagnostics.mechanicalRepairs.some((i) => i.type === 'dangling_edge')).toBe(true);
  });

  it('payment/search keywords do not inject services automatically', () => {
    const stylePlan = inferStylePlan('ecommerce with search', 'monolith');
    const { diagram, diagnostics } = validateAndRepair(
      {
        nodes: [{ id: 'app', label: 'Store API', layer: 'application' }],
        flows: [],
      },
      'ecommerce with search and payment',
      undefined,
      { stylePlan, prompt: 'ecommerce with search and payment' }
    );

    expect(diagram.nodes).toHaveLength(1);
    expect(diagnostics.rejectedAutoInjection).toBe(true);
  });
});

describe('flowsToEdges', () => {
  it('converts multi-hop flows to edges', () => {
    const edges = flowsToEdges([
      { path: ['a', 'b', 'c'], label: 'flow', async: false },
    ]);
    expect(edges).toHaveLength(2);
    expect(edges.map((e) => `${e.source}->${e.target}`)).toEqual(['a->b', 'b->c']);
  });
});
