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

const COMM_COLORS: Record<string, { color: string; dash: string; animated: boolean }> = {
  sync: { color: '#6366f1', dash: '', animated: false },
  async: { color: '#f59e0b', dash: '8,4', animated: true },
  stream: { color: '#10b981', dash: '4,2', animated: true },
  event: { color: '#ec4899', dash: '2,3', animated: true },
  dep: { color: '#94a3b8', dash: '6,6', animated: true },
};

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

function getCommunicationStyle(communicationType: string | undefined): { color: string; dash: string; animated: boolean } {
  return COMM_COLORS[communicationType || 'sync'] || COMM_COLORS.sync;
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
  const communicationType: string | undefined = data?.communicationType;
  const pathType = getEffectivePathType(edgeType, customPathType);
  const config = getEdgeConfig(edgeType);
  
  const commStyle = getCommunicationStyle(communicationType);
  const isDark = useTheme().isDark;

  const { path: edgePath, labelX, labelY } = useMemo(() => {
    return getPath(pathType, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition);
  }, [pathType, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);

  const animationClass = useMemo(() => {
    const shouldAnimate = commStyle.animated || config.animated;
    if (!shouldAnimate) return '';
    return `flow-${id}`;
  }, [commStyle.animated, config.animated, id]);

  const strokeColor = commStyle.color || config.color;
  
  const strokeStyle: React.CSSProperties = useMemo(() => {
    let dashArray = commStyle.dash || config.dash;
    if (edgeVariant === 'dashed') {
      dashArray = '8,4';
    } else if (edgeVariant === 'dotted') {
      dashArray = '2,2';
    } else if (edgeVariant === 'solid' || !edgeVariant) {
      dashArray = '';
    }
    return {
      stroke: strokeColor,
      strokeWidth: selected ? 2.5 : 2,
      strokeDasharray: dashArray || undefined,
      transition: 'stroke 0.2s, stroke-width 0.2s, opacity 0.2s',
      opacity: selected ? 1 : 0.85,
      filter: selected ? `drop-shadow(0 0 4px ${strokeColor}40)` : 'none',
    };
  }, [commStyle.dash, config.dash, edgeVariant, selected, strokeColor]);

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
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 0 6 L 6 3 z" fill={strokeColor} />
        </marker>
        {config.markerStart && (
          <marker
            id={`arrow-start-${id}`}
            markerWidth="8"
            markerHeight="8"
            refX="2"
            refY="3"
            orient="auto-start-reverse"
            markerUnits="strokeWidth"
          >
            <path d="M 6 0 L 6 6 L 0 3 z" fill={strokeColor} />
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
