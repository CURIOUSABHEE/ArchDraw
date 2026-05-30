'use client';

import { useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';

interface FloatingHandlesProps {
  nodeId: string;
  rightOffset?: number;
  leftOffset?: number;
  topOffset?: number;
  bottomOffset?: number;
}

export function FloatingHandles({
  nodeId,
  rightOffset = 24,
  leftOffset = -14,
  topOffset = -14,
  bottomOffset = 24,
}: FloatingHandlesProps) {
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(nodeId);
  }, [nodeId, updateNodeInternals]);

  const handleStyle = {
    opacity: 0,
    width: 8,
    height: 8,
    border: 'none',
    background: 'transparent',
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        style={{ ...handleStyle, left: leftOffset, top: 'calc(50% - 6px)', transform: 'translateY(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="source-left"
        style={{ ...handleStyle, left: leftOffset, top: 'calc(50% + 6px)', transform: 'translateY(-50%)' }}
      />

      <Handle
        type="target"
        position={Position.Right}
        id="target-right"
        style={{ ...handleStyle, right: -rightOffset, top: 'calc(50% + 6px)', transform: 'translateY(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        style={{ ...handleStyle, right: -rightOffset, top: 'calc(50% - 6px)', transform: 'translateY(-50%)' }}
      />

      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        style={{ ...handleStyle, top: topOffset, left: 'calc(50% + 6px)', transform: 'translateX(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="source-top"
        style={{ ...handleStyle, top: topOffset, left: 'calc(50% - 6px)', transform: 'translateX(-50%)' }}
      />

      <Handle
        type="target"
        position={Position.Bottom}
        id="target-bottom"
        style={{ ...handleStyle, bottom: -bottomOffset, left: 'calc(50% - 6px)', transform: 'translateX(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        style={{ ...handleStyle, bottom: -bottomOffset, left: 'calc(50% + 6px)', transform: 'translateX(-50%)' }}
      />

      {/* Dummy handles for edges that don't specify sourceHandle/targetHandle.
          React Flow will drop edges if it can't find a matching handle.
          Our SimpleFloatingEdge component calculates the actual routing dynamically,
          so these just need to exist to satisfy React Flow's validation. */}
      <Handle type="source" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none', position: 'absolute', top: '50%', left: '50%' }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none', position: 'absolute', top: '50%', left: '50%' }} />
    </>
  );
}
