import ELK from 'elkjs/lib/elk.bundled.js';
import type { LayoutedNode, ValidatedDiagram } from './types';

const elk = new ELK();

// Node dimensions
const NODE_WIDTH = 180;
const NODE_HEIGHT = 70;
const MIN_PADDING = 10;
const MIN_SPACING = 20;

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
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  children?: ELKNode[];
  edges?: ELKEdge[];
  layoutOptions?: Record<string, string>;
}

export async function applyLayout(validated: ValidatedDiagram): Promise<LayoutedNode[]> {
  const { nodes } = validated;

  const groupNodes = nodes.filter(n => n.isGroup === true);
  const childNodes = nodes.filter(n => n.parentId && n.isGroup !== true);
  const rootNodes = nodes.filter(n => !n.parentId && n.isGroup !== true);

  const elkGraph: ELKGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '40',
      'elk.layered.spacing.nodeNodeBetweenLayers': '100',
      'elk.padding': '[top=60,left=60,bottom=60,right=60]',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.layered.unnecessaryBendpoints': 'true',
    },
    children: [
      ...rootNodes.map(n => ({
        id: n.id,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      })),
      ...groupNodes.map(group => {
        const children = childNodes.filter(c => c.parentId === group.id);
        const cols = Math.min(children.length, 2);
        const rows = Math.ceil(children.length / cols);
        const w = cols * (NODE_WIDTH + 40) + 80;
        const h = rows * (NODE_HEIGHT + 40) + 80;
        return {
          id: group.id,
          width: Math.max(w, 400),
          height: Math.max(h, 200),
          layoutOptions: {
            'elk.algorithm': 'layered',
            'elk.direction': 'DOWN',
            'elk.padding': '[top=50,left=20,bottom=20,right=20]',
            'elk.spacing.nodeNode': '30',
          },
          children: children.map(c => ({
            id: c.id,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
          })),
        };
      }),
    ],
    edges: validated.edges
      .filter(e => {
        const srcIsGroup = groupNodes.some(g => g.id === e.source);
        const tgtIsGroup = groupNodes.some(g => g.id === e.target);
        return !srcIsGroup && !tgtIsGroup;
      })
      .map(e => ({
        id: e.id,
        sources: [e.source],
        targets: [e.target],
      })),
  };

  const result = await elk.layout(elkGraph) as ELKGraph;

  const originalById = new Map(nodes.map(n => [n.id, n]));
  const outById = new Map<string, LayoutedNode>();

  for (const top of result.children ?? []) {
    const originalTop = originalById.get(top.id);
    if (!originalTop) continue;

    outById.set(top.id, {
      ...originalTop,
      x: top.x ?? 0,
      y: top.y ?? 0,
      width: top.width ?? 180,
      height: top.height ?? 70,
    });

    for (const child of top.children ?? []) {
      const originalChild = originalById.get(child.id);
      if (!originalChild) continue;

      // Child positions from ELK are already parent-relative for React Flow parentId nodes.
      outById.set(child.id, {
        ...originalChild,
        x: child.x ?? 0,
        y: child.y ?? 0,
        width: child.width ?? 180,
        height: child.height ?? 70,
      });
    }
  }

  for (const node of nodes) {
    if (outById.has(node.id)) continue;
    // Use ELK's default padding as base position for orphaned nodes
    const idx = outById.size;
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    outById.set(node.id, {
      ...node,
      x: 60 + col * (NODE_WIDTH + MIN_SPACING),
      y: 60 + row * (NODE_HEIGHT + MIN_SPACING),
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  }

  const nodeArray = Array.from(outById.values());
  resolveCollisions(nodeArray);

  return nodeArray
    .map(n => outById.get(n.id))
    .filter((n): n is LayoutedNode => Boolean(n));
}

function resolveCollisions(nodes: LayoutedNode[]): void {
  const padding = MIN_PADDING;
  const minSpacing = MIN_SPACING;
  const iters = 5;
  
  for (let iter = 0; iter < iters; iter++) {
    let moved = false;
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].isGroup === true || nodes[j].isGroup === true) continue;
        if (nodes[i].parentId !== nodes[j].parentId) continue;

        const a = nodes[i];
        const b = nodes[j];
        
        const ax1 = a.x - padding;
        const ay1 = a.y - padding;
        const ax2 = a.x + (a.width ?? NODE_WIDTH) + padding;
        const ay2 = a.y + (a.height ?? NODE_HEIGHT) + padding;
        
        const bx1 = b.x - padding;
        const by1 = b.y - padding;
        const bx2 = b.x + (b.width ?? NODE_WIDTH) + padding;
        const by2 = b.y + (b.height ?? NODE_HEIGHT) + padding;

        const overlapX = Math.min(ax2, bx2) - Math.max(ax1, bx1);
        const overlapY = Math.min(ay2, by2) - Math.max(ay1, by1);
        
        if (overlapX > 0 && overlapY > 0) {
          const dx = overlapX > overlapY ? 0 : overlapX / 2;
          const dy = overlapY >= overlapX ? 0 : overlapY / 2;
          
          if (a.x < b.x) {
            a.x -= minSpacing;
            b.x += minSpacing;
          } else {
            a.x += minSpacing;
            b.x -= minSpacing;
          }
          moved = true;
        }
        
        const gapX = Math.min(Math.abs(ax2 - bx1), Math.abs(bx2 - ax2));
        const gapY = Math.min(Math.abs(ay2 - by1), Math.abs(by2 - ay2));
        
        if (gapX < minSpacing && gapY < minSpacing) {
          const shift = minSpacing - gapX;
          if (a.x < b.x) {
            a.x -= shift / 2;
            b.x += shift / 2;
          } else {
            a.x += shift / 2;
            b.x -= shift / 2;
          }
          moved = true;
        }
      }
    }
    
    if (!moved) break;
  }
}
