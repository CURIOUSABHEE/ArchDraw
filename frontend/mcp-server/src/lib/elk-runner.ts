import type { ArchitectureNode, ArchitectureEdge, ReactFlowNode, ReactFlowEdge, TierType } from '../types/index.js';
import type { ElkNode as LocalElkNode, ElkEdge as LocalElkEdge } from '../types/index.js';
import type { ElkNode as ElkApiNode } from 'elkjs/lib/elk-api.js';

export interface LayoutOptions {
  direction?: 'RIGHT' | 'DOWN' | 'LEFT' | 'UP';
  spacingMultiplier?: number;
}

export interface LayoutResult {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
  elkPositions: Array<{ id: string; x: number; y: number; width: number; height: number }>;
}

const TIER_X_POSITIONS: Record<string, Record<TierType, number>> = {
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

const TIER_ORDER: TierType[] = [
  'client',
  'edge',
  'compute',
  'async',
  'data',
  'observe',
  'external',
];

const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 70;

export function generateELKOptions(direction: string = 'RIGHT', density: 'low' | 'medium' | 'high' = 'medium', hasAsync: boolean = false): Record<string, string> {
  const spacingMultiplier = density === 'high' ? 1.5 : density === 'medium' ? 1.2 : 1;

  const options: Record<string, string> = {
    'elk.algorithm': 'layered',
    'elk.direction': direction,
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
    'elk.layered.crossingMinimization.forceNodeModelOrder': 'false',
    'elk.layered.separatingEdges.strategy': 'CENTERING',
    'elk.layered.unnecessaryBendpoints': 'false',
    'elk.layered.mergeEdges': 'false',
    'elk.edgeLabels.inline': 'false',
    'elk.edgeLabels.placement': 'CENTER',
    'elk.padding': '[top=50, left=24, bottom=24, right=24]',
  };

  if (hasAsync) {
    options['elk.layered.spacing.nodeNodeBetweenLayers'] = String(
      Math.round(200 * spacingMultiplier)
    );
  }

  return options;
}

export function computeDensity(nodes: ArchitectureNode[], _edges: ArchitectureEdge[]): 'low' | 'medium' | 'high' {
  const maxNodesPerTier = Math.max(
    ...TIER_ORDER.map(tier => 
      nodes.filter(n => (n.tier || n.layer) === tier && !n.isGroup).length
    ),
    0
  );
  
  return maxNodesPerTier > 6 ? 'high' : maxNodesPerTier > 3 ? 'medium' : 'low';
}

export function hasAsyncNodes(nodes: ArchitectureNode[]): boolean {
  return nodes.some(n => (n.tier || n.layer) === 'async' && !n.isGroup);
}

export function nodesToElkFormat(nodes: ArchitectureNode[]): LocalElkNode[] {
  return nodes.map(node => ({
    id: node.id,
    width: node.width || DEFAULT_NODE_WIDTH,
    height: node.height || DEFAULT_NODE_HEIGHT,
    layoutOptions: {
      'elk.nodeLabels.placement': 'INSIDE',
      'elk.portConstraints': 'FIXED_SIDE',
    },
  }));
}

export function edgesToElkFormat(edges: ArchitectureEdge[]): LocalElkEdge[] {
  return edges.map(edge => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }));
}

export async function runELKLayout(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[],
  options: LayoutOptions = {}
): Promise<LayoutResult> {
  const direction = options.direction || 'RIGHT';
  const density = computeDensity(nodes, edges);
  const hasAsync = hasAsyncNodes(nodes);
  const elkOptions = generateELKOptions(direction, density, hasAsync);

  const elkNodes = nodesToElkFormat(nodes);
  const elkEdges = edgesToElkFormat(edges);

  try {
    const elkModule = await import('elkjs/lib/elk.bundled.js');
    const elk = new (elkModule.default as unknown as { new(): { layout(graph: object): Promise<ElkApiNode> } })();
    const layout = await elk.layout({
      id: 'root',
      layoutOptions: elkOptions,
      children: elkNodes,
      edges: elkEdges,
    });

    const nodeMap = new Map<string, { x: number; y: number; width: number; height: number }>();
    
    if (layout.children) {
      for (const node of layout.children) {
        if (node.x !== undefined && node.y !== undefined) {
          nodeMap.set(node.id, {
            x: node.x,
            y: node.y,
            width: node.width || DEFAULT_NODE_WIDTH,
            height: node.height || DEFAULT_NODE_HEIGHT,
          });
        }
      }
    }

    const reactFlowNodes: ReactFlowNode[] = nodes.map(node => {
      const pos = nodeMap.get(node.id);
      const width = node.width || DEFAULT_NODE_WIDTH;
      const height = node.height || DEFAULT_NODE_HEIGHT;

      return {
        id: node.id,
        type: node.isGroup ? 'group' : 'systemNode',
        position: {
          x: pos?.x ?? 400,
          y: pos?.y ?? 200,
        },
        data: {
          label: node.label,
          icon: node.icon || 'box',
          layer: node.layer,
          tier: node.tier,
          tierColor: node.tierColor,
          subtitle: node.subtitle,
          serviceType: node.serviceType,
          isGroup: node.isGroup,
          parentId: node.parentId,
          groupLabel: node.groupLabel,
          groupColor: node.groupColor,
        },
        width: pos?.width ?? width,
        height: pos?.height ?? height,
        zIndex: node.isGroup ? 0 : 1,
      };
    });

    const reactFlowEdges: ReactFlowEdge[] = edges.map(edge => {
      const commType = edge.communicationType || 'sync';
      const commColors: Record<string, { color: string; dash: string; animated: boolean }> = {
        sync: { color: '#6366f1', dash: '', animated: false },
        async: { color: '#f59e0b', dash: '8,4', animated: true },
        stream: { color: '#10b981', dash: '4,2', animated: true },
        event: { color: '#ec4899', dash: '2,3', animated: true },
        dep: { color: '#94a3b8', dash: '6,6', animated: true },
      };
      const commStyle = commColors[commType] || commColors.sync;

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || 'right',
        targetHandle: edge.targetHandle || 'left',
        type: edge.pathType || 'smooth',
        animated: commStyle.animated,
        label: edge.label || '',
        labelShowBg: true,
        labelBgPadding: [8, 4] as [number, number],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: '#1e1e2e', fillOpacity: 0.9 },
        labelStyle: { fontSize: 10, fontWeight: 600, fill: '#e2e8f0' },
        style: {
          stroke: commStyle.color,
          strokeWidth: 2,
          strokeDasharray: commStyle.dash,
        },
        markerEnd: { type: 'arrowclosed', color: commStyle.color },
        data: {
          communicationType: commType as 'sync' | 'async' | 'stream' | 'event' | 'dep',
          pathType: edge.pathType || 'smooth',
          label: edge.label || '',
        },
      };
    });

    const elkPositions = Array.from(nodeMap.entries()).map(([id, pos]) => ({
      id,
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
    }));

    return {
      nodes: reactFlowNodes,
      edges: reactFlowEdges,
      elkPositions,
    };
  } catch (error) {
    console.error('[ELK Runner] Layout computation failed:', error);
    return runFallbackLayout(nodes, edges, options);
  }
}

export function runFallbackLayout(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[],
  options: LayoutOptions = {}
): LayoutResult {
  const direction = options.direction || 'RIGHT';
  const spacingMultiplier = options.spacingMultiplier || 1;
  const tierXPositions = TIER_X_POSITIONS[direction];
  const baseVerticalSpacing = (DEFAULT_NODE_HEIGHT + 60) * spacingMultiplier;

  const nodesByTier = new Map<TierType, ArchitectureNode[]>();
  for (const node of nodes) {
    if (node.isGroup) continue;
    const tier = (node.tier || node.layer) as TierType;
    if (!nodesByTier.has(tier)) {
      nodesByTier.set(tier, []);
    }
    nodesByTier.get(tier)!.push(node);
  }

  const tierStartY = new Map<TierType, number>();
  const canvasHeight = 800;

  if (direction === 'DOWN') {
    let currentY = 50;
    for (const tier of TIER_ORDER) {
      tierStartY.set(tier, currentY);
      const tierNodes = nodesByTier.get(tier) || [];
      if (tierNodes.length > 0) {
        currentY += TIER_Y_POSITIONS_DOWN[tier] + tierNodes.length * baseVerticalSpacing;
      }
    }
  } else {
    for (const tier of TIER_ORDER) {
      const tierNodes = nodesByTier.get(tier) || [];
      if (tierNodes.length === 0) {
        tierStartY.set(tier, 50);
        continue;
      }
      const totalHeight = tierNodes.length * baseVerticalSpacing - 60;
      const startY = Math.max(50, (canvasHeight - totalHeight) / 2);
      tierStartY.set(tier, startY);
    }
  }

  const reactFlowNodes: ReactFlowNode[] = [];
  const elkPositions: Array<{ id: string; x: number; y: number; width: number; height: number }> = [];

  for (const node of nodes) {
    if (node.isGroup) continue;

    const tier = (node.tier || node.layer) as TierType;
    const x = tierXPositions[tier] ?? 500;
    
    const nodesInTier = nodesByTier.get(tier) || [];
    const indexInTier = nodesInTier.findIndex(n => n.id === node.id);
    
    const y = tierStartY.get(tier)! + indexInTier * baseVerticalSpacing;
    const width = node.width || DEFAULT_NODE_WIDTH;
    const height = node.height || DEFAULT_NODE_HEIGHT;

    reactFlowNodes.push({
      id: node.id,
      type: 'systemNode',
      position: { x, y },
      data: {
        label: node.label,
        icon: node.icon || 'box',
        layer: node.layer,
        tier: node.tier,
        tierColor: node.tierColor,
        subtitle: node.subtitle,
        serviceType: node.serviceType,
      },
      width,
      height,
      zIndex: 1,
    });

    elkPositions.push({ id: node.id, x, y, width, height });
  }

  const commColors: Record<string, { color: string; dash: string; animated: boolean }> = {
    sync: { color: '#6366f1', dash: '', animated: false },
    async: { color: '#f59e0b', dash: '8,4', animated: true },
    stream: { color: '#10b981', dash: '4,2', animated: true },
    event: { color: '#ec4899', dash: '2,3', animated: true },
    dep: { color: '#94a3b8', dash: '6,6', animated: true },
  };

  const reactFlowEdges: ReactFlowEdge[] = edges.map(edge => {
    const commType = edge.communicationType || 'sync';
    const commStyle = commColors[commType] || commColors.sync;

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || 'right',
      targetHandle: edge.targetHandle || 'left',
      type: edge.pathType || 'smooth',
      animated: commStyle.animated,
      label: edge.label || '',
      labelShowBg: true,
      labelBgPadding: [8, 4] as [number, number],
      labelBgBorderRadius: 4,
      labelBgStyle: { fill: '#1e1e2e', fillOpacity: 0.9 },
      labelStyle: { fontSize: 10, fontWeight: 600, fill: '#e2e8f0' },
      style: {
        stroke: commStyle.color,
        strokeWidth: 2,
        strokeDasharray: commStyle.dash,
      },
      markerEnd: { type: 'arrowclosed', color: commStyle.color },
      data: {
        communicationType: commType as 'sync' | 'async' | 'stream' | 'event' | 'dep',
        pathType: edge.pathType || 'smooth',
        label: edge.label || '',
      },
    };
  });

  return {
    nodes: reactFlowNodes,
    edges: reactFlowEdges,
    elkPositions,
  };
}
