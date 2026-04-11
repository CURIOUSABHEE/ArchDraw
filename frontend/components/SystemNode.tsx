'use client';

import { memo, useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Monitor, Shield, Cpu, Zap, Database, Activity, Globe, Server } from 'lucide-react';
import { useDiagramStore, NodeData } from '@/store/diagramStore';
import { useTheme } from '@/lib/theme';

const TIER_COLORS: Record<string, string> = {
  client: '#8B5CF6',
  edge: '#6366F1',
  compute: '#0D9488',
  async: '#F59E0B',
  data: '#3B82F6',
  observe: '#6B7280',
  external: '#F43F5E',
};

const TIER_ICONS: Record<string, React.ElementType> = {
  client: Monitor,
  edge: Shield,
  compute: Cpu,
  async: Zap,
  data: Database,
  observe: Activity,
  external: Globe,
};

function SystemNodeComponent({ id, data, selected }: NodeProps<NodeData>) {
  const setSelectedNodeId = useDiagramStore((s) => s.setSelectedNodeId);
  const { isDark } = useTheme();

  const tierColor = useMemo(() => {
    const tier = (data.category || '').toLowerCase();
    return TIER_COLORS[tier] || TIER_COLORS.compute;
  }, [data.category]);

  const TierIcon = useMemo(() => {
    const tier = (data.category || '').toLowerCase();
    return TIER_ICONS[tier] || Server;
  }, [data.category]);

  const hasError = data.hasError;

  const nodeStyles: React.CSSProperties = {
    width: data.nodeWidth ?? 200,
    minWidth: 200,
    height: 72,
    boxSizing: 'border-box',
    borderRadius: 14,
    background: isDark ? 'hsl(220 18% 12%)' : '#FFFFFF',
    border: selected ? `2px solid ${tierColor}` : '1px solid #E5E7EB',
    boxShadow: selected
      ? `0 0 0 3px ${tierColor}33, 0 2px 8px rgba(0,0,0,0.08)`
      : hasError
        ? '0 0 0 2px rgba(239,68,68,0.5), 0 2px 8px rgba(239,68,68,0.2)'
        : '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'all 180ms ease',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    overflow: 'hidden',
  };

  return (
    <div
      className="group"
      style={nodeStyles}
      onClick={() => setSelectedNodeId(id)}
      onMouseEnter={(e) => {
        if (!selected && !hasError) {
          e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.12), 0 0 0 1px ${tierColor}66`;
        }
      }}
      onMouseLeave={(e) => {
        if (!selected && !hasError) {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        }
      }}
    >
      {/* LEFT ACCENT BAR */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: tierColor,
          borderRadius: '4px 0 0 4px',
        }}
      />

      {/* LEFT handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          width: 10,
          height: 10,
          background: '#FFFFFF',
          border: `2px solid ${tierColor}`,
          borderRadius: '50%',
          left: -4,
          zIndex: 10,
        }}
      />

      {/* RIGHT handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          width: 10,
          height: 10,
          background: '#FFFFFF',
          border: `2px solid ${tierColor}`,
          borderRadius: '50%',
          right: -4,
          zIndex: 10,
        }}
      />

      {/* Hidden handles */}
      <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0, width: 0, height: 0 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0, width: 0, height: 0 }} />

      {/* Icon Container */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: `${tierColor}1F`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginLeft: 16,
        }}
      >
        <TierIcon size={20} color={tierColor} strokeWidth={2} />
      </div>

      {/* Text Block */}
      <div
        style={{
          flex: 1,
          marginLeft: 12,
          marginRight: 16,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <p
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: isDark ? '#F1F5F9' : '#0F172A',
            letterSpacing: '-0.01em',
            margin: 0,
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {data.label}
        </p>
        {data.sublabel && (
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: '#94A3B0',
              margin: '2px 0 0 0',
              lineHeight: 1.2,
              maxWidth: 140,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.sublabel}
          </p>
        )}
      </div>
    </div>
  );
}

export const SystemNode = memo(SystemNodeComponent);
