'use client';

import { useMemo, useRef, useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import { 
  EdgeLabelRenderer,
  EdgeProps, 
  getSmoothStepPath,
  useStore,
  ReactFlowState,
  Position,
  useReactFlow,
} from 'reactflow';
import { getEdgeShiftOffset, getHandleOffset } from '@/lib/utils/simpleFloatingEdge';
import { getDynamicHandles, getHandleCoordinate, NodeRect } from '@/lib/features/dynamicHandles';
import { getPointOnPath, findClosestT } from '@/lib/utils/edgeLabelDrag';
import { useDiagramStore } from '@/store/diagramStore';
import { DIAGRAM_CONSTANTS } from '@/constants/diagram';
import { EdgeLabel } from './EdgeLabel';
import { EdgeToolbar } from './EdgeToolbar';
import { EdgeContextMenu } from './EdgeContextMenu';
import type { EdgeData } from '@/data/edgeTypes';

export default function SimpleFloatingEdge({
  id,
  source,
  target,
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
  sourceHandleId,
  targetHandleId,
}: EdgeProps<EdgeData>) {
  const sourceNode = useStore((s: ReactFlowState) => s.nodeInternals.get(source));
  const targetNode = useStore((s: ReactFlowState) => s.nodeInternals.get(target));
  const edges = useStore((s: ReactFlowState) => s.edges);
  const nodeInternals = useStore((s: ReactFlowState) => s.nodeInternals);
  const { getViewport } = useReactFlow();
  const updateEdgeData = useDiagramStore((s) => s.updateEdgeData);

  const edgeParams = useMemo(() => {
    let sx = 0;
    let sy = 0;
    let tx = 0;
    let ty = 0;
    let sourcePos = Position.Top;
    let targetPos = Position.Bottom;

    if (sourceNode && targetNode) {
      const sourceRect: NodeRect = {
        x: sourceNode.positionAbsolute?.x ?? sourceNode.position.x,
        y: sourceNode.positionAbsolute?.y ?? sourceNode.position.y,
        width: sourceNode.width ?? 200,
        height: sourceNode.height ?? 80,
      };
      const targetRect: NodeRect = {
        x: targetNode.positionAbsolute?.x ?? targetNode.position.x,
        y: targetNode.positionAbsolute?.y ?? targetNode.position.y,
        width: targetNode.width ?? 200,
        height: targetNode.height ?? 80,
      };

      const { sourcePosition: srcPos, targetPosition: tgtPos } = getDynamicHandles(
        sourceRect, 
        targetRect,
        id,
        source,
        target
      );
      sourcePos = srcPos;
      targetPos = tgtPos;

      const rawSrc = getHandleCoordinate(sourceRect, sourcePos);
      const rawTgt = getHandleCoordinate(targetRect, targetPos);

      const srcOffset = getHandleOffset(sourcePos);
      const tgtOffset = getHandleOffset(targetPos);

      const sourceShift = getEdgeShiftOffset(source, id, sourcePos, edges, nodeInternals, 15);
      const targetShift = getEdgeShiftOffset(target, id, targetPos, edges, nodeInternals, 15);

      if (sourcePos === Position.Left || sourcePos === Position.Right) {
        sx = rawSrc.x + srcOffset;
        sy = rawSrc.y + sourceShift;
      } else {
        sx = rawSrc.x + sourceShift;
        sy = rawSrc.y + srcOffset;
      }

      if (targetPos === Position.Left || targetPos === Position.Right) {
        tx = rawTgt.x + tgtOffset;
        ty = rawTgt.y + targetShift;
      } else {
        tx = rawTgt.x + targetShift;
        ty = rawTgt.y + tgtOffset;
      }
    }

    return { sx, sy, tx, ty, sourcePos, targetPos };
  }, [sourceNode, targetNode, source, target, id, edges, nodeInternals]);

  const { sx, sy, tx, ty, sourcePos, targetPos } = edgeParams;
  const [isHovered, setIsHovered] = useState(false);
  
  const isAsync = data?.edgeVariant === 'dashed' || data?.async || data?.connectionType === 'async';

  const strokeStyle: React.CSSProperties = useMemo(() => {
    const stroke = edgeStyle?.stroke || DIAGRAM_CONSTANTS.edge.stroke;
    const strokeWidth = DIAGRAM_CONSTANTS.edge.strokeWidth;
    const strokeDasharray = isAsync ? DIAGRAM_CONSTANTS.edge.dashArray : undefined;

    return {
      stroke,
      strokeWidth,
      strokeDasharray,
      transition: 'opacity 0.2s',
      opacity: selected || isHovered ? 1 : 0.85,
    };
  }, [edgeStyle, isAsync, selected, isHovered]);

  const edgeLabel = data?.label?.trim();
  const parallelEdges = useMemo(
    () => edges.filter((edge) => (edge.source === source && edge.target === target) || (edge.source === target && edge.target === source)).sort((a, b) => a.id.localeCompare(b.id)),
    [edges, source, target]
  );
  const labelOrder = Math.max(0, parallelEdges.findIndex((edge) => edge.id === id));
  const labelT = data?.labelT ?? (parallelEdges.length > 1 ? Math.max(0.2, Math.min(0.8, 0.5 + ((labelOrder - (parallelEdges.length - 1) / 2) * 0.15))) : 0.5);

  // Enforce smoothstep path always
  const edgePath = useMemo(() => {
    const [path] = getSmoothStepPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: sourcePos,
      targetX: tx,
      targetY: ty,
      targetPosition: targetPos,
      borderRadius: 50,
    });
    return path;
  }, [sx, sy, sourcePos, tx, ty, targetPos]);

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
              e.preventDefault();
              e.stopPropagation();
              document.dispatchEvent(new CustomEvent('edit-edge-label', { detail: id }));
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
