'use client';

import { memo, useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useDiagramStore, NodeData } from '@/store/diagramStore';
import { getTierColor, getTierBg } from '@/lib/tierColors';
import { NODE_DIMENSIONS, STATUS_COLORS } from './nodes/nodeDesignTokens';
import { NodeShapeRenderer } from './nodes/shapes/NodeShapeRenderer';
import { TechIconRenderer } from './nodes/icons/TechIconRenderer';

const { width: NODE_WIDTH, height: NODE_HEIGHT, borderRadius: BORDER_RADIUS } = NODE_DIMENSIONS;

function SystemNodeComponent({ id, data, selected }: NodeProps<NodeData>) {
  const setSelectedNodeId = useDiagramStore((s) => s.setSelectedNodeId);
  const canvasDarkMode = useDiagramStore((s) => s.canvasDarkMode);

  const tierColor = useMemo(() => {
    const tier = (data.category || '').toLowerCase();
    return getTierColor(tier, canvasDarkMode);
  }, [data.category, canvasDarkMode]);

  const tierBg = useMemo(() => {
    const tier = (data.category || '').toLowerCase();
    return getTierBg(tier, canvasDarkMode);
  }, [data.category, canvasDarkMode]);

  const isDark = canvasDarkMode;
  const statusColor = STATUS_COLORS[data.status || 'unknown'];
  const isExternal = data.isExternal === true;
  const hideTierTag = data.hideTierTag === true;

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selected) {
      e.currentTarget.style.borderColor = `${tierColor}99`;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selected) {
      e.currentTarget.style.borderColor = `${tierColor}4D`;
    }
  };

  return (
    <div
      style={{
        width: data.nodeWidth ?? NODE_WIDTH,
        minWidth: data.nodeWidth ?? NODE_WIDTH,
        height: NODE_HEIGHT,
        boxSizing: 'border-box',
        borderRadius: BORDER_RADIUS,
        background: isDark ? '#1e1e1e' : '#FFFFFF',
        borderWidth: selected ? 2 : 1,
        borderStyle: isExternal ? 'dashed' : 'solid',
        borderColor: selected ? tierColor : `${tierColor}4D`,
        boxShadow: selected ? `0 0 0 3px ${tierColor}33` : 'none',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      onClick={() => setSelectedNodeId(id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Handle: Left */}
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
          opacity: 0,
          transition: 'opacity 150ms ease',
        }}
        className="group-hover:!opacity-100"
      />

      {/* Handle: Right */}
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
          opacity: 0,
          transition: 'opacity 150ms ease',
        }}
      />

      {/* Handle: Top */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ opacity: 0, width: 0, height: 0 }}
      />

      {/* Handle: Bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ opacity: 0, width: 0, height: 0 }}
      />

      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          height: 20,
        }}
      >
        {/* Status Dot */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: statusColor,
            flexShrink: 0,
          }}
        />

        {/* External Badge */}
        {isExternal && (
          <span
            style={{
              fontSize: 8,
              fontWeight: 600,
              color: tierColor,
              backgroundColor: `${tierColor}15`,
              padding: '1px 4px',
              borderRadius: 4,
              letterSpacing: '0.05em',
            }}
          >
            EXT
          </span>
        )}

        {/* Tier Tag */}
        {!hideTierTag && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: tierColor,
              backgroundColor: `${tierColor}1A`,
              padding: '2px 6px',
              borderRadius: 9999,
              maxWidth: 60,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={data.category}
          >
            {data.category}
          </span>
        )}
      </div>

      {/* Icon Zone */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div style={{ position: 'relative' }}>
          <NodeShapeRenderer
            nodeType={data.tech || data.category || 'service'}
            size={64}
            tierColor={tierColor}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <TechIconRenderer
              tech={data.tech || 'service'}
              size={32}
              tierColor={tierColor}
            />
          </div>
        </div>
      </div>

      {/* Label Zone */}
      <div
        style={{
          padding: '4px 8px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: isDark ? '#F1F5F9' : '#0F172A',
            margin: 0,
            lineHeight: 1.2,
            maxWidth: 100,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={data.label}
        >
          {data.label}
        </p>
        {data.sublabel && (
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: tierColor,
              opacity: 0.8,
              margin: 0,
              lineHeight: 1.2,
              maxWidth: 100,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={data.sublabel}
          >
            {data.sublabel}
          </p>
        )}
      </div>
    </div>
  );
}

export const SystemNode = memo(SystemNodeComponent);
