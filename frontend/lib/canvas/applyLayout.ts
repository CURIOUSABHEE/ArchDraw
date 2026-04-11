import ELK from 'elkjs/lib/elk.bundled.js';
import type { Node, Edge } from 'reactflow';
import type { LayoutPreset } from './layoutPresets';

const elk = new ELK();

const DEFAULT_NODE_WIDTH = 200;
const DEFAULT_NODE_HEIGHT = 100;

export async function applyLayoutPreset(
  nodes: Node[],
  edges: Edge[],
  preset: LayoutPreset
): Promise<Node[]> {
  const groupNodes = nodes.filter(n => n.type === 'group' || n.type === 'groupNode');
  const leafNodes = nodes.filter(n => n.type !== 'group' && n.type !== 'groupNode');

  const elkNodes = nodes.map(node => {
    const isGroup = node.type === 'group' || node.type === 'groupNode';
    const children = isGroup
      ? leafNodes
          .filter(n => n.parentId === node.id)
          .map(child => ({
            id: child.id,
            width: child.width ?? DEFAULT_NODE_WIDTH,
            height: child.height ?? DEFAULT_NODE_HEIGHT,
          }))
      : [];

    return {
      id: node.id,
      width: node.width ?? (isGroup ? 400 : DEFAULT_NODE_WIDTH),
      height: node.height ?? (isGroup ? 300 : DEFAULT_NODE_HEIGHT),
      ...(children.length > 0 ? { children } : {}),
    };
  });

  const rootElkNodes = elkNodes.filter(n => {
    const rfNode = nodes.find(r => r.id === n.id);
    return !rfNode?.parentId;
  });

  const elkEdges = edges
    .filter(e => {
      const sourceIsGroup = groupNodes.some(g => g.id === e.source);
      const targetIsGroup = groupNodes.some(g => g.id === e.target);
      return !sourceIsGroup && !targetIsGroup;
    })
    .map(e => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    }));

  const elkGraph = {
    id: 'root',
    layoutOptions: preset.elkOptions,
    children: rootElkNodes,
    edges: elkEdges,
  };

  try {
    const layouted = await elk.layout(elkGraph);

    const positionMap = new Map<string, { x: number; y: number }>();

    function extractPositions(elkNodes: { id: string; x?: number; y?: number; width?: number; height?: number; children?: typeof elkNodes }[], parentX = 0, parentY = 0) {
      for (const elkNode of elkNodes ?? []) {
        positionMap.set(elkNode.id, {
          x: elkNode.x ?? 0,
          y: elkNode.y ?? 0,
        });
        if (elkNode.children && elkNode.children.length > 0) {
          extractPositions(elkNode.children, elkNode.x ?? 0, elkNode.y ?? 0);
        }
      }
    }

    extractPositions(layouted.children ?? []);

    return nodes.map(node => {
      const newPos = positionMap.get(node.id);
      if (!newPos) return node;
      return {
        ...node,
        position: newPos,
        ...(node.type === 'group' || node.type === 'groupNode' ? {
          style: {
            ...node.style,
            width: layouted.children?.find(c => c.id === node.id)?.width ?? node.style?.width,
            height: layouted.children?.find(c => c.id === node.id)?.height ?? node.style?.height,
          }
        } : {})
      };
    });
  } catch (error) {
    console.error('[AutoLayout] ELK layout failed:', error);
    return nodes;
  }
}
