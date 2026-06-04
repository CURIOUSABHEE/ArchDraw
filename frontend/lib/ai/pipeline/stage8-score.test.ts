import { describe, it, expect } from 'vitest';
import { Node, Edge } from 'reactflow';
import { scoreDiagram } from './stage8-score';
import { inferStylePlan } from './stage2-reasoning';

function makeNode(id: string, label: string, layer: string): Node {
  return {
    id,
    type: 'architectureNode',
    position: { x: 0, y: 0 },
    data: { label, layer },
  };
}

function makeEdge(source: string, target: string, label: string): Edge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    data: { label },
  };
}

describe('stage8-score (intent-fidelity)', () => {
  it('scores MVC diagram well without gateway/client/data quartet', () => {
    const nodes = [
      makeNode('view', 'Rails Views', 'application'),
      makeNode('ctrl', 'Controllers', 'application'),
      makeNode('model', 'ActiveRecord Models', 'application'),
    ];
    const edges = [
      makeEdge('view', 'ctrl', 'HTTP request'),
      makeEdge('ctrl', 'model', 'query records'),
      makeEdge('model', 'ctrl', 'return data'),
      makeEdge('ctrl', 'view', 'render response'),
    ];

    const score = scoreDiagram(nodes, edges, {
      diagramSize: 'small',
      stylePlan: inferStylePlan('MVC architecture for a Rails app', 'mvc'),
      prompt: 'MVC architecture for a Rails app',
    });

    expect(score.score).toBeGreaterThanOrEqual(65);
  });

  it('scores backend-only data pipeline without client layer', () => {
    const nodes = [
      makeNode('s3', 'S3 Raw Zone', 'data'),
      makeNode('dbt', 'dbt Transform', 'application'),
      makeNode('sf', 'Snowflake', 'data'),
    ];
    const edges = [
      makeEdge('s3', 'dbt', 'ingest files'),
      makeEdge('dbt', 'sf', 'load tables'),
    ];

    const score = scoreDiagram(nodes, edges, {
      diagramSize: 'medium',
      stylePlan: inferStylePlan('data pipeline from S3 to Snowflake using dbt', 'data_pipeline'),
      prompt: 'data pipeline from S3 to Snowflake using dbt',
    });

    expect(score.score).toBeGreaterThanOrEqual(60);
  });

  it('lowers score for unrequested generic template nodes', () => {
    const withGeneric = scoreDiagram(
      [
        makeNode('gw', 'API Gateway', 'gateway'),
        makeNode('obs', 'Observability Stack', 'observability'),
        makeNode('app', 'Blog Service', 'application'),
      ],
      [
        makeEdge('gw', 'app', 'route'),
        makeEdge('app', 'obs', 'telemetry'),
      ],
      {
        diagramSize: 'small',
        stylePlan: inferStylePlan('simple monolith blog app', 'monolith'),
        prompt: 'simple monolith blog app',
      }
    );

    const withoutGeneric = scoreDiagram(
      [makeNode('app', 'Blog Service', 'application'), makeNode('db', 'SQLite', 'data')],
      [makeEdge('app', 'db', 'read write')],
      {
        diagramSize: 'small',
        stylePlan: inferStylePlan('simple monolith blog app', 'monolith'),
        prompt: 'simple monolith blog app',
      }
    );

    expect(withoutGeneric.score).toBeGreaterThan(withGeneric.score);
  });

  it('does not penalize small correct diagrams for low node count', () => {
    const score = scoreDiagram(
      [
        makeNode('app', 'Monolith API', 'application'),
        makeNode('db', 'PostgreSQL', 'data'),
      ],
      [makeEdge('app', 'db', 'SQL queries')],
      {
        diagramSize: 'small',
        stylePlan: inferStylePlan('simple monolith blog app', 'monolith'),
        prompt: 'simple monolith blog app',
      }
    );

    expect(score.score).toBeGreaterThanOrEqual(55);
  });
});
