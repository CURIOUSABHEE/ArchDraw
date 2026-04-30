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
  sync: '#6B7280',
  async: '#6B7280',
  stream: '#6B7280',
  event: '#6B7280',
  dep: '#6B7280',
};

const STROKE_DASHARRAYS: Record<string, string | undefined> = {
  sync: undefined,
  async: '8 4',
  stream: '6 3 2 3',
  event: '4 2',
  dep: '6 4',
};

function getEdgeColor(connectionType?: string): string {
  return EDGE_COLORS[connectionType || 'sync'] || EDGE_COLORS.sync;
}

function getStrokeDasharray(connectionType?: string): string | undefined {
  return STROKE_DASHARRAYS[connectionType || 'sync'];
}

/**
 * SimpleFloatingEdge - A floating edge implementation that dynamically chooses
 * the correct side based on node geometry. This follows the React Flow "Simple
 * Floating Edges" example pattern.
 * 
 * Key features:
 * - Automatically determines source/target positions based on node centers
 * - Uses handle offsets to position connection points outside nodes
 * - Clears node shadows and backplates with proper spacing
 * - Works with ConnectionMode.Loose for flexible connections
 */

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
  const resolvedMarkerEnd = 'url(#arrow-sync)';
  const strokeDasharray = animated || connectionType === 'async' || connectionType === 'stream' || connectionType === 'event' || connectionType === 'dep'
    ? getStrokeDasharray(connectionType)
    : undefined;
  const strokeWidth = (style as React.CSSProperties)?.strokeWidth || 2;

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
              fontSize: 9,
              fontWeight: 600,
              color: '#6B7280',
              background: 'hsl(60 33% 98% / 1)',
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid hsl(40 20% 88% / 0.8)',
              boxShadow: '0 1px 3px hsl(40 15% 20% / 0.08)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              zIndex: 1000,
            }}
          >
            {edgeLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
