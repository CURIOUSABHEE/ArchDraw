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
    borderRadius: 8,
    background: isDark
      ? '#1e2235'
      : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
    border: selected
      ? `2px solid ${resolvedAccent}`
      : hasError
        ? '2px solid rgba(239,68,68,0.4)'
        : isDark
          ? `1px solid ${resolvedAccent}50`
          : `1px solid ${resolvedAccent}25`,
    boxShadow: selected
      ? `0 0 0 2px ${resolvedAccent}, 0 4px 20px ${resolvedAccent}50`
      : hasError
        ? '0 0 0 1px rgba(239,68,68,0.3), 0 2px 8px rgba(0,0,0,0.3)'
        : isDark
          ? '0 4px 12px rgba(0,0,0,0.4)'
          : '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
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
    borderRadius: 8,
    background: isAIGenerated 
      ? 'rgba(139, 92, 246, 0.2)' 
      : isDark ? `${resolvedAccent}15` : `${resolvedAccent}10`,
    border: isAIGenerated
      ? '1px solid rgba(139, 92, 246, 0.4)'
      : isDark ? `1px solid ${resolvedAccent}30` : `1px solid ${resolvedAccent}20`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const handleStyle: React.CSSProperties = {
    width: 8,
    height: 8,
    background: isDark ? '#161b22' : '#ffffff',
    border: `1px solid rgba(255,255,255,0.08)`,
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
          e.currentTarget.style.borderColor = `${resolvedAccent}80`;
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = isDark
            ? `0 4px 16px ${resolvedAccent}30`
            : `0 4px 16px ${resolvedAccent}25`;
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = isDark ? `${resolvedAccent}30` : `${resolvedAccent}25`;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isDark
            ? '0 2px 8px rgba(0,0,0,0.3)'
            : '0 2px 8px rgba(0,0,0,0.1)';
        }
      }}
    >
      {/* Diagonal corner shine */}
      <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-10 bg-gradient-to-br from-white/10 via-white/[0.03] to-transparent group-hover:from-white/[0.15] group-hover:via-white/[0.06] transition-all duration-300 dark:from-white/10 dark:via-white/[0.03] dark:to-transparent" />
      
      {/* LEFT handles (targets) - for incoming edges from left */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ ...handleStyle, left: -4 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-top"
        style={{ ...handleStyle, left: -4, top: '25%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-mid"
        style={{ ...handleStyle, left: -4, top: '50%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-bot"
        style={{ ...handleStyle, left: -4, top: '75%' }}
      />
      
      {/* RIGHT handles (sources) - for outgoing edges to right */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ ...handleStyle, right: -4 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-top"
        style={{ ...handleStyle, right: -4, top: '25%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-mid"
        style={{ ...handleStyle, right: -4, top: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-bot"
        style={{ ...handleStyle, right: -4, top: '75%' }}
      />
      
      {/* TOP/BOTTOM handles (hidden) - for vertical connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ ...handleStyle, top: -4, opacity: 0 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ ...handleStyle, bottom: -4, opacity: 0 }}
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
          fontWeight: 700,
          color: isDark ? '#ffffff' : '#1e293b',
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
