import type { ArchitectureNode, ArchitectureEdge, LayoutConfig, ReactFlowNode } from '../types';
import { LAYER_ORDER } from '../constants';

export function computeLayout(
  nodes: ArchitectureNode[],
  layoutConfig: LayoutConfig
): ReactFlowNode[] {
  const direction = layoutConfig.direction ?? 'RIGHT';
  const elkOptions = layoutConfig.elkOptions ?? {};

  const spacingX = parseInt(elkOptions['elk.spacing.nodeNode'] ?? '20', 10);
  const spacingY = parseInt(elkOptions['elk.layered.spacing.nodeNodeBetweenLayers'] ?? '120', 10);

  const nodesByLayer: Record<string, ArchitectureNode[]> = {};
  for (const node of nodes) {
    const layer = node.layer;
    if (!nodesByLayer[layer]) {
      nodesByLayer[layer] = [];
    }
    nodesByLayer[layer].push(node);
  }

  const layerPositions: Record<string, { x: number; y: number }> = {};

  if (direction === 'RIGHT') {
    let currentX = 50;
    for (const layer of LAYER_ORDER) {
      layerPositions[layer] = { x: currentX, y: 0 };
      currentX += getMaxNodeWidth(nodesByLayer[layer]) + spacingY;
    }
  } else {
    let currentY = 50;
    for (const layer of LAYER_ORDER) {
      layerPositions[layer] = { x: 0, y: currentY };
      currentY += getMaxNodeHeight(nodesByLayer[layer]) + spacingY;
    }
  }

  const reactFlowNodes: ReactFlowNode[] = [];

  for (const layer of LAYER_ORDER) {
    const layerNodes = nodesByLayer[layer] ?? [];
    const layerPos = layerPositions[layer];

    const layerWidth = getMaxNodeWidth(layerNodes);

    if (direction === 'RIGHT') {
      let currentY = 50;
      for (const node of layerNodes) {
        const nodeX = layerPos.x;
        const nodeY = currentY;
        const nodeWidth = node.width ?? 160;
        const nodeHeight = node.height ?? 80;

        reactFlowNodes.push({
          id: node.id,
          type: 'customNode',
          position: { x: nodeX, y: nodeY },
          data: {
            label: node.label,
            icon: node.icon ?? 'box',
            layer: node.layer,
          },
          width: nodeWidth,
          height: nodeHeight,
        });

        currentY += nodeHeight + spacingX;
      }
    } else {
      let currentX = 50;
      for (const node of layerNodes) {
        const nodeX = currentX;
        const nodeY = layerPos.y;
        const nodeWidth = node.width ?? 160;
        const nodeHeight = node.height ?? 80;

        reactFlowNodes.push({
          id: node.id,
          type: 'customNode',
          position: { x: nodeX, y: nodeY },
          data: {
            label: node.label,
            icon: node.icon ?? 'box',
            layer: node.layer,
          },
          width: nodeWidth,
          height: nodeHeight,
        });

        currentX += nodeWidth + spacingX;
      }
    }
  }

  for (const node of nodes) {
    if (!reactFlowNodes.find(n => n.id === node.id)) {
      const defaultLayerPos = layerPositions[node.layer] ?? { x: 400, y: 200 };
      reactFlowNodes.push({
        id: node.id,
        type: 'customNode',
        position: { x: defaultLayerPos.x, y: defaultLayerPos.y + Math.random() * 50 },
        data: {
          label: node.label,
          icon: node.icon ?? 'box',
          layer: node.layer,
        },
        width: node.width ?? 160,
        height: node.height ?? 80,
      });
    }
  }

  return reactFlowNodes;
}

function getMaxNodeWidth(nodes: ArchitectureNode[] | undefined): number {
  if (!nodes || nodes.length === 0) return 160;
  return Math.max(...nodes.map(n => n.width ?? 160));
}

function getMaxNodeHeight(nodes: ArchitectureNode[] | undefined): number {
  if (!nodes || nodes.length === 0) return 80;
  return Math.max(...nodes.map(n => n.height ?? 80));
}

export function convertToReactFlowEdges(
  edges: ArchitectureEdge[],
  nodeMap: Map<string, ReactFlowNode>
): ReturnType<typeof convertEdge>[] {
  return edges.map(edge => convertEdge(edge, nodeMap));
}

function convertEdge(
  edge: ArchitectureEdge,
  nodeMap: Map<string, ReactFlowNode>
): {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  type: string;
  animated: boolean;
  label: string;
  labelShowBg: boolean;
  labelBgPadding: [number, number];
  labelBgBorderRadius: number;
  labelBgStyle: { fill: string; fillOpacity: number };
  labelStyle: { fontSize: number; fontWeight: number; fill: string };
  style: { stroke: string; strokeWidth: number; strokeDasharray: string };
  markerEnd: { type: string; color: string };
  data: { communicationType: string };
} {
  const commType = edge.communicationType ?? 'sync';

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? 'right',
    targetHandle: edge.targetHandle ?? 'left',
    type: edge.pathType ?? 'smooth',
    animated: edge.animated ?? false,
    label: edge.label ?? '',
    labelShowBg: true,
    labelBgPadding: [8, 4] as [number, number],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: '#1e1e2e', fillOpacity: 0.9 },
    labelStyle: { fontSize: 10, fontWeight: 600, fill: '#e2e8f0' },
    style: {
      stroke: edge.style?.stroke ?? '#94a3b8',
      strokeWidth: edge.style?.strokeWidth ?? 2,
      strokeDasharray: edge.style?.strokeDasharray ?? '',
    },
    markerEnd: { type: edge.markerEnd ?? 'arrowclosed', color: edge.style?.stroke ?? '#94a3b8' },
    data: { communicationType: commType },
  };
}
