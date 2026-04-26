import { Position } from 'reactflow';

export interface EdgePositions {
  sourcePos: Position;
  targetPos: Position;
}

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
  switch (position) {
    case Position.Left:
      return { x: nodeX, y: nodeY + height / 2 };
    case Position.Right:
      return { x: nodeX + width, y: nodeY + height / 2 };
    case Position.Top:
      return { x: nodeX + width / 2, y: nodeY };
    case Position.Bottom:
      return { x: nodeX + width / 2, y: nodeY + height };
  }
}