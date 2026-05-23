'use client';

import React, { useState, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { 
  EdgeProps, EdgeLabelRenderer, Position,
  getSmoothStepPath,
} from 'reactflow';
import { EdgeContextMenu } from './EdgeContextMenu';
import { EdgeToolbar } from './EdgeToolbar';
import { EdgeLabel } from './EdgeLabel';
import { DIAGRAM_CONSTANTS } from '@/constants/diagram';
import type { EdgeData } from '@/data/edgeTypes';

export function FlowEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<EdgeData>) {
  const [isHovered, setIsHovered] = useState(false);

  // Enforce smoothstep path always
  const { path: edgePath, labelX, labelY } = useMemo(() => {
    const [path, lx, ly] = getSmoothStepPath({
      sourceX, sourceY, sourcePosition,
      targetX, targetY, targetPosition,
      borderRadius: 50,
    });
    return { path, labelX: lx, labelY: ly };
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);

  const isAsync = data?.edgeVariant === 'dashed' || data?.async || data?.connectionType === 'async';

  const strokeStyle: React.CSSProperties = useMemo(() => {
    const stroke = DIAGRAM_CONSTANTS.edge.stroke;
    const strokeWidth = DIAGRAM_CONSTANTS.edge.strokeWidth;
    const strokeDasharray = isAsync ? DIAGRAM_CONSTANTS.edge.dashArray : undefined;

    return {
      stroke,
      strokeWidth,
      strokeDasharray,
      transition: 'opacity 0.2s',
      opacity: selected || isHovered ? 1 : 0.85,
    };
  }, [isAsync, selected, isHovered]);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const closeMenu = useCallback(() => setContextMenu(null), []);

  return (
    <>
      {/* Hit area */}
      <path
        d={edgePath}
        stroke="transparent"
        strokeWidth={20}
        fill="none"
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ cursor: 'pointer', zIndex: 0 }}
      />

      {/* Visible edge path */}
      <path
        d={edgePath}
        fill="none"
        markerEnd={markerEnd}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ ...strokeStyle, zIndex: 0 }}
      />

      <EdgeLabelRenderer>
        {!data?.hideLabel && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 1000,
            }}
            onContextMenu={handleContextMenu}
          >
            <EdgeLabel
              edgeId={id}
              label={data?.label}
              labelX={labelX}
              labelY={labelY}
            />
          </div>
        )}
      </EdgeLabelRenderer>

      {selected && (
        <EdgeToolbar
          edgeId={id}
          currentLabel={data?.label}
          currentEdgeType={data?.edgeType}
          currentPathType={data?.pathType}
          labelX={labelX}
          labelY={labelY}
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
