import ELK from 'elkjs/lib/elk.bundled.js';
import type { RawNode, DiagramEdge, LayoutedNode, ValidatedDiagram } from './types';

const elk = new ELK();

interface ELKNode {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  children?: ELKNode[];
  layoutOptions?: Record<string, string>;
}

interface ELKEdge {
  id: string;
  sources: string[];
  targets: string[];
}

interface ELKGraph {
  id: string;
  layoutOptions?: Record<string, string>;
  children?: ELKNode[];
  edges?: ELKEdge[];
}

const TIER_X: Record<string, number> = {
  presentation: 50,
  gateway: 350,
  application: 700,
  async: 1100,
  data: 1500,
  observability: 1900,
  external: 2300,
};

export async function applyLayout(
  validated: ValidatedDiagram
): Promise<LayoutedNode[]> {
  const { nodes, edges } = validated;

  const groupNodes = nodes.filter(n => n.isGroup);
  const childNodes = nodes.filter(n => n.parentId && !n.isGroup);
  const rootNodes = nodes.filter(n => !n.isGroup && !n.parentId);

  const groupIds = new Set(groupNodes.map(g => g.id));

  const elkChildren: ELKNode[] = [];

  for (const node of rootNodes) {
    elkChildren.push({
      id: node.id,
      width: 180,
      height: 70,
    });
  }

  for (const group of groupNodes) {
    const groupChildren = childNodes.filter(c => c.parentId === group.id);
    
    elkChildren.push({
      id: group.id,
      width: 400,
      height: 300,
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN',
        'elk.padding': '[top=52,left=24,bottom=24,right=24]',
        'elk.spacing.nodeNode': '24',
      },
      children: groupChildren.map(child => ({
        id: child.id,
        width: 180,
        height: 70,
      })),
    });
  }

  const elkEdges: ELKEdge[] = [];
  for (const edge of edges) {
    if (!groupIds.has(edge.source) && !groupIds.has(edge.target)) {
      elkEdges.push({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      });
    }
  }

  const elkGraph: ELKGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '80',
      'elk.layered.spacing.nodeNodeBetweenLayers': '120',
      'elk.padding': '[top=60,left=60,bottom=60,right=60]',
    },
    children: elkChildren,
    edges: elkEdges,
  };

  let elkResult: ELKGraph;
  try {
    elkResult = await elk.layout(elkGraph) as ELKGraph;
  } catch (error) {
    console.warn('[Layout] ELK failed, using manual fallback');
    return manualLayout(nodes, edges, groupNodes, childNodes, rootNodes);
  }

  const layouted: LayoutedNode[] = [];
  const nodeMap = new Map<string, LayoutedNode>();

  function extractPositions(graph: ELKGraph, offsetX = 0, offsetY = 0) {
    if (!graph.children) return;
    
    for (const elkNode of graph.children) {
      const originalNode = nodes.find(n => n.id === elkNode.id);
      if (!originalNode) continue;

      const x = (elkNode.x ?? 0) + offsetX;
      const y = (elkNode.y ?? 0) + offsetY;

      let finalWidth = elkNode.width ?? 180;
      let finalHeight = elkNode.height ?? 70;

      if (originalNode.isGroup) {
        const childCount = childNodes.filter(c => c.parentId === originalNode.id).length;
        const minWidth = Math.max(childCount * 220, 400);
        const minHeight = Math.ceil(childCount / 2) * 100 + 80;
        finalWidth = Math.max(finalWidth, minWidth);
        finalHeight = Math.max(finalHeight, minHeight);
      }

      const layoutedNode: LayoutedNode = {
        ...originalNode,
        x,
        y,
        width: finalWidth,
        height: finalHeight,
      };

      layouted.push(layoutedNode);
      nodeMap.set(elkNode.id, layoutedNode);

      if (elkNode.children) {
        for (const childElk of elkNode.children) {
          const childOriginal = childNodes.find(n => n.id === childElk.id);
          if (!childOriginal) continue;

          const childX = (childElk.x ?? 24);
          const childY = (childElk.y ?? 52);

          layouted.push({
            ...childOriginal,
            x: childX,
            y: childY,
            width: childElk.width ?? 180,
            height: childElk.height ?? 70,
          });
        }
      }
    }
  }

  extractPositions(elkResult);

  return layouted;
}

function manualLayout(
  nodes: RawNode[],
  edges: DiagramEdge[],
  groupNodes: RawNode[],
  childNodes: RawNode[],
  rootNodes: RawNode[]
): LayoutedNode[] {
  const layouted: LayoutedNode[] = [];

  let currentY = 50;
  for (const node of rootNodes) {
    const x = TIER_X[node.layer] ?? 700;
    layouted.push({
      ...node,
      x,
      y: currentY,
      width: 180,
      height: 70,
    });
    currentY += 100;
  }

  for (const group of groupNodes) {
    const children = childNodes.filter(c => c.parentId === group.id);
    const cols = Math.ceil(Math.sqrt(children.length));
    const rows = Math.ceil(children.length / cols);
    const width = Math.max(cols * 220 + 80, 400);
    const height = Math.max(rows * 100 + 80, 300);
    
    const x = TIER_X[group.layer] ?? 700;
    
    layouted.push({
      ...group,
      x,
      y: currentY,
      width,
      height,
    });
    currentY += height + 40;

    let childY = 48;
    let childX = 24;
    let col = 0;

    for (const child of children) {
      layouted.push({
        ...child,
        x: childX,
        y: childY,
        width: 180,
        height: 70,
      });

      col++;
      if (col >= cols) {
        col = 0;
        childX = 24;
        childY += 90;
      } else {
        childX += 200;
      }
    }
  }

  return layouted;
}