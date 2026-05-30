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
 * Decision is based on the center-to-center vector between the two nodes.
 * The dominant axis (horizontal vs vertical) determines the handle side.
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
  } catch (e) {
    return { sourcePosition: Position.Right, targetPosition: Position.Left };
  }

  let sourcePosition = Position.Right;
  let targetPosition = Position.Left;
  let dominantAxis = 'horizontal';

  // Determine dominant axis
  if (Math.abs(dx) >= Math.abs(dy)) {
    dominantAxis = 'horizontal';
    if (dx >= 0) {
      sourcePosition = Position.Right;
      targetPosition = Position.Left;
    } else {
      sourcePosition = Position.Left;
      targetPosition = Position.Right;
    }
  } else {
    dominantAxis = 'vertical';
    if (dy >= 0) {
      sourcePosition = Position.Bottom;
      targetPosition = Position.Top;
    } else {
      sourcePosition = Position.Top;
      targetPosition = Position.Bottom;
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
 * Used by SimpleFloatingEdge to compute exact edge start/end points.
 */
export function getHandleCoordinate(
  rect: NodeRect,
  position: Position,
  type?: 'source' | 'target'
): { x: number; y: number } {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  
  let offset = 0;
  if (type === 'source') {
    switch (position) {
      case Position.Right:  offset = -6; break;
      case Position.Left:   offset = 6; break;
      case Position.Top:    offset = -6; break;
      case Position.Bottom: offset = 6; break;
    }
  } else if (type === 'target') {
    switch (position) {
      case Position.Right:  offset = 6; break;
      case Position.Left:   offset = -6; break;
      case Position.Top:    offset = 6; break;
      case Position.Bottom: offset = -6; break;
    }
  }

  switch (position) {
    case Position.Top:    return { x: cx + offset, y: rect.y - 14 };
    case Position.Bottom: return { x: cx + offset, y: rect.y + rect.height + 24 };
    case Position.Left:   return { x: rect.x - 14, y: cy + offset };
    case Position.Right:  return { x: rect.x + rect.width + 24, y: cy + offset };
    default:              return { x: cx, y: cy };
  }
}
