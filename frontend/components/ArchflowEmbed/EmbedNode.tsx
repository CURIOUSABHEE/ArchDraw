'use client';

import { memo } from 'react';
import {
  Database, Braces, Cog, Radio, Zap, Globe, Monitor, HardDrive, Box,
} from 'lucide-react';
import type { NodeDef } from './types';

const typeIcons: Record<string, React.FC<{ style?: React.CSSProperties }>> = {
  database: Database,
  api: Braces,
  service: Cog,
  queue: Radio,
  cache: Zap,
  gateway: Globe,
  client: Monitor,
  storage: HardDrive,
  default: Box,
};

const typeColors: Record<string, string> = {
  database: '#3b82f6',
  api: '#6366f1',
  service: '#8b5cf6',
  queue: '#f59e0b',
  cache: '#ef4444',
  gateway: '#6366f1',
  client: '#10b981',
  storage: '#64748b',
  default: '#6366f1',
};

interface EmbedNodeProps {
  node: NodeDef;
  x: number;
  y: number;
  isDragging: boolean;
  interactive: boolean;
  onMouseDown: (nodeId: string, e: React.MouseEvent) => void;
  onTouchStart: (nodeId: string, e: React.TouchEvent) => void;
  onClick?: (nodeId: string) => void;
}

export const EmbedNode = memo(function EmbedNode({
  node,
  x,
  y,
  isDragging,
  interactive,
  onMouseDown,
  onTouchStart,
  onClick,
}: EmbedNodeProps) {
  const Icon = typeIcons[node.type || 'default'] || typeIcons.default;
  const color = typeColors[node.type || 'default'] || typeColors.default;

  return (
    <div
      className="embed-node absolute cursor-grab select-none"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 100,
        height: 70,
        background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
        border: node.highlight
          ? `2px solid ${color}`
          : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '10px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        boxShadow: isDragging
          ? '0 12px 40px rgba(0,0,0,0.5), 0 0 20px rgba(99,102,241,0.2)'
          : '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
        cursor: interactive ? (isDragging ? 'grabbing' : 'grab') : 'default',
        opacity: isDragging ? 0.9 : 1,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.15s ease, box-shadow 0.15s ease',
        zIndex: isDragging ? 100 : 10,
        userSelect: 'none',
      }}
      onMouseDown={(e) => onMouseDown(node.id, e)}
      onTouchStart={(e) => onTouchStart(node.id, e)}
      onClick={() => onClick?.(node.id)}
    >
      {/* Icon */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `${color}15`,
          border: `1px solid ${color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon style={{ width: 16, height: 16, color, strokeWidth: '1.5px' }} />
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: '#f1f5f9',
          textAlign: 'center',
          lineHeight: 1.2,
          maxWidth: 80,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {node.label}
      </span>

      {/* Description tooltip on hover */}
      {node.description && (
        <div
          className="node-tooltip absolute hidden group-hover:block"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
            padding: '6px 10px',
            background: '#1e293b',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            fontSize: 11,
            color: '#94a3b8',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        >
          {node.description}
        </div>
      )}
    </div>
  );
});
