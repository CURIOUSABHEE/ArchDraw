'use client';

import { useMemo } from 'react';
import { 
  BaseEdge, 
  EdgeProps, 
  getSmoothStepPath,
  useStore,
  ReactFlowState,
} from 'reactflow';
import { getSimpleEdgePositions, getSimpleHandlePosition } from '@/lib/utils/simpleFloatingEdge';

interface SimpleEdgeData {
  connectionType?: 'sync' | 'async' | 'stream' | 'event' | 'dep';
  pathType?: 'smooth' | 'Smoothstep' | 'bezier' | 'step' | 'straight';
  label?: string;
}

const EDGE_COLORS: Record<string, string> = {
  sync: '#6366f1',
  async: '#f59e0b',
  stream: '#22c55e',
  event: '#ec4899',
  dep: '#94a3b8',
};

const STROKE_DASHARRAYS: Record<string, string | undefined> = {
  sync: undefined,
  async: '8 6',
  stream: '10 4 2 4',
  event: '4 4',
  dep: '6 6',
};

function getEdgeColor(connectionType?: string): string {
  return EDGE_COLORS[connectionType || 'sync'] || EDGE_COLORS.sync;
}

function getStrokeDasharray(connectionType?: string): string | undefined {
  return STROKE_DASHARRAYS[connectionType || 'sync'];
}

export default function SimpleFloatingEdge({
  id,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  style,
  markerEnd,
  data,
  animated,
}: EdgeProps) {
  const sourceNode = useStore((s: ReactFlowState) => s.nodeInternals.get(source));
  const targetNode = useStore((s: ReactFlowState) => s.nodeInternals.get(target));

  const edgeParams = useMemo(() => {
    if (!sourceNode || !targetNode) return null;

    const sx = sourceNode.positionAbsolute?.x ?? sourceNode.position.x;
    const sy = sourceNode.positionAbsolute?.y ?? sourceNode.position.y;
    const tx = targetNode.positionAbsolute?.x ?? targetNode.position.x;
    const ty = targetNode.positionAbsolute?.y ?? targetNode.position.y;

    const sourceWidth = sourceNode.width ?? 160;
    const sourceHeight = sourceNode.height ?? 80;
    const targetWidth = targetNode.width ?? 160;
    const targetHeight = targetNode.height ?? 80;

    const { sourcePos, targetPos } = getSimpleEdgePositions(
      sx + sourceWidth / 2,
      sy + sourceHeight / 2,
      tx + targetWidth / 2,
      ty + targetHeight / 2
    );

    const sourceHandle = getSimpleHandlePosition(sx, sy, sourceWidth, sourceHeight, sourcePos);
    const targetHandle = getSimpleHandlePosition(tx, ty, targetWidth, targetHeight, targetPos);

    return {
      sx: sourceHandle.x,
      sy: sourceHandle.y,
      tx: targetHandle.x,
      ty: targetHandle.y,
      sourcePos,
      targetPos,
    };
  }, [sourceNode, targetNode]);

  if (!edgeParams) return null;

  const { sx, sy, tx, ty, sourcePos, targetPos } = edgeParams;
  
  const connectionType = (data as SimpleEdgeData)?.connectionType || 'sync';
  const stroke = getEdgeColor(connectionType);
  const strokeDasharray = animated || connectionType === 'async' || connectionType === 'stream' || connectionType === 'event' || connectionType === 'dep' 
    ? getStrokeDasharray(connectionType) 
    : undefined;
  const strokeWidth = (style as React.CSSProperties)?.strokeWidth || 2;

  const [edgePath] = getSmoothStepPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: tx,
    targetY: ty,
    targetPosition: targetPos,
    borderRadius: 12,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke,
        strokeWidth,
        strokeDasharray: strokeDasharray || undefined,
        ...style,
      }}
      markerEnd={markerEnd}
    />
  );
}