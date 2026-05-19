import { Edge, Node, Position } from 'reactflow';

export interface EdgePositions {
  sourcePos: Position;
  targetPos: Position;
}

// Align with FloatingHandles.tsx defaults for accurate edge attachment
const HANDLE_OFFSETS = {
  [Position.Left]: -12,
  [Position.Right]: 24,
  [Position.Top]: -12,
  [Position.Bottom]: 12,
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

  if (Math.abs(dx) > Math.abs(dy)) {
    // horizontal dominant
    if (dx > 0) {
      // Target is to the right of source
      sourcePos = Position.Right;
      targetPos = Position.Left;
    } else {
      // Target is to the left of source
      sourcePos = Position.Left;
      targetPos = Position.Right;
    }
  } else {
    // vertical dominant
    if (dy > 0) {
      // Target is below source
      sourcePos = Position.Bottom;
      targetPos = Position.Top;
    } else {
      // Target is above source
      sourcePos = Position.Top;
      targetPos = Position.Bottom;
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
  spacing: number = 10
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

  // We have both inward and outward edges on this side. Max 2 ports needed.
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
  
  // Assign shifts to avoid crossovers between the inward and outward bundles
  if (avgIn <= avgOut) {
    // Inward bundle is "above" or "left" of outward bundle
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

  switch (position) {
    case Position.Left:
      return { x: nodeX + offset, y: nodeY + height / 2 + shiftOffset };
    case Position.Right:
      return { x: nodeX + width + offset, y: nodeY + height / 2 + shiftOffset };
    case Position.Top:
      return { x: nodeX + width / 2 + shiftOffset, y: nodeY + offset };
    case Position.Bottom:
      return { x: nodeX + width / 2 + shiftOffset, y: nodeY + height + offset };
  }
}

export function getHandleOffset(position: Position): number {
  return HANDLE_OFFSETS[position] || 0;
}