'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

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

/** Four-directional handles shared by all shapes */
function Handles({ color }: { color: string }) {
  const s = HANDLE_STYLE(color);
  return (
    <>
      <Handle type="target" position={Position.Left}   style={s} />
      <Handle type="source" position={Position.Right}  style={s} />
      <Handle type="target" position={Position.Top}    style={s} />
      <Handle type="source" position={Position.Bottom} style={s} />
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

// ── Individual shape renderers ────────────────────────────────────────────────

function Rectangle({ data, selected, rounded }: { data: ShapeNodeData; selected: boolean; rounded: boolean }) {
  const color = data.accentColor ?? data.color ?? '#6366f1';
  const r = rounded ? 14 : 8;
  return (
    <div
      style={{
        width: 140,
        height: 72,
        borderRadius: r,
        border: 'none',
        background: 'linear-gradient(145deg, #ffffff 0%, hsl(0 0% 98%) 100%)',
        boxShadow: selected 
          ? `0 0 0 2px ${color}, 0 8px 32px ${color}30, 0 4px 12px hsl(var(--foreground) / 0.1)`
          : '0 4px 16px hsl(var(--foreground) / 0.08), inset 0 1px 0 hsl(var(--foreground) / 0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Handles color={color} />
      <Label label={data.label} sublabel={data.sublabel} color={color} />
    </div>
  );
}

function Diamond({ data, selected }: { data: ShapeNodeData; selected: boolean }) {
  const color = data.accentColor ?? data.color ?? '#6366f1';
  const W = 140, H = 80;
  return (
    <div style={{ width: W, height: H, position: 'relative' }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <polygon
          points={`${W / 2},4 ${W - 4},${H / 2} ${W / 2},${H - 4} 4,${H / 2}`}
          fill={`${color}10`}
          stroke={selected ? color : `${color}50`}
          strokeWidth={selected ? 2 : 1.5}
          filter={selected ? `drop-shadow(0 0 8px ${color}40)` : 'none'}
        />
      </svg>
      <Handles color={color} />
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

function Cylinder({ data, selected }: { data: ShapeNodeData; selected: boolean }) {
  const color = data.accentColor ?? data.color ?? '#6366f1';
  const W = 120, H = 90, RY = 14;
  const stroke = selected ? color : `${color}60`;
  const strokeW = selected ? 2 : 1.5;
  return (
    <div style={{ width: W, height: H, position: 'relative' }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible', filter: selected ? `drop-shadow(0 0 8px ${color}30)` : 'none' }}>
        {/* Body */}
        <rect x={2} y={RY} width={W - 4} height={H - RY * 2} fill={`${color}10`} stroke={stroke} strokeWidth={strokeW} />
        {/* Bottom ellipse */}
        <ellipse cx={W / 2} cy={H - RY} rx={(W - 4) / 2} ry={RY} fill={`${color}15`} stroke={stroke} strokeWidth={strokeW} />
        {/* Top ellipse (drawn last so it overlaps body top edge) */}
        <ellipse cx={W / 2} cy={RY} rx={(W - 4) / 2} ry={RY} fill={`${color}18`} stroke={stroke} strokeWidth={strokeW} />
      </svg>
      <Handles color={color} />
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

function Circle({ data, selected }: { data: ShapeNodeData; selected: boolean }) {
  const color = data.accentColor ?? data.color ?? '#6366f1';
  const W = 100, H = 100;
  return (
    <div style={{ width: W, height: H, position: 'relative' }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, filter: selected ? `drop-shadow(0 0 8px ${color}30)` : 'none' }}>
        <ellipse
          cx={W / 2} cy={H / 2} rx={W / 2 - 2} ry={H / 2 - 2}
          fill={`${color}10`}
          stroke={selected ? color : `${color}50`}
          strokeWidth={selected ? 2 : 1.5}
        />
      </svg>
      <Handles color={color} />
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

function Parallelogram({ data, selected }: { data: ShapeNodeData; selected: boolean }) {
  const color = data.accentColor ?? data.color ?? '#6366f1';
  const W = 150, H = 70, SKEW = 20;
  const pts = `${SKEW},2 ${W - 2},2 ${W - SKEW - 2},${H - 2} 2,${H - 2}`;
  return (
    <div style={{ width: W, height: H, position: 'relative' }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible', filter: selected ? `drop-shadow(0 0 8px ${color}30)` : 'none' }}>
        <polygon
          points={pts}
          fill={`${color}10`}
          stroke={selected ? color : `${color}50`}
          strokeWidth={selected ? 2 : 1.5}
        />
      </svg>
      <Handles color={color} />
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

function ShapeNodeComponent({ data, selected }: NodeProps<ShapeNodeData>) {
  switch (data.shape) {
    case 'diamond':          return <Diamond data={data} selected={!!selected} />;
    case 'cylinder':         return <Cylinder data={data} selected={!!selected} />;
    case 'circle':           return <Circle data={data} selected={!!selected} />;
    case 'parallelogram':    return <Parallelogram data={data} selected={!!selected} />;
    case 'rounded-rectangle': return <Rectangle data={data} selected={!!selected} rounded />;
    default:                 return <Rectangle data={data} selected={!!selected} rounded={false} />;
  }
}

export const ShapeNode = memo(ShapeNodeComponent);
