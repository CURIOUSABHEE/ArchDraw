import React, { useState, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { 
  EdgeProps, EdgeLabelRenderer, Position,
  getBezierPath, getSmoothStepPath, getStraightPath,
} from 'reactflow';
import { EdgeContextMenu } from './EdgeContextMenu';
import { EdgeToolbar } from './EdgeToolbar';
import { EdgeLabel } from './EdgeLabel';
import { useCanvasTheme } from '@/lib/theme';
import type { EdgeData, EdgeType, PathType } from '@/data/edgeTypes';
import { getEdgeConfig, getEffectivePathType } from '@/data/edgeTypes';

const EDGE_COLORS = {
  light: {
    default: '#9CA3AF',
    hover: '#6B7280',
    selected: '#2563EB',
    async: '#F59E0B',
    error: '#EF4444',
    success: '#10B981',
    data: '#F87171',
  },
  dark: {
    default: '#4B5563',
    hover: '#9CA3AF',
    selected: '#3B82F6',
    async: '#FBBF24',
    error: '#EF4444',
    success: '#34D399',
    data: '#FB7185',
  },
};

function getEdgeStyle(connectionType: string | undefined, label: string | undefined, isDark: boolean): { color: string; dash: string; animated: boolean; strokeWidth: number } {
  const lowerLabel = label?.toLowerCase() ?? '';
  const lowerType = connectionType?.toLowerCase() ?? '';
  const colors = isDark ? EDGE_COLORS.dark : EDGE_COLORS.light;
  
  if (lowerType === 'error' || lowerLabel.includes('error') || lowerLabel.includes('failed')) {
    return { color: colors.error, dash: '', animated: false, strokeWidth: 1.5 };
  }
  if (lowerType === 'success' || lowerLabel.includes('success') || lowerLabel.includes('ok')) {
    return { color: colors.success, dash: '', animated: false, strokeWidth: 1.5 };
  }
  if (lowerType === 'async' || lowerType === 'publish' || lowerType === 'consume' || lowerLabel.includes('event') || lowerLabel.includes('publish') || lowerLabel.includes('consume') || lowerLabel.includes('queue')) {
    return { color: colors.async, dash: '8,4', animated: true, strokeWidth: 1.5 };
  }
  if (lowerType === 'sql' || lowerType === 'data' || lowerLabel.includes('sql') || lowerLabel.includes('query') || lowerLabel.includes('cache')) {
    return { color: colors.data, dash: '', animated: false, strokeWidth: 1.5 };
  }
  return { color: colors.default, dash: '', animated: false, strokeWidth: 1.5 };
}

interface PathResult {
  path: string;
  labelX: number;
  labelY: number;
}

function getBezierPathWithOffset(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePosition: Position,
  targetPosition: Position,
): PathResult {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const curveStrength = Math.min(Math.abs(dx) * 0.5, 80);
  
  let controlOffset1: { x: number; y: number };
  let controlOffset2: { x: number; y: number };

  if (sourcePosition === Position.Right || sourcePosition === Position.Left) {
    controlOffset1 = { x: sourceX + Math.sign(dx) * curveStrength, y: sourceY };
    controlOffset2 = { x: targetX - Math.sign(dx) * curveStrength, y: targetY };
  } else {
    controlOffset1 = { x: sourceX, y: sourceY + Math.sign(dy) * curveStrength };
    controlOffset2 = { x: targetX, y: targetY - Math.sign(dy) * curveStrength };
  }

  const path = `M ${sourceX} ${sourceY} C ${controlOffset1.x} ${controlOffset1.y}, ${controlOffset2.x} ${controlOffset2.y}, ${targetX} ${targetY}`;
  
  return {
    path,
    labelX: (sourceX + targetX) / 2,
    labelY: (sourceY + targetY) / 2,
  };
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
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minCurveDistance = 100;
  
  switch (pathType) {
    case 'Smoothstep': {
      if (distance < minCurveDistance) {
        const [path] = getStraightPath({ sourceX, sourceY, targetX, targetY });
        return { path, labelX: (sourceX + targetX) / 2, labelY: (sourceY + targetY) / 2 };
      }
      const [path, labelX, labelY] = getSmoothStepPath({
        sourceX, sourceY, sourcePosition,
        targetX, targetY, targetPosition,
        borderRadius: 50,
      });
      return { path, labelX, labelY };
    }
    
    case 'bezier': {
      if (distance < minCurveDistance) {
        const [path] = getStraightPath({ sourceX, sourceY, targetX, targetY });
        return { path, labelX: (sourceX + targetX) / 2, labelY: (sourceY + targetY) / 2 };
      }
      return getBezierPathWithOffset(sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition);
    }
    
    case 'smooth': {
      if (distance < minCurveDistance) {
        const [path] = getStraightPath({ sourceX, sourceY, targetX, targetY });
        return { path, labelX: (sourceX + targetX) / 2, labelY: (sourceY + targetY) / 2 };
      }
      const [path, labelX, labelY] = getSmoothStepPath({
        sourceX, sourceY, sourcePosition,
        targetX, targetY, targetPosition,
        borderRadius: 24,
      });
      return { path, labelX, labelY };
    }
    
    case 'straight':
    default: {
      const [path] = getStraightPath({ sourceX, sourceY, targetX, targetY });
      return { path, labelX: (sourceX + targetX) / 2, labelY: (sourceY + targetY) / 2 };
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
  const edgeVariant: 'solid' | 'dashed' | 'dotted' | 'feedback' | undefined = data?.edgeVariant;
  const communicationType: string | undefined = (data as { connectionType?: string; communicationType?: string })?.connectionType ?? data?.communicationType;
  const pathType = getEffectivePathType(edgeType, customPathType);
  const config = getEdgeConfig(edgeType);
  
  const { isDark } = useCanvasTheme();
  const commStyle = getEdgeStyle(communicationType, data?.label as string | undefined, isDark);

  const { path: edgePath, labelX, labelY } = useMemo(() => {
    const result = getPath(pathType, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition);
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const perpendicularOffset = Math.min(Math.sqrt(dx * dx + dy * dy) * 0.1, 15);
    const perpX = dy === 0 ? 0 : (dy / Math.abs(dy || 1)) * perpendicularOffset;
    const perpY = dx === 0 ? 0 : -(dx / Math.abs(dx || 1)) * perpendicularOffset;
    return {
      ...result,
      labelX: result.labelX + perpX,
      labelY: result.labelY + perpY,
    };
  }, [pathType, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);

  const animationClass = useMemo(() => {
    const shouldAnimate = commStyle.animated || config.animated;
    if (!shouldAnimate) return '';
    return `flow-${id}`;
  }, [commStyle.animated, config.animated, id]);

  const colors = isDark ? EDGE_COLORS.dark : EDGE_COLORS.light;
  const strokeColor = selected 
    ? colors.selected 
    : commStyle.color || config.color || colors.default;
  
  const strokeStyle: React.CSSProperties = useMemo(() => {
    let dashArray = commStyle.dash || config.dash;
    let strokeWidth = selected ? commStyle.strokeWidth + 0.5 : commStyle.strokeWidth;
    
    if (edgeVariant === 'dashed') {
      dashArray = '8,4';
    } else if (edgeVariant === 'dotted') {
      dashArray = '2,2';
    } else if (edgeVariant === 'feedback') {
      dashArray = '12,4,4,4';
      strokeWidth = 2;
    }
    
    return {
      stroke: strokeColor,
      strokeWidth,
      strokeDasharray: dashArray || undefined,
      transition: 'stroke 0.2s, stroke-width 0.2s, opacity 0.2s',
      opacity: selected ? 1 : 0.85,
    };
  }, [commStyle, config.dash, edgeVariant, selected, strokeColor]);

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
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 0 6 L 6 3 z" fill={strokeColor} />
        </marker>
        {config.markerStart && (
          <marker
            id={`arrow-start-${id}`}
            markerWidth="6"
            markerHeight="6"
            refX="1"
            refY="3"
            orient="auto-start-reverse"
            markerUnits="strokeWidth"
          >
            <path d="M 6 0 L 6 6 L 0 3 z" fill={strokeColor} />
          </marker>
        )}
      </defs>
      
      {/* Hit area */}
      <path
        d={edgePath}
        stroke="transparent"
        strokeWidth={20}
        fill="none"
        onContextMenu={handleContextMenu}
        style={{ cursor: 'pointer' }}
      />
      
      {/* Visible edge path */}
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