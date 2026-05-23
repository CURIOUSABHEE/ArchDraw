'use client';

import { useMemo, useRef, useCallback, useState } from 'react';
import { 
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
import { useCanvasTheme } from '@/lib/theme';
import { getEdgeConfig, type EdgeData, EDGE_TYPE_CONFIGS } from '@/data/edgeTypes';

const EDGE_COLORS = {
  light: {
    default: '#6B7280',
    async: '#F59E0B',
    error: '#EF4444',
    success: '#10B981',
    data: '#3B82F6',
  },
  dark: {
    default: '#6B7280',
    async: '#F59E0B',
    error: '#EF4444',
    success: '#10B981',
    data: '#3B82F6',
  },
};

function getInferredConnectionStyle(connectionType: string | undefined, label: string | undefined, isDark: boolean): { color?: string; dash?: string } {
  const lowerLabel = label?.toLowerCase() ?? '';
  const lowerType = connectionType?.toLowerCase() ?? '';
  const colors = isDark ? EDGE_COLORS.dark : EDGE_COLORS.light;
  
  if (lowerType === 'error' || lowerLabel.includes('error') || lowerLabel.includes('failed')) {
    return { color: colors.error };
  }
  if (lowerType === 'success' || lowerLabel.includes('success') || lowerLabel.includes('ok')) {
    return { color: colors.success };
  }
  if (lowerType === 'async' || lowerType === 'publish' || lowerType === 'consume' || lowerLabel.includes('event') || lowerLabel.includes('publish') || lowerLabel.includes('consume') || lowerLabel.includes('queue')) {
    return { color: colors.async, dash: '8 4' };
  }
  if (lowerType === 'sql' || lowerType === 'data' || lowerLabel.includes('sql') || lowerLabel.includes('query') || lowerLabel.includes('cache')) {
    return { color: colors.data };
  }
  return {};
}

/**
 * SimpleFloatingEdge - A floating edge implementation that dynamically chooses
 * the correct side based on node geometry. This follows the React Flow "Simple
 * Floating Edges" example pattern.
 */

export default function SimpleFloatingEdge({
  id,
  source,
  target,
  style,
  data,
  animated,
  selected,
  sourceX = 0,
  sourceY = 0,
  targetX = 0,
  targetY = 0,
  sourcePosition = Position.Right,
  targetPosition = Position.Left,
}: EdgeProps<EdgeData>) {
  const sourceNode = useStore((s: ReactFlowState) => s.nodeInternals.get(source));
  const targetNode = useStore((s: ReactFlowState) => s.nodeInternals.get(target));
  const edges = useStore((s: ReactFlowState) => s.edges);
  const nodeInternals = useStore((s: ReactFlowState) => s.nodeInternals);
  const { getViewport } = useReactFlow();
  const updateEdgeData = useDiagramStore((s) => s.updateEdgeData);
  const { isDark } = useCanvasTheme();

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
  const [isHovered, setIsHovered] = useState(false);
  
  const connectionType = data?.connectionType || 'sync';
  const config = getEdgeConfig(connectionType) || EDGE_TYPE_CONFIGS.sync;
  const inferred = getInferredConnectionStyle(connectionType, data?.label, isDark);
  
  const lowerLabel = data?.label?.toLowerCase() ?? '';
  const lowerType = connectionType?.toLowerCase() ?? '';
  const isAsync = lowerType === 'async' || lowerType === 'publish' || lowerType === 'consume' || ['amqp', 'kafka', 'queue', 'pub/sub', 'event', 'publish', 'consume', 'nats', 'rabbitmq'].some(p => lowerLabel.includes(p));

  const strokeColor = useMemo(() => {
    if (selected) {
      return isDark ? '#9CA3AF' : '#374151';
    }
    if (data?.color) {
      return data.color;
    }
    if (style?.stroke) {
      return style.stroke as string;
    }
    if (isDark) {
      if (isAsync) return '#FBBF24';
      if (lowerType === 'error' || lowerLabel.includes('error') || lowerLabel.includes('failed')) return '#EF4444';
      if (lowerType === 'success' || lowerLabel.includes('success') || lowerLabel.includes('ok')) return '#34D399';
      return '#60A5FA'; // sync/default bright blue
    }
    return inferred.color || config.color || '#6B7280';
  }, [selected, isDark, data?.color, isAsync, lowerType, lowerLabel, inferred.color, style?.stroke, config.color]);

  const strokeWidth = useMemo(() => {
    if (style?.strokeWidth) return style.strokeWidth as number;
    return selected ? 2.5 : (isHovered ? 2 : 1.5);
  }, [style?.strokeWidth, selected, isHovered]);

  const strokeDasharray = useMemo(() => {
    if (style?.strokeDasharray) {
      return style.strokeDasharray as string;
    }
    if (data?.edgeVariant === 'dotted' || data?.connectionType === 'dotted') {
      return '2,4';
    }
    if (data?.edgeVariant === 'dashed') {
      return '8,4';
    }
    if (data?.edgeVariant === 'solid') {
      return undefined;
    }
    if (isDark) {
      if (isAsync) return '8,4';
      return undefined;
    }
    return animated || config.animated || inferred.dash
      ? inferred.dash || config.dash || undefined
      : undefined;
  }, [style?.strokeDasharray, data?.edgeVariant, data?.connectionType, isDark, isAsync, animated, config.animated, inferred.dash]);

  const edgeStyle: React.CSSProperties = useMemo(() => {
    const opacity = selected ? 1 : (isHovered ? 1 : (isDark ? 0.8 : 0.85));
    return {
      stroke: strokeColor,
      strokeWidth,
      strokeDasharray,
      transition: 'stroke 0.2s, stroke-width 0.2s, opacity 0.2s, filter 0.2s',
      opacity,
      filter: isDark ? `drop-shadow(0 0 ${isHovered ? '6px' : '3px'} ${strokeColor})` : undefined,
    };
  }, [strokeColor, strokeWidth, strokeDasharray, selected, isHovered, isDark]);

  const pathType = data?.pathType || 'Smoothstep';
  const edgeLabel = data?.label?.trim();
  const sharedEndpointEdges = useMemo(
    () => edges.filter((edge) => edge.source === source || edge.target === target || edge.source === target || edge.target === source),
    [edges, source, target]
  );
  const labelOrder = Math.max(0, sharedEndpointEdges.findIndex((edge) => edge.id === id));
  const labelT = data?.labelT ?? Math.max(0.32, Math.min(0.68, 0.5 + ((labelOrder % 3) - 1) * 0.08));
  
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

  const safeId = id.replace(/[^a-zA-Z0-9-_]/g, '_');
  const markerEndId = `arrow-${safeId}`;

  return (
    <>
      <defs>
        <marker
          id={markerEndId}
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 0 6 L 6 3 z" fill={strokeColor} />
        </marker>
      </defs>

      {/* Interaction layer */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={20}
        stroke="transparent"
        className="react-flow__edge-interaction"
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      {/* Visual layer */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        markerEnd={config.markerEnd ? `url(#${markerEndId})` : undefined}
        className={`react-flow__edge-path ${(animated || config.animated || (isDark && isAsync)) ? `flow-${safeId}` : ''}`}
        style={edgeStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      {edgeLabel && (
        <EdgeLabelRenderer>
          <div
            onMouseDown={handleLabelMouseDown}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              document.dispatchEvent(new CustomEvent('edit-edge-label', { detail: id }));
            }}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelPos.x}px, ${labelPos.y}px)`,
              // Allow pointer events so we can drag
              pointerEvents: 'all',
              cursor: dragging ? 'grabbing' : 'grab',
              fontSize: isDark ? 10 : 9,
              fontWeight: isDark ? 'bold' : 600,
              color: isDark ? '#CBD5E1' : '#6B7280',
              background: isDark
                ? 'rgba(30, 34, 53, 0.86)'
                : dragging
                ? 'hsl(220 80% 97% / 1)'
                : 'hsl(60 33% 98% / 0.88)',
              padding: '2px 6px',
              borderRadius: 4,
              border: isDark
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : dragging
                ? '1px solid hsl(220 70% 75% / 0.9)'
                : '1px solid hsl(40 20% 88% / 0.8)',
              boxShadow: isDark
                ? '0 2px 8px rgba(0, 0, 0, 0.4)'
                : dragging
                ? '0 2px 8px rgba(59,130,246,0.18)'
                : '0 1px 3px hsl(40 15% 20% / 0.08)',
              textTransform: 'uppercase',
              letterSpacing: isDark ? '0.05em' : '0.04em',
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
