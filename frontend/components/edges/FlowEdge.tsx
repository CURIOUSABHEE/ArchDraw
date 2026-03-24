import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  EdgeProps,
  EdgeLabelRenderer,
} from 'reactflow';
import { EDGE_TYPE_CONFIGS, DEFAULT_EDGE_TYPE, EdgeType } from '@/data/edgeTypes';
import { EdgeContextMenu } from './EdgeContextMenu';
import { EdgeToolbar } from './EdgeToolbar';
import { EdgeLabel } from './EdgeLabel';

function getSimpleEdgePath(
  sourceX: number, sourceY: number,
  targetX: number, targetY: number,
  offset: number = 40
): { path: string; labelX: number; labelY: number } {
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  const cp1x = sourceX + offset;
  const cp1y = sourceY;
  const cp2x = targetX - offset;
  const cp2y = targetY;

  const dFn = `M ${sourceX} ${sourceY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetX} ${targetY}`;

  return {
    path: dFn,
    labelX: midX,
    labelY: midY - 15,
  };
}

export function FlowEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data,
  selected,
}: EdgeProps) {
  const edgeType: EdgeType = data?.edgeType ?? DEFAULT_EDGE_TYPE;
  const cfg = EDGE_TYPE_CONFIGS[edgeType];

  const spreadOffset = (data?.spreadOffset as number) ?? 0;
  const isBundle     = (data?.isBundle     as boolean) ?? false;

  const adjustedSourceY = sourceY + spreadOffset;
  const adjustedTargetY = targetY + spreadOffset;

  const { path: edgePath, labelX: lx, labelY: ly } = getSimpleEdgePath(
    sourceX, adjustedSourceY, targetX, adjustedTargetY, 40
  );

  const strokeWidth = isBundle ? (cfg.strokeWidth ?? 2) + 1 : (cfg.strokeWidth ?? 2);

  // Label position calculated by smart router

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
    strokeWidth,
    strokeDasharray: cfg.strokeDasharray || undefined,
    ...dashAnimation,
  };

  const rfMarkerEnd   = `url(#marker-${edgeType}-end)`;
  const rfMarkerStart = cfg.markerStart ? `url(#marker-${edgeType}-start)` : undefined;

  // lx and ly are obtained from path routing above

  return (
    <>
      <path
        d={edgePath}
        stroke="transparent"
        strokeWidth={20}
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
        {!data?.hideLabel && (
          <div
            style={{
              position: 'absolute',
              transform: 'translate(-50%, -50%) translate(' + lx + 'px,' + (ly - 2) + 'px)',
              pointerEvents: 'all',
              zIndex: 10,
            }}
            onContextMenu={handleContextMenu}
          >
            <EdgeLabel
              edgeId={id}
              edgeType={edgeType}
              label={data?.label}
              labelX={lx}
              labelY={ly}
            />
          </div>
        )}
      </EdgeLabelRenderer>
      {selected && (
        <EdgeToolbar
          edgeId={id}
          currentType={edgeType}
          currentLabel={data?.label as string | undefined}
          labelX={lx}
          labelY={ly}
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