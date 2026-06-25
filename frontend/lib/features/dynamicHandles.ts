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

  const overlapsHorizontally = (sourceRect.x < targetRect.x + targetRect.width) &&
                                (targetRect.x < sourceRect.x + sourceRect.width);

  const horizontalDist = Math.abs(dx);
  // Stricter rules for changing direction: strongly prefer horizontal (left/right) 
  // handles by requiring a much larger vertical distance to switch.
  const verticalThreshold = overlapsHorizontally
    ? Math.max(horizontalDist * 0.2, 20)
    : Math.max(horizontalDist * 0.5, 40);

  let sourcePosition = Position.Right;
  let targetPosition = Position.Left;
  let dominantAxis = 'horizontal';

  if (dy > verticalThreshold) {
    dominantAxis = 'vertical';
    sourcePosition = Position.Bottom;
    targetPosition = Position.Top;
  } else if (dy < -verticalThreshold) {
    dominantAxis = 'vertical';
    sourcePosition = Position.Top;
    targetPosition = Position.Bottom;
  } else {
    dominantAxis = 'horizontal';
    // Use symmetric tie-breaker based on dy when dx is exactly 0
    if (dx > 0 || (dx === 0 && dy >= 0)) {
      sourcePosition = Position.Right;
      targetPosition = Position.Left;
    } else {
      sourcePosition = Position.Left;
      targetPosition = Position.Right;
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
