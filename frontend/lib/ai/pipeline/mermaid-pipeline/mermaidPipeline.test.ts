import { describe, it, expect } from 'vitest';
import { parseMermaid, normalizeEdgeReferences } from './mermaidParser';
import { validateMermaid } from './stage3-validate';
import { toNodeId } from './stage2-mermaid';
import type { Node, Edge } from 'reactflow';

describe('Node Label Extraction (Bug 1 Fix)', () => {
  it('extracts clean label: A["Start"] → "Start"', () => {
    const mermaid = `graph TD\nA["Start"]\n`;
    const parsed = parseMermaid(mermaid);
    expect(parsed.nodes).toHaveLength(1);
    expect(parsed.nodes[0].id).toBe('A');
    expect(parsed.nodes[0].label).toBe('Start');
  });

  it('strips edge label syntax from node labels: B -- Yes["B -- Yes"] → "Is it raining?"', () => {
    // This malformed line is silently skipped (no arrow, no node pattern)
    // The actual node is declared as B["Is it raining?"]
    const mermaid = `graph TD\nB["Is it raining?"]\nB -- Yes["B -- Yes"]\n`;
    const parsed = parseMermaid(mermaid);
    const nodeB = parsed.nodes.find(n => n.id === 'B');
    expect(nodeB).toBeDefined();
    expect(nodeB!.label).toBe('Is it raining?');
    // The malformed line should NOT create a node with label "B -- Yes"
    const malformedNode = parsed.nodes.find(n => n.id === 'Yes');
    expect(malformedNode).toBeUndefined();
  });

  it('handles pipe syntax as edge, not node label: B -->|Yes| C', () => {
    const mermaid = `graph TD\nB["Is it raining?"]\nC["Take an umbrella"]\nB -->|Yes| C\n`;
    const parsed = parseMermaid(mermaid);
    expect(parsed.nodes).toHaveLength(2);
    expect(parsed.nodes.find(n => n.id === 'B')?.label).toBe('Is it raining?');
    const edge = parsed.edges.find(e => e.source === 'B' && e.target === 'C');
    expect(edge).toBeDefined();
    expect(edge!.label).toBe('Yes');
  });

  it('handles numeric IDs: 1["First step"] → "First step"', () => {
    const mermaid = `graph TD\n1["First step"]\n`;
    const parsed = parseMermaid(mermaid);
    expect(parsed.nodes).toHaveLength(1);
    expect(parsed.nodes[0].label).toBe('First step');
  });

  it('normalizes -- text --> edge syntax before parsing', () => {
    const mermaid = `graph TD\nB["Is it raining?"]\nC["Take an umbrella"]\nB -- Yes --> C\n`;
    const parsed = parseMermaid(mermaid);
    // Edge should be B → C with label "Yes"
    const edge = parsed.edges.find(e => e.source === 'B' && e.target === 'C');
    expect(edge).toBeDefined();
    expect(edge!.label).toBe('Yes');
    // No implicit "B -- Yes" node should be created
    const bogus = parsed.nodes.find(n => n.id === 'B -- Yes');
    expect(bogus).toBeUndefined();
  });
});

describe('Edge Label Extraction (Bug 3 Fix)', () => {
  it('handles B -- Yes --> C  → label: "Yes"', () => {
    const mermaid = `graph TD\nB["Is it raining?"]\nC["Take an umbrella"]\nB -- Yes --> C\n`;
    const parsed = parseMermaid(mermaid);
    const edge = parsed.edges.find(e => e.source === 'B' && e.target === 'C');
    expect(edge).toBeDefined();
    expect(edge!.label).toBe('Yes');
  });

  it('handles B -->|Yes| C  → label: "Yes"', () => {
    const mermaid = `graph TD\nB["Is it raining?"]\nC["Take an umbrella"]\nB -->|Yes| C\n`;
    const parsed = parseMermaid(mermaid);
    const edge = parsed.edges.find(e => e.source === 'B' && e.target === 'C');
    expect(edge).toBeDefined();
    expect(edge!.label).toBe('Yes');
  });

  it('handles B -- "Yes" --> C  → label: "Yes"', () => {
    const mermaid = `graph TD\nB["Is it raining?"]\nC["Take an umbrella"]\nB -- "Yes" --> C\n`;
    const parsed = parseMermaid(mermaid);
    const edge = parsed.edges.find(e => e.source === 'B' && e.target === 'C');
    expect(edge).toBeDefined();
    expect(edge!.label).toBe('Yes');
  });

  it('handles edge with no label', () => {
    const mermaid = `graph TD\nA["Start"]\nB["End"]\nA --> B\n`;
    const parsed = parseMermaid(mermaid);
    const edge = parsed.edges.find(e => e.source === 'A' && e.target === 'B');
    expect(edge).toBeDefined();
    expect(edge!.label).toBe('');
  });
});

describe('Subgraph Node Membership (Bug 4 Fix)', () => {
  it('all 5 nodes inside a subgraph have parentNode set', () => {
    const mermaid = `graph TD
  subgraph ungrouped["Shared Services"]
    A["Start"]
    B["Is it raining?"]
    C["Take an umbrella"]
    D["Enjoy your day"]
    E["End"]
  end
  A --> B
  B --> C
  C --> D
  D --> E`;
    const parsed = parseMermaid(mermaid);
    expect(parsed.subgraphs).toHaveLength(1);
    expect(parsed.subgraphs[0].id).toBe('ungrouped');
    expect(parsed.subgraphs[0].nodeIds).toHaveLength(5);
    for (const node of parsed.nodes) {
      expect(node.parentId).toBe('ungrouped');
    }
  });

  it('nodes outside subgraph have no parentId', () => {
    const mermaid = `graph TD\nA["Start"]\nB["End"]\nA --> B\n`;
    const parsed = parseMermaid(mermaid);
    for (const node of parsed.nodes) {
      expect(node.parentId).toBeUndefined();
    }
  });
});

describe('Mermaid Parser', () => {
  it('correctly parses subgraphs, nodes with subtitles/shapes, and bidirectional edges', () => {
    const mermaidCode = `
      graph TD
        subgraph CLIENT["Client Tier"]
          CV["Customer View\\nNext.js"]
          ASV["Admin Staff View\\nReact"]
        end
        subgraph DB["Data Tier"]
          PG[("PostgreSQL")]
        end
        CV -->|"submit ticket"| TICKETS
        AC <-->|"session check"| AUTH
    `;

    const parsed = parseMermaid(mermaidCode);

    // Subgraphs
    expect(parsed.subgraphs).toHaveLength(2);
    expect(parsed.subgraphs[0].id).toBe('CLIENT');
    expect(parsed.subgraphs[0].label).toBe('Client Tier');
    expect(parsed.subgraphs[1].id).toBe('DB');
    expect(parsed.subgraphs[1].label).toBe('Data Tier');

    // Nodes
    expect(parsed.nodes).toHaveLength(3);
    const cvNode = parsed.nodes.find(n => n.id === 'CV');
    expect(cvNode).toBeDefined();
    expect(cvNode?.label).toBe('Customer View');
    expect(cvNode?.subtitle).toBe('Next.js');
    expect(cvNode?.parentId).toBe('CLIENT');
    expect(cvNode?.isDb).toBe(false);

    const pgNode = parsed.nodes.find(n => n.id === 'PG');
    expect(pgNode).toBeDefined();
    expect(pgNode?.label).toBe('PostgreSQL');
    expect(pgNode?.isDb).toBe(true);
    expect(pgNode?.parentId).toBe('DB');

    // Edges
    expect(parsed.edges).toHaveLength(2);
    const edge1 = parsed.edges.find(e => e.source === 'CV');
    expect(edge1?.target).toBe('TICKETS');
    expect(edge1?.label).toBe('submit ticket');
    expect(edge1?.bidirectional).toBe(false);

    const edge2 = parsed.edges.find(e => e.source === 'AC');
    expect(edge2?.target).toBe('AUTH');
    expect(edge2?.label).toBe('session check');
    expect(edge2?.bidirectional).toBe(true);
  });
});

describe('normalizeEdgeReferences (Fix 2)', () => {
  it('replaces quoted label references with bare IDs in edge lines only', () => {
    const mermaid = `graph TD
  subgraph SERVICES["Services Tier"]
    AUTH["Auth Service\\nExpress"]
  end
  "Auth Service" -->|"login"| "Customer View"`;

    const nodeIdMap = [
      { label: 'Auth Service', id: 'AUTH' },
      { label: 'Customer View', id: 'CV' },
    ];

    const result = normalizeEdgeReferences(mermaid, nodeIdMap);
    const lines = result.split('\n');

    // Node declaration line preserved unchanged
    expect(lines[2]).toContain('AUTH["Auth Service');
    // Edge line has labels replaced with bare IDs
    const edgeLine = lines.find(l => l.includes('-->'));
    expect(edgeLine).toContain('AUTH -->');
    expect(edgeLine).toContain('CV');
    expect(edgeLine).not.toContain('"Auth Service"');
    expect(edgeLine).not.toContain('"Customer View"');
  });

  it('does not touch node declarations or subgraph labels', () => {
    const mermaid = `graph TD
  subgraph SERVICES["Services Tier"]
    AUTH["Auth Service\\nExpress"]
  end
  AUTH --> CV`;

    const result = normalizeEdgeReferences(mermaid, [
      { label: 'Auth Service', id: 'AUTH' },
      { label: 'Customer View', id: 'CV' },
    ]);

    expect(result).toBe(mermaid);
  });

  it('handles bidirectional edges', () => {
    const mermaid = `graph TD
  AUTH -->|"login"| DB
  "Auth Service" <--> "Database"`;

    const result = normalizeEdgeReferences(mermaid, [
      { label: 'Auth Service', id: 'AUTH' },
      { label: 'Database', id: 'DB' },
    ]);

    const bidiLine = result.split('\n').find(l => l.includes('<-->'));
    expect(bidiLine).toContain('AUTH <-->');
    expect(bidiLine).toContain('DB');
    expect(bidiLine).not.toContain('"Auth Service"');
    expect(bidiLine).not.toContain('"Database"');
  });

  it('does not break when there is no nodeIdMap', () => {
    const mermaid = `graph TD
  CV --> AUTH`;
    expect(normalizeEdgeReferences(mermaid, [])).toBe(mermaid);
  });
});

describe('Programmatic Validation Agent', () => {
  const inventoryConfig = {
    nodes: ['Customer View', 'PostgreSQL', 'Auth Service'],
    groups: ['Client Tier', 'Services Tier', 'Data Tier'],
    nodeCount: 3,
  };

  const edgeConfig = {
    edges: [
      { from: 'Customer View', to: 'Auth Service', label: 'login', bidirectional: false },
      { from: 'Auth Service', to: 'PostgreSQL', label: 'lookup', bidirectional: true },
    ],
    edgeCount: 2,
  };

  it('passes validation when all components and connections exist correctly', () => {
    const validMermaid = `
      graph TD
        subgraph CLIENT["Client Tier"]
          CV["Customer View\\nNext.js"]
        end
        subgraph SERVICES["Services Tier"]
          AUTH["Auth Service\\nExpress"]
        end
        subgraph DB["Data Tier"]
          PG[("PostgreSQL")]
        end
        CV -->|"login"| AUTH
        AUTH <-->|"lookup"| PG
    `;

    const result = validateMermaid(validMermaid, inventoryConfig, edgeConfig);
    expect(result.isValid).toBe(true);
    expect(result.repairInstructions).toBeUndefined();
  });

  it('fails validation and yields repair instructions for missing nodes/groups/edges', () => {
    const brokenMermaid = `
      graph TD
        subgraph CLIENT["Client Tier"]
          CV["Customer View\\nNext.js"]
        end
        CV -->|"login"| AUTH
    `;

    const result = validateMermaid(brokenMermaid, inventoryConfig, edgeConfig);
    expect(result.isValid).toBe(false);
    expect(result.nodeIssues.length).toBeGreaterThan(0);
    expect(result.groupIssues.length).toBeGreaterThan(0);
    expect(result.edgeIssues.length).toBeGreaterThan(0);
  });

  it('normalizes quoted labels in edges before parsing (safety net, Fix 2+3)', () => {
    // Edges use quoted labels instead of bare IDs; safety net fixes them before parsing
    const mermaid = `graph TD
  subgraph CLIENT["Client Tier"]
    CV["Customer View\\nNext.js"]
  end
  subgraph SERVICES["Services Tier"]
    AUTH["Auth Service\\nExpress"]
  end
  subgraph DB["Data Tier"]
    PG[("PostgreSQL")]
  end
  "Customer View" -->|"login"| "Auth Service"
  "Auth Service" <-->|"lookup"| "PostgreSQL"`;

    const result = validateMermaid(mermaid,
      { nodes: ['Customer View', 'Auth Service', 'PostgreSQL'], groups: ['Client Tier', 'Services Tier', 'Data Tier'], nodeCount: 3 },
      { edges: [
        { from: 'Customer View', to: 'Auth Service', label: 'login', bidirectional: false },
        { from: 'Auth Service', to: 'PostgreSQL', label: 'lookup', bidirectional: true },
      ], edgeCount: 2 }
    );
    // Should pass because the safety net fixes the quoted edge labels
    expect(result.isValid).toBe(true);
    expect(result.repairInstructions).toBeUndefined();
  });

  it('suggests closest matching ID for unknown edge references (Fix 3)', () => {
    const mermaid = `graph TD
  subgraph CLIENT["Client Tier"]
    CV["Customer View\\nNext.js"]
  end
  subgraph SERVICES["Services Tier"]
    AUTH["Auth Service\\nExpress"]
  end
  subgraph DB["Data Tier"]
    PG["PostgreSQL"]
  end
  CV --> UserService
  UserService --> PG`;

    const result = validateMermaid(mermaid, inventoryConfig, edgeConfig);
    expect(result.isValid).toBe(false);
    expect(result.repairInstructions).toBeDefined();
    // Should contain suggestion for closest matching ID
    expect(result.repairInstructions).toContain('AUTH');
  });

  it('detects and reports orphan nodes', () => {
    const mermaidWithOrphan = `
      graph TD
        subgraph CLIENT["Client Tier"]
          CV["Customer View\\nNext.js"]
        end
        subgraph SERVICES["Services Tier"]
          AUTH["Auth Service\\nExpress"]
          ORPH["Orphan Service\\nNode"]
        end
        subgraph DB["Data Tier"]
          PG[("PostgreSQL")]
        end
        CV -->|"login"| AUTH
        AUTH <-->|"lookup"| PG
    `;

    const result = validateMermaid(mermaidWithOrphan, {
      ...inventoryConfig,
      nodes: [...inventoryConfig.nodes, 'Orphan Service'],
      nodeCount: 4,
    }, edgeConfig);
    expect(result.isValid).toBe(false);
    expect(result.repairInstructions).toBeDefined();
    expect(result.repairInstructions).toContain('ORPHAN NODES DETECTED');
  });
});

describe('toNodeId (deterministic ID generation)', () => {
  it('produces PascalCase from simple label', () => {
    const used = new Set<string>();
    expect(toNodeId('Message Queue', used)).toBe('MessageQueue');
  });

  it('treats & / - _ as word boundaries', () => {
    const used = new Set<string>();
    expect(toNodeId('Auth & Session Service', used)).toBe('AuthSessionService');
    expect(toNodeId('Web/API Gateway', used)).toBe('WebApiGateway');
    expect(toNodeId('Object-Storage Bucket', used)).toBe('ObjectStorageBucket');
    expect(toNodeId('user_profile_db', used)).toBe('UserProfileDb');
  });

  it('keeps digits within words (only strips non-alpha-non-digit)', () => {
    const used = new Set<string>();
    expect(toNodeId('Payment (Service)', used)).toBe('PaymentService');
    expect(toNodeId('Order#123 Backend', used)).toBe('Order123Backend');
  });

  it('prefixes Node- for IDs starting with digit', () => {
    const used = new Set<string>();
    expect(toNodeId('3rd Party API', used)).toBe('Node3rdPartyApi');
  });

  it('appends Node suffix for reserved Mermaid keywords', () => {
    const used = new Set<string>();
    expect(toNodeId('End', used)).toBe('EndNode');
    expect(toNodeId('Graph', used)).toBe('GraphNode');
    expect(toNodeId('subgraph', used)).toBe('SubgraphNode');
  });

  it('two calls with same label to same used set get suffixed (collision guard)', () => {
    const used = new Set<string>();
    expect(toNodeId('Auth Service', used)).toBe('AuthService');
    expect(toNodeId('Auth Service', used)).toBe('AuthService2');
  });

  it('handles collision guard with numeric suffix from pre-seeded set', () => {
    const used = new Set<string>(['Cache']);
    expect(toNodeId('Cache', used)).toBe('Cache2');
    expect(toNodeId('Cache', used)).toBe('Cache3');
  });

  it('handles empty label by defaulting to Node prefix with collision guard', () => {
    const used = new Set<string>();
    expect(toNodeId('', used)).toBe('Node');
    expect(toNodeId('   ', used)).toBe('Node2');
  });
});


