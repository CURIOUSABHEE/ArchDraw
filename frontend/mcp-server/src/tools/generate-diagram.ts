import type { ArchitectureNode, ArchitectureEdge, ReactFlowNode, ReactFlowEdge } from '../types/index.js';
import type { GenerateDiagramInput } from '../lib/schema.js';
import { runELKLayout } from '../lib/elk-runner.js';
import { getTierColor, normalizeLayer } from '../lib/node-catalog.js';
import type { TierType } from '../types/index.js';

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
      const tier = (node.tier || normalizeLayer(node.layer || 'compute')) as TierType;
      return {
        id: node.id || `node-${index}`,
        type: 'architectureNode',
        label: node.label,
        subtitle: node.subtitle,
        layer: tier,
        tier: tier,
        tierColor: node.tierColor || getTierColor(tier),
        width: node.width || 180,
        height: node.height || 70,
        icon: node.icon || 'box',
        metadata: { serviceType: node.serviceType },
        isGroup: node.isGroup,
        serviceType: node.serviceType,
      };
    });

    const architectureEdges: ArchitectureEdge[] = (input.edges || []).map((edge, index) => {
      const commColors: Record<string, { color: string; dash: string }> = {
        sync: { color: '#6366f1', dash: '' },
        async: { color: '#f59e0b', dash: '8,4' },
        stream: { color: '#10b981', dash: '4,2' },
        event: { color: '#ec4899', dash: '2,3' },
        dep: { color: '#94a3b8', dash: '6,6' },
      };
      const commStyle = commColors[edge.communicationType || 'sync'] || commColors.sync;

      return {
        id: edge.id || `edge-${index}`,
        source: edge.source,
        target: edge.target,
        sourceHandle: 'right',
        targetHandle: 'left',
        communicationType: (edge.communicationType || 'sync') as ArchitectureEdge['communicationType'],
        pathType: (edge.pathType || 'smooth') as ArchitectureEdge['pathType'],
        label: edge.label || '',
        labelPosition: 'center' as const,
        animated: edge.communicationType !== 'sync' && edge.communicationType !== 'dep',
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
        message = `Diagram generated. Open this link to view it: ${diagramUrl}`;
      }
    } catch {
      // Silently fail - still return nodes/edges normally
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
