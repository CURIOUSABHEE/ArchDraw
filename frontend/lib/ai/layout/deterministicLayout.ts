import type { ArchitectureNode, ArchitectureEdge, ReactFlowNode } from '../types';
import type { TierType, Direction } from '../domain/tiers';
import { TIER_ORDER } from '../domain/tiers';
import { ArchitectureGraph } from '../graph/ArchitectureGraph';
import { getTierTheme } from '../domain/designSystem';
import { computeLayoutMetrics, type LayoutMetrics, LAYOUT_SPACING } from './layoutConfig';

const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 70;

const SPACING_X = LAYOUT_SPACING.NODE_SPACING_X;  // 20px
const SPACING_Y = LAYOUT_SPACING.NODE_SPACING_Y;  // 20px
const TIER_SPACING = LAYOUT_SPACING.TIER_SPACING_Y;  // 200px

const TIER_X_POSITIONS: Record<Direction, Record<TierType, number>> = {
  RIGHT: {
    client: 40,
    edge: 280,
    compute: 520,
    async: 760,
    data: 1000,
    observe: 1240,
    external: 1480,
  },
  DOWN: {
    client: 40,
    edge: 40,
    compute: 40,
    async: 40,
    data: 40,
    observe: 40,
    external: 40,
  },
  LEFT: {
    client: 1480,
    edge: 1240,
    compute: 1000,
    async: 760,
    data: 520,
    observe: 280,
    external: 40,
  },
  UP: {
    client: 1240,
    edge: 1000,
    compute: 760,
    async: 520,
    data: 280,
    observe: 40,
    external: 0,
  },
};

const TIER_Y_POSITIONS_DOWN: Record<TierType, number> = {
  client: 40,
  edge: 180,
  compute: 360,
  async: 540,
  data: 720,
  observe: 900,
  external: 1080,
};

const TIER_X_SPACING = DEFAULT_NODE_WIDTH + SPACING_X;

function nodesOverlap(
  n1: { position: { x: number; y: number }; width?: number; height?: number },
  n2: { position: { x: number; y: number }; width?: number; height?: number },
  minSpacing: number = 20
): boolean {
  const w1 = n1.width || DEFAULT_NODE_WIDTH;
  const h1 = n1.height || DEFAULT_NODE_HEIGHT;
  const w2 = n2.width || DEFAULT_NODE_WIDTH;
  const h2 = n2.height || DEFAULT_NODE_HEIGHT;
  
  const n1Left = n1.position.x;
  const n1Right = n1Left + w1 + minSpacing;
  const n1Top = n1.position.y;
  const n1Bottom = n1Top + h1 + minSpacing;
  
  const n2Left = n2.position.x;
  const n2Right = n2Left + w2 + minSpacing;
  const n2Top = n2.position.y;
  const n2Bottom = n2Top + h2 + minSpacing;
  
  const separated = 
    n1Right <= n2Left ||
    n1Left >= n2Right ||
    n1Bottom <= n2Top ||
    n1Top >= n2Bottom;
  
  return !separated;
}

export function resolveNodeCollisions(
  nodes: ReactFlowNode[]
): ReactFlowNode[] {
  const fixed = [...nodes];
  let changed = true;
  let iterations = 0;
  const maxIterations = 50;
  
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    
    for (let i = 0; i < fixed.length; i++) {
      for (let j = i + 1; j < fixed.length; j++) {
        if (nodesOverlap(fixed[i], fixed[j], SPACING_Y)) {
          const n1 = fixed[i];
          const n2 = fixed[j];
          const h1 = n1.height || DEFAULT_NODE_HEIGHT;
          
          fixed[j] = {
            ...n2,
            position: {
              x: n2.position.x,
              y: Math.max(n2.position.y, n1.position.y + h1 + SPACING_Y),
            },
          };
          changed = true;
        }
      }
    }
  }
  
  return fixed;
}

function calculateTierPositions(
  nodes: ArchitectureNode[],
  direction: Direction
): Map<TierType, { x: number; startY: number }> {
  const positions = new Map<TierType, { x: number; startY: number }>();
  
  const tierXPositions = TIER_X_POSITIONS[direction];
  const baseVerticalSpacing = DEFAULT_NODE_HEIGHT + SPACING_Y;
  
  const nodesByTier = new Map<TierType, ArchitectureNode[]>();
  for (const node of nodes) {
    if (node.isGroup) continue;
    const tier = (node.tier || node.layer) as TierType;
    if (!nodesByTier.has(tier)) {
      nodesByTier.set(tier, []);
    }
    nodesByTier.get(tier)!.push(node);
  }
  
  let currentY = LAYOUT_SPACING.CANVAS_PADDING_Y;
  
for (const tier of TIER_ORDER) {
      const tierNodes = nodesByTier.get(tier) || [];
      
      let startY: number = currentY;
      if (direction !== 'DOWN') {
        if (tierNodes.length > 0) {
          const totalHeight = tierNodes.length * baseVerticalSpacing - SPACING_Y;
          const calculatedY = (800 - totalHeight) / 2;
          startY = calculatedY > 40 ? calculatedY : 40;
        } else {
          startY = 40;
        }
      }
      
      const x = tierXPositions[tier] ?? 500;
      positions.set(tier, { x, startY });
      
      if (tierNodes.length > 0) {
        currentY = startY + tierNodes.length * baseVerticalSpacing + TIER_SPACING;
      }
    }
  
  return positions;
}

export interface DeterministicLayoutResult {
  nodes: ReactFlowNode[];
  edges: ArchitectureEdge[];
  graph: ArchitectureGraph;
  metrics: LayoutMetrics;
}

export function runDeterministicLayout(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[],
  options: {
    direction?: Direction;
    spacingMultiplier?: number;
  } = {}
): DeterministicLayoutResult {
  const direction = options.direction || 'RIGHT';
  const spacingMultiplier = options.spacingMultiplier || 1;
  
  const graph = ArchitectureGraph.fromArrays(nodes, edges);
  
  graph.pruneExcessEdges();
  graph.ensureMinConnections();
  
  const fixedEdges = graph.getAllEdges();
  const fixedNodes = graph.getAllNodes();
  
  const metrics = computeLayoutMetrics(fixedNodes, fixedEdges);
  
  const tierXPositions = TIER_X_POSITIONS[direction];
  const baseVerticalSpacing = DEFAULT_NODE_HEIGHT + SPACING_Y;
  
  const nodesByTier = new Map<TierType, ArchitectureNode[]>();
  for (const node of fixedNodes) {
    if (node.isGroup) continue;
    const tier = (node.tier || node.layer) as TierType;
    if (!nodesByTier.has(tier)) {
      nodesByTier.set(tier, []);
    }
    nodesByTier.get(tier)!.push(node);
  }
  
  const tierStartY = new Map<TierType, number>();
  
  if (direction === 'DOWN') {
    let currentY = 50;
    for (const tier of TIER_ORDER) {
      tierStartY.set(tier, currentY);
      const nodes = nodesByTier.get(tier) || [];
      if (nodes.length > 0) {
        currentY += TIER_Y_POSITIONS_DOWN[tier] + nodes.length * baseVerticalSpacing;
      }
    }
  } else {
    const canvasHeight = 800;
    for (const tier of TIER_ORDER) {
      const nodes = nodesByTier.get(tier) || [];
      if (nodes.length === 0) {
        tierStartY.set(tier, 50);
        continue;
      }
      const totalHeight = nodes.length * baseVerticalSpacing - 60;
      const startY = Math.max(50, (canvasHeight - totalHeight) / 2);
      tierStartY.set(tier, startY);
    }
  }
  
  const reactFlowNodes: ReactFlowNode[] = [];
  
  for (const node of fixedNodes) {
    if (node.isGroup) continue;
  
    const tier = (node.tier || node.layer) as TierType;
    const x = tierXPositions[tier] ?? 500;
    
    const nodesInTier = nodesByTier.get(tier) || [];
    const indexInTier = nodesInTier.findIndex(n => n.id === node.id);
    
    let y: number;
    if (direction === 'DOWN') {
      y = tierStartY.get(tier)! + indexInTier * baseVerticalSpacing;
    } else {
      y = tierStartY.get(tier)! + indexInTier * baseVerticalSpacing;
    }
  
    const theme = getTierTheme(tier);
  
    const reactFlowNode: ReactFlowNode = {
      id: node.id,
      type: 'systemNode',
      position: { x, y },
      data: {
        label: node.label,
        icon: node.icon || 'box',
        layer: node.layer,
        tier: node.tier,
        tierColor: node.tierColor || theme.colors.primary,
        subtitle: node.subtitle,
        serviceType: node.serviceType,
        groupLabel: node.groupLabel,
        groupColor: node.groupColor,
        isGroup: node.isGroup,
        parentId: node.parentId,
      },
      width: node.width || DEFAULT_NODE_WIDTH,
      height: node.height || DEFAULT_NODE_HEIGHT,
      measured: {
        width: node.width || DEFAULT_NODE_WIDTH,
        height: node.height || DEFAULT_NODE_HEIGHT,
      },
      zIndex: 1,
    };
  
    reactFlowNodes.push(reactFlowNode);
  }
  
  for (const node of fixedNodes) {
    if (!node.isGroup) continue;
  
    const children = fixedNodes.filter(n => n.parentId === node.id);
    if (children.length === 0) continue;
  
    const childReactNodes = reactFlowNodes.filter(n => 
      children.some(c => c.id === n.id)
    );
  
    if (childReactNodes.length === 0) continue;
  
    const minX = Math.min(...childReactNodes.map(n => n.position.x));
    const maxX = Math.max(...childReactNodes.map(n => n.position.x + (n.width || DEFAULT_NODE_WIDTH)));
    const minY = Math.min(...childReactNodes.map(n => n.position.y));
    const maxY = Math.max(...childReactNodes.map(n => n.position.y + (n.height || DEFAULT_NODE_HEIGHT)));
  
    const groupWidth = maxX - minX + 60;
    const groupHeight = maxY - minY + 60;
  
    reactFlowNodes.push({
      id: node.id,
      type: 'group',
      position: { x: minX - 30, y: minY - 30 },
      data: {
        label: node.label,
        icon: node.icon || 'box',
        layer: node.layer,
        tier: node.tier,
        tierColor: node.groupColor || node.tierColor,
        groupLabel: node.groupLabel,
        groupColor: node.groupColor,
        isGroup: true,
      },
      width: groupWidth,
      height: groupHeight,
      zIndex: 0,
      style: {
        width: groupWidth,
        height: groupHeight,
      },
    });
  
    for (const child of childReactNodes) {
      const idx = reactFlowNodes.findIndex(n => n.id === child.id);
      if (idx >= 0) {
        reactFlowNodes[idx].extent = 'parent';
        reactFlowNodes[idx].data.parentId = node.id;
        reactFlowNodes[idx].zIndex = 1;
      }
    }
  }
  
  return {
    nodes: reactFlowNodes,
    edges: fixedEdges,
    graph,
    metrics,
  };
}

export function verifySpacing(nodes: ReactFlowNode[]): {
  violations: Array<{ node1: string; node2: string; gap: number }>;
  averageGap: number;
} {
  const violations: Array<{ node1: string; node2: string; gap: number }> = [];
  const gaps: number[] = [];
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const n1 = nodes[i];
      const n2 = nodes[j];
      
      const w1 = n1.width || DEFAULT_NODE_WIDTH;
      const h1 = n1.height || DEFAULT_NODE_HEIGHT;
      
      const horizontalGap = n2.position.x - (n1.position.x + w1);
      const verticalGap = n2.position.y - (n1.position.y + h1);
      
      if (Math.abs(horizontalGap) < 100 && horizontalGap > 0) {
        gaps.push(horizontalGap);
        if (horizontalGap < SPACING_X) {
          violations.push({ node1: n1.data.label, node2: n2.data.label, gap: horizontalGap });
        }
      }
      
      if (Math.abs(verticalGap) < 100 && verticalGap > 0) {
        gaps.push(verticalGap);
        if (verticalGap < SPACING_Y) {
          violations.push({ node1: n1.data.label, node2: n2.data.label, gap: verticalGap });
        }
      }
    }
  }
  
  const averageGap = gaps.length > 0 
    ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) 
    : 0;
  
  return { violations, averageGap };
}

export function generateELKOptionsFromMetrics(metrics: LayoutMetrics): Record<string, string> {
  const multiplier = metrics.density === 'high' ? 1.5 : metrics.density === 'medium' ? 1.2 : 1;
  
  const options: Record<string, string> = {
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT',
    'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
    'elk.edgeRouting': 'ORTHOGONAL',
    'elk.portConstraints': 'FIXED_SIDE',
    'elk.layered.spacing.nodeNodeBetweenLayers': String(Math.round(TIER_SPACING * multiplier)),
    'elk.spacing.nodeNode': String(SPACING_X),
    'elk.spacing.edgeEdge': String(SPACING_Y),
    'elk.spacing.edgeNode': String(SPACING_Y),
    'elk.spacing.labelNode': '30',
    'elk.layered.spacing.edgeNodeBetweenLayers': String(Math.round(SPACING_X * multiplier)),
    'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
    'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    'elk.layered.separatingEdges.strategy': 'CENTERING',
    'elk.layered.unnecessaryBendpoints': 'false',
    'elk.layered.mergeEdges': 'false',
    'elk.edgeLabels.inline': 'false',
    'elk.edgeLabels.placement': 'CENTER',
    'elk.padding': '[top=40, left=40, bottom=40, right=40]',
  };
  
  if (metrics.hasAsync) {
    options['elk.layered.spacing.nodeNodeBetweenLayers'] = String(
      Math.round(TIER_SPACING * 1.8)
    );
  }
  
  return options;
}