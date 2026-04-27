import { Position, Node } from 'reactflow';

function getNodeIntersection(a: Node, b: Node) {
  const ax = (a.position?.x ?? 0) + (a.width ?? 150) / 2;
  const ay = (a.position?.y ?? 0) + (a.height ?? 50) / 2;
  const bx = (b.position?.x ?? 0) + (b.width ?? 150) / 2;
  const by = (b.position?.y ?? 0) + (b.height ?? 50) / 2;

  const w = (a.width ?? 150) / 2;
  const h = (a.height ?? 50) / 2;

  const xx1 = (bx - ax) / (2 * w) - (by - ay) / (2 * h);
  const yy1 = (bx - ax) / (2 * w) + (by - ay) / (2 * h);
  const a2 = 1 / (Math.abs(xx1) + Math.abs(yy1));
  const xx3 = a2 * xx1;
  const yy3 = a2 * yy1;

  return {
    x: w * (xx3 + yy3) + ax,
    y: h * (-xx3 + yy3) + ay,
  };
}

function getEdgePosition(node: Node, pt: { x: number; y: number }) {
  const nx = Math.round(node.position?.x ?? 0);
  const ny = Math.round(node.position?.y ?? 0);
  const w = node.width ?? 150;
  const h = node.height ?? 50;
  const px = Math.round(pt.x);
  const py = Math.round(pt.y);

  if (px <= nx + 1) return Position.Left;
  if (px >= nx + w - 1) return Position.Right;
  if (py <= ny + 1) return Position.Top;
  if (py >= ny + h - 1) return Position.Bottom;
  return Position.Top;
}

export function getEdgeParams(source: Node, target: Node) {
  const sp = getNodeIntersection(source, target);
  const tp = getNodeIntersection(target, source);

  return {
    sx: sp.x,
    sy: sp.y,
    tx: tp.x,
    ty: tp.y,
    sourcePos: getEdgePosition(source, sp),
    targetPos: getEdgePosition(target, tp),
  };
}
