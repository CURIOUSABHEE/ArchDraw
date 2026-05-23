import dagre from 'dagre';
import type { LayoutedNode, ValidatedDiagram, RawNode } from './types';
import { resolveNodeCollisions } from '@/lib/collision';

/**
 * STAGE 6 — LAYOUT ENGINE
 * 
 * Mandates from GEMINI.md:
 * 1. Use Dagre for layered layout (rankdir=LR)
 * 2. Adaptive node sizing (no truncation)
 * 3. Min rank separation: 120px
 * 4. Min node separation: 60px
 * 5. Collision detection pass
 */

const MIN_NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const CHAR_WIDTH = 8.5; // Estimated width per character at 14px bold
const PADDING_X = 80; // 40px on each side
const PADDING_Y = 40; // 20px on each side

const RANK_SEPARATION = 220;
const NODE_SEPARATION = 130;

const SUBTITLE_CHAR_WIDTH = 6.5; // 11px font for subtitles

/**
 * Calculate required node width based on label and subtitle
 */
function calculateNodeDimensions(node: RawNode): { width: number; height: number } {
  const labelLen = node.label.length;
  const subtitleLen = node.subtitle?.length || 0;
  
  const labelWidth = (labelLen * CHAR_WIDTH) + PADDING_X;
  const subtitleWidth = (subtitleLen * SUBTITLE_CHAR_WIDTH) + PADDING_X;
  
  const calculatedWidth = Math.max(labelWidth, subtitleWidth);
  const width = Math.max(MIN_NODE_WIDTH, calculatedWidth);
  
  // Height adapts if there is a subtitle
  const height = node.subtitle ? NODE_HEIGHT + 20 : NODE_HEIGHT;
  
  return { width, height };
}

export async function applyLayout(validated: ValidatedDiagram): Promise<LayoutedNode[]> {
  const { nodes, edges } = validated;
  console.log(`[Layout] Processing ${nodes.length} nodes, ${edges.length} edges using Dagre`);

  // Dynamic layout direction based on aspect ratio/tier structure
  const layerCounts: Record<string, number> = {};
  nodes.forEach(node => {
    const layer = node.layer || 'application';
    layerCounts[layer] = (layerCounts[layer] || 0) + 1;
  });
  const activeLayers = Object.keys(layerCounts).length;
  const maxNodesPerLayer = Math.max(...Object.values(layerCounts), 0);
  
  // Use 'LR' (Left-to-Right) to ensure that nodes within the same layer (e.g. services) are always stacked vertically.
  const rankdir = 'LR';
  console.log(`[Layout] Rankdir: ${rankdir} (activeLayers: ${activeLayers}, maxNodesPerLayer: ${maxNodesPerLayer}, total nodes: ${nodes.length})`);

  // Check if there are any edges connecting nodes in the same layer (vertical edges)
  // If so, we need more vertical space so the edges and their labels don't look cramped
  const hasVerticalEdges = edges.some(edge => {
    const src = nodes.find(n => n.id === edge.source);
    const tgt = nodes.find(n => n.id === edge.target);
    return src && tgt && src.layer === tgt.layer;
  });

  const edgePressure = Math.max(0, edges.length - nodes.length);
  const dynamicNodeSep = Math.max(
    hasVerticalEdges ? 190 : NODE_SEPARATION,
    NODE_SEPARATION + edgePressure * 8
  );

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir,
    ranksep: RANK_SEPARATION,
    nodesep: dynamicNodeSep,
    marginx: 160,
    marginy: 140,
  });

  // 1. Add nodes with adaptive sizes
  const nodeDimensions = new Map<string, { width: number; height: number }>();
  
  nodes.forEach((node) => {
    const { width, height } = calculateNodeDimensions(node);
    nodeDimensions.set(node.id, { width, height });
    
    dagreGraph.setNode(node.id, { width, height });
  });

  // 2. Add edges
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // 3. Execute Dagre layout
  try {
    dagre.layout(dagreGraph);
  } catch (e) {
    console.error('[Layout] Dagre failed, falling back to basic layout:', e);
    return fallbackLayout(nodes);
  }

  // 4. Map positions back and create LayoutedNodes
  const layoutedNodes: LayoutedNode[] = nodes.map((node) => {
    const dagreNode = dagreGraph.node(node.id);
    const { width, height } = nodeDimensions.get(node.id)!;
    
    return {
      ...node,
      x: dagreNode.x - width / 2,
      y: dagreNode.y - height / 2,
      width,
      height,
    };
  });

  // 5. Final collision resolution pass (as mandated by GEMINI.md)
  // Convert to Node format for collision resolver
  const rfNodes = layoutedNodes.map(ln => ({
    id: ln.id,
    position: { x: ln.x, y: ln.y },
    width: ln.width,
    height: ln.height,
    data: ln
  })) as any[];

  const resolvedRfNodes = resolveNodeCollisions(rfNodes, 40);

  // Map back to LayoutedNode
  return layoutedNodes.map(ln => {
    const resolved = resolvedRfNodes.find(rn => rn.id === ln.id);
    if (resolved) {
      return {
        ...ln,
        x: resolved.position.x,
        y: resolved.position.y
      };
    }
    return ln;
  });
}

function fallbackLayout(nodes: RawNode[]): LayoutedNode[] {
  return nodes.map((node, idx) => ({
    ...node,
    x: 100 + (idx % 3) * 250,
    y: 100 + Math.floor(idx / 3) * 150,
    width: MIN_NODE_WIDTH,
    height: NODE_HEIGHT,
  }));
}
