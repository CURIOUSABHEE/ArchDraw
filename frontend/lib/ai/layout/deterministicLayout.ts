import type { ArchitectureNode, ArchitectureEdge, ReactFlowNode } from '../types';
import type { TierType, Direction } from '../domain/tiers';
import { TIER_ORDER } from '../domain/tiers';
import { ArchitectureGraph } from '../graph/ArchitectureGraph';
import { getTierTheme } from '../domain/designSystem';
import { computeLayoutMetrics, type LayoutMetrics } from './layoutConfig';

const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 70;

const TIER_X_POSITIONS: Record<Direction, Record<TierType, number>> = {
  RIGHT: {
    client: 50,
    edge: 320,
    compute: 650,
    async: 1000,
    data: 1350,
    observe: 1700,
    external: 2050,
  },
  DOWN: {
    client: 50,
    edge: 50,
    compute: 50,
    async: 50,
    data: 50,
    observe: 50,
    external: 50,
  },
  LEFT: {
    client: 2050,
    edge: 1780,
    compute: 1450,
    async: 1100,
    data: 750,
    observe: 400,
    external: 50,
  },
  UP: {
    client: 1700,
    edge: 1350,
    compute: 1000,
    async: 650,
    data: 320,
    observe: 50,
    external: 0,
  },
};

const TIER_Y_POSITIONS_DOWN: Record<TierType, number> = {
  client: 50,
  edge: 250,
  compute: 500,
  async: 750,
  data: 1000,
  observe: 1250,
  external: 1500,
};

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
  const baseVerticalSpacing = (DEFAULT_NODE_HEIGHT + 60) * spacingMultiplier;

  const nodesByTier = new Map<TierType, ArchitectureNode[]>();
  for (const node of fixedNodes) {
    if (node.isGroup) continue;
    const tier = (node.tier || node.layer) as TierType;
    if (!nodesByTier.has(tier)) {
      nodesByTier.set(tier, []);
    }
    nodesByTier.get(tier)!.push(node);
  }

  const tierMaxHeight = new Map<TierType, number>();
  for (const [tier, tierNodes] of nodesByTier) {
    const maxHeight = Math.max(
      ...tierNodes.map(n => n.height || DEFAULT_NODE_HEIGHT)
    );
    tierMaxHeight.set(tier, maxHeight);
  }

  const reactFlowNodes: ReactFlowNode[] = [];
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

export function generateELKOptionsFromMetrics(metrics: LayoutMetrics): Record<string, string> {
  const spacingMultiplier = metrics.density === 'high' ? 1.5 : metrics.density === 'medium' ? 1.2 : 1;

  const options: Record<string, string> = {
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT',
    'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
    'elk.edgeRouting': 'ORTHOGONAL',
    'elk.portConstraints': 'FIXED_SIDE',
    'elk.layered.spacing.nodeNodeBetweenLayers': String(Math.round(150 * spacingMultiplier)),
    'elk.spacing.nodeNode': String(Math.round(80 * spacingMultiplier)),
    'elk.spacing.edgeEdge': String(Math.round(30 * spacingMultiplier)),
    'elk.spacing.edgeNode': String(Math.round(60 * spacingMultiplier)),
    'elk.spacing.labelNode': '30',
    'elk.layered.spacing.edgeNodeBetweenLayers': String(Math.round(90 * spacingMultiplier)),
    'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
    'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    'elk.layered.separatingEdges.strategy': 'CENTERING',
    'elk.layered.unnecessaryBendpoints': 'false',
    'elk.layered.mergeEdges': 'false',
    'elk.edgeLabels.inline': 'false',
    'elk.edgeLabels.placement': 'CENTER',
    'elk.padding': '[top=50, left=24, bottom=24, right=24]',
  };

  if (metrics.hasAsync) {
    options['elk.layered.spacing.nodeNodeBetweenLayers'] = String(
      Math.round(200 * spacingMultiplier)
    );
  }

  return options;
}
