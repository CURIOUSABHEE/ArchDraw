import type { ArchitectureNode, ArchitectureEdge, ReactFlowNode, ReactFlowEdge, TierType } from '../types/index.js';
import type { GenerateDiagramInput } from '../lib/schema.js';
import { runELKLayout, validateLayout } from '../lib/elk-runner.js';
import { getTierColor } from '../lib/node-catalog.js';

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

const LAYER_ORDER = [
  'client',
  'edge',
  'compute',
  'async',
  'data',
  'external',
  'observe',
];

function assignTierFromLayer(layer: string): TierType {
  const normalized = layer.toLowerCase();
  if (LAYER_ORDER.includes(normalized)) {
    return normalized as TierType;
  }
  return 'compute';
}

function validateNodes(nodes: ArchitectureNode[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  
  for (const node of nodes) {
    if (!node.id) {
      errors.push(`Node missing id: ${node.label}`);
    } else if (ids.has(node.id)) {
      errors.push(`Duplicate node id: ${node.id}`);
    } else {
      ids.add(node.id);
    }
    
    if (!node.label) {
      errors.push(`Node missing label`);
    }
    
    const layer = node.tier || node.layer;
    if (!layer) {
      errors.push(`Node ${node.label || node.id} missing tier/layer`);
    }
  }
  
  return errors;
}

export async function generateDiagram(input: GenerateDiagramInput): Promise<{
  success: boolean;
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
  elkPositions: Array<{ id: string; x: number; y: number; width: number; height: number }>;
  metadata: {
    nodeCount: number;
    edgeCount: number;
    layoutAlgorithm: string;
    direction: string;
  };
  diagramUrl?: string;
  message?: string;
  errors?: string[];
}> {
  const errors: string[] = [];

  try {
    const { direction } = input;

    if (!input.nodes || input.nodes.length === 0) {
      return {
        success: false,
        nodes: [],
        edges: [],
        elkPositions: [],
        metadata: {
          nodeCount: 0,
          edgeCount: 0,
          layoutAlgorithm: 'ELK layered',
          direction,
        },
        errors: ['No nodes provided. You must provide nodes array with at least one node.'],
      };
    }

    const architectureNodes: ArchitectureNode[] = input.nodes.map((node, index) => {
      const layer = node.layer || node.tier || 'compute';
      const tier = assignTierFromLayer(layer);
      return {
        id: node.id || `node-${index}`,
        type: 'architectureNode',
        label: node.label,
        subtitle: node.subtitle,
        layer: tier,
        tier: tier,
        tierColor: node.tierColor || getTierColor(tier) || TIER_COLORS[tier],
        width: Math.max(node.width || DEFAULT_NODE_WIDTH, 200),
        height: Math.max(node.height || DEFAULT_NODE_HEIGHT, 70),
        icon: node.icon || 'box',
        metadata: { serviceType: node.serviceType },
        isGroup: node.isGroup,
        serviceType: node.serviceType,
      };
    });

    const nodeIdSet = new Set(architectureNodes.map(n => n.id));
    
    const inputEdgeErrors: string[] = [];
    const inputEdgeIds = new Set<string>();
    for (const edge of (input.edges || [])) {
      if (edge.id && inputEdgeIds.has(edge.id)) {
        inputEdgeErrors.push(`Duplicate edge id: ${edge.id}`);
      } else if (edge.id) {
        inputEdgeIds.add(edge.id);
      }
      if (!nodeIdSet.has(edge.source)) {
        inputEdgeErrors.push(`Edge ${edge.id || 'unknown'}: invalid source node ${edge.source}`);
      }
      if (!nodeIdSet.has(edge.target)) {
        inputEdgeErrors.push(`Edge ${edge.id || 'unknown'}: invalid target node ${edge.target}`);
      }
      if (edge.source === edge.target) {
        inputEdgeErrors.push(`Edge ${edge.id || 'unknown'}: source and target are the same`);
      }
    }
    
    const validationErrors = [
      ...validateNodes(architectureNodes),
      ...inputEdgeErrors,
    ];
    if (validationErrors.length > 0) {
      errors.push(...validationErrors);
    }

    const commColors: Record<string, { color: string; dash: string }> = {
      sync: { color: '#6366f1', dash: '' },
      async: { color: '#f59e0b', dash: '8,4' },
      stream: { color: '#10b981', dash: '4,2' },
      event: { color: '#ec4899', dash: '2,3' },
      dep: { color: '#94a3b8', dash: '6,6' },
    };

    const architectureEdges: ArchitectureEdge[] = (input.edges || []).map((edge, index) => {
      const commType = edge.communicationType || 'sync';
      const commStyle = commColors[commType] || commColors.sync;

      return {
        id: edge.id || `edge-${index}`,
        source: edge.source,
        target: edge.target,
        sourceHandle: 'right' as const,
        targetHandle: 'left' as const,
        communicationType: commType as ArchitectureEdge['communicationType'],
        pathType: 'step' as ArchitectureEdge['pathType'],
        label: edge.label || '',
        labelPosition: 'center' as const,
        animated: commType !== 'sync' && commType !== 'dep',
        style: {
          stroke: commStyle.color,
          strokeDasharray: commStyle.dash,
          strokeWidth: 2,
        },
        markerEnd: 'arrowclosed' as const,
        markerStart: 'none' as const,
      };
    });

    const layoutResult = await runELKLayout(architectureNodes, architectureEdges, { direction });

    const layoutValidation = validateLayout(layoutResult.nodes, layoutResult.edges);
    if (!layoutValidation.valid) {
      errors.push(...layoutValidation.errors);
    }

    let diagramUrl: string | undefined;
    let message: string | undefined;

    const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

    try {
      const label = input.label || input.nodes[0]?.label || 'AI Diagram';
      const saveResponse = await fetch(`${API_BASE}/api/diagram/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: layoutResult.nodes,
          edges: layoutResult.edges,
          label,
        }),
      });

      if (saveResponse.ok) {
        const saveData = await saveResponse.json() as { sessionId: string; url: string };
        diagramUrl = `${API_BASE}${saveData.url}`;
        message = `Diagram generated with ${layoutResult.nodes.length} nodes and ${layoutResult.edges.length} edges. Open this link to view it: ${diagramUrl}`;
      }
    } catch {
      message = `Diagram generated with ${layoutResult.nodes.length} nodes and ${layoutResult.edges.length} edges.`;
    }

    return {
      success: true,
      nodes: layoutResult.nodes,
      edges: layoutResult.edges,
      elkPositions: layoutResult.elkPositions,
      metadata: {
        nodeCount: layoutResult.nodes.length,
        edgeCount: layoutResult.edges.length,
        layoutAlgorithm: 'ELK layered',
        direction,
      },
      diagramUrl,
      message,
      errors: errors.length > 0 ? errors : undefined,
    };

  } catch (error) {
    return {
      success: false,
      nodes: [],
      edges: [],
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
