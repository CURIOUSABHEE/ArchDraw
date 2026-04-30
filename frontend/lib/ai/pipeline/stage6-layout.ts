import ELK from 'elkjs/lib/elk.bundled.js';
import type { LayoutedNode, ValidatedDiagram, PipelineLayer } from './types';

const elk = new ELK();

// Node dimensions
const NODE_WIDTH = 180;
const NODE_HEIGHT = 70;
const MIN_PADDING = 10;
const MIN_SPACING = 20;

const LAYER_ORDER: PipelineLayer[] = ['presentation', 'gateway', 'application', 'async', 'data', 'observability', 'external'];

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

/**
 * STAGE 6 — LAYOUT
 * 
 * Uses hierarchy-aware layout with improved handling for non-grouped nodes:
 * - Groups are optional - only used when present
 * - Non-grouped nodes flow naturally left-to-right by layer
 * - Better spacing and positioning
 * - Cleaner, more practical layouts
 * 
 * STRUCTURAL ENFORCEMENT:
 * LEFT → RIGHT FLOW: clients → entry → services → async → data
 */
export async function applyLayout(validated: ValidatedDiagram): Promise<LayoutedNode[]> {
  const { nodes, edges } = validated;

  // Separate nodes by type
  const groupNodes = nodes.filter(n => n.isGroup === true);
  const childNodes = nodes.filter(n => n.parentId && n.isGroup !== true);
  const rootNodes = nodes.filter(n => !n.parentId && n.isGroup !== true);

  console.log(`[Layout] Processing: ${groupNodes.length} groups, ${childNodes.length} children, ${rootNodes.length} roots`);

  // If no groups, use simple layer-based layout
  if (groupNodes.length === 0) {
    return applySimpleLayerLayout(nodes, edges);
  }

  // Build group lookup
  const groupById = new Map(groupNodes.map((g) => [g.id, g]));

  // Attach root nodes to appropriate groups if they exist
  const attachableRoots = rootNodes.filter((n) => {
    const targetGroupId = `${n.layer}-group`;
    return groupById.has(targetGroupId);
  });

  const normalizedChildNodes = [
    ...childNodes,
    ...attachableRoots.map((n) => ({ ...n, parentId: `${n.layer}-group` })),
  ];

  const normalizedRootNodes = rootNodes.filter((n) => {
    const targetGroupId = `${n.layer}-group`;
    return !groupById.has(targetGroupId);
  });

  // Build ELK graph with hierarchy enforcement
  const elkGraph: ELKGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '40',
      'elk.layered.spacing.nodeNodeBetweenLayers': '150',
      'elk.padding': '[top=60,left=60,bottom=60,right=60]',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.edgeRouting': 'ORTHOGONAL',
    },
    children: [
      // Root nodes first (ungrouped)
      ...normalizedRootNodes.map(n => ({
        id: n.id,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      })),

      // Group nodes with children
      ...groupNodes.map(group => {
        const children = normalizedChildNodes.filter(c => c.parentId === group.id);
        
        // Calculate group dimensions based on children
        const cols = Math.min(Math.max(children.length, 1), 3);
        const rows = Math.ceil(children.length / cols);
        const w = Math.max(cols * (NODE_WIDTH + 40) + 80, 400);
        const h = Math.max(rows * (NODE_HEIGHT + 40) + 100, 220);

        return {
          id: group.id,
          width: w,
          height: h,
          layoutOptions: {
            'elk.algorithm': 'box',
            'elk.padding': '[top=60,left=30,bottom=30,right=30]',
            'elk.spacing.nodeNode': '40',
          },
          children: children.map((c, idx) => ({
            id: c.id,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
          })),
        };
      }),
    ],

    // Edges - filter out edges involving groups
    edges: edges
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

  // Run ELK layout
  const result = await elk.layout(elkGraph) as ELKGraph;

  // Convert ELK output back to LayoutedNode[]
  const originalById = new Map(nodes.map(n => [n.id, n]));
  const outById = new Map<string, LayoutedNode>();

  // Process top-level nodes (groups and root nodes)
  for (const top of result.children ?? []) {
    const originalTop = originalById.get(top.id);
    if (!originalTop) continue;

    outById.set(top.id, {
      ...originalTop,
      x: top.x ?? 0,
      y: top.y ?? 0,
      width: top.width ?? (originalTop.isGroup ? 400 : NODE_WIDTH),
      height: top.height ?? (originalTop.isGroup ? 220 : NODE_HEIGHT),
    });

    // Process children (their positions are relative to parent)
    for (const child of top.children ?? []) {
      const originalChild = originalById.get(child.id);
      if (!originalChild) continue;

      outById.set(child.id, {
        ...originalChild,
        x: child.x ?? 0,
        y: child.y ?? 0,
        width: child.width ?? NODE_WIDTH,
        height: child.height ?? NODE_HEIGHT,
      });
    }
  }

  // Handle any nodes not processed (orphans)
  for (const node of nodes) {
    if (outById.has(node.id)) continue;

    const layerIdx = LAYER_ORDER.indexOf(node.layer as PipelineLayer);
    const col = outById.size % 4;
    const row = Math.floor(outById.size / 4);
    const xOffset = (layerIdx >= 0 ? layerIdx * 250 : 0);

    outById.set(node.id, {
      ...node,
      x: 60 + xOffset + col * (NODE_WIDTH + MIN_SPACING),
      y: 60 + row * (NODE_HEIGHT + MIN_SPACING),
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  }

  return Array.from(outById.values());
}

/**
 * Simple layer-based layout for diagrams without groups
 * Creates a clean left-to-right flow
 */
function applySimpleLayerLayout(nodes: RawNode[], edges: DiagramEdge[]): LayoutedNode[] {
  const layerGroups = new Map<PipelineLayer, RawNode[]>();

  // Group nodes by layer
  for (const node of nodes) {
    const layer = node.layer as PipelineLayer;
    if (!layerGroups.has(layer)) {
      layerGroups.set(layer, []);
    }
    layerGroups.get(layer)!.push(node);
  }

  const result: LayoutedNode[] = [];
  const LAYER_SPACING = 300;
  const NODE_SPACING_Y = 120;
  const START_X = 100;
  const START_Y = 100;

  // Position nodes layer by layer (left to right)
  LAYER_ORDER.forEach((layer, layerIdx) => {
    const nodesInLayer = layerGroups.get(layer) || [];
    const x = START_X + layerIdx * LAYER_SPACING;

    nodesInLayer.forEach((node, nodeIdx) => {
      const y = START_Y + nodeIdx * NODE_SPACING_Y;
      
      result.push({
        ...node,
        x,
        y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    });
  });

  return result;
}
