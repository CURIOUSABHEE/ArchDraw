import type { Node, Edge } from 'reactflow';
import type { LayoutPreset } from './layoutPresets';
import { getNodeShapeConfig } from '@/constants/nodeShapeConfig';
import logger from '@/lib/logger';
import { ELK_CONFIG } from '@/lib/config';

let elkInstance: any = null;
async function getELK() {
  if (!elkInstance) {
    const ELKModule = await import('elkjs/lib/elk.bundled.js');
    const ELK = ELKModule.default ?? ELKModule;
    elkInstance = new ELK();
  }
  return elkInstance as { layout: (graph: any) => Promise<any> };
}

const DEFAULT_GROUP_WIDTH = 400;
const DEFAULT_GROUP_HEIGHT = 300;



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
                'elk.portConstraints': 'FREE',
              },
            };
          })
      : [];
    
    const isGroupWithChildren = isGroup && children.length > 0;
    
    return {
      id: node.id,
      ...(isGroupWithChildren ? {} : { width: nodeWidth, height: nodeHeight }),
      layoutOptions: {
        ...(isGroupWithChildren
          ? {
              'elk.nodeSize.constraints': 'NODE_LABELS',
              'elk.padding': '[top=60, left=40, bottom=40, right=40]',
            }
          : {
              'elk.nodeSize.constraints': 'MINIMUM_SIZE',
              'elk.nodeSize.minimum': `${nodeWidth}, ${nodeHeight}`,
            }),
        'elk.portConstraints': 'FREE',
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
    ...ELK_CONFIG,
    ...preset.elkOptions,
  };

  const elkGraph = {
    id: 'root',
    layoutOptions: mergedOptions,
    children: rootElkNodes,
    edges: elkEdges,
  };

  try {
    const elk = await getELK();
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
        const w = size?.width ?? node.width ?? DEFAULT_GROUP_WIDTH;
        const h = size?.height ?? node.height ?? DEFAULT_GROUP_HEIGHT;
        return {
          ...node,
          position: newPos,
          width: w,
          height: h,
          style: {
            ...node.style,
            width: w,
            height: h,
          },
        };
      }
      
      if (node.parentId) {
        const parentPos = positionMap.get(node.parentId);
        if (parentPos) {
          return {
            ...node,
            position: {
              x: newPos.x - parentPos.x,
              y: newPos.y - parentPos.y,
            },
          };
        }
      }
      
      return {
        ...node,
        position: newPos,
      };
    });
  } catch (error) {
    logger.error('[AutoLayout] ELK layout failed:', error);
    return nodes;
  }
}
