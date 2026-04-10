import type { ArchitectureNode, ArchitectureEdge } from '../types/index.js';
import type { FixLayoutInput } from '../lib/schema.js';
import { runELKLayout } from '../lib/elk-runner.js';
import { normalizeLayer, getTierColor } from '../lib/node-catalog.js';
import type { TierType } from '../types/index.js';

interface InputNode {
  id: string;
  label: string;
  layer: string;
  width?: number;
  height?: number;
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
      return {
        id: node.id || `node-${index}`,
        type: 'architectureNode',
        label: node.label || `Node ${index}`,
        layer: normalizedLayer,
        tier: normalizedLayer,
        tierColor: getTierColor(normalizedLayer),
        width: node.width || 180,
        height: node.height || 70,
        icon: 'box',
        metadata: {},
      };
    });

    const architectureEdges: ArchitectureEdge[] = inputEdges.map((edge: InputEdge, index: number) => ({
      id: edge.id || `edge-${index}`,
      source: edge.source,
      target: edge.target,
      sourceHandle: 'right',
      targetHandle: 'left',
      communicationType: (edge.communicationType as ArchitectureEdge['communicationType']) || 'sync',
      pathType: 'smooth',
      label: '',
      labelPosition: 'center',
      animated: false,
      style: {
        stroke: '#6366f1',
        strokeDasharray: '',
        strokeWidth: 2,
      },
      markerEnd: 'arrowclosed',
      markerStart: 'none',
    }));

    const layoutResult = await runELKLayout(architectureNodes, architectureEdges, { direction });

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
