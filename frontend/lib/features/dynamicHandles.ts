import logger from '@/lib/logger';
/**
 * @feature DynamicHandleSelection
 * @protected true
 * @description Dynamically selects edge source/target handles based on 
 *   relative node positions. Source handle is on the side facing the target.
 *   Target handle is on the side facing the source. Recalculates on every 
 *   node position change (drag, layout, programmatic move).
 * 
 * @do-not-modify Without explicit instruction from the user.
 * @do-not-delete This file implements core edge routing behavior.
 * @affects SimpleFloatingEdge, useAutoLayout, elkLayoutService
 * 
 * @last-updated 2026-05-27
 */

import { Position } from 'reactflow';

export type HandleSide = 'top' | 'right' | 'bottom' | 'left';

export interface NodeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DynamicHandleResult {
  sourcePosition: Position;
  targetPosition: Position;
}

/**
 * Given two node rects, returns which handle sides to use for source and target.
 * The handle position matches the direction of the connection:
 * - bottom handle for downward connections (target below source)
 * - top handle for upward connections (target above source)
 * Falls back to horizontal handles when nodes are on the same level.
 */
export const VERTICAL_BIAS = 1.5;

export function getDynamicHandles(
  sourceRect: NodeRect,
  targetRect: NodeRect,
  edgeId?: string,
  sourceId?: string,
  targetId?: string
): DynamicHandleResult {
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const debug = process.env.NEXT_PUBLIC_DEBUG_HANDLES === 'true';

  let dx = 0;
  let dy = 0;
  let sourceCX = 0;
  let sourceCY = 0;
  let targetCX = 0;
  let targetCY = 0;
  
  try {
    sourceCX = sourceRect.x + sourceRect.width / 2;
    sourceCY = sourceRect.y + sourceRect.height / 2;
    targetCX = targetRect.x + targetRect.width / 2;
    targetCY = targetRect.y + targetRect.height / 2;
    
    if (isNaN(sourceCX) || isNaN(sourceCY) || isNaN(targetCX) || isNaN(targetCY)) {
      throw new Error('Invalid rect');
    }

    dx = targetCX - sourceCX;
    dy = targetCY - sourceCY;
    
    // Normalize values extremely close to 0 to prevent floating-point rounding
    // differences from flipping signs during axis-aligned coordinate movements.
    if (Math.abs(dx) < 1e-9) dx = 0;
    if (Math.abs(dy) < 1e-9) dy = 0;
  } catch {
    return { sourcePosition: Position.Right, targetPosition: Position.Left };
  }

  let sourcePosition = Position.Right;
  let targetPosition = Position.Left;
  let dominantAxis = 'horizontal';

  // Compare edge-to-edge gaps rather than center-to-center deltas.
  // This ensures handles are placed on the sides closest to each other,
  // even when nodes are offset on the opposite axis.
  const sourceBottom = sourceRect.y + sourceRect.height;
  const sourceRight = sourceRect.x + sourceRect.width;
  const targetBottom = targetRect.y + targetRect.height;
  const targetRight = targetRect.x + targetRect.width;

  const gapBottomToTop = targetRect.y - sourceBottom;   // positive if target is below
  const gapTopToBottom = sourceRect.y - targetBottom;   // positive if target is above
  const gapRightToLeft = targetRect.x - sourceRight;    // positive if target is to the right
  const gapLeftToRight = sourceRect.x - targetRight;    // positive if target is to the left

  const vertGap = Math.max(gapBottomToTop, gapTopToBottom);
  const horizGap = Math.max(gapRightToLeft, gapLeftToRight);

  if (vertGap < 0 && horizGap < 0) {
    // Both axes overlap — fall back to center-distance comparison
    if (Math.abs(dy) > Math.abs(dx) / VERTICAL_BIAS) {
      dominantAxis = 'vertical';
      if (dy > 0) { sourcePosition = Position.Bottom; targetPosition = Position.Top; }
      else { sourcePosition = Position.Top; targetPosition = Position.Bottom; }
    } else {
      dominantAxis = 'horizontal';
      if (dx > 0 || (dx === 0 && dy >= 0)) { sourcePosition = Position.Right; targetPosition = Position.Left; }
      else { sourcePosition = Position.Left; targetPosition = Position.Right; }
    }
  } else if (vertGap < 0) {
    // Vertical overlap — use horizontal handles
    dominantAxis = 'horizontal';
    if (dx > 0 || (dx === 0 && dy >= 0)) { sourcePosition = Position.Right; targetPosition = Position.Left; }
    else { sourcePosition = Position.Left; targetPosition = Position.Right; }
  } else if (horizGap < 0) {
    // Horizontal overlap — use vertical handles
    dominantAxis = 'vertical';
    if (dy > 0) { sourcePosition = Position.Bottom; targetPosition = Position.Top; }
    else { sourcePosition = Position.Top; targetPosition = Position.Bottom; }
  } else {
    // Both gaps are positive — use the axis with closer facing edges
    const useVertical = vertGap <= horizGap * VERTICAL_BIAS;
    dominantAxis = useVertical ? 'vertical' : 'horizontal';
    if (useVertical) {
      if (dy > 0) { sourcePosition = Position.Bottom; targetPosition = Position.Top; }
      else { sourcePosition = Position.Top; targetPosition = Position.Bottom; }
    } else {
      if (dx > 0 || (dx === 0 && dy >= 0)) { sourcePosition = Position.Right; targetPosition = Position.Left; }
      else { sourcePosition = Position.Left; targetPosition = Position.Right; }
    }
  }

  if (debug) {
    logger.info('[DynamicHandles] Calculation:', {
      edgeId,
      sourceId,
      targetId,
      nodeCenter: {
        source: { x: sourceCX, y: sourceCY },
        target: { x: targetCX, y: targetCY },
      },
      dx,
      dy,
      dominantAxis,
    });

    logger.info('[DynamicHandles] Selected handles:', {
      edgeId,
      sourceId,
      targetId,
      sourcePosition,
      targetPosition,
    });

    logger.info('[DynamicHandles] Performance:', {
      edgeId,
      elapsedMs: (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start,
    });
  }

  return { sourcePosition, targetPosition };
}

/**
 * Gets the XY coordinate of a handle on a node rect for a given Position side.
 * Right and Bottom handles are shifted outward (12px) for cleaner edge routing.
 * Used by SimpleFloatingEdge to compute exact edge start/end points.
 */
const OUTER_OFFSET = 12;

function lineIntersectsRect(
  x1: number, y1: number,
  x2: number, y2: number,
  rx: number, ry: number, rw: number, rh: number,
): boolean {
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

export function getObstacleAwareHandles(
  sourceRect: NodeRect,
  targetRect: NodeRect,
  nodeRects?: Map<string, { id: string; x: number; y: number; w: number; h: number }>,
  excludedNodeIds?: Set<string>,
  edgeId?: string,
  sourceId?: string,
  targetId?: string,
): DynamicHandleResult {
  const defaultHandles = getDynamicHandles(sourceRect, targetRect, edgeId, sourceId, targetId);

  if (!nodeRects || nodeRects.size === 0) {
    return defaultHandles;
  }

  const allPairs: Array<{ source: Position; target: Position }> = [
    { source: Position.Right, target: Position.Left },
    { source: Position.Left, target: Position.Right },
    { source: Position.Top, target: Position.Bottom },
    { source: Position.Bottom, target: Position.Top },
  ];

  const rects = nodeRects!;
  const excluded = excludedNodeIds ?? new Set();

  function scorePair(sp: Position, tp: Position): { collisions: number; pathLen: number } {
    // No type passed — compute handle coordinates at the node edge center,
    // matching getSimpleHandlePosition used for actual edge drawing.
    const sh = getHandleCoordinate(sourceRect, sp);
    const th = getHandleCoordinate(targetRect, tp);
    const sx = sh.x, sy = sh.y, tx = th.x, ty = th.y;
    const sourceIsH = sp === Position.Left || sp === Position.Right;
    const targetIsH = tp === Position.Left || tp === Position.Right;

    let waypoints: Array<{ x: number; y: number }>;
    if (sourceIsH && targetIsH) {
      const mx = (sx + tx) / 2;
      waypoints = [{ x: sx, y: sy }, { x: mx, y: sy }, { x: mx, y: ty }, { x: tx, y: ty }];
    } else if (!sourceIsH && !targetIsH) {
      const my = (sy + ty) / 2;
      waypoints = [{ x: sx, y: sy }, { x: sx, y: my }, { x: tx, y: my }, { x: tx, y: ty }];
    } else if (sourceIsH) {
      waypoints = [{ x: sx, y: sy }, { x: tx, y: sy }, { x: tx, y: ty }];
    } else {
      waypoints = [{ x: sx, y: sy }, { x: sx, y: ty }, { x: tx, y: ty }];
    }

    let collisions = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      for (const [nid, rect] of rects) {
        if (excluded.has(nid)) continue;
        if (lineIntersectsRect(waypoints[i].x, waypoints[i].y, waypoints[i + 1].x, waypoints[i + 1].y, rect.x, rect.y, rect.w, rect.h)) {
          collisions++;
        }
      }
    }

    let pathLen = 0;
    for (let i = 1; i < waypoints.length; i++) {
      pathLen += Math.abs(waypoints[i].x - waypoints[i - 1].x) + Math.abs(waypoints[i].y - waypoints[i - 1].y);
    }

    return { collisions, pathLen };
  }

  const defaultScore = scorePair(defaultHandles.sourcePosition, defaultHandles.targetPosition);
  if (defaultScore.collisions === 0) {
    return defaultHandles;
  }

  let best = { ...defaultScore, pair: defaultHandles };

  for (const pair of allPairs) {
    if (pair.source === defaultHandles.sourcePosition && pair.target === defaultHandles.targetPosition) continue;
    const score = scorePair(pair.source, pair.target);
    if (score.collisions < best.collisions || (score.collisions === best.collisions && score.pathLen < best.pathLen)) {
      best = { ...score, pair: { sourcePosition: pair.source, targetPosition: pair.target } };
    }
  }

  return best.pair;
}

export function getHandleCoordinate(
  rect: NodeRect,
  position: Position,
  type?: 'source' | 'target',
  isBidirectional: boolean = true
): { x: number; y: number } {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  
  let offset = 0;
  if (isBidirectional && type) {
    if (type === 'source') {
      offset = 12;
    } else if (type === 'target') {
      offset = -12;
    }
  }

  switch (position) {
    case Position.Top:    return { x: cx + offset, y: rect.y - OUTER_OFFSET };
    case Position.Bottom: return { x: cx + offset, y: rect.y + rect.height + OUTER_OFFSET };
    case Position.Left:   return { x: rect.x - OUTER_OFFSET, y: cy + offset };
    case Position.Right:  return { x: rect.x + rect.width + OUTER_OFFSET, y: cy + offset };
    default:              return { x: cx, y: cy };
  }
}
