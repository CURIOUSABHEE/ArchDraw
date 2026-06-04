import { describe, it, expect } from 'vitest';
import { buildEdgesFromFlows, diagramEdgesToArchitectureEdges } from './pipelineOrchestrator';
import { validateAndRepair } from './stage5-validate';
import { inferStylePlan } from './stage2-reasoning';
import type { RawNode, RawFlow } from './types';

describe('pipelineOrchestrator (custom-first helpers)', () => {
  it('builds edges only from LLM flows (no presentation→application→data fallback)', () => {
    const flows: RawFlow[] = [
      { path: ['blog', 'db'], label: 'queries', async: false },
    ];
    const edges = buildEdgesFromFlows(flows);
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('blog');
    expect(edges[0].target).toBe('db');
  });

  it('monolith validation does not add API Gateway, Cache, DLQ, Circuit Breaker, Observability', () => {
    const nodes: RawNode[] = [
      { id: 'web', label: 'Web UI', layer: 'client' },
      { id: 'api', label: 'Blog API', layer: 'application' },
      { id: 'db', label: 'PostgreSQL', layer: 'data' },
    ];
    const flows: RawFlow[] = [
      { path: ['web', 'api'], label: 'HTTP', async: false },
      { path: ['api', 'db'], label: 'SQL', async: false },
    ];

    const stylePlan = inferStylePlan('Draw a simple monolith blog app', 'monolith');
    const { diagram, diagnostics } = validateAndRepair(
      { nodes, flows },
      'Draw a simple monolith blog app',
      undefined,
      { stylePlan }
    );

    const labels = diagram.nodes.map((n) => n.label.toLowerCase()).join(' ');
    expect(labels).not.toMatch(/api gateway|cache|dlq|circuit breaker|observability/);
    expect(diagnostics.rejectedAutoInjection).toBe(true);
  });

  it('preserves microservices service boundaries from model output', () => {
    const nodes: RawNode[] = [
      { id: 'orders', label: 'Order Service', layer: 'application' },
      { id: 'orders-db', label: 'Orders DB', layer: 'data' },
      { id: 'catalog', label: 'Catalog Service', layer: 'application' },
      { id: 'catalog-db', label: 'Catalog DB', layer: 'data' },
      { id: 'kafka', label: 'Kafka', layer: 'queue' },
    ];
    const flows: RawFlow[] = [
      { path: ['orders', 'orders-db'], label: 'persist', async: false },
      { path: ['catalog', 'catalog-db'], label: 'persist', async: false },
      { path: ['orders', 'kafka'], label: 'order placed', async: true },
      { path: ['kafka', 'catalog'], label: 'consume', async: true },
    ];

    const { diagram } = validateAndRepair(
      { nodes, flows },
      'microservices ecommerce with per-service databases and Kafka',
      undefined,
      { stylePlan: inferStylePlan('microservices ecommerce with per-service databases and Kafka', 'microservices') }
    );

    expect(diagram.nodes.filter((n) => n.layer === 'data')).toHaveLength(2);
    expect(diagram.nodes.some((n) => n.label.includes('Kafka'))).toBe(true);
  });

  it('diagramEdgesToArchitectureEdges maps communication styles', () => {
    const arch = diagramEdgesToArchitectureEdges([
      { id: 'e1', source: 'a', target: 'b', label: 'event', async: true, communicationType: 'async' },
    ]);
    expect(arch[0].animated).toBeDefined();
    expect(arch[0].source).toBe('a');
  });
});
