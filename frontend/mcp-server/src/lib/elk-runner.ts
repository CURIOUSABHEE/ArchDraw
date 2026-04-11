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

const TIER_X_POSITIONS_LR: Record<TierType, number> = {
  client: 50,
  edge: 400,
  compute: 750,
  async: 1200,
  data: 1550,
  external: 1900,
  observe: 2250,
};

const TIER_ORDER: TierType[] = [
  'client',
  'edge',
  'compute',
  'async',
  'data',
  'external',
  'observe',
];

const LAYER_ORDER: string[] = [
  'client',
  'edge',
  'compute',
  'async',
  'data',
  'external',
  'observe',
];

const DEFAULT_NODE_WIDTH = 220;
const DEFAULT_NODE_HEIGHT = 80;
const MIN_VERTICAL_GAP = 80;
const COLLISION_BUFFER = 20;
const MIN_CANVAS_HEIGHT = 1200;

const TIER_COLORS: Record<TierType, string> = {
  client: '#a855f7',
  edge: '#6366f1',
  compute: '#14b8a6',
  async: '#f59e0b',
  data: '#3b82f6',
  external: '#f97316',
  observe: '#6b7280',
};

const COMM_COLORS: Record<string, { color: string; dash: string; animated: boolean }> = {
  sync: { color: '#6366f1', dash: '', animated: false },
  async: { color: '#f59e0b', dash: '8,4', animated: true },
  stream: { color: '#10b981', dash: '4,2', animated: true },
  event: { color: '#ec4899', dash: '2,3', animated: true },
  dep: { color: '#94a3b8', dash: '6,6', animated: true },
};

interface PlacedNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tier: TierType;
}

function normalizeTier(layer: string): TierType {
  const normalized = layer.toLowerCase();
  if (LAYER_ORDER.includes(normalized)) {
    return normalized as TierType;
  }
  return 'compute';
}

function getNodesByTier(nodes: ArchitectureNode[]): Map<TierType, ArchitectureNode[]> {
  const nodesByTier = new Map<TierType, ArchitectureNode[]>();
  for (const tier of TIER_ORDER) {
    nodesByTier.set(tier, []);
  }
  for (const node of nodes) {
    if (node.isGroup) continue;
    const tier = normalizeTier(node.tier || node.layer);
    const tierNodes = nodesByTier.get(tier) || [];
    tierNodes.push(node);
    nodesByTier.set(tier, tierNodes);
  }
  return nodesByTier;
}

function calculateCanvasHeight(nodesByTier: Map<TierType, ArchitectureNode[]>): number {
  let maxNodesInLayer = 0;
  for (const [, tierNodes] of nodesByTier) {
    maxNodesInLayer = Math.max(maxNodesInLayer, tierNodes.length);
  }
  const requiredHeight = maxNodesInLayer * (DEFAULT_NODE_HEIGHT + MIN_VERTICAL_GAP) + 200;
  return Math.max(requiredHeight, MIN_CANVAS_HEIGHT);
}

function checkCollision(
  newNode: { x: number; y: number; width: number; height: number },
  placedNodes: PlacedNode[],
  buffer: number = COLLISION_BUFFER
): boolean {
  for (const placed of placedNodes) {
    const expanded = {
      x: placed.x - buffer,
      y: placed.y - buffer,
      width: placed.width + buffer * 2,
      height: placed.height + buffer * 2,
    };
    const overlaps = !(
      newNode.x + newNode.width <= expanded.x ||
      newNode.x >= expanded.x + expanded.width ||
      newNode.y + newNode.height <= expanded.y ||
      newNode.y >= expanded.y + expanded.height
    );
    if (overlaps) return true;
  }
  return false;
}

function findNonCollidingY(
  x: number,
  startY: number,
  width: number,
  height: number,
  placedNodes: PlacedNode[],
  canvasHeight: number
): number {
  let y = startY;
  const maxAttempts = 100;
  let attempts = 0;
  
  while (checkCollision({ x, y, width, height }, placedNodes) && attempts < maxAttempts) {
    y += MIN_VERTICAL_GAP / 2;
    if (y + height > canvasHeight - 50) {
      y = 50;
    }
    attempts++;
  }
  
  return Math.max(50, Math.min(y, canvasHeight - height - 50));
}

function distributeNodesVertically(
  nodes: ArchitectureNode[],
  startX: number,
  canvasHeight: number,
  placedNodes: PlacedNode[],
  tier: TierType
): PlacedNode[] {
  if (nodes.length === 0) return [];
  
  const nodeCount = nodes.length;
  const gap = tier === 'compute' && nodeCount > 4 ? 100 : MIN_VERTICAL_GAP;
  const totalHeight = nodeCount * DEFAULT_NODE_HEIGHT + (nodeCount - 1) * gap;
  const startY = Math.max(50, (canvasHeight - totalHeight) / 2);
  
  const placed: PlacedNode[] = [];
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const width = node.width || DEFAULT_NODE_WIDTH;
    const height = node.height || DEFAULT_NODE_HEIGHT;
    
    let y = startY + i * (height + gap);
    y = findNonCollidingY(startX, y, width, height, [...placedNodes, ...placed], canvasHeight);
    
    placed.push({
      id: node.id,
      x: startX,
      y,
      width,
      height,
      tier,
    });
  }
  
  return placed;
}

function createReactFlowEdge(
  edge: ArchitectureEdge,
  _sourceNode: PlacedNode,
  _targetNode: PlacedNode
): ReactFlowEdge {
  const commType = edge.communicationType || 'sync';
  const commStyle = COMM_COLORS[commType] || COMM_COLORS.sync;
  const pathType = edge.pathType || 'smooth';
  
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: 'right',
    targetHandle: 'left',
    type: pathType,
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
      pathType,
      label: edge.label || '',
    },
  };
}

export function generateELKOptions(_direction: string = 'RIGHT', density: 'low' | 'medium' | 'high' = 'medium'): Record<string, string> {
  const spacingMultiplier = density === 'high' ? 1.8 : density === 'medium' ? 1.5 : 1.2;
  
  const options: Record<string, string> = {
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT',
    'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
    'elk.edgeRouting': 'ORTHOGONAL',
    'elk.portConstraints': 'FIXED_SIDE',
    'elk.spacing.nodeNode': String(Math.round(150 * spacingMultiplier)),
    'elk.spacing.edgeEdge': String(Math.round(60 * spacingMultiplier)),
    'elk.spacing.edgeNode': String(Math.round(80 * spacingMultiplier)),
    'elk.spacing.labelNode': '50',
    'elk.layered.spacing.nodeNodeBetweenLayers': String(Math.round(200 * spacingMultiplier)),
    'elk.layered.spacing.edgeNodeBetweenLayers': String(Math.round(160 * spacingMultiplier)),
    'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
    'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
    'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    'elk.layered.crossingMinimization.forceNodeModelOrder': 'false',
    'elk.layered.separatingEdges.strategy': 'CENTERING',
    'elk.layered.unnecessaryBendpoints': 'true',
    'elk.layered.edgeRouting.selfLoopDistribution': 'EVEN',
    'elk.layered.mergeEdges': 'false',
    'elk.edgeLabels.inline': 'false',
    'elk.edgeLabels.placement': 'CENTER',
    'elk.padding': '[top=80, left=60, bottom=80, right=60]',
    'elk.layered.layering.strategy': 'LONGEST_PATH',
    'elk.layered.initialization.strategy': 'MULTI_LEVEL',
  };
  
  return options;
}

export function computeDensity(nodes: ArchitectureNode[]): 'low' | 'medium' | 'high' {
  const maxNodesPerTier = Math.max(
    ...TIER_ORDER.map(tier => {
      return nodes.filter(n => normalizeTier(n.tier || n.layer) === tier && !n.isGroup).length;
    }),
    0
  );
  
  return maxNodesPerTier > 6 ? 'high' : maxNodesPerTier > 3 ? 'medium' : 'low';
}

export function nodesToElkFormat(nodes: ArchitectureNode[]): LocalElkNode[] {
  return nodes.map(node => ({
    id: node.id,
    width: node.width || DEFAULT_NODE_WIDTH,
    height: node.height || DEFAULT_NODE_HEIGHT,
    layoutOptions: {
      'elk.nodeLabels.placement': 'INSIDE',
      'elk.portConstraints': 'FIXED_SIDE',
      'elk.portAlignment.default': 'CENTER',
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
  const density = computeDensity(nodes);
  const elkOptions = generateELKOptions(direction, density);
  
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
    
    const nodeMap = new Map<string, { x: number; y: number; width: number; height: number; tier: TierType }>();
    
    if (layout.children) {
      for (const node of layout.children) {
        if (node.x !== undefined && node.y !== undefined) {
          const originalNode = nodes.find(n => n.id === node.id);
          const tier = originalNode ? normalizeTier(originalNode.tier || originalNode.layer) : 'compute';
          nodeMap.set(node.id, {
            x: node.x,
            y: node.y,
            width: node.width || DEFAULT_NODE_WIDTH,
            height: node.height || DEFAULT_NODE_HEIGHT,
            tier,
          });
        }
      }
    }
    
    const placedNodes: PlacedNode[] = [];
    for (const [id, pos] of nodeMap) {
      placedNodes.push({
        id,
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height,
        tier: pos.tier,
      });
    }
    
    const reactFlowNodes: ReactFlowNode[] = nodes.map(node => {
      const pos = nodeMap.get(node.id);
      const width = node.width || DEFAULT_NODE_WIDTH;
      const height = node.height || DEFAULT_NODE_HEIGHT;
      const tier = pos?.tier || normalizeTier(node.tier || node.layer);
      
      return {
        id: node.id,
        type: node.isGroup ? 'group' : 'systemNode',
        position: {
          x: pos?.x ?? TIER_X_POSITIONS_LR[tier],
          y: pos?.y ?? 200,
        },
        data: {
          label: node.label,
          icon: node.icon || 'box',
          layer: node.layer,
          tier,
          tierColor: node.tierColor || TIER_COLORS[tier],
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
    
    const nodePositionMap = new Map(placedNodes.map(p => [p.id, p]));
    
    const reactFlowEdges: ReactFlowEdge[] = edges.map(edge => {
      const sourceNode = nodePositionMap.get(edge.source);
      const targetNode = nodePositionMap.get(edge.target);
      
      if (sourceNode && targetNode) {
        return createReactFlowEdge(edge, sourceNode, targetNode);
      }
      
      const commType = edge.communicationType || 'sync';
      const commStyle = COMM_COLORS[commType] || COMM_COLORS.sync;
      
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: 'right',
        targetHandle: 'left',
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
  _options: LayoutOptions = {}
): LayoutResult {
  const nodesByTier = getNodesByTier(nodes);
  const canvasHeight = calculateCanvasHeight(nodesByTier);
  
  const placedNodes: PlacedNode[] = [];
  
  for (const tier of TIER_ORDER) {
    const tierNodes = nodesByTier.get(tier) || [];
    const tierX = TIER_X_POSITIONS_LR[tier];
    const tierPlaced = distributeNodesVertically(
      tierNodes,
      tierX,
      canvasHeight,
      placedNodes,
      tier
    );
    placedNodes.push(...tierPlaced);
  }
  
  const nodePositionMap = new Map(placedNodes.map(p => [p.id, p]));
  
  const reactFlowNodes: ReactFlowNode[] = nodes.map(node => {
    const placed = nodePositionMap.get(node.id);
    const tier = placed?.tier || normalizeTier(node.tier || node.layer);
    const width = node.width || DEFAULT_NODE_WIDTH;
    const height = node.height || DEFAULT_NODE_HEIGHT;
    
    return {
      id: node.id,
      type: node.isGroup ? 'group' : 'systemNode',
      position: {
        x: placed?.x ?? TIER_X_POSITIONS_LR[tier],
        y: placed?.y ?? 200,
      },
      data: {
        label: node.label,
        icon: node.icon || 'box',
        layer: node.layer,
        tier,
        tierColor: node.tierColor || TIER_COLORS[tier],
        subtitle: node.subtitle,
        serviceType: node.serviceType,
        isGroup: node.isGroup,
        parentId: node.parentId,
        groupLabel: node.groupLabel,
        groupColor: node.groupColor,
      },
      width: placed?.width ?? width,
      height: placed?.height ?? height,
      zIndex: node.isGroup ? 0 : 1,
    };
  });
  
  const reactFlowEdges: ReactFlowEdge[] = edges.map(edge => {
    const sourceNode = nodePositionMap.get(edge.source);
    const targetNode = nodePositionMap.get(edge.target);
    
    if (sourceNode && targetNode) {
      return createReactFlowEdge(edge, sourceNode, targetNode);
    }
    
    const commType = edge.communicationType || 'sync';
    const commStyle = COMM_COLORS[commType] || COMM_COLORS.sync;
    
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: 'right',
      targetHandle: 'left',
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
  
  const elkPositions = placedNodes.map(p => ({
    id: p.id,
    x: p.x,
    y: p.y,
    width: p.width,
    height: p.height,
  }));
  
  return {
    nodes: reactFlowNodes,
    edges: reactFlowEdges,
    elkPositions,
  };
}

export function validateLayout(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      
      const aRight = a.position.x + (a.width || DEFAULT_NODE_WIDTH);
      const aBottom = a.position.y + (a.height || DEFAULT_NODE_HEIGHT);
      const bRight = b.position.x + (b.width || DEFAULT_NODE_WIDTH);
      const bBottom = b.position.y + (b.height || DEFAULT_NODE_HEIGHT);
      
      const overlaps = !(
        aRight <= b.position.x + COLLISION_BUFFER ||
        a.position.x >= bRight - COLLISION_BUFFER ||
        aBottom <= b.position.y + COLLISION_BUFFER ||
        a.position.y >= bBottom - COLLISION_BUFFER
      );
      
      if (overlaps) {
        errors.push(`Collision detected: ${a.data.label} overlaps with ${b.data.label}`);
      }
    }
  }
  
  for (const edge of edges) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    
    if (!source) errors.push(`Edge ${edge.id}: source node not found`);
    if (!target) errors.push(`Edge ${edge.id}: target node not found`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
