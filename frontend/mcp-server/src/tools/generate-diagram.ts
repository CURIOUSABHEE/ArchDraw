import type { ArchitectureNode, ArchitectureEdge, ReactFlowNode, ReactFlowEdge, TierType } from '../types/index.js';
import type { GenerateDiagramInput } from '../lib/schema.js';
import { runELKLayout, validateLayout } from '../lib/elk-runner.js';
import { getTierColor } from '../lib/node-catalog.js';

const DEFAULT_NODE_WIDTH = 200;
const DEFAULT_NODE_HEIGHT = 70;
const DEFAULT_GROUP_WIDTH = 500;
const DEFAULT_GROUP_HEIGHT = 280;

/** Canonical tier colors — keep in sync with frontend tierColors.ts */
const TIER_COLORS: Record<TierType, string> = {
  client:   '#64748b',
  edge:     '#6366f1',
  compute:  '#0d9488',
  async:    '#d97706',
  data:     '#3b82f6',
  external: '#8b5cf6',
  observe:  '#6b7280',
};

const LAYER_ORDER = ['client', 'edge', 'compute', 'async', 'data', 'external', 'observe'];

function assignTierFromLayer(layer: string): TierType {
  const normalized = layer.toLowerCase();
  if (LAYER_ORDER.includes(normalized)) return normalized as TierType;
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

    if (!node.label) errors.push(`Node missing label`);

    const layer = node.tier || node.layer;
    if (!layer) errors.push(`Node ${node.label || node.id} missing tier/layer`);
  }

  // Validate parentId references
  for (const node of nodes) {
    if (node.parentId && !ids.has(node.parentId)) {
      errors.push(`Node "${node.id}" has parentId "${node.parentId}" which does not exist`);
    }
    if (node.parentId && node.isGroup) {
      errors.push(`Node "${node.id}" cannot be both a group and a child (parentId + isGroup)`);
    }
  }

  return errors;
}

interface NodeInput {
  id?: string;
  label: string;
  tier?: string;
  layer?: string;
  subtitle?: string;
  icon?: string;
  tierColor?: string;
  accentColor?: string;
  groupColor?: string;
  status?: 'healthy' | 'warning' | 'error' | 'unknown';
  shape?: string;
  width?: number;
  height?: number;
  serviceType?: string;
  isGroup?: boolean;
  parentId?: string;
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
    groupCount: number;
  };
  diagramUrl?: string;
  sessionId?: string;
  embeddedDiagram?: { nodes: ReactFlowNode[]; edges: ReactFlowEdge[] };
  message?: string;
  errors?: string[];
}> {
  const errors: string[] = [];

  try {
    const { direction } = input;

    if (!input.nodes || input.nodes.length === 0) {
      return {
        success: false, nodes: [], edges: [], elkPositions: [],
        metadata: { nodeCount: 0, edgeCount: 0, layoutAlgorithm: 'ELK layered', direction, groupCount: 0 },
        errors: ['No nodes provided.'],
      };
    }

    // Check if AI used groups — warn if not
    const groupNodes = input.nodes.filter((n: NodeInput) => n.isGroup);
    if (groupNodes.length === 0) {
      errors.push('WARNING: No group nodes provided. Best practice: wrap related nodes in group containers (isGroup:true) for visual clarity.');
    }

    const architectureNodes: ArchitectureNode[] = input.nodes.map((node: NodeInput, index: number) => {
      const layer = node.layer || node.tier || 'compute';
      const tier = assignTierFromLayer(layer);
      const isGroup = node.isGroup === true;

      return {
        id: node.id || `node-${index}`,
        type: 'architectureNode',
        label: node.label,
        subtitle: node.subtitle || '',
        layer: tier,
        tier: tier,
        tierColor: node.tierColor || getTierColor(tier) || TIER_COLORS[tier],
        accentColor: node.accentColor,
        groupColor: node.groupColor,
        status: node.status,
        shape: node.shape,
        // Groups get larger default dimensions; clamp regular nodes to minimum
        width: isGroup
          ? Math.max(node.width || DEFAULT_GROUP_WIDTH, 300)
          : Math.max(node.width || DEFAULT_NODE_WIDTH, 160),
        height: isGroup
          ? Math.max(node.height || DEFAULT_GROUP_HEIGHT, 200)
          : Math.max(node.height || DEFAULT_NODE_HEIGHT, 60),
        icon: node.icon || (isGroup ? 'layers' : 'box'),
        metadata: { serviceType: node.serviceType },
        isGroup,
        parentId: node.parentId,
        serviceType: node.serviceType,
      };
    });

    // Validate node integrity
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
        inputEdgeErrors.push(`Edge ${edge.id || 'unknown'}: invalid source "${edge.source}"`);
      }
      if (!nodeIdSet.has(edge.target)) {
        inputEdgeErrors.push(`Edge ${edge.id || 'unknown'}: invalid target "${edge.target}"`);
      }
      if (edge.source === edge.target) {
        inputEdgeErrors.push(`Edge ${edge.id || 'unknown'}: source and target are the same`);
      }
    }

    errors.push(...validateNodes(architectureNodes), ...inputEdgeErrors);

    const commColors: Record<string, { color: string; dash: string }> = {
      sync:   { color: '#94a3b8', dash: '' },
      async:  { color: '#d97706', dash: '8,4' },
      stream: { color: '#10b981', dash: '4,2' },
      event:  { color: '#ec4899', dash: '2,3' },
      dep:    { color: '#6b7280', dash: '6,6' },
    };

    const architectureEdges: ArchitectureEdge[] = (input.edges || []).map((edge, index) => {
      const commType = edge.communicationType || 'sync';
      const commStyle = commColors[commType] || commColors.sync;
      // Use provided label; for async/stream/event, fall back to comm type description
      const label = edge.label?.trim() ||
        (commType !== 'sync' && commType !== 'dep' ? commType : '');

      return {
        id: edge.id || `edge-${index}`,
        source: edge.source,
        target: edge.target,
        sourceHandle: 'right' as const,
        targetHandle: 'left' as const,
        communicationType: commType as ArchitectureEdge['communicationType'],
        pathType: (edge.pathType ?? 'Smoothstep') as ArchitectureEdge['pathType'],
        label,
        labelPosition: 'center' as const,
        animated: commType !== 'sync' && commType !== 'dep',
        style: {
          stroke: commStyle.color,
          strokeDasharray: commStyle.dash,
          strokeWidth: 2.5,
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
    let sessionId: string | undefined;

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
          source: 'mcp',
        }),
      });

      if (saveResponse.ok) {
        const saveData = await saveResponse.json() as { sessionId: string; url: string };
        diagramUrl = `${API_BASE}${saveData.url}`;
        sessionId = saveData.sessionId;
        const nodeCount = layoutResult.nodes.filter(n => !n.data?.isGroup).length;
        const groupCount = layoutResult.nodes.filter(n => n.data?.isGroup).length;
        message = `✅ Diagram ready! Open this URL to view and edit:\n\n${diagramUrl}\n\n📊 ${nodeCount} nodes, ${groupCount} groups, ${layoutResult.edges.length} edges.\n\n**To export**: Use session ID "${sessionId}" with the export_diagram tool.`;
      }
    } catch {
      message = `Diagram generated with ${layoutResult.nodes.length} nodes and ${layoutResult.edges.length} edges, but couldn't save to generate a link. Make sure Next.js is running on ${API_BASE}.`;
    }

    const groupCount = architectureNodes.filter(n => n.isGroup).length;

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
        groupCount,
      },
      diagramUrl,
      sessionId,
      embeddedDiagram: { nodes: layoutResult.nodes, edges: layoutResult.edges },
      message,
      errors: errors.length > 0 ? errors : undefined,
    };

  } catch (error) {
    return {
      success: false, nodes: [], edges: [], elkPositions: [],
      metadata: { nodeCount: 0, edgeCount: 0, layoutAlgorithm: 'ELK layered', direction: input.direction, groupCount: 0 },
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
