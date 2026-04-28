import ELK from 'elkjs/lib/elk.bundled.js';
import type { Node, Edge } from 'reactflow';
import type { LayoutPreset } from './layoutPresets';
import { resolveNodeCollisions } from '@/src/utils/resolveNodeCollisions';
import { getNodeShapeConfig } from '@/constants/nodeShapeConfig';

const elk = new ELK();

const DEFAULT_NODE_WIDTH = 200;
const DEFAULT_NODE_HEIGHT = 100;
const DEFAULT_GROUP_WIDTH = 400;
const DEFAULT_GROUP_HEIGHT = 300;

const BASE_ELK_OPTIONS: Record<string, string> = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  'elk.spacing.nodeNode': '120',
  'elk.spacing.edgeNode': '80',
  'elk.spacing.edgeEdge': '60',
  'elk.spacing.labelNode': '50',
  'elk.layered.spacing.nodeNodeBetweenLayers': '250',
  'elk.layered.spacing.edgeNodeBetweenLayers': '150',
  'elk.layered.spacing.edgeEdgeBetweenLayers': '80',
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.crossingMinimization.forceNodeModelOrder': 'false',
  'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
  'elk.layered.separatingEdges.strategy': 'CENTERING',
  'elk.layered.unnecessaryBendpoints': 'false',
  'elk.layered.mergeEdges': 'false',
  'elk.layered.cycleBreaking.strategy': 'GREEDY',
  'elk.layered.nodeSize.constraints': 'MINIMUM_SIZE',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.portConstraints': 'FIXED_SIDE',
  'elk.edgeLabels.inline': 'false',
  'elk.edgeLabels.placement': 'CENTER',
  'elk.padding': '[top=60, left=40, bottom=60, right=40]',
  'elk.separateConnectedComponents': 'false',
};

export async function applyLayoutPreset(
  nodes: Node[],
  edges: Edge[],
  preset: LayoutPreset
): Promise<Node[]> {
  if (preset.isFreeform) {
    return nodes;
  }

  if (!preset.elkOptions) {
    return nodes;
  }

  const groupNodes = nodes.filter(n => n.type === 'group' || n.type === 'groupNode');
  const leafNodes = nodes.filter(n => n.type !== 'group' && n.type !== 'groupNode');

  const elkNodes = nodes.map(node => {
    const isGroup = node.type === 'group' || node.type === 'groupNode';
    const serviceType = (node.data as { serviceType?: string })?.serviceType;
    const config = getNodeShapeConfig(serviceType);
    const nodeWidth = node.width ?? (isGroup ? DEFAULT_GROUP_WIDTH : config.width);
    const nodeHeight = node.height ?? (isGroup ? DEFAULT_GROUP_HEIGHT : config.height);
    
    const children = isGroup
      ? leafNodes
          .filter(n => n.parentId === node.id)
          .map(child => {
            const childServiceType = (child.data as { serviceType?: string })?.serviceType;
            const childConfig = getNodeShapeConfig(childServiceType);
            const childWidth = child.width ?? childConfig.width;
            const childHeight = child.height ?? childConfig.height;
            return {
              id: child.id,
              width: childWidth,
              height: childHeight,
              layoutOptions: {
                'elk.nodeSize.constraints': 'MINIMUM_SIZE',
                'elk.nodeSize.minimum': `${childWidth}, ${childHeight}`,
                'elk.portConstraints': 'FIXED_SIDE',
              },
            };
          })
      : [];
    
    return {
      id: node.id,
      width: nodeWidth,
      height: nodeHeight,
      layoutOptions: {
        'elk.nodeSize.constraints': 'MINIMUM_SIZE',
        'elk.nodeSize.minimum': `${nodeWidth}, ${nodeHeight}`,
        'elk.portConstraints': 'FIXED_SIDE',
      },
      ...(children.length > 0 ? { children } : {}),
    };
  });

  const rootElkNodes = elkNodes.filter(n => {
    const rfNode = nodes.find(r => r.id === n.id);
    return !rfNode?.parentId;
  });

  const elkEdges = edges
    .filter(e => {
      const sourceIsGroup = groupNodes.some(g => g.id === e.source);
      const targetIsGroup = groupNodes.some(g => g.id === e.target);
      return !sourceIsGroup && !targetIsGroup;
    })
    .map(e => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    }));

  const mergedOptions: Record<string, string> = {
    ...BASE_ELK_OPTIONS,
    ...preset.elkOptions,
  };

  const elkGraph = {
    id: 'root',
    layoutOptions: mergedOptions,
    children: rootElkNodes,
    edges: elkEdges,
  };

  try {
    const layouted = await elk.layout(elkGraph);

    const positionMap = new Map<string, { x: number; y: number }>();
    const sizeMap = new Map<string, { width?: number; height?: number }>();

    function extractPositions(
      elkNodes: Array<{
        id: string;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        children?: Array<{
          id: string;
          x?: number;
          y?: number;
          width?: number;
          height?: number;
        }>;
      }>,
      parentX: number = 0,
      parentY: number = 0
    ) {
      for (const elkNode of elkNodes ?? []) {
        const absoluteX = (elkNode.x ?? 0) + parentX;
        const absoluteY = (elkNode.y ?? 0) + parentY;
        positionMap.set(elkNode.id, { x: absoluteX, y: absoluteY });
        sizeMap.set(elkNode.id, { width: elkNode.width, height: elkNode.height });
        
        if (elkNode.children && elkNode.children.length > 0) {
          extractPositions(elkNode.children, absoluteX, absoluteY);
        }
      }
    }

    extractPositions(layouted.children ?? []);

    return nodes.map(node => {
      const newPos = positionMap.get(node.id);
      const size = sizeMap.get(node.id);
      if (!newPos) return node;
      
      const isGroup = node.type === 'group' || node.type === 'groupNode';
      
      if (isGroup) {
        return {
          ...node,
          position: newPos,
          style: {
            ...node.style,
            width: size?.width ?? node.width ?? DEFAULT_GROUP_WIDTH,
            height: size?.height ?? node.height ?? DEFAULT_GROUP_HEIGHT,
          },
        };
      }
      
      return {
        ...node,
        position: newPos,
      };
    });
  } catch (error) {
    console.error('[AutoLayout] ELK layout failed:', error);
    return nodes;
  }
}