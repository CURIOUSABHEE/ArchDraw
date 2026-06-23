import { Edge, Node, Position } from 'reactflow';

export interface EdgePositions {
  sourcePos: Position;
  targetPos: Position;
}

// Align with FloatingHandles.tsx defaults for accurate edge attachment
const HANDLE_OFFSETS = {
  [Position.Left]: 0,
  [Position.Right]: 0,
  [Position.Top]: 0,
  [Position.Bottom]: 0,
};

export function getNodeCenter(node: Node) {
  const x = node.positionAbsolute?.x ?? node.position.x;
  const y = node.positionAbsolute?.y ?? node.position.y;
  const width = node.width ?? 160;
  const height = node.height ?? 80;
  return { cx: x + width / 2, cy: y + height / 2, x, y, width, height };
}

export function getSimpleEdgePositions(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): EdgePositions {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;

  let sourcePos: Position;
  let targetPos: Position;

  const horizontalDist = Math.abs(dx);
  const verticalThreshold = Math.max(horizontalDist * 0.25, 30);

  if (dy > verticalThreshold) {
    sourcePos = Position.Bottom;
    targetPos = Position.Top;
  } else if (dy < -verticalThreshold) {
    sourcePos = Position.Top;
    targetPos = Position.Bottom;
  } else {
    if (dx > 0) {
      sourcePos = Position.Right;
      targetPos = Position.Left;
    } else {
      sourcePos = Position.Left;
      targetPos = Position.Right;
    }
  }

  return { sourcePos, targetPos };
}

export function getEdgeShiftOffset(
  nodeId: string,
  edgeId: string,
  side: Position,
  edges: Edge[],
  nodeInternals: Map<string, Node>,
  spacing: number = 15
): number {
  const node = nodeInternals.get(nodeId);
  if (!node) return 0;
  
  // Find all edges that connect to this node on the given side
  const connectedEdges = edges.map(e => {
    if (e.source !== nodeId && e.target !== nodeId) return null;
    
    const sNode = nodeInternals.get(e.source);
    const tNode = nodeInternals.get(e.target);
    if (!sNode || !tNode) return null;
    
    const sCenter = getNodeCenter(sNode);
    const tCenter = getNodeCenter(tNode);
    
    const positions = getSimpleEdgePositions(sCenter.cx, sCenter.cy, tCenter.cx, tCenter.cy);
    
    if (e.source === nodeId && positions.sourcePos === side) {
      return { edge: e, otherNodeCenter: tCenter, flow: 'out' };
    }
    if (e.target === nodeId && positions.targetPos === side) {
      return { edge: e, otherNodeCenter: sCenter, flow: 'in' };
    }
    
    return null;
  }).filter(Boolean) as { edge: Edge; otherNodeCenter: ReturnType<typeof getNodeCenter>; flow: 'in' | 'out' }[];
  
  if (connectedEdges.length <= 1) return 0;

  const inwardEdges = connectedEdges.filter(e => e.flow === 'in');
  const outwardEdges = connectedEdges.filter(e => e.flow === 'out');

  // If this side only has one type of flow, merge them all at the center
  if (inwardEdges.length === 0 || outwardEdges.length === 0) {
    return 0;
  }

  const edge = edges.find(e => e.id === edgeId);
  if (!edge) return 0;

  // Check for parallel edges between the exact same two nodes (regardless of direction)
  const parallelEdges = edges.filter(
    e => (e.source === edge.source && e.target === edge.target) || 
         (e.source === edge.target && e.target === edge.source)
  ).sort((a, b) => a.id.localeCompare(b.id));

  // Determine if there are bidirectional connections between source and target nodes, in which case we center the handles
  const forward = edges.filter(e => e.source === edge.source && e.target === edge.target);
  const reverse = edges.filter(e => e.source === edge.target && e.target === edge.source);
  const isBidirectionalConnection = forward.length > 0 && reverse.length > 0;

  if (isBidirectionalConnection) {
    return 0;
  }

  // If this specific edge is part of a parallel/bidirectional group, spread them evenly
  if (parallelEdges.length > 1) {
    const index = parallelEdges.findIndex(e => e.id === edgeId);
    // Spread them by spacing * 1.5 around the center
    return (index - (parallelEdges.length - 1) / 2) * spacing * 1.5;
  }

  // Otherwise, use the geometric calculation to untangle bundles of different nodes
  const getAvgCoord = (items: typeof inwardEdges) => {
    let sum = 0;
    for (const item of items) {
      sum += (side === Position.Left || side === Position.Right) 
          ? item.otherNodeCenter.cy 
          : item.otherNodeCenter.cx;
    }
    return sum / items.length;
  };

  const avgIn = getAvgCoord(inwardEdges);
  const avgOut = getAvgCoord(outwardEdges);

  const isCurrentInward = inwardEdges.some(e => e.edge.id === edgeId);
  
  if (avgIn <= avgOut) {
    return isCurrentInward ? -spacing : spacing;
  } else {
    return isCurrentInward ? spacing : -spacing;
  }
}

export function getSimpleHandlePosition(
  nodeX: number,
  nodeY: number,
  width: number,
  height: number,
  position: Position,
  shiftOffset: number = 0
): { x: number; y: number } {
  const offset = HANDLE_OFFSETS[position] || 0;
  const outerOffset = 12;

  switch (position) {
    case Position.Left:
      return { x: nodeX - outerOffset + offset, y: nodeY + height / 2 + shiftOffset };
    case Position.Right:
      return { x: nodeX + width + outerOffset + offset, y: nodeY + height / 2 + shiftOffset };
    case Position.Top:
      return { x: nodeX + width / 2 + shiftOffset, y: nodeY - outerOffset + offset };
    case Position.Bottom:
      return { x: nodeX + width / 2 + shiftOffset, y: nodeY + height + outerOffset + offset };
  }
}

export function getHandleOffset(position: Position): number {
  return HANDLE_OFFSETS[position] || 0;
}