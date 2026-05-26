'use client';

import { useEffect, useMemo } from 'react';
import { Handle, Position, useUpdateNodeInternals, useStore, ReactFlowState } from 'reactflow';
import { useTheme } from '@/lib/theme';

interface FloatingHandlesProps {
  nodeId: string;
  rightOffset?: number;
  leftOffset?: number;
  topOffset?: number;
  bottomOffset?: number;
}

function calcHandleTop(
  nodeId: string,
  mode: 'incoming' | 'outgoing',
  nodeInternals: Map<string, any>,
  edges: any[]
): string {
  const thisNode = nodeInternals.get(nodeId);
  if (!thisNode) return '50%';

  const nodeY = thisNode.positionAbsolute?.y ?? thisNode.position.y ?? 0;
  const nodeH = thisNode.height ?? 80;
  const nodeCenterY = nodeY + nodeH / 2;

  const connectedEdges = edges.filter(e =>
    mode === 'incoming' ? e.target === nodeId : e.source === nodeId
  );
  if (connectedEdges.length === 0) return '50%';

  let totalShift = 0;
  let count = 0;

  for (const edge of connectedEdges) {
    const peerId = mode === 'incoming' ? edge.source : edge.target;
    const peer = nodeInternals.get(peerId);
    if (!peer) continue;
    const peerY = peer.positionAbsolute?.y ?? peer.position.y ?? 0;
    const peerH = peer.height ?? 80;
    totalShift += (peerY + peerH / 2) - nodeCenterY;
    count++;
  }

  if (count === 0) return '50%';

  const avgRelativeY = totalShift / count;
  const shiftPercent = Math.max(-30, Math.min(30, (avgRelativeY / (nodeH / 2)) * 30));
  return `${50 + shiftPercent}%`;
}

function calcHandleLeft(
  nodeId: string,
  mode: 'incoming' | 'outgoing',
  nodeInternals: Map<string, any>,
  edges: any[]
): string {
  const thisNode = nodeInternals.get(nodeId);
  if (!thisNode) return '50%';

  const nodeX = thisNode.positionAbsolute?.x ?? thisNode.position.x ?? 0;
  const nodeW = thisNode.width ?? 200;
  const nodeCenterX = nodeX + nodeW / 2;

  const connectedEdges = edges.filter(e =>
    mode === 'incoming' ? e.target === nodeId : e.source === nodeId
  );
  if (connectedEdges.length === 0) return '50%';

  let totalShift = 0;
  let count = 0;

  for (const edge of connectedEdges) {
    const peerId = mode === 'incoming' ? edge.source : edge.target;
    const peer = nodeInternals.get(peerId);
    if (!peer) continue;
    const peerX = peer.positionAbsolute?.x ?? peer.position.x ?? 0;
    const peerW = peer.width ?? 200;
    totalShift += (peerX + peerW / 2) - nodeCenterX;
    count++;
  }

  if (count === 0) return '50%';

  const avgRelativeX = totalShift / count;
  const shiftPercent = Math.max(-30, Math.min(30, (avgRelativeX / (nodeW / 2)) * 30));
  return `${50 + shiftPercent}%`;
}

export function FloatingHandles({
  nodeId,
  rightOffset = 24,
  leftOffset = -14,
  topOffset = -14,
  bottomOffset = 24,
}: FloatingHandlesProps) {
  const updateNodeInternals = useUpdateNodeInternals();
  const { isDark } = useTheme();

  const nodeInternals = useStore((s: ReactFlowState) => s.nodeInternals);
  const edges = useStore((s: ReactFlowState) => s.edges);

  const leftTop = useMemo(
    () => calcHandleTop(nodeId, 'incoming', nodeInternals, edges),
    [nodeId, nodeInternals, edges]
  );

  const rightTop = useMemo(
    () => calcHandleTop(nodeId, 'outgoing', nodeInternals, edges),
    [nodeId, nodeInternals, edges]
  );

  const topLeft = useMemo(
    () => calcHandleLeft(nodeId, 'incoming', nodeInternals, edges),
    [nodeId, nodeInternals, edges]
  );

  const bottomLeft = useMemo(
    () => calcHandleLeft(nodeId, 'outgoing', nodeInternals, edges),
    [nodeId, nodeInternals, edges]
  );

  useEffect(() => {
    updateNodeInternals(nodeId);
  }, [nodeId, updateNodeInternals, leftTop, rightTop, topLeft, bottomLeft]);

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
        style={{ ...handleStyle, left: leftOffset, top: leftTop, transform: 'translateY(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ ...handleStyle, left: leftOffset, top: leftTop, transform: 'translateY(-50%)' }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        style={{ ...handleStyle, right: -rightOffset, top: rightTop, transform: 'translateY(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ ...handleStyle, right: -rightOffset, top: rightTop, transform: 'translateY(-50%)' }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ ...handleStyle, top: topOffset, left: topLeft, transform: 'translateX(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{ ...handleStyle, top: topOffset, left: topLeft, transform: 'translateX(-50%)' }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        style={{ ...handleStyle, bottom: -bottomOffset, left: bottomLeft, transform: 'translateX(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ ...handleStyle, bottom: -bottomOffset, left: bottomLeft, transform: 'translateX(-50%)' }}
      />
    </>
  );
}
