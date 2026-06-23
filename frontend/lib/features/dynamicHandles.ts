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

    dx = Math.round((targetCX - sourceCX) * 1e6) / 1e6;
    dy = Math.round((targetCY - sourceCY) * 1e6) / 1e6;
  } catch {
    return { sourcePosition: Position.Right, targetPosition: Position.Left };
  }

  let sourcePosition = Position.Right;
  let targetPosition = Position.Left;
  let dominantAxis = 'horizontal';

  const horizontalDist = Math.abs(dx);
  const verticalThreshold = Math.max(horizontalDist * 0.25, 30);

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
    if (dx >= 0) {
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
