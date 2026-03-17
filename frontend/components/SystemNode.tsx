'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Server, LucideIcon } from 'lucide-react';
import { useDiagramStore, NodeData } from '@/store/diagramStore';
import { NodeIcon, resolveNodeColor } from '@/components/NodeIcon';

const ICON_MAP: Record<string, LucideIcon> = {};

function SystemNodeComponent({ id, data, selected }: NodeProps<NodeData>) {
  const setSelectedNodeId = useDiagramStore((s) => s.setSelectedNodeId);
  const accent = data.accentColor ?? data.color ?? '#6366f1';
  const resolvedAccent = data.technology ? resolveNodeColor(data.technology, accent) : accent;
  const hasError = data.hasError;

  const nodeStyles: React.CSSProperties = {
    width: 140,
    borderRadius: 12,
    background: 'hsl(var(--card))',
    border: `1px solid ${selected ? resolvedAccent : 'hsl(var(--border))'}`,
    boxShadow: selected 
      ? `0 0 0 1px ${resolvedAccent}30, 0 4px 12px -2px ${resolvedAccent}20`
      : hasError 
        ? `0 0 0 1px #ef444430, 0 4px 12px -2px #ef444420`
        : '0 1px 3px -1px hsl(var(--border)), 0 1px 2px -1px hsl(var(--border))',
    transition: 'all 0.15s ease',
    cursor: 'pointer',
  };

  const iconContainerStyle: React.CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: 10,
    background: `${resolvedAccent}12`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const handleStyle: React.CSSProperties = {
    width: 8,
    height: 8,
    background: 'hsl(var(--card))',
    border: `2px solid ${selected ? resolvedAccent : 'hsl(var(--border))'}`,
    borderRadius: '50%',
    transition: 'all 0.15s ease',
  };

  return (
    <div
      style={nodeStyles}
      onClick={() => setSelectedNodeId(id)}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = resolvedAccent + '60';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = `0 4px 12px -2px ${resolvedAccent}15`;
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = 'hsl(var(--border))';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px -1px hsl(var(--border)), 0 1px 2px -1px hsl(var(--border))';
        }
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={handleStyle}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={handleStyle}
      />

      <div style={{
        padding: '16px 14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}>
        {/* Big Icon */}
        <div style={iconContainerStyle}>
          {data.technology ? (
            <NodeIcon technology={data.technology} size={24} />
          ) : (
            <Server size={24} style={{ color: resolvedAccent, strokeWidth: 1.5 }} />
          )}
        </div>

        {/* Label */}
        <span style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'hsl(var(--foreground))',
          textAlign: 'center',
          lineHeight: 1.3,
          maxWidth: 110,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {data.label}
        </span>

        {/* Category/Type - subtle */}
        <span style={{
          fontSize: 10,
          fontWeight: 400,
          color: 'hsl(var(--muted-foreground))',
          letterSpacing: '0.02em',
        }}>
          {data.technology || data.category?.replace(/[^A-Z]/g, '').slice(0, 3) || 'Service'}
        </span>

        {/* Error state */}
        {hasError && (
          <span style={{
            fontSize: 9,
            color: '#ef4444',
            fontWeight: 500,
          }}>
            No connections
          </span>
        )}
      </div>
    </div>
  );
}

export const SystemNode = memo(SystemNodeComponent);
