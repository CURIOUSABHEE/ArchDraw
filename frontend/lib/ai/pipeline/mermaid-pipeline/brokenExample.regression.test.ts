import { describe, it, expect } from 'vitest';
import { parseMermaid } from './mermaidParser';

const BROKEN_EXAMPLE = `graph TD
  subgraph ungrouped["Shared Services"]
    A["Start"]
    B["Is it raining?"]
    C["Take an umbrella"]
    D["Enjoy your day"]
    E["End"]
    B -- Yes["B -- Yes"]
    B -- No["B -- No"]
  end
  A --> B
  B -- Yes --> C
  B -- No --> D
  C --> E
  D --> E`;

describe('Broken Example Regression Tests', () => {
  it('parses 5 nodes with correct labels (no edge syntax leaks)', () => {
    const parsed = parseMermaid(BROKEN_EXAMPLE);
    expect(parsed.nodes).toHaveLength(5);
    const labels = parsed.nodes.map(n => n.label);
    expect(labels).toContain('Start');
    expect(labels).toContain('Is it raining?');
    expect(labels).toContain('Take an umbrella');
    expect(labels).toContain('Enjoy your day');
    expect(labels).toContain('End');
    // No node label should contain '--' or '|' or '['
    for (const node of parsed.nodes) {
      expect(node.label).not.toContain('--');
      expect(node.label).not.toContain('|');
      expect(node.label).not.toContain('["');
    }
  });

  it('parses exactly 5 edges with correct labels', () => {
    const parsed = parseMermaid(BROKEN_EXAMPLE);
    expect(parsed.edges).toHaveLength(5);

    const edgeAtoB = parsed.edges.find(e => e.source === 'A' && e.target === 'B');
    expect(edgeAtoB).toBeDefined();
    expect(edgeAtoB!.label).toBe('');

    const edgeBtoC = parsed.edges.find(e => e.source === 'B' && e.target === 'C');
    expect(edgeBtoC).toBeDefined();
    expect(edgeBtoC!.label).toBe('Yes');

    const edgeBtoD = parsed.edges.find(e => e.source === 'B' && e.target === 'D');
    expect(edgeBtoD).toBeDefined();
    expect(edgeBtoD!.label).toBe('No');

    const edgeCtoE = parsed.edges.find(e => e.source === 'C' && e.target === 'E');
    expect(edgeCtoE).toBeDefined();
    expect(edgeCtoE!.label).toBe('');

    const edgeDtoE = parsed.edges.find(e => e.source === 'D' && e.target === 'E');
    expect(edgeDtoE).toBeDefined();
    expect(edgeDtoE!.label).toBe('');
  });

  it('all 5 nodes are inside the subgraph with parentId set', () => {
    const parsed = parseMermaid(BROKEN_EXAMPLE);
    expect(parsed.subgraphs).toHaveLength(1);
    expect(parsed.subgraphs[0].id).toBe('ungrouped');
    expect(parsed.subgraphs[0].nodeIds).toHaveLength(5);
    // Remove the optional display flag to avoid false positives
    const displayedNodes = parsed.nodes.filter(n => n.parentId);
    expect(displayedNodes).toHaveLength(5);
  });

  it('no malformed "Yes" or "No" nodes from inline extraction', () => {
    const parsed = parseMermaid(BROKEN_EXAMPLE);
    // Edge labels should not create nodes "Yes" or "No"
    const yesOrNoNodes = parsed.nodes.filter(n => n.id === 'Yes' || n.id === 'No');
    expect(yesOrNoNodes).toHaveLength(0);
  });

  it('no "B -- Yes" or "B -- No" bogus node IDs', () => {
    const parsed = parseMermaid(BROKEN_EXAMPLE);
    const bogusNodes = parsed.nodes.filter(n =>
      n.id === 'B -- Yes' || n.id === 'B -- No' || n.id === 'B--Yes' || n.id === 'B--No'
    );
    expect(bogusNodes).toHaveLength(0);
  });
});
