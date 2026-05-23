import type { TierType } from '../domain/tiers';
import type { ArchitectureNode, ArchitectureEdge } from '../types';
import type { Direction } from '../domain/tiers';

export interface LayoutConfig {
  direction: Direction;
  elkOptions: Record<string, string>;
  tierOrder: TierType[];
}

export interface LayoutMetrics {
  nodeCount: number;
  edgeCount: number;
  tiers: Set<TierType>;
  maxNodesPerTier: number;
  hasAsync: boolean;
  density: 'low' | 'medium' | 'high';
}

const SPACING = {
  nodeNode: 80,
  nodeNodeBetweenLayers: 120,
  edgeNode: 40,
  edgeEdge: 20,
  labelNode: 50,
} as const;

const MIN_NODE_WIDTH = 220;
const MAX_NODE_WIDTH = 220;
const MIN_NODE_HEIGHT = 72;
const MAX_NODE_HEIGHT = 72;

// Consistent spacing constants for layout
export const LAYOUT_SPACING = {
  NODE_SPACING_X: 80,
  NODE_SPACING_Y: 80,
  TIER_SPACING_Y: 120,
  CANVAS_PADDING_X: 80,
  CANVAS_PADDING_Y: 80,
  NODE_WIDTH: 220,
  NODE_HEIGHT: 72,
} as const;

const BASE_FONT_SIZE = 14;
const SUBTITLE_FONT_SIZE = 11;
const CHAR_WIDTH_RATIO = 7.5;
const LINE_HEIGHT = 1.4;
const PADDING_H = 24;
const PADDING_V = 16;

export function computeNodeSize(label: string, subtitle?: string): { width: number; height: number } {
  return { width: 220, height: 72 };
}

export function computeLayoutMetrics(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): LayoutMetrics {
  const tierCounts = new Map<TierType, number>();
  
  for (const node of nodes) {
    if (node.isGroup) continue;
    const tier = (node.tier || node.layer) as TierType;
    if (tier && tier !== 'external') {
      tierCounts.set(tier, (tierCounts.get(tier) || 0) + 1);
    }
  }
  
  const maxNodesPerTier = Math.max(...tierCounts.values(), 0);
  const density = maxNodesPerTier > 6 ? 'high' : maxNodesPerTier > 3 ? 'medium' : 'low';
  
  return {
    nodeCount: nodes.filter(n => !n.isGroup).length,
    edgeCount: edges.length,
    tiers: new Set(tierCounts.keys()),
    maxNodesPerTier,
    hasAsync: tierCounts.has('async'),
    density,
  };
}

export function generateELKOptions(metrics: LayoutMetrics): Record<string, string> {
  const options: Record<string, string> = {
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT',
    'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
    'elk.edgeRouting': 'ORTHOGONAL',
    'elk.portConstraints': 'FIXED_SIDE',
    'elk.layered.spacing.nodeNodeBetweenLayers': '120',
    'elk.spacing.nodeNode': '80',
    'elk.spacing.edgeEdge': '20',
    'elk.spacing.edgeNode': '40',
    'elk.spacing.labelNode': '50',
    'elk.layered.spacing.edgeNodeBetweenLayers': '40',
    'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
    'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    'elk.layered.crossingMinimization.forceNodeModelOrder': 'false',
    'elk.layered.separatingEdges.strategy': 'CENTERING',
    'elk.layered.unnecessaryBendpoints': 'true',
    'elk.layered.mergeEdges': 'false',
    'elk.layered.wrapping.multiEdge.improveCuts': 'true',
    'elk.layered.spacing.edgeEdgeBetweenLayers': '20',
    'elk.edgeLabels.inline': 'false',
    'elk.edgeLabels.placement': 'CENTER',
    'elk.padding': '[top=80, left=80, bottom=80, right=80]',
  };
  
  return options;
}

export function generateLayoutConfig(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[],
  direction: Direction = 'RIGHT'
): LayoutConfig {
  const metrics = computeLayoutMetrics(nodes, edges);
  const elkOptions = generateELKOptions(metrics);
  
  return {
    direction,
    elkOptions,
    tierOrder: ['client', 'edge', 'compute', 'async', 'data', 'infrastructure', 'observe', 'external'],
  };
}

export function getTierXPosition(tier: TierType, direction: Direction): number {
  const positions: Record<Direction, Record<TierType, number>> = {
    RIGHT: {
      client: 50,
      edge: 320,
      compute: 650,
      async: 1000,
      data: 1350,
      infrastructure: 1700,
      observe: 2050,
      external: 2400,
    },
    DOWN: {
      client: 50,
      edge: 50,
      compute: 50,
      async: 50,
      data: 50,
      infrastructure: 50,
      observe: 50,
      external: 50,
    },
    LEFT: {
      client: 2400,
      edge: 2130,
      compute: 1800,
      async: 1450,
      data: 1100,
      infrastructure: 750,
      observe: 400,
      external: 50,
    },
    UP: {
      client: 2050,
      edge: 1700,
      compute: 1350,
      async: 1000,
      data: 650,
      infrastructure: 320,
      observe: 50,
      external: 0,
    },
  };
  
  return positions[direction][tier];
}

export function getTierYPosition(
  tier: TierType,
  nodeIndex: number,
  totalInTier: number,
  direction: Direction,
  nodeHeight: number
): number {
  const spacing = nodeHeight + LAYOUT_SPACING.NODE_SPACING_Y;
  const totalHeight = totalInTier * spacing - LAYOUT_SPACING.NODE_SPACING_Y;
  const canvasHeight = 800;
  const startY = Math.max(LAYOUT_SPACING.CANVAS_PADDING_Y, (canvasHeight - totalHeight) / 2);
  
  if (direction === 'DOWN') {
    const tierYPositions: Record<TierType, number> = {
      client: 50,
      edge: 200,
      compute: 450,
      async: 700,
      data: 950,
      infrastructure: 1200,
      observe: 1450,
      external: 1700,
    };
    return tierYPositions[tier] + nodeIndex * spacing;
  }
  
  return startY + nodeIndex * spacing;
}
