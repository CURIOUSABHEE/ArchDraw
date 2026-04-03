'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useDiagramStore, NodeData } from '@/store/diagramStore';
import { NodeIcon, resolveNodeColor } from '@/components/NodeIcon';
import { useTheme } from '@/lib/theme';

function SystemNodeComponent({ id, data, selected }: NodeProps<NodeData>) {
  const setSelectedNodeId = useDiagramStore((s) => s.setSelectedNodeId);
  const { isDark } = useTheme();
  const accent = data.accentColor ?? data.color ?? '#6366f1';
  const resolvedAccent = data.technology ? resolveNodeColor(data.technology, accent) : accent;
  const hasError = data.hasError;
  const isAIGenerated = data.icon && !data.technology;

  const nodeStyles: React.CSSProperties = {
    width: data.nodeWidth ?? 200,
    minWidth: 200,
    minHeight: 80,
    maxHeight: 100,
    height: 'auto',
    boxSizing: 'border-box',
    borderRadius: 14,
    background: isDark
      ? 'linear-gradient(145deg, hsl(220 18% 15%) 0%, hsl(220 18% 11%) 100%)'
      : 'linear-gradient(145deg, #ffffff 0%, hsl(0 0% 98%) 100%)',
    border: 'none',
    boxShadow: selected
      ? `0 0 0 2px ${resolvedAccent}, 0 8px 32px ${resolvedAccent}30, 0 4px 12px hsl(var(--foreground) / 0.1)`
      : hasError
        ? '0 0 0 2px rgba(239,68,68,0.5), 0 4px 16px rgba(239,68,68,0.2)'
        : isDark
          ? `0 6px 20px hsl(var(--foreground) / 0.3), inset 0 1px 0 hsl(var(--foreground) / 0.1)`
          : '0 4px 16px hsl(var(--foreground) / 0.08), inset 0 1px 0 hsl(var(--foreground) / 0.03)',
    transition: 'box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '0 16px',
    gap: 12,
  };

  const iconContainerStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: isAIGenerated 
      ? 'rgba(139, 92, 246, 0.15)' 
      : isDark ? `${resolvedAccent}20` : `${resolvedAccent}12`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const handleStyle: React.CSSProperties = {
    width: 12,
    height: 12,
    background: isDark ? 'hsl(var(--card))' : '#ffffff',
    border: `2px solid ${resolvedAccent}60`,
    borderRadius: '50%',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 8px hsl(var(--foreground) / 0.15)',
  };

  return (
    <div
      className="relative group"
      style={nodeStyles}
      onClick={() => setSelectedNodeId(id)}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = isDark
            ? `0 8px 24px hsl(var(--foreground) / 0.35), 0 0 0 1px ${resolvedAccent}40`
            : `0 8px 24px hsl(var(--foreground) / 0.12), 0 0 0 1px ${resolvedAccent}20`;
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isDark
            ? `0 6px 20px hsl(var(--foreground) / 0.3), inset 0 1px 0 hsl(var(--foreground) / 0.1)`
            : '0 4px 16px hsl(var(--foreground) / 0.08), inset 0 1px 0 hsl(var(--foreground) / 0.03)';
        }
      }}
    >
      {/* Subtle shine overlay */}
      <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-10 bg-gradient-to-br from-white/8 via-white/[0.02] to-transparent group-hover:from-white/[0.12] group-hover:via-white/[0.04] transition-all duration-300 dark:from-white/8 dark:via-white/[0.02] dark:to-transparent" />
      
      {/* LEFT handles (targets) - for incoming edges from left */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ ...handleStyle, left: -5 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-top"
        style={{ ...handleStyle, left: -5, top: '25%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-mid"
        style={{ ...handleStyle, left: -5, top: '50%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-bot"
        style={{ ...handleStyle, left: -5, top: '75%' }}
      />
      
      {/* RIGHT handles (sources) - for outgoing edges to right */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ ...handleStyle, right: -5 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-top"
        style={{ ...handleStyle, right: -5, top: '25%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-mid"
        style={{ ...handleStyle, right: -5, top: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-bot"
        style={{ ...handleStyle, right: -5, top: '75%' }}
      />
      
      {/* TOP/BOTTOM handles (hidden) - for vertical connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ ...handleStyle, top: -5, opacity: 0 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ ...handleStyle, bottom: -5, opacity: 0 }}
      />

      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 12,
        width: '100%',
        height: '100%',
        minHeight: 80,
        padding: '12px 0',
      }}>
        {/* Icon */}
        <div style={iconContainerStyle}>
          {data.technology ? (
            <NodeIcon technology={data.technology} size={20} />
          ) : (
            <NodeIcon 
              technology={undefined} 
              fallbackIcon={data.icon} 
              fallbackColor={isAIGenerated ? '#8b5cf6' : resolvedAccent} 
              size={20} 
            />
          )}
        </div>

        {/* Label */}
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: isDark ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))',
          textAlign: 'left',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          lineHeight: 1.3,
          margin: 0,
          flex: 1,
        }}>
          {data.label}
        </span>
      </div>
    </div>
  );
}

export const SystemNode = memo(SystemNodeComponent);
