import logger from '@/lib/logger';
import ELK from 'elkjs/lib/elk.bundled.js';
import type { LayoutedNode, ValidatedDiagram, RawNode } from './types';
import { resolveNodeCollisions } from '@/lib/collision';
import { snapNodesToColumns } from '@/lib/utils/columnAlignNodes';
import { ELK_CONFIG, ELK_DIRECTION_OVERRIDE } from '@/lib/config';

/**
 * STAGE 6 — LAYOUT ENGINE
 * 
 * Mandates from GEMINI.md:
 * 1. Use ELK for layered layout (direction=RIGHT)
 * 2. Adaptive node sizing (no truncation)
 * 3. Min rank separation: 120px
 * 4. Min node separation: 60px
 * 5. Collision detection pass
 * 6. Use partitioning for tier discipline
 */

const MIN_NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const CHAR_WIDTH = 8.5; // Estimated width per character at 14px bold
const PADDING_X = 40; // 20px on each side
const PADDING_Y = 40; // 20px on each side

const RANK_SEPARATION = 220;
const NODE_SEPARATION = 130;

const SUBTITLE_CHAR_WIDTH = 6.5; // 11px font for subtitles

const TIER_LAYER: Record<string, number> = {
  client: 0,
  edge: 1,
  gateway: 2,
  application: 3,
  queue: 4,
  data: 5,
  infrastructure: 5,
  observability: 6,
  external: 7,
};

// Label-pattern-based layer hints for strict column placement
const LAYER_HINTS: { pattern: RegExp; layer: number }[] = [
  { pattern: /\bclient\b|\bbrowser\b|\bmobile\b|\bspa\b|\bapp\b|\bui\b/i, layer: 0 },
  { pattern: /\brouter\b|\broutes?\b|\bdispatcher\b|\bnginx\b/i, layer: 1 },
  { pattern: /\bcontroller\b|\bhandler\b|\bendpoint\b/i, layer: 2 },
  { pattern: /\bservice\b|\bworker\b|\bprocess/i, layer: 3 },
  { pattern: /\bmodel\b|\brepository\b|\borm\b|\bentity\b|\bdomain\b/i, layer: 4 },
  { pattern: /\bcache\b|\bredis\b|\bmemcached\b/i, layer: 4 },
  { pattern: /\bobserv/i, layer: 5 },
  { pattern: /\bexternal\b|\bthird.?party\b|\bapi\b/i, layer: 5 },
];

function getLayerHint(node: RawNode): number {
  const label = node.label || '';
  for (const hint of LAYER_HINTS) {
    if (hint.pattern.test(label)) return hint.layer;
  }
  const layer = node.layer ? node.layer.toLowerCase() : 'application';
  return TIER_LAYER[layer] ?? 3;
}

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

export async function applyLayout(
  validated: ValidatedDiagram,
  diagramSize: 'small' | 'medium' | 'large' = 'medium',
  diagramType?: string
): Promise<LayoutedNode[]> {
  const { nodes, edges } = validated;
  logger.info(`[Layout] Processing ${nodes.length} nodes, ${edges.length} edges using ELK with partitioning (size: ${diagramSize})`);

  const baseNodeSep = 160;
  const layerSep = 240;

  // Check if there are any edges connecting nodes in the same layer (vertical edges)
  const hasVerticalEdges = edges.some(edge => {
    const src = nodes.find(n => n.id === edge.source);
    const tgt = nodes.find(n => n.id === edge.target);
    return src && tgt && src.layer === tgt.layer;
  });

  const edgePressure = Math.max(0, edges.length - nodes.length);
  const dynamicNodeSep = Math.max(
    hasVerticalEdges ? (baseNodeSep + 60) : baseNodeSep,
    baseNodeSep + edgePressure * 8
  );

  const elk = new ELK();
  
  // Filter out self-loops (source === target) before ELK
  const cleanEdges = edges.filter(e => e.source !== e.target);

  const elkNodes = nodes.map(node => {
    const { width, height } = calculateNodeDimensions(node);
    return {
      id: node.id,
      width,
      height,
      layoutOptions: {
        'elk.layered.layering.layerId': String(getLayerHint(node)),
      }
    };
  });

  // Push sink nodes (only incoming edges, no outgoing) to the last layer
  const sinkIds = new Set(
    nodes.map(n => n.id).filter(id => !cleanEdges.some(e => e.source === id))
  );
  for (const elkNode of elkNodes) {
    if (sinkIds.has(elkNode.id)) {
      elkNode.layoutOptions['elk.layered.layering.layerId'] = '99';
    }
  }

  const elkEdges = cleanEdges.map(edge => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target]
  }));
  
    const graph = {
    id: 'root',
    layoutOptions: {
      ...ELK_CONFIG,
      'elk.direction': diagramType && ELK_DIRECTION_OVERRIDE[diagramType] 
                       ? ELK_DIRECTION_OVERRIDE[diagramType] 
                       : ELK_CONFIG['elk.direction'],
    },
    children: elkNodes,
    edges: elkEdges
  };

  try {
    const layoutedGraph = await elk.layout(graph);
    
    if (!layoutedGraph.children) throw new Error("ELK returned no children");

    // Map positions back and create LayoutedNodes
    const layoutedNodes: LayoutedNode[] = nodes.map(node => {
      const elkNode = layoutedGraph.children!.find(n => n.id === node.id);
      if (!elkNode) throw new Error(`Node ${node.id} missing from layout`);
      
      const { width, height } = calculateNodeDimensions(node);
      return {
        ...node,
        x: elkNode.x || 0,
        y: elkNode.y || 0,
        width,
        height
      };
    });

    // Layout Refinement: Symmetrize targets when a node has multiple outgoing edges to the same tier
    try {
      for (const sourceNode of layoutedNodes) {
        // Find all outgoing edges from this node
        const outgoingEdges = edges.filter(e => e.source === sourceNode.id);
        if (outgoingEdges.length < 2) continue;

        // Find the target nodes
        const targetNodes = outgoingEdges
          .map(e => layoutedNodes.find(n => n.id === e.target))
          .filter(Boolean) as LayoutedNode[];

        if (targetNodes.length < 2) continue;

        // Group targets by tier/layer to handle only same-layer targets
        const tierGroups: Record<string, LayoutedNode[]> = {};
        for (const target of targetNodes) {
          const tier = target.layer || 'application';
          tierGroups[tier] ||= [];
          tierGroups[tier].push(target);
        }

        for (const [tier, group] of Object.entries(tierGroups)) {
          if (group.length < 2) continue;

          // Sort them by their current Y coordinates (top to bottom)
          group.sort((a, b) => a.y - b.y);

          // Find average X to align them vertically
          const avgX = group.reduce((sum, n) => sum + n.x, 0) / group.length;

          // Source center Y
          const sourceCenterY = sourceNode.y + sourceNode.height / 2;

          // Align vertically and space them symmetrically
          const spacing = 220; // Symmetrical center-to-center spacing
          const totalHeight = (group.length - 1) * spacing;
          const startY = sourceCenterY - totalHeight / 2;

          for (let i = 0; i < group.length; i++) {
            const target = group[i];
            target.x = avgX;
            target.y = (startY + i * spacing) - target.height / 2;
          }
        }
      }
    } catch (err) {
      logger.error('[Layout Refinement] Symmetrization failed:', err);
    }

    // Column alignment: snap same-column nodes to identical X
    const alignedNodes = snapNodesToColumns(
      layoutedNodes,
      n => n.x,
      (n, x) => ({ ...n, x }),
      60
    );

    // Final layout formatting
    return alignedNodes;

  } catch (e) {
    logger.error('[Layout] ELK failed, falling back to basic layout:', e);
    return fallbackLayout(nodes);
  }
}

function fallbackLayout(nodes: RawNode[]): LayoutedNode[] {
  const layerGroups: Record<string, RawNode[]> = {};
  for (const node of nodes) {
    const layer = node.layer ? node.layer.toLowerCase() : 'application';
    if (!layerGroups[layer]) layerGroups[layer] = [];
    layerGroups[layer].push(node);
  }

  // Sort layers
  const layerOrder = Object.keys(TIER_LAYER).sort((a, b) => TIER_LAYER[a] - TIER_LAYER[b]);
  
  const layouted: LayoutedNode[] = [];
  let currentX = 100;

  for (const layer of layerOrder) {
    if (!layerGroups[layer]) continue;
    let currentY = 100;
    let maxLayerWidth = 0;
    
    for (const node of layerGroups[layer]) {
      const { width, height } = calculateNodeDimensions(node);
      layouted.push({
        ...node,
        x: currentX,
        y: currentY,
        width,
        height,
      });
      currentY += height + 80;
      maxLayerWidth = Math.max(maxLayerWidth, width);
    }
    currentX += maxLayerWidth + 150;
  }
  
  // Also add any nodes that didn't match a valid layer
  const remainingNodes = nodes.filter(n => !layouted.find(l => l.id === n.id));
  let currentY = 100;
  for (const node of remainingNodes) {
    const { width, height } = calculateNodeDimensions(node);
    layouted.push({
      ...node,
      x: currentX,
      y: currentY,
      width,
      height,
    });
    currentY += height + 80;
  }

  return layouted;
}
