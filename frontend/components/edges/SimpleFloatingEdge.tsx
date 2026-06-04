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
} from 'reactflow';
import { getDynamicHandles, getHandleCoordinate } from '@/lib/features/dynamicHandles';
import { getPointOnPath, findClosestT } from '@/lib/utils/edgeLabelDrag';
import { useDiagramStore } from '@/store/diagramStore';
import { DIAGRAM_CONSTANTS } from '@/constants/diagram';
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
  const isHorizontal = sourcePosition === Position.Left || sourcePosition === Position.Right;

  if (isHorizontal) {
    const mx = (sourceX + targetX) / 2;
    const mx_custom = mx + edgeOffset;

    const dx_sign = Math.sign(mx_custom - sourceX) || 1;
    const dy_sign = Math.sign(targetY - sourceY) || 1;
    const dx_sign_target = Math.sign(targetX - mx_custom) || 1;

    const r = Math.max(0, Math.min(
      borderRadius,
      Math.abs(mx_custom - sourceX),
      Math.abs(targetX - mx_custom),
      Math.abs(targetY - sourceY) / 2
    ));

    if (r === 0) {
      return `M ${sourceX},${sourceY} L ${mx_custom},${sourceY} L ${mx_custom},${targetY} L ${targetX},${targetY}`;
    }

    return `M ${sourceX},${sourceY} ` +
      `L ${mx_custom - dx_sign * r},${sourceY} ` +
      `Q ${mx_custom},${sourceY} ${mx_custom},${sourceY + dy_sign * r} ` +
      `L ${mx_custom},${targetY - dy_sign * r} ` +
      `Q ${mx_custom},${targetY} ${mx_custom + dx_sign_target * r},${targetY} ` +
      `L ${targetX},${targetY}`;
  } else {
    const my = (sourceY + targetY) / 2;
    const my_custom = my + edgeOffset;

    const dy_sign = Math.sign(my_custom - sourceY) || 1;
    const dx_sign = Math.sign(targetX - sourceX) || 1;
    const dy_sign_target = Math.sign(targetY - my_custom) || 1;

    const r = Math.max(0, Math.min(
      borderRadius,
      Math.abs(my_custom - sourceY),
      Math.abs(targetY - my_custom),
      Math.abs(targetX - sourceX) / 2
    ));

    if (r === 0) {
      return `M ${sourceX},${sourceY} L ${sourceX},${my_custom} L ${targetX},${my_custom} L ${targetX},${targetY}`;
    }

    return `M ${sourceX},${sourceY} ` +
      `L ${sourceX},${my_custom - dy_sign * r} ` +
      `Q ${sourceX},${my_custom} ${sourceX + dx_sign * r},${my_custom} ` +
      `L ${targetX - dx_sign * r},${my_custom} ` +
      `Q ${targetX},${my_custom} ${targetX},${my_custom + dy_sign_target * r} ` +
      `L ${targetX},${targetY}`;
  }
}

const getEdgeSide = (
  edge: any,
  nodeId: string,
  nodeInternals: Map<string, any>
): Position | null => {
  const sourceNode = nodeInternals.get(edge.source);
  const targetNode = nodeInternals.get(edge.target);
  if (!sourceNode || !targetNode) return null;

  const sX = sourceNode.positionAbsolute?.x ?? sourceNode.position.x;
  const sY = sourceNode.positionAbsolute?.y ?? sourceNode.position.y;
  const tX = targetNode.positionAbsolute?.x ?? targetNode.position.x;
  const tY = targetNode.positionAbsolute?.y ?? targetNode.position.y;

  const sWidth = sourceNode.measured?.width ?? sourceNode.width ?? sourceNode.data?.nodeWidth ?? 200;
  const sHeight = sourceNode.measured?.height ?? sourceNode.height ?? sourceNode.data?.nodeHeight ?? 80;
  const tWidth = targetNode.measured?.width ?? targetNode.width ?? targetNode.data?.nodeWidth ?? 200;
  const tHeight = targetNode.measured?.height ?? targetNode.height ?? targetNode.data?.nodeHeight ?? 80;

  const sourceRect = { x: sX, y: sY, width: sWidth, height: sHeight };
  const targetRect = { x: tX, y: tY, width: tWidth, height: tHeight };

  const handles = getDynamicHandles(sourceRect, targetRect);

  if (edge.source === nodeId) {
    return handles.sourcePosition;
  } else if (edge.target === nodeId) {
    return handles.targetPosition;
  }
  return null;
};

const isSideBidirectional = (
  nodeId: string,
  side: Position,
  edges: any[],
  nodeInternals: Map<string, any>
): boolean => {
  let hasIncoming = false;
  let hasOutgoing = false;

  for (const edge of edges) {
    if (edge.source === nodeId || edge.target === nodeId) {
      const edgeSide = getEdgeSide(edge, nodeId, nodeInternals);
      if (edgeSide === side) {
        if (edge.source === nodeId) {
          hasOutgoing = true;
        } else {
          hasIncoming = true;
        }
      }
    }
    if (hasIncoming && hasOutgoing) return true;
  }

  return false;
};

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

      // Determine if there are bidirectional connections between source and target nodes, in which case we center the handles
      const isBidirectionalConnection = edges.some(e => e.source === target && e.target === source) &&
                                         edges.some(e => e.source === source && e.target === target);

      const sourceBidirectional = isBidirectionalConnection ? false : isSideBidirectional(source, sourcePos, edges, nodeInternals);
      const targetBidirectional = isBidirectionalConnection ? false : isSideBidirectional(target, targetPos, edges, nodeInternals);

      const sourceXY = getHandleCoordinate(sourceRect, sourcePos, 'source', sourceBidirectional);
      const targetXY = getHandleCoordinate(targetRect, targetPos, 'target', targetBidirectional);

      sx = sourceXY.x;
      sy = sourceXY.y;
      tx = targetXY.x;
      ty = targetXY.y;
    }

    return { sx, sy, tx, ty, sourcePos, targetPos };
  }, [sourceNode, targetNode, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, edges, nodeInternals, source, target]);

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

  const bidirectionalEdges = useMemo(() => {
    const forward = edges.filter(e => e.source === source && e.target === target);
    const reverse = edges.filter(e => e.source === target && e.target === source);
    return { forward, reverse, isBidirectional: forward.length > 0 && reverse.length > 0 };
  }, [edges, source, target]);

  const bidirectionalGroup = useMemo(() => {
    if (!bidirectionalEdges.isBidirectional) return null;
    return [...bidirectionalEdges.forward, ...bidirectionalEdges.reverse]
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [bidirectionalEdges]);

  const isCombinedLeader = useMemo(() => {
    if (!bidirectionalGroup) return true;
    return bidirectionalGroup[0].id === id;
  }, [bidirectionalGroup, id]);

  const combinedLabel = useMemo(() => {
    if (!bidirectionalGroup) return data?.label?.trim();
    return bidirectionalGroup
      .map(e => e.data?.label?.trim())
      .filter(Boolean)
      .join(' / ');
  }, [bidirectionalGroup, data?.label]);

  const edgeLabel = combinedLabel;

  const parallelEdges = useMemo(
    () => edges.filter((edge) => 
      (edge.source === source && edge.target === target) ||
      (edge.source === target && edge.target === source)
    ).sort((a, b) => a.id.localeCompare(b.id)),
    [edges, source, target]
  );
  const labelOrder = Math.max(0, parallelEdges.findIndex((edge) => edge.id === id));
  const labelT = data?.labelT ?? (parallelEdges.length > 1 ? Math.max(0.2, Math.min(0.8, 0.5 + ((labelOrder - (parallelEdges.length - 1) / 2) * 0.15))) : 0.5);

  // Calculate edge offset to shift path bend points for parallel edges
  // If we are combining bidirectional edges visually, they align to the center (edgeOffset = 0)
  const edgeOffset = (parallelEdges.length > 1 && !bidirectionalGroup)
    ? (labelOrder - (parallelEdges.length - 1) / 2) * 20
    : 0;

  // Enforce custom smoothstep path to avoid overlapping middle segments and preserve arrow directions
  const edgePath = useMemo(() => {
    try {
      return getCustomSmoothStepPath({
        sourceX: sx,
        sourceY: sy,
        targetX: tx,
        targetY: ty,
        sourcePosition: sourcePos,
        targetPosition: targetPos,
        borderRadius: 40,
        edgeOffset: edgeOffset,
      });
    } catch (e) {
      return `M${isNaN(sx) ? 0 : sx},${isNaN(sy) ? 0 : sy} L${isNaN(tx) ? 0 : tx},${isNaN(ty) ? 0 : ty}`;
    }
  }, [sx, sy, tx, ty, sourcePos, targetPos, edgeOffset]);

  // Compute label position from labelT along the SVG path
  const labelPos = useMemo(() => {
    if (!edgeLabel) return { x: (sx + tx) / 2 || 0, y: (sy + ty) / 2 || 0, angle: 0 };
    try {
      return getPointOnPath(edgePath, labelT);
    } catch (e) {
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

  // If this is a bidirectional edge but not the leader, don't render it at all
  if (bidirectionalGroup && !isCombinedLeader) {
    return null;
  }

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
        markerStart={bidirectionalGroup ? markerEnd : undefined}
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
              transform: `translate(-50%, -50%) translate(${labelPos.x}px, ${labelPos.y}px) rotate(${labelPos.angle ?? 0}deg)`,
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
