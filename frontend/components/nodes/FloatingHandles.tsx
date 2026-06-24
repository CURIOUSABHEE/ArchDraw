'use client';

import { Handle, Position, useNodeId } from 'reactflow';
import { useNodeHandles } from '@/hooks/useNodeHandles';

const ghost: React.CSSProperties = {
  opacity: 0,
  width: 1,
  height: 1,
  border: 'none',
  background: 'transparent',
  pointerEvents: 'none',
  minWidth: 0,
  minHeight: 0,
};


/**
 * FloatingHandles — minimal, centered-by-default handle rendering.
 *
 * Rules:
 *  • Default: 4 ghost handles (one centered per side: top/right/bottom/left).
 *    Allows new connections to be dragged from any side.
 *  • A fallback handle is hidden when that side already has an explicit edge-driven
 *    handle — preventing duplicates and keeping the count at exactly 4.
 *  • 2 edges on a side (source + target both used) → offset ±12px so they don't overlap.
 *    In this case the fallback for that side is already suppressed.
 */
export function FloatingHandles() {
  const nodeId = useNodeId() ?? '';
  const needed = useNodeHandles(nodeId);

  // Per-side: do we need BOTH source and target? If so, we offset; otherwise center.
  const bothLeft   = needed.has('target-left')   && needed.has('source-left');
  const bothRight  = needed.has('target-right')  && needed.has('source-right');
  const bothTop    = needed.has('target-top')    && needed.has('source-top');
  const bothBottom = needed.has('target-bottom') && needed.has('source-bottom');

  return (
    <>
      {/* ── Default: 4 centered fallback handles (one per side) ────────── */}
      {/* Suppressed per-side once an explicit edge-driven handle covers it. */}
      {!needed.has('target-top')    && !needed.has('source-top')    && <Handle type="source" position={Position.Top}    style={{ ...ghost, top: 0,    left: '50%', transform: 'translate(-50%, -50%)' }} />}
      {!needed.has('target-right')  && !needed.has('source-right')  && <Handle type="source" position={Position.Right}  style={{ ...ghost, right: 0,  top: '50%',  transform: 'translate(50%, -50%)' }}  />}
      {!needed.has('target-bottom') && !needed.has('source-bottom') && <Handle type="source" position={Position.Bottom} style={{ ...ghost, bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' }}  />}
      {!needed.has('target-left')   && !needed.has('source-left')   && <Handle type="source" position={Position.Left}   style={{ ...ghost, left: 0,   top: '50%',  transform: 'translate(-50%, -50%)' }} />}

      {/* ── Left ─────────────────────────────────────────────────────────── */}
      {needed.has('target-left') && (
        <Handle
          type="target"
          position={Position.Left}
          id="target-left"
          style={{ ...ghost, left: 0, top: bothLeft ? 'calc(50% - 12px)' : '50%', transform: 'translate(-50%, -50%)' }}
        />
      )}
      {needed.has('source-left') && (
        <Handle
          type="source"
          position={Position.Left}
          id="source-left"
          style={{ ...ghost, left: 0, top: bothLeft ? 'calc(50% + 12px)' : '50%', transform: 'translate(-50%, -50%)' }}
        />
      )}

      {/* ── Right ────────────────────────────────────────────────────────── */}
      {needed.has('target-right') && (
        <Handle
          type="target"
          position={Position.Right}
          id="target-right"
          style={{ ...ghost, right: 0, top: bothRight ? 'calc(50% - 12px)' : '50%', transform: 'translate(50%, -50%)' }}
        />
      )}
      {needed.has('source-right') && (
        <Handle
          type="source"
          position={Position.Right}
          id="source-right"
          style={{ ...ghost, right: 0, top: bothRight ? 'calc(50% + 12px)' : '50%', transform: 'translate(50%, -50%)' }}
        />
      )}

      {/* ── Top ──────────────────────────────────────────────────────────── */}
      {needed.has('target-top') && (
        <Handle
          type="target"
          position={Position.Top}
          id="target-top"
          style={{ ...ghost, top: 0, left: bothTop ? 'calc(50% - 12px)' : '50%', transform: 'translate(-50%, -50%)' }}
        />
      )}
      {needed.has('source-top') && (
        <Handle
          type="source"
          position={Position.Top}
          id="source-top"
          style={{ ...ghost, top: 0, left: bothTop ? 'calc(50% + 12px)' : '50%', transform: 'translate(-50%, -50%)' }}
        />
      )}

      {/* ── Bottom ───────────────────────────────────────────────────────── */}
      {needed.has('target-bottom') && (
        <Handle
          type="target"
          position={Position.Bottom}
          id="target-bottom"
          style={{ ...ghost, bottom: 0, left: bothBottom ? 'calc(50% - 12px)' : '50%', transform: 'translate(-50%, 50%)' }}
        />
      )}
      {needed.has('source-bottom') && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="source-bottom"
          style={{ ...ghost, bottom: 0, left: bothBottom ? 'calc(50% + 12px)' : '50%', transform: 'translate(-50%, 50%)' }}
        />
      )}
    </>
  );
}
