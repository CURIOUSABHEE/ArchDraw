'use client';

import { useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';

interface FloatingHandlesProps {
  nodeId: string;
}

/**
 * FloatingHandles renders one invisible source+target handle per side.
 *
 * SimpleFloatingEdge computes all geometry independently — these handles
 * exist solely so React Flow does not drop edges that reference this node.
 * They are fully transparent, pointer-events: none, and positioned at the
 * exact centre of each edge so only ONE dot appears per side when hovered.
 */
export function FloatingHandles({ nodeId }: FloatingHandlesProps) {
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(nodeId);
  }, [nodeId, updateNodeInternals]);

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

  return (
    <>
      {/* Left — single centred handle pair */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        style={{ ...ghost, left: 0, top: '50%', transform: 'translate(-50%, -50%)' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="source-left"
        style={{ ...ghost, left: 0, top: '50%', transform: 'translate(-50%, -50%)' }}
      />

      {/* Right — single centred handle pair */}
      <Handle
        type="target"
        position={Position.Right}
        id="target-right"
        style={{ ...ghost, right: 0, top: '50%', transform: 'translate(50%, -50%)' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        style={{ ...ghost, right: 0, top: '50%', transform: 'translate(50%, -50%)' }}
      />

      {/* Top — single centred handle pair */}
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        style={{ ...ghost, top: 0, left: '50%', transform: 'translate(-50%, -50%)' }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="source-top"
        style={{ ...ghost, top: 0, left: '50%', transform: 'translate(-50%, -50%)' }}
      />

      {/* Bottom — single centred handle pair */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="target-bottom"
        style={{ ...ghost, bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        style={{ ...ghost, bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' }}
      />

      {/* Generic fallback handles for edges that don't specify a handleId */}
      <Handle
        type="source"
        position={Position.Top}
        style={{ ...ghost, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      />
      <Handle
        type="target"
        position={Position.Top}
        style={{ ...ghost, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      />
    </>
  );
}
