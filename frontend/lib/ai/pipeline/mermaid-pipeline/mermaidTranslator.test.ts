import { describe, it, expect } from 'vitest';
import { translateMermaidToReactFlowJSON } from '@/lib/mermaid/aiAdapter';

describe('Mermaid AST to React Flow Translator', () => {
  const styleConfig = {
    primaryColor: '#2D6A4F',
    secondaryColor: '#354F52',
    background: '#F8F9FA',
    fontFamily: 'Inter',
    theme: 'forest-green-slate',
  };

  const nodeTypeMap = {
    CV: 'frontend',
    AUTH: 'api',
    PG: 'database',
  };

  it('correctly scans subgraphs, nodes, and edges, applying dagre-based positions and styling', async () => {
    const mermaidCode = `
      graph TD
        subgraph CLIENT["Client Container"]
          CV["Customer View\\nNext.js"]
          AC["AuthContext\\nReact Context"]
        end
        subgraph SERVER["Application Server"]
          AUTH["/api/auth"]
          TICKETS["/api/tickets"]
        end
        CV -->|"submit ticket"| TICKETS
        AC <-->|"session check"| AUTH
    `;

    const { nodes, edges } = await translateMermaidToReactFlowJSON(mermaidCode, styleConfig, nodeTypeMap);

    // Verify CLIENT frame properties
    const clientFrame = nodes.find(n => n.id === 'CLIENT');
    expect(clientFrame).toBeDefined();
    expect(clientFrame.type).toBe('frameNode');
    expect(clientFrame.position.x).toBeGreaterThanOrEqual(0);
    expect(clientFrame.position.y).toBeGreaterThanOrEqual(0);
    expect(clientFrame.data.style.borderColor).toBe('#2D6A4F');

    // Verify CV node properties
    const cvNode = nodes.find(n => n.id === 'CV');
    expect(cvNode).toBeDefined();
    expect(cvNode.type).toBe('shapeNode');
    expect(cvNode.position.x).toBeGreaterThanOrEqual(0);
    expect(cvNode.position.y).toBeGreaterThanOrEqual(0);
    expect(cvNode.parentNode).toBe('CLIENT');
    expect(cvNode.data.label).toContain('Customer View');

    // Verify AC node properties
    const acNode = nodes.find(n => n.id === 'AC');
    expect(acNode).toBeDefined();
    expect(acNode.position.x).toBeGreaterThanOrEqual(0);
    expect(acNode.position.y).toBeGreaterThanOrEqual(0);

    // Verify SERVER frame properties
    const serverFrame = nodes.find(n => n.id === 'SERVER');
    expect(serverFrame).toBeDefined();
    expect(serverFrame.position.x).toBeGreaterThanOrEqual(0);
    expect(serverFrame.position.y).toBeGreaterThanOrEqual(0);

    // Verify AUTH node properties
    const authNode = nodes.find(n => n.id === 'AUTH');
    expect(authNode).toBeDefined();
    expect(authNode.position.x).toBeGreaterThanOrEqual(0);
    expect(authNode.position.y).toBeGreaterThanOrEqual(0);

    // Verify Edges
    expect(edges).toHaveLength(2);

    const edge1 = edges.find(e => e.source === 'CV' && e.target === 'TICKETS');
    expect(edge1).toBeDefined();
    expect(edge1.source).toBe('CV');
    expect(edge1.target).toBe('TICKETS');
    expect(edge1.type).toBe('simpleFloating');

    const edge2 = edges.find(e => e.source === 'AC' && e.target === 'AUTH');
    expect(edge2).toBeDefined();
    expect(edge2.source).toBe('AC');
    expect(edge2.target).toBe('AUTH');
  });

  it('correctly maps cylinders to shapeNode', async () => {
    const mermaidCode = `
      graph TD
        subgraph DB["Database Tier"]
          PG[("PostgreSQL")]
        end
    `;

    const { nodes } = await translateMermaidToReactFlowJSON(mermaidCode, styleConfig, nodeTypeMap);
    const pgNode = nodes.find(n => n.id === 'PG');
    expect(pgNode).toBeDefined();
    expect(pgNode.type).toBe('shapeNode');
  });

  it('correctly maps and positions nodes that are not inside any subgraph/group', async () => {
    const mermaidCode = `
      graph TD
        CV["Customer View"]
        PG[("PostgreSQL")]
        CV --> PG
    `;

    const { nodes, edges } = await translateMermaidToReactFlowJSON(mermaidCode, styleConfig);

    const cvNode = nodes.find(n => n.id === 'CV');
    expect(cvNode).toBeDefined();
    expect(cvNode.position.x).toBeGreaterThanOrEqual(0);
    expect(cvNode.position.y).toBeGreaterThanOrEqual(0);

    const pgNode = nodes.find(n => n.id === 'PG');
    expect(pgNode).toBeDefined();
    expect(pgNode.position.x).toBeGreaterThanOrEqual(0);
    expect(pgNode.position.y).toBeGreaterThanOrEqual(0);

    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('CV');
    expect(edges[0].target).toBe('PG');
  });

  it('correctly parses edges with different arrow types', async () => {
    const mermaidCode = `
      graph TD
        A["A"]
        B["B"]
        C["C"]
        A --> B
        B -.-> C
    `;

    const { nodes, edges } = await translateMermaidToReactFlowJSON(mermaidCode, styleConfig);

    expect(edges).toHaveLength(2);
    const edge1 = edges.find(e => e.source === 'A');
    const edge2 = edges.find(e => e.source === 'B');

    expect(edge1).toBeDefined();
    expect(edge2).toBeDefined();
  });
});
