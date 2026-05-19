'use client';

import { useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';
import { useTheme } from '@/lib/theme';

interface FloatingHandlesProps {
  nodeId: string;
  /**
   * Extra offset for right/bottom handles to clear shadows/backplates.
   * Default: 30px for right, 30px for bottom
   */
  rightOffset?: number;
  bottomOffset?: number;
  /**
   * Offset for left/top handles (negative values move outside).
   * Default: -15px for left, -15px for top
   */
  leftOffset?: number;
  topOffset?: number;
}

/**
 * FloatingHandles component provides 4 handles positioned outside the node
 * for use with floating edges. Handles are positioned to:
 * - Clear node borders and shadows
 * - Work with React Flow's internal connection calculations
 * - Support the floating edge approach from React Flow examples
 */
export function FloatingHandles({
  nodeId,
  rightOffset = 6,
  bottomOffset = 6,
  leftOffset = -12,
  topOffset = -6,
}: FloatingHandlesProps) {
  const updateNodeInternals = useUpdateNodeInternals();
  const { isDark } = useTheme();

  // Notify React Flow to re-measure handle positions after mount
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
      {/* Left side */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        style={{ ...handleStyle, left: leftOffset, top: '50%', transform: 'translateY(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="source-left"
        style={{ ...handleStyle, left: leftOffset, top: '50%', transform: 'translateY(-50%)' }}
      />

      {/* Right side */}
      <Handle
        type="target"
        position={Position.Right}
        id="target-right"
        style={{ ...handleStyle, right: -rightOffset, top: '50%', transform: 'translateY(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        style={{ ...handleStyle, right: -rightOffset, top: '50%', transform: 'translateY(-50%)' }}
      />

      {/* Top side */}
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        style={{ ...handleStyle, top: topOffset, left: '50%', transform: 'translateX(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="source-top"
        style={{ ...handleStyle, top: topOffset, left: '50%', transform: 'translateX(-50%)' }}
      />

      {/* Bottom side */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="target-bottom"
        style={{ ...handleStyle, bottom: -bottomOffset, left: '50%', transform: 'translateX(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        style={{ ...handleStyle, bottom: -bottomOffset, left: '50%', transform: 'translateX(-50%)' }}
      />
    </>
  );
}
