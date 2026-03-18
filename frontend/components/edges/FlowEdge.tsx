import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
} from 'reactflow';
import { EDGE_TYPE_CONFIGS, DEFAULT_EDGE_TYPE, EdgeType } from '@/data/edgeTypes';
import { EdgeContextMenu } from './EdgeContextMenu';
import { EdgeToolbar } from './EdgeToolbar';
import { EdgeLabel } from './EdgeLabel';

export function FlowEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data,
  selected,
}: EdgeProps) {
  const edgeType: EdgeType = data?.edgeType ?? DEFAULT_EDGE_TYPE;
  const cfg = EDGE_TYPE_CONFIGS[edgeType];

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const closeMenu = useCallback(() => setContextMenu(null), []);

  const dashAnimation = cfg.strokeDasharray && cfg.animationDuration !== '0s'
    ? {
        strokeDasharray: cfg.strokeDasharray,
        animation: `edgeDash ${cfg.animationDuration} linear infinite`,
      }
    : {};

  const strokeStyle: React.CSSProperties = {
    stroke: cfg.color,
    strokeWidth: cfg.strokeWidth,
    strokeDasharray: cfg.strokeDasharray || undefined,
    ...dashAnimation,
  };

  const rfMarkerEnd = `url(#marker-${edgeType}-end)`;
  const rfMarkerStart = cfg.markerStart ? `url(#marker-${edgeType}-start)` : undefined;

  return (
    <>
      <path
        d={edgePath}
        stroke="transparent"
        strokeWidth={16}
        fill="none"
        onContextMenu={handleContextMenu}
        style={{ cursor: 'context-menu' }}
      />

      <path
        d={edgePath}
        fill="none"
        style={strokeStyle}
        markerEnd={rfMarkerEnd}
        markerStart={rfMarkerStart}
        className={selected ? 'opacity-100' : 'opacity-80'}
        onContextMenu={handleContextMenu}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            zIndex: 10,
          }}
          onContextMenu={handleContextMenu}
        >
          <EdgeLabel
            edgeId={id}
            edgeType={edgeType}
            label={data?.label}
            labelX={labelX}
            labelY={labelY}
          />
        </div>
      </EdgeLabelRenderer>

      {selected && (
        <EdgeToolbar
          edgeId={id}
          currentType={edgeType}
          labelX={labelX}
          labelY={labelY}
        />
      )}

      {contextMenu && ReactDOM.createPortal(
        <EdgeContextMenu
          edgeId={id}
          currentType={edgeType}
          position={contextMenu}
          onClose={closeMenu}
        />,
        document.body
      )}
    </>
  );
}
