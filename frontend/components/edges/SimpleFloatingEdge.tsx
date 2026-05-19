'use client';

import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
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
  useReactFlow,
} from 'reactflow';
import { getSimpleEdgePositions, getSimpleHandlePosition, getEdgeShiftOffset, getNodeCenter } from '@/lib/utils/simpleFloatingEdge';
import { getPointOnPath, findClosestT } from '@/lib/utils/edgeLabelDrag';
import { useDiagramStore } from '@/store/diagramStore';

interface SimpleEdgeData {
  connectionType?: 'sync' | 'async' | 'stream' | 'event' | 'dep';
  pathType?: 'smooth' | 'Smoothstep' | 'bezier' | 'step' | 'straight';
  label?: string;
  /** Fractional position of the label along the edge path (0 = source, 1 = target). Default 0.5 */
  labelT?: number;
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
  sync: '#3B82F6', // Blue
  async: '#F59E0B', // Amber
  stream: '#10B981', // Emerald
  event: '#8B5CF6', // Purple
  dep: '#6B7280', // Gray
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
 * - Supports draggable label along the edge path
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
  const edges = useStore((s: ReactFlowState) => s.edges);
  const nodeInternals = useStore((s: ReactFlowState) => s.nodeInternals);
  const { getViewport } = useReactFlow();
  const updateEdgeData = useDiagramStore((s) => s.updateEdgeData);

  const edgeParams = useMemo(() => {
    let sx = sourceX;
    let sy = sourceY;
    let tx = targetX;
    let ty = targetY;
    let sourcePos = sourcePosition;
    let targetPos = targetPosition;

    if (sourceNode && targetNode) {
      const sCenter = getNodeCenter(sourceNode);
      const tCenter = getNodeCenter(targetNode);

      const positions = getSimpleEdgePositions(sCenter.cx, sCenter.cy, tCenter.cx, tCenter.cy);
      sourcePos = positions.sourcePos;
      targetPos = positions.targetPos;

      const sourceShift = getEdgeShiftOffset(source, id, sourcePos, edges, nodeInternals, 15);
      const targetShift = getEdgeShiftOffset(target, id, targetPos, edges, nodeInternals, 15);

      const sourceHandle = getSimpleHandlePosition(sCenter.x, sCenter.y, sCenter.width, sCenter.height, sourcePos, sourceShift);
      const targetHandle = getSimpleHandlePosition(tCenter.x, tCenter.y, tCenter.width, tCenter.height, targetPos, targetShift);

      sx = sourceHandle.x;
      sy = sourceHandle.y;
      tx = targetHandle.x;
      ty = targetHandle.y;
    }

    return { sx, sy, tx, ty, sourcePos, targetPos };
  }, [sourceNode, targetNode, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, source, target, id, edges, nodeInternals]);

  const { sx, sy, tx, ty, sourcePos, targetPos } = edgeParams;
  
  const connectionType = (data as SimpleEdgeData)?.connectionType || 'sync';
  const stroke = getEdgeColor(connectionType);
  const resolvedMarkerEnd = resolveMarkerEnd(markerEnd, connectionType);
  const strokeDasharray = animated || connectionType === 'async' || connectionType === 'stream' || connectionType === 'event' || connectionType === 'dep'
    ? getStrokeDasharray(connectionType)
    : undefined;
  const strokeWidth = (style as React.CSSProperties)?.strokeWidth || 2;

  const pathType = (data as SimpleEdgeData)?.pathType || 'Smoothstep';
  const edgeLabel = (data as SimpleEdgeData)?.label?.trim();
  const labelT = (data as SimpleEdgeData)?.labelT ?? 0.5;
  
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

  // Compute label position from labelT along the SVG path
  const labelPos = useMemo(() => {
    if (!edgeLabel) return { x: (sx + tx) / 2, y: (sy + ty) / 2 };
    return getPointOnPath(edgePath, labelT);
  }, [edgePath, labelT, edgeLabel, sx, sy, tx, ty]);

  // Drag state
  const isDragging = useRef(false);
  const [dragging, setDragging] = useState(false);

  const handleLabelMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging.current = true;
      setDragging(true);

      const onMouseMove = (ev: MouseEvent) => {
        if (!isDragging.current) return;
        const { x: vpX, y: vpY, zoom } = getViewport();
        // Convert screen coords to flow canvas coords
        const flowX = (ev.clientX - vpX) / zoom;
        const flowY = (ev.clientY - vpY) / zoom;
        const newT = findClosestT(edgePath, flowX, flowY);
        updateEdgeData(id, { labelT: newT });
      };

      const onMouseUp = () => {
        isDragging.current = false;
        setDragging(false);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [edgePath, getViewport, id, updateEdgeData]
  );

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke,
          strokeWidth,
          strokeDasharray: strokeDasharray || undefined,
        }}
        markerEnd={resolvedMarkerEnd}
      />
      {edgeLabel && (
        <EdgeLabelRenderer>
          <div
            onMouseDown={handleLabelMouseDown}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelPos.x}px, ${labelPos.y}px)`,
              // Allow pointer events so we can drag
              pointerEvents: 'all',
              cursor: dragging ? 'grabbing' : 'grab',
              fontSize: 9,
              fontWeight: 600,
              color: '#6B7280',
              background: dragging
                ? 'hsl(220 80% 97% / 1)'
                : 'hsl(60 33% 98% / 1)',
              padding: '2px 6px',
              borderRadius: 4,
              border: dragging
                ? '1px solid hsl(220 70% 75% / 0.9)'
                : '1px solid hsl(40 20% 88% / 0.8)',
              boxShadow: dragging
                ? '0 2px 8px rgba(59,130,246,0.18)'
                : '0 1px 3px hsl(40 15% 20% / 0.08)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              zIndex: 1000,
              userSelect: 'none',
              transition: dragging ? 'none' : 'box-shadow 0.15s, background 0.15s, border-color 0.15s',
            }}
            title="Drag to reposition label"
          >
            {edgeLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
