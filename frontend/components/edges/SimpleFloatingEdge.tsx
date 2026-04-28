'use client';

import { useMemo } from 'react';
import { 
  BaseEdge, 
  EdgeLabelRenderer,
  EdgeProps, 
  getSmoothStepPath,
  getBezierPath,
  getStraightPath,
  useStore,
  ReactFlowState,
  Position,
} from 'reactflow';
import { getSimpleEdgePositions, getSimpleHandlePosition } from '@/lib/utils/simpleFloatingEdge';

interface SimpleEdgeData {
  connectionType?: 'sync' | 'async' | 'stream' | 'event' | 'dep';
  pathType?: 'smooth' | 'Smoothstep' | 'bezier' | 'step' | 'straight';
  label?: string;
}

function resolveMarkerEnd(markerEnd: unknown, connectionType?: string): string {
  if (typeof markerEnd === 'string' && markerEnd.startsWith('url(')) {
    return markerEnd;
  }

  const markerByType: Record<string, string> = {
    sync: 'url(#arrow-sync)',
    async: 'url(#arrow-async)',
    stream: 'url(#arrow-stream)',
    event: 'url(#arrow-event)',
    dep: 'url(#arrow-dep)',
  };

  return markerByType[connectionType || 'sync'] || 'url(#arrow-default)';
}

const EDGE_COLORS: Record<string, string> = {
  sync: '#94a3b8',
  async: '#94a3b8',
  stream: '#94a3b8',
  event: '#94a3b8',
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
  sourceX = 0,
  sourceY = 0,
  targetX = 0,
  targetY = 0,
  sourcePosition = Position.Right,
  targetPosition = Position.Left,
}: EdgeProps) {
  const sourceNode = useStore((s: ReactFlowState) => s.nodeInternals.get(source));
  const targetNode = useStore((s: ReactFlowState) => s.nodeInternals.get(target));

  const edgeParams = useMemo(() => {
    let sx = sourceX;
    let sy = sourceY;
    let tx = targetX;
    let ty = targetY;
    let sourcePos = sourcePosition;
    let targetPos = targetPosition;

    if (sourceNode && targetNode) {
      sx = sourceNode.positionAbsolute?.x ?? sourceNode.position.x;
      sy = sourceNode.positionAbsolute?.y ?? sourceNode.position.y;
      tx = targetNode.positionAbsolute?.x ?? targetNode.position.x;
      ty = targetNode.positionAbsolute?.y ?? targetNode.position.y;

      const sourceWidth = sourceNode.width ?? 160;
      const sourceHeight = sourceNode.height ?? 80;
      const targetWidth = targetNode.width ?? 160;
      const targetHeight = targetNode.height ?? 80;

      const positions = getSimpleEdgePositions(
        sx + sourceWidth / 2,
        sy + sourceHeight / 2,
        tx + targetWidth / 2,
        ty + targetHeight / 2
      );
      sourcePos = positions.sourcePos;
      targetPos = positions.targetPos;

      const sourceHandle = getSimpleHandlePosition(sx, sy, sourceWidth, sourceHeight, sourcePos);
      const targetHandle = getSimpleHandlePosition(tx, ty, targetWidth, targetHeight, targetPos);

      sx = sourceHandle.x;
      sy = sourceHandle.y;
      tx = targetHandle.x;
      ty = targetHandle.y;
    }

    return { sx, sy, tx, ty, sourcePos, targetPos };
  }, [sourceNode, targetNode, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);

  const { sx, sy, tx, ty, sourcePos, targetPos } = edgeParams;
  
  const connectionType = (data as SimpleEdgeData)?.connectionType || 'sync';
  const stroke = getEdgeColor(connectionType);
  const resolvedMarkerEnd = 'url(#arrow-sync)'; // Force explicit marker
  const strokeDasharray = animated || connectionType === 'async' || connectionType === 'stream' || connectionType === 'event' || connectionType === 'dep' 
    ? getStrokeDasharray(connectionType) 
    : undefined;
  const strokeWidth = (style as React.CSSProperties)?.strokeWidth || 2.5;

  const pathType = (data as SimpleEdgeData)?.pathType || 'Smoothstep';
  const edgeLabel = (data as SimpleEdgeData)?.label?.trim();
  
  let edgePath: string;
  if (pathType === 'straight') {
    [edgePath] = getStraightPath({ sourceX: sx, sourceY: sy, targetX: tx, targetY: ty });
  } else if (pathType === 'bezier') {
    [edgePath] = getBezierPath({ sourceX: sx, sourceY: sy, targetX: tx, targetY: ty });
  } else {
    [edgePath] = getSmoothStepPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: sourcePos,
      targetX: tx,
      targetY: ty,
      targetPosition: targetPos,
      borderRadius: 50,
    });
  }

  const labelX = (sx + tx) / 2;
  const labelY = (sy + ty) / 2;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke,
          strokeWidth,
          strokeDasharray: strokeDasharray || undefined,
          ...style,
        }}
        markerEnd={resolvedMarkerEnd}
      />
      {edgeLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
              fontSize: 11,
              fontWeight: 500,
              color: '#64748b',
              background: 'rgba(255,255,255,0.85)',
              borderRadius: 4,
              padding: '1px 4px',
            }}
            className="nodrag nopan"
          >
            {edgeLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
