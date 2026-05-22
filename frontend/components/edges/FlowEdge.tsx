'use client';

import React, { useState, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { 
  EdgeProps, EdgeLabelRenderer, Position,
  getSmoothStepPath, getStraightPath,
} from 'reactflow';
import { EdgeContextMenu } from './EdgeContextMenu';
import { EdgeToolbar } from './EdgeToolbar';
import { EdgeLabel } from './EdgeLabel';
import { useCanvasTheme } from '@/lib/theme';
import type { EdgeData, PathType } from '@/data/edgeTypes';
import { getEdgeConfig, getEffectivePathType, EDGE_TYPE_CONFIGS } from '@/data/edgeTypes';

const EDGE_COLORS = {
  light: {
    default: '#6B7280',
    hover: '#4B5563',
    selected: '#374151',
    async: '#F59E0B',
    error: '#EF4444',
    success: '#10B981',
    data: '#3B82F6',
  },
  dark: {
    default: '#6B7280',
    hover: '#9CA3AF',
    selected: '#9CA3AF',
    async: '#F59E0B',
    error: '#EF4444',
    success: '#10B981',
    data: '#3B82F6',
  },
};

function getInferredConnectionStyle(connectionType: string | undefined, label: string | undefined, isDark: boolean): { color?: string; dash?: string; animated?: boolean } {
  const lowerLabel = label?.toLowerCase() ?? '';
  const lowerType = connectionType?.toLowerCase() ?? '';
  const colors = isDark ? EDGE_COLORS.dark : EDGE_COLORS.light;
  
  // Rule 4: Sync connections (REST, HTTPS, SQL, gRPC) → solid lines
  const isSync = lowerType === 'sync' || ['rest', 'https', 'http', 'sql', 'grpc', 'postgres', 'mysql'].some(p => lowerLabel.includes(p));
  
  // Rule 4: Async connections (AMQP, Kafka, Queue, Pub/Sub) → dashed lines
  const isAsync = lowerType === 'async' || ['amqp', 'kafka', 'queue', 'pub/Sub', 'redis', 'nats'].some(p => lowerLabel.includes(p));

  if (isAsync) {
    return { color: colors.async, dash: '8,4', animated: true };
  }
  
  if (lowerType === 'error' || lowerLabel.includes('error') || lowerLabel.includes('failed')) {
    return { color: colors.error };
  }
  
  return { color: colors.default, dash: '', animated: false };
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
      return getBezierPathWithOffset(sourceX, sourceY, targetX, targetY, sourcePosition);
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
  const [isHovered, setIsHovered] = useState(false);

  const edgeType = data?.edgeType;
  const customPathType = data?.pathType;
  const edgeVariant = data?.edgeVariant;
  const connectionType = data?.connectionType || edgeType || 'sync';

  const pathType = getEffectivePathType(edgeType, customPathType);
  const config = getEdgeConfig(connectionType) || EDGE_TYPE_CONFIGS.sync;

  const { isDark } = useCanvasTheme();
  const inferred = getInferredConnectionStyle(connectionType, data?.label, isDark);

  const { path: edgePath, labelX, labelY } = useMemo(() => {
    return getPath(pathType, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition);
  }, [pathType, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);

  const lowerLabel = data?.label?.toLowerCase() ?? '';
  const lowerType = connectionType?.toLowerCase() ?? '';
  const isAsync = lowerType === 'async' || lowerType === 'publish' || lowerType === 'consume' || ['amqp', 'kafka', 'queue', 'pub/sub', 'event', 'publish', 'consume', 'nats', 'rabbitmq'].some(p => lowerLabel.includes(p));

  const animationClass = useMemo(() => {
    const shouldAnimate = inferred.animated || config.animated || (isDark && isAsync);
    if (!shouldAnimate) return '';
    return `flow-${id}`;
  }, [inferred.animated, config.animated, isDark, isAsync, id]);

  const strokeColor = useMemo(() => {
    if (selected) {
      return isDark ? '#9CA3AF' : '#374151';
    }
    if (data?.color) {
      return data.color;
    }
    if (isDark) {
      if (isAsync) return '#FBBF24';
      if (lowerType === 'error' || lowerLabel.includes('error') || lowerLabel.includes('failed')) return '#EF4444';
      if (lowerType === 'success' || lowerLabel.includes('success') || lowerLabel.includes('ok')) return '#34D399';
      return '#60A5FA'; // sync/default bright blue
    }
    return inferred.color || config.color || '#6B7280';
  }, [selected, isDark, data?.color, isAsync, lowerType, lowerLabel, inferred.color, config.color]);

  const strokeStyle: React.CSSProperties = useMemo(() => {
    let dashArray = inferred.dash || config.dash || '';
    let strokeWidth = selected ? 2.5 : (isHovered ? 2 : 1.5);

    if (isDark) {
      if (edgeVariant === 'dashed' || isAsync) {
        dashArray = '8,4';
      } else if (edgeVariant === 'dotted') {
        dashArray = '2,2';
      } else if (edgeVariant === 'feedback') {
        dashArray = '12,4,4,4';
        strokeWidth = selected ? 3 : (isHovered ? 2.5 : 2);
      } else {
        dashArray = '';
      }
    } else {
      if (edgeVariant === 'dashed') {
        dashArray = '8,4';
      } else if (edgeVariant === 'dotted') {
        dashArray = '2,2';
      } else if (edgeVariant === 'feedback') {
        dashArray = '12,4,4,4';
        strokeWidth = 2;
      }
    }

    const opacity = selected ? 1 : (isHovered ? 1 : (isDark ? 0.8 : 0.85));

    return {
      stroke: strokeColor,
      strokeWidth,
      strokeDasharray: dashArray || undefined,
      transition: 'stroke 0.2s, stroke-width 0.2s, opacity 0.2s, filter 0.2s',
      opacity,
      filter: isDark ? `drop-shadow(0 0 ${isHovered ? '6px' : '3px'} ${strokeColor})` : undefined,
    };
  }, [inferred.dash, config.dash, edgeVariant, selected, isHovered, isDark, isAsync, strokeColor]);

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
            refX="0"
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ cursor: 'pointer', zIndex: 0 }}
      />

      {/* Visible edge path */}
      <path
        d={edgePath}
        fill="none"
        markerEnd={config.markerEnd ? `url(#arrow-${id})` : undefined}
        markerStart={config.markerStart ? `url(#arrow-start-${id})` : undefined}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ ...strokeStyle, zIndex: 0 }}
        className={animationClass}
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
              edgeColor={strokeColor}
            />
          </div>
        )}
      </EdgeLabelRenderer>

      {selected && (
        <EdgeToolbar
          edgeId={id}
          currentLabel={data?.label}

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
