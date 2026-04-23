import { Node, Edge } from 'reactflow';
import type { LayoutedNode, DiagramEdge, ValidatedDiagram } from './types';

function sanitizeParentRelationships(
  nodes: LayoutedNode[]
): LayoutedNode[] {
  const groupIds = new Set(
    nodes.filter(n => n.isGroup).map(n => n.id)
  );
  return nodes.map(node => {
    if (node.parentId && !groupIds.has(node.parentId)) {
      console.warn(
        `[Convert] Node ${node.id} has parentId ${node.parentId} but group not found — stripping`
      );
      return { ...node, parentId: undefined };
    }
    return node;
  });
}

export function convertToReactFlow(
  layouted: LayoutedNode[],
  validated: ValidatedDiagram
): { nodes: Node[]; edges: Edge[] } {
  const { edges: diagramEdges } = validated;
  const safeLayouted = sanitizeParentRelationships(layouted);

  // Sort nodes: groups first, then root nodes, then children
  const sortedNodes = [...safeLayouted].sort((a, b) => {
    if (a.isGroup && !b.isGroup) return -1;
    if (!a.isGroup && b.isGroup) return 1;
    if (!a.parentId && b.parentId) return -1;
    if (a.parentId && !b.parentId) return 1;
    return 0;
  });

  const rfNodes: Node[] = sortedNodes.map(node => {
    const isGroup = node.isGroup;

    const result: Node = {
      id: node.id,
      type: isGroup ? 'groupNode' : 'architectureNode',
      position: { x: node.x, y: node.y },
      parentId: node.parentId || undefined,
      data: {
        label: node.label,
        subtitle: node.subtitle || '',
        layer: node.layer as any,
        icon: node.icon || 'box',
        serviceType: node.serviceType as any || '',
        isGroup: node.isGroup || false,
        groupLabel: node.groupLabel || '',
        groupColor: node.groupColor || '',
      },
      width: node.width,
      height: node.height,
      zIndex: isGroup ? 0 : 1,
      extent: !!node.parentId ? 'parent' : undefined,
      style: isGroup ? { width: node.width, height: node.height } : undefined,
    };
    return result;
  });

  const rfEdges: Edge[] = diagramEdges.map((edge, idx) => {
    const asyncStyle = edge.async
      ? { stroke: '#f59e0b', strokeDasharray: '6 3' }
      : { stroke: '#64748b', strokeDasharray: '' };

    return {
      id: edge.id || `rf-${idx}`,
      source: edge.source,
      target: edge.target,
      sourceHandle: 'right',
      targetHandle: 'left',
      label: undefined,
      type: 'smoothstep',
      animated: edge.async,
      style: { ...asyncStyle, strokeWidth: 2 },
      markerEnd: 'arrowclosed' as any,
      data: { communicationType: edge.async ? 'async' : 'sync', pathType: 'smooth', label: undefined },
    };
  });

  return { nodes: rfNodes, edges: rfEdges };
}