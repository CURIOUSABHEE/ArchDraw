import { Edge, Node, Position } from 'reactflow';

export interface EdgePositions {
  sourcePos: Position;
  targetPos: Position;
}

// Align with FloatingHandles.tsx defaults for accurate edge attachment
// FloatingHandles: left:-14 (w:8 center=-10), right:-14 (w:8 center=+10),
// top:-14 (w:8 center=-10), bottom:-14 (w:8 center=+10)
const HANDLE_OFFSETS = {
  [Position.Left]: -10,
  [Position.Right]: 15,
  [Position.Top]: -10,
  [Position.Bottom]: 15,
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

  // Always merge incoming edges at center — no gap between them
  const isInward = connectedEdges.some(e => e.flow === 'in' && e.edge.id === edgeId);
  if (isInward) return 0;

  // Only space out outgoing edges that share a side with incoming edges
  const hasInward = connectedEdges.some(e => e.flow === 'in');

  const edge = edges.find(e => e.id === edgeId);
  if (!edge) return 0;

  // Check for parallel edges between the exact same two nodes (regardless of direction)
  const parallelEdges = edges.filter(
    e => (e.source === edge.source && e.target === edge.target) || 
         (e.source === edge.target && e.target === edge.source)
  ).sort((a, b) => a.id.localeCompare(b.id));

  // If this specific edge is part of a parallel/bidirectional group, spread them evenly
  if (parallelEdges.length > 1) {
    const index = parallelEdges.findIndex(e => e.id === edgeId);
    // Spread them by spacing * 1.5 around the center
    return (index - (parallelEdges.length - 1) / 2) * spacing * 1.5;
  }

  if (!hasInward) return 0;

  // Only split outward edges from the inward cluster
  return spacing;
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