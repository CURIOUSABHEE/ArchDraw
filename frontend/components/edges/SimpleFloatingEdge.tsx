'use client';

import { useMemo, useRef, useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import { 
  EdgeLabelRenderer,
  EdgeProps, 
  useReactFlow,
  useStore,
  ReactFlowState,
  Position,
  Edge,
  Node,
} from 'reactflow';
import { getDynamicHandles } from '@/lib/features/dynamicHandles';
import { getEdgeShiftOffset, getSimpleHandlePosition } from '@/lib/utils/simpleFloatingEdge';
import { getPointOnPath, findClosestT } from '@/lib/utils/edgeLabelDrag';
import { useDiagramStore } from '@/store/diagramStore';
import { DIAGRAM_CONSTANTS } from '@/constants/diagram';
import { useCanvasTheme } from '@/lib/theme';
import { EdgeLabel } from './EdgeLabel';
import { EdgeToolbar } from './EdgeToolbar';
import { EdgeContextMenu } from './EdgeContextMenu';
import type { EdgeData } from '@/data/edgeTypes';

function getCustomSmoothStepPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  borderRadius = 40,
  edgeOffset = 0,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  borderRadius?: number;
  edgeOffset?: number;
}): string {
  const sourceIsHorizontal = sourcePosition === Position.Left || sourcePosition === Position.Right;
  const targetIsHorizontal = targetPosition === Position.Left || targetPosition === Position.Right;

  const maxR = Math.max(0, Math.abs(targetX - sourceX) / 2, Math.abs(targetY - sourceY) / 2);

  if (sourceIsHorizontal && targetIsHorizontal) {
    // H → V → H: both sides horizontal, mid segment vertical
    const mx = (sourceX + targetX) / 2 + edgeOffset;
    const r = Math.max(0, Math.min(
      borderRadius,
      Math.abs(mx - sourceX),
      Math.abs(targetX - mx),
      maxR > 0 ? Math.abs(targetY - sourceY) / 2 : borderRadius
    ));

    const dx_sign = Math.sign(mx - sourceX) || 1;
    const dy_sign = Math.sign(targetY - sourceY) || 1;
    const dx_sign_target = Math.sign(targetX - mx) || 1;

    if (r === 0) {
      return `M ${sourceX},${sourceY} L ${mx},${sourceY} L ${mx},${targetY} L ${targetX},${targetY}`;
    }

    return `M ${sourceX},${sourceY} ` +
      `L ${mx - dx_sign * r},${sourceY} ` +
      `Q ${mx},${sourceY} ${mx},${sourceY + dy_sign * r} ` +
      `L ${mx},${targetY - dy_sign * r} ` +
      `Q ${mx},${targetY} ${mx + dx_sign_target * r},${targetY} ` +
      `L ${targetX},${targetY}`;
  }

  if (!sourceIsHorizontal && !targetIsHorizontal) {
    // V → H → V: both sides vertical, mid segment horizontal
    const my = (sourceY + targetY) / 2 + edgeOffset;
    const r = Math.max(0, Math.min(
      borderRadius,
      Math.abs(my - sourceY),
      Math.abs(targetY - my),
      maxR > 0 ? Math.abs(targetX - sourceX) / 2 : borderRadius
    ));

    const dy_sign = Math.sign(my - sourceY) || 1;
    const dx_sign = Math.sign(targetX - sourceX) || 1;
    const dy_sign_target = Math.sign(targetY - my) || 1;

    if (r === 0) {
      return `M ${sourceX},${sourceY} L ${sourceX},${my} L ${targetX},${my} L ${targetX},${targetY}`;
    }

    return `M ${sourceX},${sourceY} ` +
      `L ${sourceX},${my - dy_sign * r} ` +
      `Q ${sourceX},${my} ${sourceX + dx_sign * r},${my} ` +
      `L ${targetX - dx_sign * r},${my} ` +
      `Q ${targetX},${my} ${targetX},${my + dy_sign_target * r} ` +
      `L ${targetX},${targetY}`;
  }

  if (sourceIsHorizontal) {
    // source H (Left/Right), target V (Top/Bottom)
    // Path: go H directly to targetX, then V to targetY
    // Last segment is VERTICAL → marker points up/down → matches vertical target handle
    const dx_sign = Math.sign(targetX - sourceX) || 1;
    const dy_sign = Math.sign(targetY - sourceY) || 1;
    const r = Math.max(0, Math.min(borderRadius, Math.abs(targetX - sourceX), Math.abs(targetY - sourceY)));

    if (r === 0) {
      return `M ${sourceX},${sourceY} L ${targetX},${sourceY} L ${targetX},${targetY}`;
    }

    return `M ${sourceX},${sourceY} ` +
      `L ${targetX - dx_sign * r},${sourceY} ` +
      `Q ${targetX},${sourceY} ${targetX},${sourceY + dy_sign * r} ` +
      `L ${targetX},${targetY}`;
  }

  // source V (Top/Bottom), target H (Left/Right)
  // Path: go V directly to targetY, then H to targetX
  // Last segment is HORIZONTAL → marker points left/right → matches horizontal target handle
  const dx_sign = Math.sign(targetX - sourceX) || 1;
  const dy_sign = Math.sign(targetY - sourceY) || 1;
  const r = Math.max(0, Math.min(borderRadius, Math.abs(targetX - sourceX), Math.abs(targetY - sourceY)));

  if (r === 0) {
    return `M ${sourceX},${sourceY} L ${sourceX},${targetY} L ${targetX},${targetY}`;
  }

  return `M ${sourceX},${sourceY} ` +
    `L ${sourceX},${targetY - dy_sign * r} ` +
    `Q ${sourceX},${targetY} ${sourceX + dx_sign * r},${targetY} ` +
    `L ${targetX},${targetY}`;
}

function getSelfLoopPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}): string {
  const r = 40;
  return `M ${sourceX},${sourceY} C ${sourceX},${sourceY - r} ${targetX + r},${targetY} ${targetX},${targetY}`;
}

interface ReactFlow12Node extends Node {
  measured?: {
    width?: number;
    height?: number;
  };
}

export default function SimpleFloatingEdge({
  id,
  source,
  target,
  label,
  data,
  selected,
  style: edgeStyle,
  sourceX = 0,
  sourceY = 0,
  targetX = 0,
  targetY = 0,
  sourcePosition = Position.Right,
  targetPosition = Position.Left,
  markerEnd,
  markerStart,
}: EdgeProps<EdgeData>) {
  const sourceNode = useStore((s: ReactFlowState) => s.nodeInternals.get(source));
  const targetNode = useStore((s: ReactFlowState) => s.nodeInternals.get(target));
  const nodeInternals = useStore((s: ReactFlowState) => s.nodeInternals);
  const edges = useStore((s: ReactFlowState) => s.edges);
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
      // In reactflow v11/v12, positionAbsolute is preferred, but fallback to position.
      const sX = sourceNode.positionAbsolute?.x ?? sourceNode.position.x;
      const sY = sourceNode.positionAbsolute?.y ?? sourceNode.position.y;
      const tX = targetNode.positionAbsolute?.x ?? targetNode.position.x;
      const tY = targetNode.positionAbsolute?.y ?? targetNode.position.y;

      // Handle both v11 (width/height directly on node) and v12 (measured object)
      const sWidth = (sourceNode as ReactFlow12Node).measured?.width ?? sourceNode.width ?? (sourceNode.data as { nodeWidth?: number } | undefined)?.nodeWidth ?? 200;
      const sHeight = (sourceNode as ReactFlow12Node).measured?.height ?? sourceNode.height ?? (sourceNode.data as { nodeHeight?: number } | undefined)?.nodeHeight ?? 80;
      const tWidth = (targetNode as ReactFlow12Node).measured?.width ?? targetNode.width ?? (targetNode.data as { nodeWidth?: number } | undefined)?.nodeWidth ?? 200;
      const tHeight = (targetNode as ReactFlow12Node).measured?.height ?? targetNode.height ?? (targetNode.data as { nodeHeight?: number } | undefined)?.nodeHeight ?? 80;

      const sourceRect = { x: sX, y: sY, width: sWidth, height: sHeight };
      const targetRect = { x: tX, y: tY, width: tWidth, height: tHeight };

      if (source === target) {
        sourcePos = Position.Top;
        targetPos = Position.Right;

        const sourceXY = getSimpleHandlePosition(sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height, sourcePos, 12);
        const targetXY = getSimpleHandlePosition(targetRect.x, targetRect.y, targetRect.width, targetRect.height, targetPos, -12);

        sx = sourceXY.x;
        sy = sourceXY.y;
        tx = targetXY.x;
        ty = targetXY.y;
      } else {
        const handles = getDynamicHandles(sourceRect, targetRect);
        sourcePos = handles.sourcePosition;
        targetPos = handles.targetPosition;

        const sourceShift = getEdgeShiftOffset(source, id, sourcePos, edges, nodeInternals, 12);
        const targetShift = getEdgeShiftOffset(target, id, targetPos, edges, nodeInternals, 12);

        const sourceXY = getSimpleHandlePosition(sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height, sourcePos, sourceShift);
        const targetXY = getSimpleHandlePosition(targetRect.x, targetRect.y, targetRect.width, targetRect.height, targetPos, targetShift);

        sx = sourceXY.x;
        sy = sourceXY.y;
        tx = targetXY.x;
        ty = targetXY.y;
      }
      
      console.log(`[SimpleFloatingEdge] ${id}: (${source} -> ${target})`, {
        sourceX: sourceX,
        sourceY: sourceY,
        targetX: targetX,
        targetY: targetY,
        computedSx: sx,
        computedSy: sy,
        computedTx: tx,
        computedTy: ty,
        sourcePos,
        targetPos
      });
    } else {
      console.warn(`[SimpleFloatingEdge] Missing nodes for edge ${id}:`, { sourceNode: !!sourceNode, targetNode: !!targetNode });
    }

    return { sx, sy, tx, ty, sourcePos, targetPos };
  }, [sourceNode, targetNode, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, source, target, edges, nodeInternals]);

  const { sx, sy, tx, ty, sourcePos, targetPos } = edgeParams;
  const [isHovered, setIsHovered] = useState(false);
  
  const isAsync = data?.edgeVariant === 'dashed' || data?.async || data?.connectionType === 'async';
  const { isDark } = useCanvasTheme();

  const strokeStyle: React.CSSProperties = useMemo(() => {
    // Prefer the color already set by useEdgeColors on the edge style prop.
    // Fall back to theme-aware defaults so dark mode always works even if the
    // prop chain hasn't propagated yet.
    const darkDefault = '#cbd5e1';
    const lightDefault = DIAGRAM_CONSTANTS.edge.stroke; // '#94a3b8'
    const stroke = edgeStyle?.stroke || (isDark ? darkDefault : lightDefault);
    const strokeWidth = selected || isHovered ? 2.5 : DIAGRAM_CONSTANTS.edge.strokeWidth;
    const strokeDasharray = isAsync ? DIAGRAM_CONSTANTS.edge.dashArray : undefined;

    return {
      stroke,
      strokeWidth,
      strokeDasharray,
      transition: 'stroke 0.2s, stroke-width 0.2s, opacity 0.2s',
      opacity: selected || isHovered ? 1 : 0.85,
    };
  }, [edgeStyle, isAsync, selected, isHovered, isDark]);

  const edgeLabel = typeof data?.label === 'string' ? data.label.trim() : (typeof label === 'string' ? label.trim() : '');

  const parallelEdges = useMemo(
    () => edges.filter((edge) => 
      (edge.source === source && edge.target === target) ||
      (edge.source === target && edge.target === source)
    ).sort((a, b) => a.id.localeCompare(b.id)),
    [edges, source, target]
  );
  const labelOrder = Math.max(0, parallelEdges.findIndex((edge) => edge.id === id));
  const labelT = data?.labelT ?? (parallelEdges.length > 1 ? Math.max(0.2, Math.min(0.8, 0.5 + ((labelOrder - (parallelEdges.length - 1) / 2) * 0.15))) : 0.5);

  // For parallel edges, calculate an offset to prevent overlap (unless it's a self-loop)
  const edgeOffset = useMemo(() => {
    if (source === target) return 0;
    if (parallelEdges.length <= 1) return 0;
    const index = parallelEdges.findIndex((edge) => edge.id === id);
    if (index === -1) return 0;
    // Spacing of 20px between adjacent parallel lines
    return (index - (parallelEdges.length - 1) / 2) * 20;
  }, [parallelEdges, id, source, target]);

  // Enforce custom smoothstep path to avoid overlapping middle segments and preserve arrow directions
  const isStep = data?.pathType === 'step';
  const borderRadius = isStep ? 0 : 40;
  const edgePath = useMemo(() => {
    try {
      if (source === target) {
        return getSelfLoopPath({
          sourceX: sx,
          sourceY: sy,
          targetX: tx,
          targetY: ty,
        });
      }
      return getCustomSmoothStepPath({
        sourceX: sx,
        sourceY: sy,
        targetX: tx,
        targetY: ty,
        sourcePosition: sourcePos,
        targetPosition: targetPos,
        borderRadius,
        edgeOffset: edgeOffset,
      });
    } catch {
      return `M${isNaN(sx) ? 0 : sx},${isNaN(sy) ? 0 : sy} L${isNaN(tx) ? 0 : tx},${isNaN(ty) ? 0 : ty}`;
    }
  }, [source, target, sx, sy, tx, ty, sourcePos, targetPos, edgeOffset, borderRadius]);

  // Compute label position from labelT along the SVG path
  const labelPos = useMemo(() => {
    if (!edgeLabel) return { x: (sx + tx) / 2 || 0, y: (sy + ty) / 2 || 0, angle: 0 };
    try {
      return getPointOnPath(edgePath, labelT);
    } catch {
      return { x: (sx + tx) / 2 || 0, y: (sy + ty) / 2 || 0, angle: 0 };
    }
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

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const closeMenu = useCallback(() => setContextMenu(null), []);

  return (
    <>
      {/* Interaction layer */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={20}
        stroke="transparent"
        className="react-flow__edge-interaction"
        style={{ cursor: 'pointer' }}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      {/* Visual layer */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        markerStart={markerStart}
        markerEnd={markerEnd}
        className="react-flow__edge-path"
        style={strokeStyle}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      {edgeLabel && (
        <EdgeLabelRenderer>
          <div
            onMouseDown={handleLabelMouseDown}
            onDoubleClick={(e) => {
              e.stopPropagation();
            }}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelPos.x}px, ${labelPos.y}px)`,
              pointerEvents: 'all',
              cursor: dragging ? 'grabbing' : 'grab',
              zIndex: 1000,
              userSelect: 'none',
            }}
            title="Drag to reposition label"
          >
            <EdgeLabel
              edgeId={id}
              label={edgeLabel}
              labelX={labelPos.x}
              labelY={labelPos.y}
            />
          </div>
        </EdgeLabelRenderer>
      )}

      {selected && (
        <EdgeToolbar
          edgeId={id}
          currentLabel={data?.label}
          currentEdgeType={data?.edgeType}
          currentPathType={data?.pathType}
          labelX={labelPos.x}
          labelY={labelPos.y}
        />
      )}

      {contextMenu && ReactDOM.createPortal(
        <EdgeContextMenu
          edgeId={id}
          position={contextMenu}
          onClose={closeMenu}
          currentEdgeType={data?.edgeType}
          currentPathType={data?.pathType}
        />,
        document.body
      )}
    </>
  );
}
