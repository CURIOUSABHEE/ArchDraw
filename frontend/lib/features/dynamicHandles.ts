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
 * @last-updated 2026-05-26
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
 * 
 * @param sourceRect - Rectangle defining the source node's position and dimensions
 * @param targetRect - Rectangle defining the target node's position and dimensions
 * @param edgeId - Optional edge ID for debug logging
 * @param sourceId - Optional source node ID for debug logging
 * @param targetId - Optional target node ID for debug logging
 */
export function getDynamicHandles(
  sourceRect: NodeRect,
  targetRect: NodeRect,
  edgeId?: string,
  sourceId?: string,
  targetId?: string,
): DynamicHandleResult {
  const DEBUG_HANDLES = process.env.NEXT_PUBLIC_DEBUG_HANDLES === 'true';
  const startTime = DEBUG_HANDLES ? performance.now() : 0;

  try {
    const sourceCX = sourceRect.x + sourceRect.width / 2;
    const sourceCY = sourceRect.y + sourceRect.height / 2;
    const targetCX = targetRect.x + targetRect.width / 2;
    const targetCY = targetRect.y + targetRect.height / 2;

    const dx = targetCX - sourceCX;
    const dy = targetCY - sourceCY;

    const dominantAxis = Math.abs(dx) >= Math.abs(dy) ? 'horizontal' : 'vertical';

    if (DEBUG_HANDLES) {
      console.log('[DynamicHandles] Calculation:', {
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
    }

    let sourcePosition: Position;
    let targetPosition: Position;

    if (Math.abs(dx) >= Math.abs(dy)) {
      if (dx >= 0) {
        sourcePosition = Position.Right;
        targetPosition = Position.Left;
      } else {
        sourcePosition = Position.Left;
        targetPosition = Position.Right;
      }
    } else {
      if (dy >= 0) {
        sourcePosition = Position.Bottom;
        targetPosition = Position.Top;
      } else {
        sourcePosition = Position.Top;
        targetPosition = Position.Bottom;
      }
    }

    if (DEBUG_HANDLES) {
      const elapsed = performance.now() - startTime;
      console.log('[DynamicHandles] Selected handles:', {
        edgeId,
        sourceId,
        targetId,
        sourcePosition,
        targetPosition,
      });
      console.log('[DynamicHandles] Performance:', { edgeId, elapsedMs: elapsed });
      if (elapsed > 1) {
        console.warn('[DynamicHandles] Warning: calculation exceeded 1ms', { edgeId, elapsedMs: elapsed });
      }
    }

    return { sourcePosition, targetPosition };
  } catch (error) {
    const elapsed = DEBUG_HANDLES ? performance.now() - startTime : 0;
    console.error('[DynamicHandles] Error calculating handle positions:', {
      edgeId,
      sourceId,
      targetId,
      sourceRect,
      targetRect,
      error: error instanceof Error ? error.message : String(error),
      elapsedMs: elapsed,
    });
    return { sourcePosition: Position.Right, targetPosition: Position.Left };
  }
}

/**
 * Gets the XY coordinate of a handle on a node rect for a given Position side.
 * Used by SimpleFloatingEdge to compute exact edge start/end points.
 */
export function getHandleCoordinate(
  rect: NodeRect,
  position: Position,
): { x: number; y: number } {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;

  switch (position) {
    case Position.Top:    return { x: cx, y: rect.y };
    case Position.Bottom: return { x: cx, y: rect.y + rect.height };
    case Position.Left:   return { x: rect.x, y: cy };
    case Position.Right:  return { x: rect.x + rect.width, y: cy };
  }
}
