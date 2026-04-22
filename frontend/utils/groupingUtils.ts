export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function normalizeSelectionRect(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): SelectionRect {
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  return { x, y, width, height };
}