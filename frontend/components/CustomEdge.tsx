'use client';

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import {
  EdgeProps,
  getSmoothStepPath,
  getStraightPath,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';

export type EdgeStyleType = 'solid' | 'dashed' | 'dotted';
export type EdgeConnectionType = 'smoothstep' | 'straight' | 'orthogonal';

export interface CustomEdgeData {
  label?: string;
  edgeStyle?: EdgeStyleType;
  connectionType?: EdgeConnectionType;
  bidirectional?: boolean;
  color?: string;
}

function getStrokeDasharray(style: EdgeStyleType): string | undefined {
  if (style === 'dashed') return '6 4';
  if (style === 'dotted') return '2 4';
  return undefined;
}

function CustomEdgeComponent({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data = {},
  selected,
}: EdgeProps<CustomEdgeData>) {
  const [hovered, setHovered] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const updateEdgeData = useDiagramStore((s) => s.updateEdgeData);
  const editingEdgeId = useDiagramStore((s) => s.editingEdgeId);
  const setEditingEdgeId = useDiagramStore((s) => s.setEditingEdgeId);

  const editing = editingEdgeId === id;

  const color = data.color ?? '#94a3b8';
  const edgeStyle = data.edgeStyle ?? 'solid';
  const connectionType = data.connectionType ?? 'smoothstep';
  const bidirectional = data.bidirectional ?? false;
  const label = data.label ?? '';

  let path = '';
  let labelX = 0;
  let labelY = 0;

  if (connectionType === 'straight') {
    [path, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  } else if (connectionType === 'orthogonal') {
    [path, labelX, labelY] = getSmoothStepPath({
      sourceX, sourceY, sourcePosition,
      targetX, targetY, targetPosition,
      borderRadius: 0,
    });
  } else {
    [path, labelX, labelY] = getBezierPath({
      sourceX, sourceY, sourcePosition,
      targetX, targetY, targetPosition,
    });
  }

  // Focus + select all when editing starts
  useEffect(() => {
    if (editing) {
      setDraft(label);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editing]);  // eslint-disable-line react-hooks/exhaustive-deps

  const commitEdit = useCallback(() => {
    updateEdgeData(id, { label: draft });
    setEditingEdgeId(null);
  }, [id, draft, updateEdgeData, setEditingEdgeId]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') { setEditingEdgeId(null); }
  }, [commitEdit, setEditingEdgeId]);

  const strokeWidth = selected ? 2.5 : 1.5;
  const strokeDasharray = getStrokeDasharray(edgeStyle);
  const markerEndId = `arrow-${id}-end`;
  const markerStartId = `arrow-${id}-start`;
  const showLabel = label.length > 0 || hovered || selected || editing;

  return (
    <>
      <defs>
        <marker id={markerEndId} markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill={color} />
        </marker>
        {bidirectional && (
          <marker id={markerStartId} markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto-start-reverse">
            <path d="M0,0 L0,6 L9,3 z" fill={color} />
          </marker>
        )}
      </defs>

      {/* Wide invisible hit area */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: 'pointer' }}
      />

      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: color,
          strokeWidth,
          strokeDasharray,
          markerEnd: `url(#${markerEndId})`,
          markerStart: bidirectional ? `url(#${markerStartId})` : undefined,
          opacity: selected || hovered ? 1 : 0.75,
          transition: 'opacity 0.15s',
        }}
      />

      {showLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {editing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={onKeyDown}
                placeholder="Type label…"
                style={{
                  background: 'hsl(var(--card))',
                  border: `1.5px solid ${color}`,
                  borderRadius: 6,
                  padding: '3px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'hsl(var(--foreground))',
                  outline: 'none',
                  minWidth: 80,
                  maxWidth: 180,
                  textAlign: 'center',
                  boxShadow: `0 0 0 3px ${color}22, 0 2px 8px rgba(0,0,0,0.15)`,
                }}
              />
            ) : (
              <div
                style={{
                  background: label ? 'hsl(var(--card))' : 'transparent',
                  border: `1px solid ${label ? color + '55' : 'transparent'}`,
                  borderRadius: 6,
                  padding: label ? '2px 8px' : '2px 4px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: label ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                  whiteSpace: 'nowrap',
                  boxShadow: label ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'text',
                  opacity: label ? 1 : 0.45,
                  transition: 'all 0.15s',
                  userSelect: 'none',
                }}
              >
                {label || (hovered || selected ? '+ label' : '')}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const CustomEdge = memo(CustomEdgeComponent);
