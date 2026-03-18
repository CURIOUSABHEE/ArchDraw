'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import * as LucideIcons from 'lucide-react';
import { type LucideProps } from 'lucide-react';

type IconName = keyof typeof LucideIcons;

interface HeroNodeData {
  label: string;
  category: string;
  icon: string;
  color: string;
}

const H: React.CSSProperties = {
  opacity: 0, width: 1, height: 1, minWidth: 1, minHeight: 1,
  border: 'none', background: 'transparent',
};

export const HeroNode = memo(function HeroNode({ data }: NodeProps<HeroNodeData>) {
  const Icon = (LucideIcons[data.icon as IconName] ?? LucideIcons.Box) as React.FC<LucideProps>;

  return (
    <>
      <Handle type="target" position={Position.Left}   id="left"   style={H} />
      <Handle type="target" position={Position.Top}    id="top"    style={H} />
      <Handle type="source" position={Position.Right}  id="right"  style={H} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={H} />

      <div style={{
        position: 'relative',
        width: 110,
        background: 'linear-gradient(145deg, #1a2235 0%, #0f172a 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: '14px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 7,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
      }}>
        {/* Shine overlay */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        {/* Icon */}
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: data.color + '15',
          border: `1px solid ${data.color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <Icon style={{ width: 18, height: 18, color: data.color }} />
        </div>

        {/* Label */}
        <span style={{
          fontSize: 11, fontWeight: 600, color: '#f1f5f9',
          textAlign: 'center', lineHeight: 1.3, position: 'relative',
        }}>
          {data.label}
        </span>

        {/* Category */}
        <span style={{
          fontSize: 9, color: '#475569', position: 'relative',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          {data.category}
        </span>
      </div>
    </>
  );
});
