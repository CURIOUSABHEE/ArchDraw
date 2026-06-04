'use client';

import { useMemo, useRef, useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import { 
  EdgeLabelRenderer,
  EdgeProps, 
  getSmoothStepPath,
  useReactFlow,
  useStore,
  ReactFlowState,
  Position,
} from 'reactflow';
import { getDynamicHandles, getHandleCoordinate } from '@/lib/features/dynamicHandles';
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
      const sX = (sourceNode as any).positionAbsolute?.x ?? sourceNode.position.x;
      const sY = (sourceNode as any).positionAbsolute?.y ?? sourceNode.position.y;
      const tX = (targetNode as any).positionAbsolute?.x ?? targetNode.position.x;
      const tY = (targetNode as any).positionAbsolute?.y ?? targetNode.position.y;

      // Handle both v11 (width/height directly on node) and v12 (measured object)
      const sWidth = (sourceNode as any).measured?.width ?? sourceNode.width ?? sourceNode.data?.nodeWidth ?? 200;
      const sHeight = (sourceNode as any).measured?.height ?? sourceNode.height ?? sourceNode.data?.nodeHeight ?? 80;
      const tWidth = (targetNode as any).measured?.width ?? targetNode.width ?? targetNode.data?.nodeWidth ?? 200;
      const tHeight = (targetNode as any).measured?.height ?? targetNode.height ?? targetNode.data?.nodeHeight ?? 80;

      const sourceRect = { x: sX, y: sY, width: sWidth, height: sHeight };
      const targetRect = { x: tX, y: tY, width: tWidth, height: tHeight };

      const handles = getDynamicHandles(sourceRect, targetRect);
      sourcePos = handles.sourcePosition;
      targetPos = handles.targetPosition;

      const sourceXY = getHandleCoordinate(sourceRect, sourcePos, 'source');
      const targetXY = getHandleCoordinate(targetRect, targetPos, 'target');

      sx = sourceXY.x;
      sy = sourceXY.y;
      tx = targetXY.x;
      ty = targetXY.y;
    }

    return { sx, sy, tx, ty, sourcePos, targetPos };
  }, [sourceNode, targetNode, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);

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
    () => edges.filter((edge) => 
      (edge.source === source && edge.target === target) ||
      (edge.source === target && edge.target === source)
    ).sort((a, b) => a.id.localeCompare(b.id)),
    [edges, source, target]
  );
  const labelOrder = Math.max(0, parallelEdges.findIndex((edge) => edge.id === id));
  
  // Calculate canonical distribution of label along path to avoid overlaps
  const canonicalT = parallelEdges.length > 1
    ? Math.max(0.2, Math.min(0.8, 0.5 + ((labelOrder - (parallelEdges.length - 1) / 2) * 0.18)))
    : 0.5;

  // Determine direction canonicality based on node IDs comparison
  const isCanonical = source.localeCompare(target) < 0;
  const labelT = data?.labelT ?? (isCanonical ? canonicalT : 1 - canonicalT);

  // Calculate edge offset for parallel edges
  const edgeOffset = parallelEdges.length > 1 
    ? (labelOrder - (parallelEdges.length - 1) / 2) * 16
    : 0;

  const finalSx = sourcePos === Position.Left || sourcePos === Position.Right ? sx : sx + edgeOffset;
  const finalSy = sourcePos === Position.Left || sourcePos === Position.Right ? sy + edgeOffset : sy;
  const finalTx = targetPos === Position.Left || targetPos === Position.Right ? tx : tx + edgeOffset;
  const finalTy = targetPos === Position.Left || targetPos === Position.Right ? ty + edgeOffset : ty;

  // Enforce smoothstep path always
  const edgePath = useMemo(() => {
    try {
      const [path] = getSmoothStepPath({
        sourceX: isNaN(finalSx) ? 0 : finalSx,
        sourceY: isNaN(finalSy) ? 0 : finalSy,
        sourcePosition: sourcePos,
        targetX: isNaN(finalTx) ? 0 : finalTx,
        targetY: isNaN(finalTy) ? 0 : finalTy,
        targetPosition: targetPos,
        borderRadius: 40,
      });
      if (!path) {
        // Fallback to straight line if getSmoothStepPath returns empty
        return `M${isNaN(finalSx) ? 0 : finalSx},${isNaN(finalSy) ? 0 : finalSy} L${isNaN(finalTx) ? 0 : finalTx},${isNaN(finalTy) ? 0 : finalTy}`;
      }
      return path;
    } catch (e) {
      return `M${isNaN(finalSx) ? 0 : finalSx},${isNaN(finalSy) ? 0 : finalSy} L${isNaN(finalTx) ? 0 : finalTx},${isNaN(finalTy) ? 0 : finalTy}`;
    }
  }, [finalSx, finalSy, sourcePos, finalTx, finalTy, targetPos]);

  // Compute label position from labelT along the SVG path
  const labelPos = useMemo(() => {
    if (!edgeLabel) return { x: (finalSx + finalTx) / 2 || 0, y: (finalSy + finalTy) / 2 || 0 };
    try {
      return getPointOnPath(edgePath, labelT);
    } catch (e) {
      return { x: (finalSx + finalTx) / 2 || 0, y: (finalSy + finalTy) / 2 || 0 };
    }
  }, [edgePath, labelT, edgeLabel, finalSx, finalSy, finalTx, finalTy]);

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
