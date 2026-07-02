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
  Node,
} from 'reactflow';
import { getObstacleAwareHandles } from '@/lib/features/dynamicHandles';
import { getEdgeShiftOffset, getSimpleHandlePosition } from '@/lib/utils/simpleFloatingEdge';
import { getCollisionFreeSmoothStepPath, getCollisionFreeWaypoints, buildSmoothStepSvg, segmentIntersectsRect } from '@/lib/utils/collisionFreeEdgePath';
import type { NodeRect } from '@/lib/utils/collisionFreeEdgePath';
import { getPointOnPath, findClosestT } from '@/lib/utils/edgeLabelDrag';
import { useDiagramStore } from '@/store/diagramStore';
import { DIAGRAM_CONSTANTS } from '@/constants/diagram';
import { useCanvasTheme } from '@/lib/theme';
import { EdgeLabel } from './EdgeLabel';
import { EdgeToolbar } from './EdgeToolbar';
import { EdgeContextMenu } from './EdgeContextMenu';
import type { EdgeData } from '@/data/edgeTypes';

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
    let sourceRect: { x: number; y: number; width: number; height: number } | null = null;
    let targetRect: { x: number; y: number; width: number; height: number } | null = null;

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

      sourceRect = { x: sX, y: sY, width: sWidth, height: sHeight };
      targetRect = { x: tX, y: tY, width: tWidth, height: tHeight };

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
        // Build intermediate node rects for obstacle-aware handle selection
        const intermediateNodeRects = new Map<string, { id: string; x: number; y: number; w: number; h: number }>();
        const excludedIds = new Set([source, target]);
        for (const [nid, node] of nodeInternals) {
          if (excludedIds.has(nid)) continue;
          if (node.type === 'group' || node.type === 'demoGroup') continue;
          const pos = node.positionAbsolute ?? node.position;
          const w = node.width ?? 200;
          const h = node.height ?? 80;
          intermediateNodeRects.set(nid, { id: nid, x: pos.x, y: pos.y, w, h });
        }

        const handles = getObstacleAwareHandles(
          sourceRect, targetRect,
          intermediateNodeRects.size > 0 ? intermediateNodeRects : undefined,
          excludedIds,
        );
        sourcePos = handles.sourcePosition;
        targetPos = handles.targetPosition;

        const sourceShift = getEdgeShiftOffset(source, id, sourcePos, edges, nodeInternals, 12, intermediateNodeRects.size > 0 ? intermediateNodeRects : undefined, excludedIds);
        const targetShift = getEdgeShiftOffset(target, id, targetPos, edges, nodeInternals, 12, intermediateNodeRects.size > 0 ? intermediateNodeRects : undefined, excludedIds);

        const sourceXY = getSimpleHandlePosition(sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height, sourcePos, sourceShift);
        const targetXY = getSimpleHandlePosition(targetRect.x, targetRect.y, targetRect.width, targetRect.height, targetPos, targetShift);

        sx = sourceXY.x;
        sy = sourceXY.y;
        tx = targetXY.x;
        ty = targetXY.y;
      }
      
    } else {
      console.warn(`[SimpleFloatingEdge] Missing nodes for edge ${id}:`, { sourceNode: !!sourceNode, targetNode: !!targetNode });
    }

    return { sx, sy, tx, ty, sourcePos, targetPos, sourceRect, targetRect };
  }, [sourceNode, targetNode, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, source, target, edges, nodeInternals, id]);

  const { sx, sy, tx, ty, sourcePos, targetPos, sourceRect, targetRect } = edgeParams;
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

      if (!sourceRect || !targetRect) {
        return `M${sx},${sy} L${tx},${ty}`;
      }

      // Build intermediate node rects for collision avoidance
      const excludedIds = new Set([source, target]);
      const nodeRects = new Map<string, NodeRect>();
      for (const [nid, node] of nodeInternals) {
        if (excludedIds.has(nid)) continue;
        if (node.type === 'group' || node.type === 'demoGroup') continue;
        const pos = node.positionAbsolute ?? node.position;
        const w = node.width ?? 200;
        const h = node.height ?? 80;
        nodeRects.set(nid, { id: nid, x: pos.x, y: pos.y, w, h });
      }

      const nodeRectParam = nodeRects.size > 0 ? nodeRects : undefined;

      // Use the primary handle pair from edgeParams (which uses getObstacleAwareHandles).
      // No fallback to other pairs — changing handle sides mid-drag causes abrupt path
      // snapping. The collision-free waypoint system routes around obstacles for this pair.
      const sourceShift = getEdgeShiftOffset(source, id, sourcePos, edges, nodeInternals, 12, nodeRectParam, excludedIds);
      const targetShift = getEdgeShiftOffset(target, id, targetPos, edges, nodeInternals, 12, nodeRectParam, excludedIds);

      const sh = getSimpleHandlePosition(sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height, sourcePos, sourceShift);
      const th = getSimpleHandlePosition(targetRect.x, targetRect.y, targetRect.width, targetRect.height, targetPos, targetShift);

      const pairIsVertical = (sourcePos === Position.Top || sourcePos === Position.Bottom) &&
                             (targetPos === Position.Top || targetPos === Position.Bottom);
      const pairIsHorizontal = (sourcePos === Position.Left || sourcePos === Position.Right) &&
                               (targetPos === Position.Left || targetPos === Position.Right);

      let startX = sh.x;
      let startY = sh.y;
      let endX = th.x;
      let endY = th.y;

      if (pairIsVertical && Math.abs(startX - endX) < 16) {
        endX = startX;
      } else if (pairIsHorizontal && Math.abs(startY - endY) < 16) {
        endY = startY;
      }

      const waypoints = getCollisionFreeWaypoints({
        sourceX: startX, sourceY: startY,
        targetX: endX, targetY: endY,
        sourcePosition: sourcePos,
        targetPosition: targetPos,
        borderRadius, edgeOffset,
        nodeRects: nodeRectParam,
        excludedNodeIds: excludedIds,
      });

      // Verify waypoints actually avoid all intermediate nodes
      let collides = false;
      for (let i = 0; i < waypoints.length - 1; i++) {
        for (const [, nr] of nodeRects) {
          if (segmentIntersectsRect(waypoints[i].x, waypoints[i].y, waypoints[i + 1].x, waypoints[i + 1].y, nr.x, nr.y, nr.w, nr.h)) {
            collides = true;
            break;
          }
        }
        if (collides) break;
      }

      if (!collides) {
        return buildSmoothStepSvg(waypoints, borderRadius);
      }

      // Fallback: direct path (extremely rare — only when computeWaypoints can't route around obstacles)
      return getCollisionFreeSmoothStepPath({
        sourceX: startX, sourceY: startY,
        targetX: endX, targetY: endY,
        sourcePosition: sourcePos,
        targetPosition: targetPos,
        borderRadius, edgeOffset,
        nodeRects: nodeRectParam,
        excludedNodeIds: excludedIds,
      });
    } catch {
      return `M${isNaN(sx) ? 0 : sx},${isNaN(sy) ? 0 : sy} L${isNaN(tx) ? 0 : tx},${isNaN(ty) ? 0 : ty}`;
    }
  }, [source, target, sourceRect, targetRect, edgeOffset, borderRadius, nodeInternals, edges, id, sx, sy, tx, ty, sourcePos, targetPos]);

  // Compute label position from labelT along the SVG path
  const labelPos = useMemo(() => {
    if (!edgeLabel) return { x: (sx + tx) / 2 || 0, y: (sy + ty) / 2 || 0, angle: 0 };
    try {
      return getPointOnPath(edgePath, labelT);
    } catch {
      return { x: (sx + tx) / 2 || 0, y: (sy + ty) / 2 || 0, angle: 0 };
    }
  }, [edgePath, labelT, edgeLabel, sx, sy, tx, ty]);

  // Labels always stay on the edge path — never jump to node edges
  const safeLabelPos = labelPos;

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
        if (useDiagramStore.getState().activeCanvasId) {
          updateEdgeData(id, { labelT: newT });
        }
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
              transform: `translate(-50%, -50%) translate(${safeLabelPos.x}px, ${safeLabelPos.y}px)`,
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
              labelX={safeLabelPos.x}
              labelY={safeLabelPos.y}
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
          labelX={safeLabelPos.x}
          labelY={safeLabelPos.y}
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
