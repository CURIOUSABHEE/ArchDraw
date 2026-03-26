'use client';

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import {
  EdgeProps,
  getSmoothStepPath,
  getStraightPath,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  useReactFlow,
} from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';

export type EdgeStyleType = 'solid' | 'dashed' | 'dotted';
export type EdgeConnectionType = 'smoothstep' | 'straight' | 'orthogonal';
export interface ControlPoint { x: number; y: number }

export interface CustomEdgeData {
  label?: string;
  edgeStyle?: EdgeStyleType;
  connectionType?: EdgeConnectionType;
  bidirectional?: boolean;
  color?: string;
  controlPoints?: ControlPoint[];
}

function getStrokeDasharray(style: EdgeStyleType) {
  if (style === 'dashed') return '6 4';
  if (style === 'dotted') return '2 4';
  return undefined;
}

function buildPath(sx: number, sy: number, tx: number, ty: number, cps: ControlPoint[]) {
  if (cps.length === 0) {
    const mx = (sx + tx) / 2;
    return `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`;
  }
  if (cps.length === 1) return `M${sx},${sy} Q${cps[0].x},${cps[0].y} ${tx},${ty}`;
  return `M${sx},${sy} C${cps[0].x},${cps[0].y} ${cps[1].x},${cps[1].y} ${tx},${ty}`;
}

function bezierMid(sx: number, sy: number, tx: number, ty: number, cps: ControlPoint[]): [number, number] {
  const t = 0.5;
  if (cps.length === 0) {
    const mx = (sx + tx) / 2;
    return [
      (1-t)**3*sx + 3*(1-t)**2*t*mx + 3*(1-t)*t**2*mx + t**3*tx,
      (1-t)**3*sy + 3*(1-t)**2*t*sy  + 3*(1-t)*t**2*ty  + t**3*ty,
    ];
  }
  if (cps.length === 1) return [
    (1-t)**2*sx + 2*(1-t)*t*cps[0].x + t**2*tx,
    (1-t)**2*sy + 2*(1-t)*t*cps[0].y + t**2*ty,
  ];
  return [
    (1-t)**3*sx + 3*(1-t)**2*t*cps[0].x + 3*(1-t)*t**2*cps[1].x + t**3*tx,
    (1-t)**3*sy + 3*(1-t)**2*t*cps[0].y + 3*(1-t)*t**2*cps[1].y + t**3*ty,
  ];
}

function defaultCPs(sx: number, sy: number, tx: number, ty: number): ControlPoint[] {
  return [
    { x: sx + (tx - sx) / 3,       y: sy + (ty - sy) / 3 },
    { x: sx + (tx - sx) * 2 / 3,   y: sy + (ty - sy) * 2 / 3 },
  ];
}

function CustomEdgeComponent({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data = {},
  selected,
}: EdgeProps<CustomEdgeData>) {
  const [hovered, setHovered]   = useState(false);
  const [editing, setEditing]   = useState(false);
  const [draft,   setDraft]     = useState('');
  const [draggingCp, setDraggingCp] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editingRef = useRef(editing);
  const lastClickTime = useRef(0);
  const { getZoom } = useReactFlow();
  const updateEdgeData = useDiagramStore((s) => s.updateEdgeData);
  const setPendingEditEdgeId = useDiagramStore((s) => s.setPendingEditEdgeId);

  useEffect(() => {
    editingRef.current = editing;
  }, [editing]);

  // Clear pending edit after timeout if no double-click
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (lastClickTime.current !== 0 && Date.now() - lastClickTime.current >= 300) {
        lastClickTime.current = 0;
        useDiagramStore.getState().setPendingEditEdgeId(null);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, []);

  const color          = data.color          ?? '#94a3b8';
  const edgeStyle      = data.edgeStyle      ?? 'solid';
  const connectionType = data.connectionType ?? 'smoothstep';
  const bidirectional  = data.bidirectional  ?? false;
  const label          = data.label          ?? '';
  const cps: ControlPoint[] = data.controlPoints ?? [];

  // ── Path ──────────────────────────────────────────────────────────────────
  let path = '', labelX = 0, labelY = 0;
  if (cps.length > 0) {
    path = buildPath(sourceX, sourceY, targetX, targetY, cps);
    [labelX, labelY] = bezierMid(sourceX, sourceY, targetX, targetY, cps);
  } else if (connectionType === 'straight') {
    [path, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  } else if (connectionType === 'orthogonal') {
    [path, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 0 });
  } else {
    [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  }

  // ── Focus input when editing flips on ─────────────────────────────────────
  useEffect(() => {
    if (editing) {
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [editing]);

  const openEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime.current;
    
    if (timeSinceLastClick < 300 && timeSinceLastClick > 0) {
      // Double click detected - upgrade to editing
      lastClickTime.current = 0;
      useDiagramStore.getState().setPendingEditEdgeId(null);
      useDiagramStore.getState().setEditingEdgeId(id);
      setDraft(label);
      setEditing(true);
    } else {
      // First click - mark as pending double-click
      lastClickTime.current = now;
      useDiagramStore.getState().setPendingEditEdgeId(id);
    }
  }, [label, id]);

  const commitEdit = useCallback(() => {
    updateEdgeData(id, { label: draft.trim() });
    setEditing(false);
  }, [id, draft, updateEdgeData]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter')  { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') { setEditing(false); }
  }, [commitEdit]);

  // ── Control point drag ────────────────────────────────────────────────────
  const startDragCp = useCallback((e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingCp(idx);

    const handles = cps.length > 0 ? [...cps] : defaultCPs(sourceX, sourceY, targetX, targetY);

    const onMove = (me: MouseEvent) => {
      const zoom = getZoom();
      const pane     = document.querySelector('.react-flow__pane')     as HTMLElement | null;
      const viewport = document.querySelector('.react-flow__viewport') as HTMLElement | null;
      if (!pane || !viewport) return;
      const rect   = pane.getBoundingClientRect();
      const matrix = new DOMMatrix(window.getComputedStyle(viewport).transform);
      handles[idx] = {
        x: (me.clientX - rect.left  - matrix.m41) / zoom,
        y: (me.clientY - rect.top   - matrix.m42) / zoom,
      };
      updateEdgeData(id, { controlPoints: [...handles] });
    };
    const onUp = () => {
      setDraggingCp(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, [cps, sourceX, sourceY, targetX, targetY, id, updateEdgeData, getZoom]);

  // ── Derived visuals ───────────────────────────────────────────────────────
  const strokeColor = selected ? '#6366f1' : (hovered ? color : '#94a3b8');
  const strokeWidth = selected ? 2 : (hovered ? 1.5 : 1.25);
  const strokeDasharray = getStrokeDasharray(edgeStyle);
  const isAnimated = edgeStyle === 'dashed' || edgeStyle === 'dotted';
  const markerEnd = `arrow-${id}-end`;
  const markerStart = `arrow-${id}-start`;
  const cpHandles = selected ? (cps.length > 0 ? cps : defaultCPs(sourceX, sourceY, targetX, targetY)) : [];
  const showLabel = editing || label.length > 0 || hovered || selected;

  return (
    <>
      <defs>
        <marker 
          id={markerEnd} 
          markerWidth="8" 
          markerHeight="8" 
          refX="7" 
          refY="3" 
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,5.5 L7,3 z" fill={strokeColor} />
        </marker>
        {bidirectional && (
          <marker 
            id={markerStart} 
            markerWidth="8" 
            markerHeight="8" 
            refX="1" 
            refY="3" 
            orient="auto-start-reverse"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,5.5 L7,3 z" fill={strokeColor} />
          </marker>
        )}
      </defs>

      {/* Invisible wide hit area — double-click opens edit */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={18}
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={openEdit}
      />

      {/* Visible path */}
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
          markerEnd:   `url(#${markerEnd})`,
          markerStart: bidirectional ? `url(#${markerStart})` : undefined,
          opacity: selected || hovered ? 1 : 0.65,
          transition: 'stroke 0.15s, stroke-width 0.15s, opacity 0.15s',
          filter: hovered ? `url(#glow-${id})` : undefined,
          ...(isAnimated && {
            strokeDashoffset: 20,
            animation: `dash 0.8s linear infinite`,
          }),
        }}
      />

      {/* Control point handles */}
      {cpHandles.map((cp, i) => (
        <circle
          key={i}
          cx={cp.x} cy={cp.y} r={4}
          fill="#6366f1" stroke="hsl(var(--card))" strokeWidth={1.5}
          style={{ cursor: draggingCp === i ? 'grabbing' : 'grab', pointerEvents: 'all' }}
          onMouseDown={(e) => startDragCp(e, i)}
          onDoubleClick={(e) => { e.stopPropagation(); updateEdgeData(id, { controlPoints: [] }); }}
        />
      ))}

      {/* Inline label */}
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
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
                  border: `1.5px solid #6366f1`,
                  borderRadius: 5,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: 500,
                  color: 'hsl(var(--foreground))',
                  outline: 'none',
                  minWidth: 60,
                  maxWidth: 150,
                  textAlign: 'center',
                  boxShadow: '0 0 0 3px rgba(99,102,241,0.15), 0 2px 8px rgba(0,0,0,0.08)',
                }}
              />
            ) : (
              <div
                onDoubleClick={openEdit}
                style={{
                  background: label ? 'hsl(var(--card))' : 'transparent',
                  border: `1px solid ${label ? 'hsl(var(--border))' : 'transparent'}`,
                  borderRadius: 5,
                  padding: label ? '2px 8px' : '2px 4px',
                  fontSize: 11,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: 500,
                  color: label ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                  whiteSpace: 'nowrap',
                  boxShadow: label ? '0 1px 3px hsl(var(--border))' : 'none',
                  cursor: 'text',
                  opacity: label ? 1 : (hovered || selected ? 0.7 : 0),
                  transition: 'opacity 0.15s, box-shadow 0.15s',
                  userSelect: 'none',
                }}
              >
                {label || '+ label'}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const CustomEdge = memo(CustomEdgeComponent, (prev, next) => {
  if (prev.id !== next.id) return false;
  if (prev.selected !== next.selected) return false;
  if (prev.sourceX !== next.sourceX || prev.sourceY !== next.sourceY) return false;
  if (prev.targetX !== next.targetX || prev.targetY !== next.targetY) return false;
  if (prev.sourcePosition !== next.sourcePosition || prev.targetPosition !== next.targetPosition) return false;
  const prevData = prev.data || {};
  const nextData = next.data || {};
  if (prevData.label !== nextData.label) return false;
  if (prevData.edgeStyle !== nextData.edgeStyle) return false;
  if (prevData.connectionType !== nextData.connectionType) return false;
  if (prevData.bidirectional !== nextData.bidirectional) return false;
  if (prevData.color !== nextData.color) return false;
  const prevCps = prevData.controlPoints || [];
  const nextCps = nextData.controlPoints || [];
  if (prevCps.length !== nextCps.length) return false;
  return true;
});
