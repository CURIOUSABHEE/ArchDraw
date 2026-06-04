'use client';

import { memo, useEffect } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals } from 'reactflow';
import { useCanvasTheme } from '@/lib/theme';
import { LIGHT_NODE_STYLES, DARK_NODE_STYLES } from '@/lib/theme/stylingConstants';
import './nodes/nodeStyles.css';

export type ShapeType =
  | 'rectangle'
  | 'rounded-rectangle'
  | 'diamond'
  | 'cylinder'
  | 'circle'
  | 'parallelogram';

export interface ShapeNodeData {
  label: string;
  sublabel?: string;
  shape: ShapeType;
  color?: string;
  accentColor?: string;
}

const HANDLE_STYLE = (color: string) => ({
  width: 12,
  height: 12,
  background: '#ffffff',
  border: `2px solid ${color}60`,
  borderRadius: '50%',
  boxShadow: '0 2px 8px hsl(var(--foreground) / 0.15)',
});

function Handles({ color, nodeId }: { color: string; nodeId: string }) {
  const updateNodeInternals = useUpdateNodeInternals();
  const s = HANDLE_STYLE(color);
  const sLeft = { ...s, left: -15 };
  
  useEffect(() => {
    updateNodeInternals(nodeId);
  }, [nodeId, updateNodeInternals]);
  
  return (
    <>
      {/* Left side */}
      <Handle type="target" position={Position.Left} id="left" style={sLeft} />
      <Handle type="source" position={Position.Left} id="left" style={sLeft} />

      {/* Right side */}
      <Handle type="target" position={Position.Right} id="right" style={s} />
      <Handle type="source" position={Position.Right} id="right" style={s} />

      {/* Top side */}
      <Handle type="target" position={Position.Top} id="top" style={s} />
      <Handle type="source" position={Position.Top} id="top" style={s} />

      {/* Bottom side */}
      <Handle type="target" position={Position.Bottom} id="bottom" style={s} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={s} />
      
      {/* Dummy handles for edges that don't specify sourceHandle/targetHandle */}
      <Handle type="source" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none', position: 'absolute', top: '50%', left: '50%' }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none', position: 'absolute', top: '50%', left: '50%' }} />
    </>
  );
}

function Label({ label, sublabel, color }: { label: string; sublabel?: string; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-2 pointer-events-none select-none">
      <span className="text-[11px] font-semibold text-foreground leading-tight">{label}</span>
      {sublabel && (
        <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color }}>
          {sublabel}
        </span>
      )}
    </div>
  );
}

function Backplates({ layers, borderRadius }: { layers: { offset: number; color: string }[], borderRadius: number | string }) {
  return (
    <>
      {layers.map((layer, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: borderRadius,
            transform: `translate(${layer.offset}px, ${layer.offset}px)`,
            background: layer.color,
            zIndex: -1,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}

// ── Individual shape renderers ────────────────────────────────────────────────

function Rectangle({ id, data, selected, rounded, backplates, isDark, styles }: { id: string; data: ShapeNodeData; selected: boolean; rounded: boolean; backplates: { offset: number; color: string }[]; isDark: boolean; styles: any }) {
  const color = data.accentColor ?? data.color ?? '#6B7280';
  const r = rounded ? 14 : 8;
  return (
    <div style={{ position: 'relative', zIndex: 2 }}>
      <Backplates layers={backplates} borderRadius={r} />
      <div
        style={{
          width: 140,
          height: 72,
          borderRadius: r,
          border: 'none',
          background: isDark ? styles.background : 'linear-gradient(145deg, #ffffff 0%, hsl(0 0% 98%) 100%)',
          boxShadow: selected 
            ? (isDark ? `0 0 0 2px ${color}, 0 8px 32px ${color}30, 0 4px 12px rgba(0,0,0,0.3)` : `0 0 0 2px ${color}, 0 8px 32px ${color}30, 0 4px 12px hsl(var(--foreground) / 0.1)`)
            : (isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px hsl(var(--foreground) / 0.08), inset 0 1px 0 hsl(var(--foreground) / 0.03)'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          transition: 'box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Colored shine overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: r,
          background: `linear-gradient(135deg, ${color}08 0%, transparent 60%)`,
          pointerEvents: 'none',
        }} />
        <Handles color={color} nodeId={id} />
        <Label label={data.label} sublabel={data.sublabel} color={color} />
      </div>
    </div>
  );
}

function Diamond({ id, data, selected, backplates }: { id: string; data: ShapeNodeData; selected: boolean; backplates: { offset: number; color: string }[] }) {
  const color = data.accentColor ?? data.color ?? '#6B7280';
  const W = 140, H = 80;
  return (
    <div style={{ width: W, height: H, position: 'relative', zIndex: 2 }}>
      {/* SVG-based backplates for diamond */}
      {backplates.map((layer, i) => (
        <svg key={i} width={W} height={H} style={{ position: 'absolute', transform: `translate(${layer.offset}px, ${layer.offset}px)`, zIndex: -1, overflow: 'visible' }}>
          <polygon
            points={`${W / 2},4 ${W - 4},${H / 2} ${W / 2},${H - 4} 4,${H / 2}`}
            fill={layer.color}
          />
        </svg>
      ))}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <polygon
          points={`${W / 2},4 ${W - 4},${H / 2} ${W / 2},${H - 4} 4,${H / 2}`}
          fill={`${color}10`}
          stroke={selected ? color : `${color}50`}
          strokeWidth={selected ? 2 : 1.5}
          filter={selected ? `drop-shadow(0 0 8px ${color}40)` : 'none'}
        />
      </svg>
      <Handles color={color} nodeId={id} />
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Label label={data.label} sublabel={data.sublabel} color={color} />
      </div>
    </div>
  );
}

function Cylinder({ id, data, selected, backplates }: { id: string; data: ShapeNodeData; selected: boolean; backplates: { offset: number; color: string }[] }) {
  const color = data.accentColor ?? data.color ?? '#6B7280';
  const W = 120, H = 90, RY = 14;
  const stroke = selected ? color : `${color}60`;
  const strokeW = selected ? 2 : 1.5;
  return (
    <div style={{ width: W, height: H, position: 'relative', zIndex: 2 }}>
      {backplates.map((layer, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50% / 15%',
            transform: `translate(${layer.offset}px, ${layer.offset}px)`,
            background: layer.color,
            zIndex: -1,
          }}
        />
      ))}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible', filter: selected ? `drop-shadow(0 0 8px ${color}30)` : 'none' }}>
        {/* Body */}
        <rect x={2} y={RY} width={W - 4} height={H - RY * 2} fill={`${color}10`} stroke={stroke} strokeWidth={strokeW} />
        {/* Bottom ellipse */}
        <ellipse cx={W / 2} cy={H - RY} rx={(W - 4) / 2} ry={RY} fill={`${color}15`} stroke={stroke} strokeWidth={strokeW} />
        {/* Top ellipse (drawn last so it overlaps body top edge) */}
        <ellipse cx={W / 2} cy={RY} rx={(W - 4) / 2} ry={RY} fill={`${color}18`} stroke={stroke} strokeWidth={strokeW} />
      </svg>
      <Handles color={color} nodeId={id} />
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Label label={data.label} sublabel={data.sublabel} color={color} />
      </div>
    </div>
  );
}

function Circle({ id, data, selected, backplates }: { id: string; data: ShapeNodeData; selected: boolean; backplates: { offset: number; color: string }[] }) {
  const color = data.accentColor ?? data.color ?? '#6B7280';
  const W = 100, H = 100;
  return (
    <div style={{ width: W, height: H, position: 'relative', zIndex: 2 }}>
      <Backplates layers={backplates} borderRadius="50%" />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, filter: selected ? `drop-shadow(0 0 8px ${color}30)` : 'none' }}>
        <ellipse
          cx={W / 2} cy={H / 2} rx={W / 2 - 2} ry={H / 2 - 2}
          fill={`${color}10`}
          stroke={selected ? color : `${color}50`}
          strokeWidth={selected ? 2 : 1.5}
        />
      </svg>
      <Handles color={color} nodeId={id} />
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Label label={data.label} sublabel={data.sublabel} color={color} />
      </div>
    </div>
  );
}

function Parallelogram({ id, data, selected, backplates }: { id: string; data: ShapeNodeData; selected: boolean; backplates: { offset: number; color: string }[] }) {
  const color = data.accentColor ?? data.color ?? '#6B7280';
  const W = 150, H = 70, SKEW = 20;
  const pts = `${SKEW},2 ${W - 2},2 ${W - SKEW - 2},${H - 2} 2,${H - 2}`;
  return (
    <div style={{ width: W, height: H, position: 'relative', zIndex: 2 }}>
       {backplates.map((layer, i) => (
        <svg key={i} width={W} height={H} style={{ position: 'absolute', transform: `translate(${layer.offset}px, ${layer.offset}px)`, zIndex: -1, overflow: 'visible' }}>
          <polygon
            points={pts}
            fill={layer.color}
          />
        </svg>
      ))}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible', filter: selected ? `drop-shadow(0 0 8px ${color}30)` : 'none' }}>
        <polygon
          points={pts}
          fill={`${color}10`}
          stroke={selected ? color : `${color}50`}
          strokeWidth={selected ? 2 : 1.5}
        />
      </svg>
      <Handles color={color} nodeId={id} />
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Label label={data.label} sublabel={data.sublabel} color={color} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function ShapeNodeComponent({ id, data, selected }: NodeProps<ShapeNodeData>) {
  const { isDark } = useCanvasTheme();
  const styles = isDark ? DARK_NODE_STYLES : LIGHT_NODE_STYLES;
  const backplates = styles.backplates;

  switch (data.shape) {
    case 'diamond':          return <Diamond id={id} data={data} selected={!!selected} backplates={backplates} />;
    case 'cylinder':         return <Cylinder id={id} data={data} selected={!!selected} backplates={backplates} />;
    case 'circle':           return <Circle id={id} data={data} selected={!!selected} backplates={backplates} />;
    case 'parallelogram':    return <Parallelogram id={id} data={data} selected={!!selected} backplates={backplates} />;
    case 'rounded-rectangle': return <Rectangle id={id} data={data} selected={!!selected} rounded backplates={backplates} isDark={isDark} styles={styles} />;
    default:                 return <Rectangle id={id} data={data} selected={!!selected} rounded={false} backplates={backplates} isDark={isDark} styles={styles} />;
  }
}

export const ShapeNode = memo(ShapeNodeComponent);
