import { useMemo } from 'react';
import { MarkerType, useStore, Position } from 'reactflow';
import type { Edge } from 'reactflow';
import { getSimpleEdgePositions, getSimpleHandlePosition } from '@/lib/utils/simpleFloatingEdge';
import { useCanvasTheme } from '@/lib/theme';

const EDGE_COLORS = {
  default: '#94a3b8',
  defaultDark: '#cbd5e1', // Slate-300 (whiter)
  overlap: '#1f2937',
  overlapDark: '#334155',
};

type NodeRect = { x: number; y: number; w: number; h: number };

function lineIntersectsRect(
  x1: number, y1: number,
  x2: number, y2: number,
  rx: number, ry: number, rw: number, rh: number,
): boolean {
  // Cohen-Sutherland outcodes
  const INSIDE = 0, LEFT = 1, RIGHT = 2, BOTTOM = 4, TOP = 8;
  const code = (x: number, y: number) => {
    let c = INSIDE;
    if (x < rx) c |= LEFT;
    else if (x > rx + rw) c |= RIGHT;
    if (y < ry) c |= TOP;
    else if (y > ry + rh) c |= BOTTOM;
    return c;
  };

  let c1 = code(x1, y1), c2 = code(x2, y2);

  while (true) {
    if (!(c1 | c2)) return true;
    if (c1 & c2) return false;
    const c = c1 || c2;
    let x = 0, y = 0;
    if (c & BOTTOM) { x = x1 + (x2 - x1) * (ry + rh - y1) / (y2 - y1); y = ry + rh; }
    else if (c & TOP) { x = x1 + (x2 - x1) * (ry - y1) / (y2 - y1); y = ry; }
    else if (c & RIGHT) { y = y1 + (y2 - y1) * (rx + rw - x1) / (x2 - x1); x = rx + rw; }
    else if (c & LEFT) { y = y1 + (y2 - y1) * (rx - x1) / (x2 - x1); x = rx; }
    if (c === c1) { x1 = x; y1 = y; c1 = code(x1, y1); }
    else { x2 = x; y2 = y; c2 = code(x2, y2); }
  }
}

function getSmoothStepWaypoints(
  sx: number, sy: number, sourcePos: Position,
  tx: number, ty: number, targetPos: Position,
): Array<{ x: number; y: number }> {
  const pts = [{ x: sx, y: sy }];
  const isHorizontal = sourcePos === Position.Left || sourcePos === Position.Right;
  if (isHorizontal) {
    const mx = (sx + tx) / 2;
    pts.push({ x: mx, y: sy });
    pts.push({ x: mx, y: ty });
  } else {
    const my = (sy + ty) / 2;
    pts.push({ x: sx, y: my });
    pts.push({ x: tx, y: my });
  }
  pts.push({ x: tx, y: ty });
  return pts;
}

export function useEdgeColors(edges: Edge[]): Edge[] {
  const nodeInternals = useStore((s) => s.nodeInternals);
  const { isDark } = useCanvasTheme();

  return useMemo(() => {
    const nodeRects = new Map<string, NodeRect>();
    for (const [id, node] of nodeInternals) {
      const pos = node.positionAbsolute ?? node.position;
      nodeRects.set(id, {
        x: pos.x,
        y: pos.y,
        w: node.width ?? 200,
        h: node.height ?? 80,
      });
    }

    const defaultColor = isDark ? EDGE_COLORS.defaultDark : EDGE_COLORS.default;
    const overlapColor = isDark ? EDGE_COLORS.overlapDark : EDGE_COLORS.overlap;

    return edges.map((edge) => {
      const src = nodeRects.get(edge.source);
      const tgt = nodeRects.get(edge.target);
      if (!src || !tgt) {
        return {
          ...edge,
          style: { ...edge.style, stroke: defaultColor, strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: defaultColor, width: 20, height: 20 },
          labelStyle: { ...edge.labelStyle, fill: defaultColor },
        };
      }

      const scx = src.x + src.w / 2;
      const scy = src.y + src.h / 2;
      const tcx = tgt.x + tgt.w / 2;
      const tcy = tgt.y + tgt.h / 2;

      const { sourcePos, targetPos } = getSimpleEdgePositions(scx, scy, tcx, tcy);
      const sh = getSimpleHandlePosition(src.x, src.y, src.w, src.h, sourcePos, 0);
      const th = getSimpleHandlePosition(tgt.x, tgt.y, tgt.w, tgt.h, targetPos, 0);

      const waypoints = getSmoothStepWaypoints(sh.x, sh.y, sourcePos, th.x, th.y, targetPos);

      let passesThroughNode = false;
      for (const [nid, nr] of nodeRects) {
        if (nid === edge.source || nid === edge.target) continue;
        for (let i = 0; i < waypoints.length - 1; i++) {
          if (lineIntersectsRect(waypoints[i].x, waypoints[i].y, waypoints[i + 1].x, waypoints[i + 1].y, nr.x, nr.y, nr.w, nr.h)) {
            passesThroughNode = true;
            break;
          }
        }
        if (passesThroughNode) break;
      }

      const color = passesThroughNode ? overlapColor : defaultColor;
      const labelColor = passesThroughNode ? (isDark ? '#475569' : '#000000') : defaultColor;

      return {
        ...edge,
        style: { ...edge.style, stroke: color, strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 20, height: 20 },
        labelStyle: { ...edge.labelStyle, fill: labelColor },
      };
    });
  }, [edges, nodeInternals, isDark]);
}

export function assignEdgeColors(edges: Edge[], isDark: boolean = true): Edge[] {
  const defaultColor = isDark ? EDGE_COLORS.defaultDark : EDGE_COLORS.default;
  return edges.map((edge) => ({
    ...edge,
    style: { ...edge.style, stroke: defaultColor, strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: defaultColor, width: 20, height: 20 },
    labelStyle: { ...edge.labelStyle, fill: defaultColor },
  }));
}
