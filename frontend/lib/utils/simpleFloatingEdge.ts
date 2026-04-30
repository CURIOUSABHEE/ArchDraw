import { Position } from 'reactflow';

export interface EdgePositions {
  sourcePos: Position;
  targetPos: Position;
}

// Handle offsets to position them outside the node
// Left: negative to move outside
// Right/Bottom: positive to clear shadows/backplates (30px for extra clearance)
// Top: negative to move outside
const HANDLE_OFFSETS = {
  [Position.Left]: -15,
  [Position.Right]: 30,
  [Position.Top]: -15,
  [Position.Bottom]: 30,
};

export function getSimpleEdgePositions(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): EdgePositions {
  const xDiff = Math.abs(targetX - sourceX);
  const yDiff = Math.abs(targetY - sourceY);

  let sourcePos: Position;
  let targetPos: Position;

  if (xDiff >= yDiff) {
    if (targetX > sourceX) {
      sourcePos = Position.Right;
      targetPos = Position.Left;
    } else {
      sourcePos = Position.Left;
      targetPos = Position.Right;
    }
  } else {
    if (targetY > sourceY) {
      sourcePos = Position.Bottom;
      targetPos = Position.Top;
    } else {
      sourcePos = Position.Top;
      targetPos = Position.Bottom;
    }
  }

  return { sourcePos, targetPos };
}

export function getSimpleHandlePosition(
  nodeX: number,
  nodeY: number,
  width: number,
  height: number,
  position: Position
): { x: number; y: number } {
  const offset = HANDLE_OFFSETS[position] || 0;
  
  switch (position) {
    case Position.Left:
      return { x: nodeX + offset, y: nodeY + height / 2 };
    case Position.Right:
      return { x: nodeX + width + offset, y: nodeY + height / 2 };
    case Position.Top:
      return { x: nodeX + width / 2, y: nodeY + offset };
    case Position.Bottom:
      return { x: nodeX + width / 2, y: nodeY + height + offset };
  }
}

export function getHandleOffset(position: Position): number {
  return HANDLE_OFFSETS[position] || 0;
}