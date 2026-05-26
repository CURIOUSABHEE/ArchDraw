'use client';

import { useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';
import { useTheme } from '@/lib/theme';

interface FloatingHandlesProps {
  nodeId: string;
  rightOffset?: number;
  leftOffset?: number;
}

/**
 * FloatingHandles provides visible connection handles on the LEFT (target)
 * and RIGHT (source) edges of the node, vertically centered.
 */
export function FloatingHandles({
  nodeId,
  rightOffset = 14,
  leftOffset = -14,
}: FloatingHandlesProps) {
  const updateNodeInternals = useUpdateNodeInternals();
  const { isDark } = useTheme();

  useEffect(() => {
    updateNodeInternals(nodeId);
  }, [nodeId, updateNodeInternals]);

  const handleStyle = {
    width: 8,
    height: 8,
    background: '#fff',
    border: `1.5px solid ${isDark ? '#4a4a4a' : '#595959'}`,
    borderRadius: '2px',
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ ...handleStyle, left: leftOffset, top: '50%', transform: 'translateY(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ ...handleStyle, right: -rightOffset, top: '50%', transform: 'translateY(-50%)' }}
      />
    </>
  );
}
