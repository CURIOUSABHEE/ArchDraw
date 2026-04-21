'use client';

import { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useDiagramStore, NodeData } from '@/store/diagramStore';
import { useCanvasTheme } from '@/lib/theme';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 80;
const BORDER_RADIUS = 12;

interface NodeStyleConfig {
  background: string;
  border: string;
  borderHover: string;
  shadow: string;
  shadowSelected: string;
  titleColor: string;
  subtitleColor: string;
  handleBg: string;
  handleBorder: string;
}

const LIGHT_STYLES: NodeStyleConfig = {
  background: '#FFFFFF',
  border: '#E5E7EB',
  borderHover: '#D1D5DB',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowSelected: '0 0 0 2px rgba(99,102,241,0.4), 0 4px 12px rgba(99,102,241,0.2)',
  titleColor: '#111827',
  subtitleColor: '#6B7280',
  handleBg: '#FFFFFF',
  handleBorder: '#9CA3AF',
};

const DARK_STYLES: NodeStyleConfig = {
  background: '#1F2937',
  border: '#374151',
  borderHover: '#4B5563',
  shadow: '0 1px 4px rgba(0,0,0,0.3)',
  shadowSelected: '0 0 0 2px rgba(129,140,248,0.5), 0 4px 12px rgba(129,140,248,0.25)',
  titleColor: '#F9FAFB',
  subtitleColor: '#9CA3AF',
  handleBg: '#374151',
  handleBorder: '#6B7280',
};

const STATUS_COLORS = {
  healthy: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  unknown: '#6B7280',
};

const STATUS_LABELS = {
  healthy: 'Healthy',
  warning: 'Warning',
  error: 'Error',
  unknown: 'Unknown',
};

function getTierColorNormalized(layer?: string): string {
  const tier = (layer || 'compute').toLowerCase();
  const colorMap: Record<string, string> = {
    client: '#8B5CF6',
    edge: '#6366F1',
    compute: '#0D9488',
    async: '#F59E0B',
    data: '#3B82F6',
    observe: '#6B7280',
    external: '#F43F5E',
  };
  return colorMap[tier] || colorMap.compute;
}

function NodeHandle({ 
  type, 
  position, 
  id, 
  color,
  styles,
}: { 
  type: 'target' | 'source'; 
  position: Position; 
  id: string;
  color: string;
  styles: NodeStyleConfig;
}) {
  const isLeft = position === Position.Left;
  const isRight = position === Position.Right;
  const isTop = position === Position.Top;
  const isBottom = position === Position.Bottom;
  
  // Calculate position based on node dimensions
  // Node is 80px tall, so center is at y=40
  const nodeCenterY = NODE_HEIGHT / 2; // 40px
  
  const getHandleStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: 10,
      height: 10,
      background: styles.handleBg,
      border: `2px solid ${color}`,
      borderRadius: '50%',
      transition: 'all 150ms ease',
      zIndex: 10,
    };
    
    if (isLeft) {
      return {
        ...baseStyle,
        left: -5,
        top: nodeCenterY,
        transform: 'translateY(-50%)',
      };
    }
    if (isRight) {
      return {
        ...baseStyle,
        right: -5,
        top: nodeCenterY,
        transform: 'translateY(-50%)',
      };
    }
    if (isTop) {
      return {
        ...baseStyle,
        top: -5,
        left: '50%',
        transform: 'translateX(-50%)',
      };
    }
    // Bottom
    return {
      ...baseStyle,
      bottom: -5,
      left: '50%',
      transform: 'translateX(-50%)',
    };
  };
  
  return (
    <Handle
      type={type}
      position={position}
      id={id}
      className={`!opacity-0 group-hover:!opacity-100 transition-opacity duration-150`}
      style={getHandleStyle()}
    />
  );
}

function SystemNodeComponent({ id, data, selected }: NodeProps<NodeData>) {
  const setSelectedNodeId = useDiagramStore((s) => s.setSelectedNodeId);
  const { isDark } = useCanvasTheme();
  
  const nodeData = data as NodeData & {
    layer?: string;
    subtitle?: string;
    status?: 'healthy' | 'warning' | 'error' | 'unknown';
    color?: string;
    nodeWidth?: number;
  };
  
  const styles = isDark ? DARK_STYLES : LIGHT_STYLES;
  const tierColor = getTierColorNormalized(nodeData.layer);
  const accentColor = nodeData.color || tierColor || '#0D9488';
  
  const statusColor = STATUS_COLORS[nodeData.status || 'healthy'];
  const showStatus = nodeData.status && nodeData.status !== 'healthy';

  const handleClick = useCallback(() => {
    setSelectedNodeId(id);
  }, [id, setSelectedNodeId]);

  return (
    <div
      className="group"
      style={{
        width: nodeData.nodeWidth || NODE_WIDTH,
        minWidth: nodeData.nodeWidth || NODE_WIDTH,
        height: NODE_HEIGHT,
        borderRadius: BORDER_RADIUS,
        background: styles.background,
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderLeftWidth: 3,
        borderTopStyle: 'solid',
        borderRightStyle: 'solid',
        borderBottomStyle: 'solid',
        borderLeftStyle: 'solid',
        borderTopColor: selected ? accentColor : styles.border,
        borderRightColor: selected ? accentColor : styles.border,
        borderBottomColor: selected ? accentColor : styles.border,
        borderLeftColor: accentColor,
        boxShadow: selected 
          ? styles.shadowSelected 
          : styles.shadow,
        transition: 'all 150ms ease',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      onClick={handleClick}
    >
      <NodeHandle
        type="target"
        position={Position.Left}
        id="left"
        color={accentColor}
        styles={styles}
      />
      <NodeHandle
        type="source"
        position={Position.Right}
        id="right"
        color={accentColor}
        styles={styles}
      />
      
      {/* Hide unused handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ opacity: 0, width: 0, height: 0 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ opacity: 0, width: 0, height: 0 }}
      />

      {/* Header: Icon + Title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 10px 4px',
          flex: 1,
        }}
      >
        {/* Type Icon */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: `${accentColor}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: accentColor,
            }}
          />
        </div>
        
        {/* Title */}
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: styles.titleColor,
            margin: 0,
            lineHeight: 1.3,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={data.label}
        >
          {data.label}
        </p>
      </div>

      {/* Footer: Subtitle + Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 10px 8px',
        }}
      >
        {/* Subtitle */}
        {nodeData.subtitle && (
          <p
            style={{
              fontSize: 10,
              color: styles.subtitleColor,
              margin: 0,
              lineHeight: 1.2,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={nodeData.subtitle}
          >
            {nodeData.subtitle}
          </p>
        )}
        
        {/* Status indicator */}
        {showStatus && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: statusColor,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export const SystemNode = memo(SystemNodeComponent);