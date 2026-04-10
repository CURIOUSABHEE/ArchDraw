import React, { useState, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { 
  EdgeProps, EdgeLabelRenderer, Position,
  getBezierPath, getSmoothStepPath, getStraightPath,
} from 'reactflow';
import { EdgeContextMenu } from './EdgeContextMenu';
import { EdgeToolbar } from './EdgeToolbar';
import { EdgeLabel } from './EdgeLabel';
import { useTheme } from '@/lib/theme';
import type { EdgeData, EdgeType, PathType } from '@/data/edgeTypes';
import { getEdgeConfig, getEffectivePathType } from '@/data/edgeTypes';

interface PathResult {
  path: string;
  labelX: number;
  labelY: number;
}

function getStepPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
): PathResult {
  const midX = (sourceX + targetX) / 2;
  const path = `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;
  return { path, labelX: midX, labelY: (sourceY + targetY) / 2 };
}

function getPath(
  pathType: PathType,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePosition: Position,
  targetPosition: Position,
): PathResult {
  switch (pathType) {
    case 'bezier': {
      const [path] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
      return { path, labelX: (sourceX + targetX) / 2, labelY: (sourceY + targetY) / 2 };
    }
    
    case 'smooth': {
      const [path, labelX, labelY] = getSmoothStepPath({
        sourceX, sourceY, sourcePosition,
        targetX, targetY, targetPosition,
        borderRadius: 24,
      });
      return { path, labelX, labelY };
    }
    
    case 'step': {
      return getStepPath(sourceX, sourceY, targetX, targetY);
    }
    
    case 'straight':
    default: {
      const [path, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
      return { path, labelX, labelY };
    }
  }
}

export function FlowEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data,
  selected,
}: EdgeProps<EdgeData>) {
  const edgeType: EdgeType | undefined = data?.edgeType;
  const customPathType: PathType | undefined = data?.pathType;
  const edgeVariant: 'solid' | 'dashed' | 'dotted' | undefined = data?.edgeVariant;
  const pathType = getEffectivePathType(edgeType, customPathType);
  const config = getEdgeConfig(edgeType);
  
  const { isDark } = useTheme();

  const { path: edgePath, labelX, labelY } = useMemo(() => {
    return getPath(pathType, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition);
  }, [pathType, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);

  const animationClass = useMemo(() => {
    if (!config.animated) return '';
    return `flow-${config.id}`;
  }, [config.animated, config.id]);

  const strokeStyle: React.CSSProperties = useMemo(() => {
    let dashArray = config.dash;
    if (edgeVariant === 'dashed') {
      dashArray = '8,4';
    } else if (edgeVariant === 'dotted') {
      dashArray = '2,2';
    }
    return {
      stroke: config.color,
      strokeWidth: selected ? 2 : 1.5,
      strokeDasharray: dashArray,
      transition: 'stroke 0.2s, stroke-width 0.2s, opacity 0.2s',
      opacity: selected ? 1 : 0.85,
      filter: selected ? `drop-shadow(0 0 4px ${config.color}40)` : 'none',
    };
  }, [config.color, config.dash, edgeVariant, selected]);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const closeMenu = useCallback(() => setContextMenu(null), []);

  return (
    <>
      <defs>
        <marker
          id={`arrow-${id}`}
          markerWidth="5"
          markerHeight="5"
          refX="4"
          refY="2.5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 0 5 L 5 2.5 z" fill={config.color} />
        </marker>
        {config.markerStart && (
          <marker
            id={`arrow-start-${id}`}
            markerWidth="5"
            markerHeight="5"
            refX="1"
            refY="2.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M 5 0 L 5 5 L 0 2.5 z" fill={config.color} />
          </marker>
        )}
      </defs>
      
      <path
        d={edgePath}
        stroke="transparent"
        strokeWidth={24}
        fill="none"
        onContextMenu={handleContextMenu}
        style={{ cursor: 'pointer' }}
      />
      <path
        d={edgePath}
        fill="none"
        markerEnd={`url(#arrow-${id})`}
        markerStart={config.markerStart ? `url(#arrow-start-${id})` : undefined}
        onContextMenu={handleContextMenu}
        style={strokeStyle}
        className={animationClass}
      />
      <EdgeLabelRenderer>
        {!data?.hideLabel && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 12}px)`,
              pointerEvents: 'all',
              zIndex: 10,
            }}
            onContextMenu={handleContextMenu}
          >
            <EdgeLabel
              edgeId={id}
              label={data?.label as string | undefined}
              labelX={labelX}
              labelY={labelY}
            />
          </div>
        )}
      </EdgeLabelRenderer>
      {selected && (
        <EdgeToolbar
          edgeId={id}
          currentLabel={data?.label as string | undefined}
          currentEdgeType={edgeType}
          currentPathType={customPathType}
          labelX={labelX}
          labelY={labelY}
        />
      )}
      {contextMenu && ReactDOM.createPortal(
        <EdgeContextMenu
          edgeId={id}
          position={contextMenu}
          onClose={closeMenu}
          currentEdgeType={edgeType}
          currentPathType={customPathType}
        />,
        document.body
      )}
    </>
  );
}
