import type { ArchitectureNode, ArchitectureEdge, TierType } from '../types/index.js';
import type { FixLayoutInput } from '../lib/schema.js';
import { runELKLayout, validateLayout } from '../lib/elk-runner.js';
import { normalizeLayer, getTierColor } from '../lib/node-catalog.js';

const DEFAULT_NODE_WIDTH = 220;
const DEFAULT_NODE_HEIGHT = 80;

const TIER_COLORS: Record<TierType, string> = {
  client: '#a855f7',
  edge: '#6366f1',
  compute: '#14b8a6',
  async: '#f59e0b',
  data: '#3b82f6',
  external: '#f97316',
  observe: '#6b7280',
};

interface InputNode {
  id: string;
  label: string;
  layer: string;
  width?: number;
  height?: number;
  tierColor?: string;
}

interface InputEdge {
  id?: string;
  source: string;
  target: string;
  communicationType?: string;
}

export async function fixLayout(input: FixLayoutInput): Promise<{
  success: boolean;
  elkPositions: Array<{ id: string; x: number; y: number; width: number; height: number }>;
  metadata: {
    nodeCount: number;
    edgeCount: number;
    layoutAlgorithm: string;
    direction: string;
  };
  errors?: string[];
}> {
  const errors: string[] = [];

  try {
    const { nodes: inputNodes, edges: inputEdges, direction } = input;

    if (inputNodes.length === 0) {
      return {
        success: false,
        elkPositions: [],
        metadata: {
          nodeCount: 0,
          edgeCount: 0,
          layoutAlgorithm: 'ELK layered',
          direction,
        },
        errors: ['No nodes provided'],
      };
    }

    const architectureNodes: ArchitectureNode[] = inputNodes.map((node: InputNode, index: number) => {
      const normalizedLayer = normalizeLayer(node.layer) as TierType;
      const tierColor = node.tierColor || getTierColor(normalizedLayer) || TIER_COLORS[normalizedLayer];
      return {
        id: node.id || `node-${index}`,
        type: 'architectureNode',
        label: node.label || `Node ${index}`,
        layer: normalizedLayer,
        tier: normalizedLayer,
        tierColor,
        width: Math.max(node.width || DEFAULT_NODE_WIDTH, 200),
        height: Math.max(node.height || DEFAULT_NODE_HEIGHT, 70),
        icon: 'box',
        metadata: {},
      };
    });

    const nodeIdSet = new Set(architectureNodes.map(n => n.id));
    const architectureEdges: ArchitectureEdge[] = inputEdges.map((edge: InputEdge, index: number) => {
      const commType = edge.communicationType || 'sync';
      const commColors: Record<string, { color: string; dash: string }> = {
        sync: { color: '#6366f1', dash: '' },
        async: { color: '#f59e0b', dash: '8,4' },
        stream: { color: '#10b981', dash: '4,2' },
        event: { color: '#ec4899', dash: '2,3' },
        dep: { color: '#94a3b8', dash: '6,6' },
      };
      const commStyle = commColors[commType] || commColors.sync;

      if (!nodeIdSet.has(edge.source)) {
        errors.push(`Edge ${edge.id || index}: invalid source node ${edge.source}`);
      }
      if (!nodeIdSet.has(edge.target)) {
        errors.push(`Edge ${edge.id || index}: invalid target node ${edge.target}`);
      }

      return {
        id: edge.id || `edge-${index}`,
        source: edge.source,
        target: edge.target,
        sourceHandle: 'right',
        targetHandle: 'left',
        communicationType: (commType) as ArchitectureEdge['communicationType'],
        pathType: 'smooth',
        label: '',
        labelPosition: 'center',
        animated: commType !== 'sync' && commType !== 'dep',
        style: {
          stroke: commStyle.color,
          strokeDasharray: commStyle.dash,
          strokeWidth: 2,
        },
        markerEnd: 'arrowclosed',
        markerStart: 'none',
      };
    });

    const layoutResult = await runELKLayout(architectureNodes, architectureEdges, { direction });

    const layoutValidation = validateLayout(layoutResult.nodes, layoutResult.edges);
    if (!layoutValidation.valid) {
      errors.push(...layoutValidation.errors);
    }

    return {
      success: true,
      elkPositions: layoutResult.elkPositions,
      metadata: {
        nodeCount: layoutResult.nodes.length,
        edgeCount: layoutResult.edges.length,
        layoutAlgorithm: 'ELK layered',
        direction,
      },
      errors: errors.length > 0 ? errors : undefined,
    };

  } catch (error) {
    return {
      success: false,
      elkPositions: [],
      metadata: {
        nodeCount: 0,
        edgeCount: 0,
        layoutAlgorithm: 'ELK layered',
        direction: input.direction,
      },
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
