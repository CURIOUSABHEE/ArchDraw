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

  const currentEdge = (edges || []).find(e => e.id === edgeId);
  const isSource = currentEdge?.source === nodeId;
  
  // Find all edges that connect to this node on the given side
  const connectedEdges = (edges || []).map(e => {
    if (e.source !== nodeId && e.target !== nodeId) return null;
    
    const sNode = nodeInternals.get(e.source);
    const tNode = nodeInternals.get(e.target);
    if (!sNode || !tNode) return null;
    
    const sCenter = getNodeCenter(sNode);
    const tCenter = getNodeCenter(tNode);
    
    const positions = getSimpleEdgePositions(sCenter.cx, sCenter.cy, tCenter.cx, tCenter.cy);
    
    if (e.source === nodeId && positions.sourcePos === side) {
      return { edge: e, otherNodeCenter: tCenter };
    }
    if (e.target === nodeId && positions.targetPos === side) {
      return { edge: e, otherNodeCenter: sCenter };
    }
    
    return null;
  }).filter(Boolean) as { edge: Edge; otherNodeCenter: ReturnType<typeof getNodeCenter> }[];
  
  // Always apply a baseline offset to separate outgoing (source) from incoming (target)
  // connections on the same node, even when there's only one edge per side — this
  // prevents the visual "merged line" effect when edges enter and exit at the same
  // centerpoint on opposite sides.
  const baseOffset = isSource ? spacing * 0.5 : -spacing * 0.5;
  if (connectedEdges.length <= 1) return baseOffset;

  // Sort connected edges by other node's coordinate along the axis of the side:
  // - For Left/Right: perpendicular axis is Y, so sort by cy
  // - For Top/Bottom: perpendicular axis is X, so sort by cx
  const isHorizontalSide = side === Position.Left || side === Position.Right;
  
  connectedEdges.sort((a, b) => {
    const valA = isHorizontalSide ? a.otherNodeCenter.cy : a.otherNodeCenter.cx;
    const valB = isHorizontalSide ? b.otherNodeCenter.cy : b.otherNodeCenter.cx;
    
    if (Math.abs(valA - valB) < 0.01) {
      // Stable tie-break by edge ID
      return a.edge.id.localeCompare(b.edge.id);
    }
    return valA - valB;
  });

  const index = connectedEdges.findIndex(e => e.edge.id === edgeId);
  if (index === -1) return 0;

  return (index - (connectedEdges.length - 1) / 2) * spacing;
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