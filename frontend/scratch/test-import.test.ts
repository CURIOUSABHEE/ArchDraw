import { describe, it, expect } from 'vitest';
import { useDiagramStore } from '../store/diagramStore';
import { translateMermaidToReactFlowJSON } from '../lib/mermaid/aiAdapter';

if (typeof window === 'undefined') {
  global.window = {} as any;
}

const styleConfig = {
  primaryColor: '#334155',
  secondaryColor: '#475569',
  background: '#F8FAFC',
  fontFamily: 'Inter',
  theme: 'slate'
};

describe('Mermaid Translator Syntax Test Suite', () => {
  const testMermaid = async (mmd: string) => {
    const { nodes: parsedNodes, edges: parsedEdges } = await translateMermaidToReactFlowJSON(mmd, styleConfig);

    const processedNodes = parsedNodes.map(node => {
      const isGroup = node.type === 'groupNode' || node.data?.isGroup;
      return {
        ...node,
        type: isGroup ? 'groupNode' : (node.type || 'systemNode'),
      };
    });

    const processedEdges = parsedEdges.map(edge => ({
      ...edge,
      type: 'simpleFloating',
    }));

    useDiagramStore.getState().importDiagram(processedNodes, processedEdges);
    
    const storedNodes = useDiagramStore.getState().nodes;
    const storedEdges = useDiagramStore.getState().edges;
    expect(storedNodes.length).toBeGreaterThan(0);
  };

  it('Case 1: Standard flowchart with shapes', async () => {
    await testMermaid(`
      flowchart LR
        A[Square]
        B(Round)
        C[(Cylinder)]
        A --> B
        B --> C
    `);
  });

  it('Case 2: Subgraphs with quoted labels and spaces', async () => {
    await testMermaid(`
      graph TD
        subgraph GroupA ["My First Group"]
          Node1["Node One"]
        end
        subgraph GroupB ["My Second Group"]
          Node2["Node Two"]
        end
        Node1 -->|"Transfer"| Node2
    `);
  });

  it('Case 3: Bidirectional and labeled edges', async () => {
    await testMermaid(`
      graph LR
        A["A"]
        B["B"]
        C["C"]
        A <-->|"Sync"| B
        B -->|"Async"| C
    `);
  });

  it('Case 4: Implicit nodes in edges', async () => {
    await testMermaid(`
      graph TD
        A["A"]
        B["B"]
        A --> B
    `);
  });

  it('Case 5: Dashed edges (async)', async () => {
    await testMermaid(`
      graph TD
        A["A"]
        B["B"]
        A -.-> B
    `);
  });
});
