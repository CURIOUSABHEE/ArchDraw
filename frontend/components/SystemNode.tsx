'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useDiagramStore, NodeData } from '@/store/diagramStore';
import { NodeIcon, resolveNodeColor } from '@/components/NodeIcon';
import { useTheme } from 'next-themes';

function SystemNodeComponent({ id, data, selected }: NodeProps<NodeData>) {
  const setSelectedNodeId = useDiagramStore((s) => s.setSelectedNodeId);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const accent = data.accentColor ?? data.color ?? '#6366f1';
  const resolvedAccent = data.technology ? resolveNodeColor(data.technology, accent) : accent;
  const hasError = data.hasError;

  const nodeStyles: React.CSSProperties = {
    width: data.nodeWidth ?? 180,
    minWidth: 180,
    minHeight: 120,
    maxHeight: 155,
    height: 'auto',
    boxSizing: 'border-box',
    borderRadius: 14,
    background: isDark
      ? 'linear-gradient(145deg, #1e2138 0%, #161928 100%)'
      : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
    border: selected
      ? '1px solid #6366f1'
      : hasError
        ? '1px solid rgba(239,68,68,0.4)'
        : isDark
          ? '1px solid rgba(99,102,241,0.2)'
          : '1px solid rgba(99,102,241,0.15)',
    boxShadow: selected
      ? '0 0 0 2px #6366f1, 0 4px 20px rgba(99,102,241,0.3)'
      : hasError
        ? '0 0 0 1px rgba(239,68,68,0.3), 0 2px 8px rgba(0,0,0,0.3)'
        : isDark
          ? '0 2px 8px rgba(0,0,0,0.3)'
          : '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const iconContainerStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.08)',
    border: isDark ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(99,102,241,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const handleStyle: React.CSSProperties = {
    width: 8,
    height: 8,
    background: isDark ? '#161b22' : '#ffffff',
    border: `2px solid ${selected ? resolvedAccent : isDark ? '#334155' : '#e2e8f0'}`,
    borderRadius: '50%',
    transition: 'all 0.15s ease',
  };

  return (
    <div
      className="relative group"
      style={nodeStyles}
      onClick={() => setSelectedNodeId(id)}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = isDark
            ? '0 4px 16px rgba(99,102,241,0.2)'
            : '0 4px 16px rgba(99,102,241,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isDark
            ? '0 2px 8px rgba(0,0,0,0.3)'
            : '0 2px 8px rgba(0,0,0,0.1)';
        }
      }}
    >
      {/* Diagonal corner shine */}
      <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-10 bg-gradient-to-br from-white/10 via-white/[0.03] to-transparent group-hover:from-white/[0.15] group-hover:via-white/[0.06] transition-all duration-300 dark:from-white/10 dark:via-white/[0.03] dark:to-transparent" />
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
      <Handle
        type="target"
        position={Position.Top}
        style={{ ...handleStyle, opacity: 0 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ ...handleStyle, opacity: 0 }}
      />

      <div style={{
        padding: '12px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        width: '100%',
      }}>
        {/* Big Icon */}
        <div style={iconContainerStyle}>
          {data.technology ? (
            <NodeIcon technology={data.technology} size={24} />
          ) : (
            <NodeIcon technology={undefined} fallbackIcon={data.icon} fallbackColor={resolvedAccent} size={24} />
          )}
        </div>

        {/* Label */}
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: isDark ? '#e5e7eb' : '#1e293b',
          textAlign: 'center',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          lineHeight: 1.3,
          margin: 0,
        }}>
          {data.label}
        </span>

        {/* Sublabel — role description (only shown when non-empty and not a layer code) */}
        {data.sublabel && data.sublabel.trim() && (
          <span style={{
            fontSize: 10,
            fontWeight: 400,
            color: isDark ? '#94a3b8' : '#64748b',
            letterSpacing: '0.02em',
            textAlign: 'center',
            lineHeight: 1.3,
          }}>
            {data.sublabel}
          </span>
        )}

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
