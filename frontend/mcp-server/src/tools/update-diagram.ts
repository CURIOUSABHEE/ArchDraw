import type { ReactFlowNode, ReactFlowEdge, TierType } from '../types/index.js';
import type { UpdateDiagramInput } from '../lib/schema.js';
import { getDiagramState, setDiagramState } from '../lib/diagram-state.js';
import { runELKLayout } from '../lib/elk-runner.js';
import type { ArchitectureNode, ArchitectureEdge } from '../types/index.js';

const TIER_COLORS: Record<string, string> = {
  client: '#a855f7',
  edge: '#6366f1',
  compute: '#14b8a6',
  async: '#f59e0b',
  data: '#3b82f6',
  external: '#f97316',
  observe: '#6b7280',
};

const COMM_COLORS: Record<string, { color: string; dash: string; animated: boolean }> = {
  sync: { color: '#94a3b8', dash: '', animated: false },
  async: { color: '#f59e0b', dash: '8,4', animated: true },
  stream: { color: '#10b981', dash: '4,2', animated: true },
  event: { color: '#ec4899', dash: '2,3', animated: true },
  dep: { color: '#94a3b8', dash: '6,6', animated: true },
};

export async function updateDiagram(input: UpdateDiagramInput): Promise<{
  success: boolean;
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
  message: string;
  changes: {
    nodesAdded: number;
    nodesRemoved: number;
    nodesUpdated: number;
    edgesAdded: number;
    edgesRemoved: number;
    nodesRepositioned: number;
  };
  error?: string;
}> {
  const state = getDiagramState();
  
  if (state.nodes.length === 0 && state.edges.length === 0) {
    return {
      success: false,
      nodes: [],
      edges: [],
      message: '',
      changes: { nodesAdded: 0, nodesRemoved: 0, nodesUpdated: 0, edgesAdded: 0, edgesRemoved: 0, nodesRepositioned: 0 },
      error: 'No diagram exists. Call generate_diagram first.',
    };
  }

  const changes = { nodesAdded: 0, nodesRemoved: 0, nodesUpdated: 0, edgesAdded: 0, edgesRemoved: 0, nodesRepositioned: 0 };

  let nodes = [...state.nodes];
  let edges = [...state.edges];

  if (input.removeNodeIds && input.removeNodeIds.length > 0) {
    const removeSet = new Set(input.removeNodeIds);
    nodes = nodes.filter(n => !removeSet.has(n.id));
    edges = edges.filter(e => !removeSet.has(e.source) && !removeSet.has(e.target));
    changes.nodesRemoved = input.removeNodeIds.length;
    changes.edgesRemoved = state.edges.length - edges.length;
  }

  if (input.removeEdgeIds && input.removeEdgeIds.length > 0) {
    const removeSet = new Set(input.removeEdgeIds);
    edges = edges.filter(e => !removeSet.has(e.id));
    changes.edgesRemoved += input.removeEdgeIds.length;
  }

  if (input.addNodes && input.addNodes.length > 0) {
    const newNodes: ReactFlowNode[] = input.addNodes.map(node => ({
      id: node.id,
      type: 'customNode',
      position: { x: 0, y: 0 },
      data: {
        label: node.label,
        icon: node.icon || 'box',
        layer: node.tier as TierType,
        tier: node.tier as TierType,
        tierColor: TIER_COLORS[node.tier] || TIER_COLORS.compute,
        subtitle: node.subtitle,
      },
      width: 180,
      height: 70,
      zIndex: 1,
    }));
    nodes = [...nodes, ...newNodes];
    changes.nodesAdded = input.addNodes.length;
  }

  if (input.updateNodes && input.updateNodes.length > 0) {
    for (const update of input.updateNodes) {
      const node = nodes.find(n => n.id === update.id);
      if (node) {
        if (update.label) node.data.label = update.label;
        if (update.subtitle) node.data.subtitle = update.subtitle;
        if (update.tier) {
          node.data.layer = update.tier as TierType;
          node.data.tier = update.tier as TierType;
          node.data.tierColor = TIER_COLORS[update.tier] || TIER_COLORS.compute;
        }
        changes.nodesUpdated++;
      }
    }
  }

  if (input.addEdges && input.addEdges.length > 0) {
    let edgeIndex = edges.length;
    const newEdges: ReactFlowEdge[] = input.addEdges.map(edge => {
      const id = `edge-${edgeIndex++}`;
      const commType = edge.communicationType || 'sync';
      const commStyle = COMM_COLORS[commType];
      return {
        id,
        source: edge.source,
        target: edge.target,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'step',
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
          pathType: 'smooth',
          label: edge.label || '',
        },
      };
    });
    edges = [...edges, ...newEdges];
    changes.edgesAdded = input.addEdges.length;
  }

  const architectureNodes: ArchitectureNode[] = nodes.map(n => ({
    id: n.id,
    type: n.type,
    label: n.data.label,
    subtitle: n.data.subtitle,
    layer: n.data.layer,
    tier: n.data.tier,
    tierColor: n.data.tierColor,
    width: n.width || 180,
    height: n.height || 70,
    icon: n.data.icon || 'box',
    metadata: {},
  }));

  const architectureEdges: ArchitectureEdge[] = edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: 'right',
    targetHandle: 'left',
    communicationType: e.data?.communicationType || 'sync',
    pathType: e.data?.pathType || 'smooth',
    label: e.label || '',
    labelPosition: 'center',
    animated: e.animated,
    style: {
      stroke: e.style?.stroke || '#94a3b8',
      strokeDasharray: e.style?.strokeDasharray || '',
      strokeWidth: 2,
    },
    markerEnd: 'arrowclosed',
    markerStart: 'none',
  }));

  const layoutResult = await runELKLayout(architectureNodes, architectureEdges, { direction: 'RIGHT' });
  
  changes.nodesRepositioned = layoutResult.nodes.length;
  
  setDiagramState({
    nodes: layoutResult.nodes,
    edges: layoutResult.edges,
  });

  const changeSummary = [
    changes.nodesAdded > 0 ? `${changes.nodesAdded} node(s) added` : '',
    changes.nodesRemoved > 0 ? `${changes.nodesRemoved} node(s) removed` : '',
    changes.nodesUpdated > 0 ? `${changes.nodesUpdated} node(s) updated` : '',
    changes.edgesAdded > 0 ? `${changes.edgesAdded} edge(s) added` : '',
    changes.edgesRemoved > 0 ? `${changes.edgesRemoved} edge(s) removed` : '',
    `${changes.nodesRepositioned} node(s) repositioned`,
  ].filter(Boolean).join(', ');

  return {
    success: true,
    nodes: layoutResult.nodes,
    edges: layoutResult.edges,
    message: `Diagram updated. ${changeSummary}.`,
    changes,
  };
}
