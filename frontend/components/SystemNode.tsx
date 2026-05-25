'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { NodeProps } from 'reactflow';
import { useDiagramStore, NodeData } from '@/store/diagramStore';
import { useCanvasTheme } from '@/lib/theme';
import { Activity, Palette, Pencil, Copy, Trash2 } from 'lucide-react';
import { FloatingHandles } from './nodes/FloatingHandles';

import { DIAGRAM_CONSTANTS } from '@/constants/diagram';

const NODE_WIDTH = DIAGRAM_CONSTANTS.node.width;
const NODE_HEIGHT = DIAGRAM_CONSTANTS.node.minHeight;
const BORDER_RADIUS = DIAGRAM_CONSTANTS.node.borderRadius;

interface NodeStyleConfig {
  background: string;
  border: string;
  borderHover: string;
  shadow: string;
  shadowSelected: string;
  titleColor: string;
  subtitleColor: string;
  fontSize: number;
  subFontSize: number;
}

const LIGHT_STYLES: NodeStyleConfig = {
  background: '#fefefe',
  border: '#595959',
  borderHover: '#595959',
  shadow: '5px 5px 0 #e1e1da, 10px 10px 0 #efefe8, 0 1px 2px rgba(0,0,0,0.04)',
  shadowSelected: '0 0 0 2px rgba(95,164,219,0.35), 5px 5px 0 #dfdfd8, 10px 10px 0 #ecece5, 0 2px 5px rgba(0,0,0,0.06)',
  titleColor: '#595959',
  subtitleColor: '#7a7a7a',
  fontSize: 12,
  subFontSize: 10,
};

const DARK_STYLES: NodeStyleConfig = {
  background: '#ffffff',
  border: '#d1d5db',
  borderHover: '#9ca3af',
  shadow: '5px 5px 0 #e5e7eb, 10px 10px 0 #f3f4f6, 0 1px 3px rgba(0,0,0,0.08)',
  shadowSelected: '0 0 0 2px rgba(129,140,248,0.5), 5px 5px 0 #d1d5db, 10px 10px 0 #e5e7eb, 0 2px 6px rgba(0,0,0,0.1)',
  titleColor: '#1f2937',
  subtitleColor: '#6b7280',
  fontSize: 12,
  subFontSize: 10,
};

const STATUS_COLORS = {
  healthy: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  unknown: '#6B7280',
};

function getTierColorNormalized(layer?: string): string {
  const tier = (layer || 'compute').toLowerCase();
  const colorMap: Record<string, string> = {
    client:   '#64748b', // slate
    edge:     '#6366f1', // indigo
    compute:  '#0d9488', // teal
    async:    '#d97706', // amber
    data:     '#3b82f6', // blue
    observe:  '#8b5cf6', // violet
    external: '#ec4899', // rose
  };
  return colorMap[tier] || colorMap.compute;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getDarkCategoryStyle(layer?: string): { border: string; glow: string } {
  const tier = (layer || 'compute').toLowerCase();
  const map: Record<string, { border: string; glow: string }> = {
    client:      { border: '#60A5FA', glow: 'rgba(96,165,250,0.15)' }, // Infrastructure/Client -> blue
    edge:        { border: '#60A5FA', glow: 'rgba(96,165,250,0.15)' },
    compute:     { border: '#34D399', glow: 'rgba(52,211,153,0.15)' }, // Services -> green
    async:       { border: '#FBBF24', glow: 'rgba(251,191,36,0.15)' }, // Async/Queue -> amber
    data:        { border: '#F87171', glow: 'rgba(248,113,113,0.15)' }, // Databases -> red
    observe:     { border: '#A78BFA', glow: 'rgba(167,139,250,0.15)' }, // Auth/Security -> purple
    external:    { border: '#22D3EE', glow: 'rgba(34,211,238,0.15)' }, // Cache/External -> cyan
  };
  return map[tier] || map.compute;
}

function ToolbarButton({ 
  onClick, 
  children,
  title,
  hoverClass = '',
}: { 
  onClick: (e: React.MouseEvent) => void; 
  children: React.ReactNode;
  title?: string;
  hoverClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-center transition-colors ${hoverClass}`}
    >
      {children}
    </button>
  );
}

function SystemNodeComponent({ id, data, selected }: NodeProps<NodeData>) {
  const setSelectedNodeId = useDiagramStore((s) => s.setSelectedNodeId);
  const { isDark } = useCanvasTheme();
  const [isHovered, setIsHovered] = useState(false);
  
  const nodeData = data as NodeData & {
    layer?: string;
    subtitle?: string;
    status?: 'healthy' | 'warning' | 'error' | 'unknown';
    color?: string;
    nodeWidth?: number;
    nodeHeight?: number;
    accentColor?: string;
  };
  
  const styles = isDark ? DARK_STYLES : LIGHT_STYLES;
  const tierColor = getTierColorNormalized(nodeData.layer);
  const accentColor = nodeData.accentColor || nodeData.color || tierColor || '#0D9488';
  
  const statusColor = STATUS_COLORS[nodeData.status || 'healthy'];
  const showStatus = nodeData.status && nodeData.status !== 'healthy';
  
  const handleClick = useCallback(() => {
    setSelectedNodeId(id);
  }, [id, setSelectedNodeId]);
  
  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const nodes = useDiagramStore.getState().nodes;
    const node = nodes.find(n => n.id === id);
    if (node) {
      const newId = `${id}-copy-${Date.now()}`;
      useDiagramStore.getState().addNode({
        ...node,
        id: newId,
        position: { x: node.position.x + 30, y: node.position.y + 30 },
        data: { ...node.data, label: `${node.data.label} (copy)` },
      });
      useDiagramStore.getState().setSelectedNodeIds([newId]);
    }
  }, [id]);
  
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    useDiagramStore.getState().removeNode(id);
  }, [id]);
  
  const handleStatusChange = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const statuses: Array<'healthy' | 'warning' | 'error' | 'unknown'> = ['healthy', 'warning', 'error', 'unknown'];
    const currentIndex = statuses.indexOf(nodeData.status || 'healthy');
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    useDiagramStore.getState().updateNodeData(id, { status: nextStatus });
  }, [id, nodeData.status]);
  
  const handleColorChange = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const colors = [
      '#64748b', '#6366f1', '#0d9488', '#d97706', '#3b82f6', '#8b5cf6', '#ec4899', // tier palette
      '#0284c7', '#059669', '#c026d3', '#65a30d', '#0891b2', // extra accents
    ];
    const currentIndex = colors.indexOf(nodeData.accentColor || nodeData.color || '#6B7280');
    const nextColor = colors[(currentIndex + 1) % colors.length];
    useDiagramStore.getState().updateNodeData(id, { accentColor: nextColor });
  }, [id, nodeData.accentColor, nodeData.color]);
  
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    useDiagramStore.getState().setSidebarOpen(true);
  }, []);


  const backplateLayers = isDark
    ? (selected
        ? [
            { offset: 10, color: '#f7f7f7' },
            { offset: 5, color: '#eef0f2' },
          ]
        : [
            { offset: 10, color: '#fbfbfb' },
            { offset: 5, color: '#f8f8fa' },
          ])
    : (selected
        ? [
            { offset: 10, color: '#f8f8f4' },
            { offset: 5, color: '#eaeae4' },
          ]
        : [
            { offset: 10, color: '#fafaf7' },
            { offset: 5, color: '#ecece6' },
          ]);


  // Dark mode details
  const catStyle = getDarkCategoryStyle(nodeData.layer);
  const showBorder = selected || isHovered;
  const borderCol = showBorder ? (isDark ? catStyle.border : accentColor) : 'transparent';
  
  let boxS = '';
  if (isDark) {
    boxS = `${styles.shadow}, inset 0 0 12px ${catStyle.glow}`;
    if (selected || isHovered) {
      boxS = `0 0 0 2px ${catStyle.border}, ${styles.shadowSelected}, inset 0 0 12px ${catStyle.glow}`;
    }
  } else {
    boxS = (selected || isHovered)
      ? `0 0 0 2px ${accentColor}, 0 3px 8px rgba(0,0,0,0.07)`
      : `0 2px 6px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.85)`;
  }

  const iconColor = isDark ? catStyle.border : accentColor;

  return (
    <div style={{ position: 'relative', zIndex: 2 /* node above edges */ }}>
      {/* Backplate layers - stacked underneath */}
      {backplateLayers.map((layer, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            top: layer.offset,
            left: layer.offset,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            borderRadius: BORDER_RADIUS,
            background: layer.color,
            zIndex: 0,
            transition: 'all 150ms ease',
          }}
        />
      ))}

      {/* Main node surface — z-index: 5 */}
      <div
        className="group"
        style={{
          width: NODE_WIDTH,
          minWidth: NODE_WIDTH,
          minHeight: NODE_HEIGHT,
          borderRadius: BORDER_RADIUS,
          background: styles.background,
          border: `1.5px solid ${borderCol}`,
          boxShadow: boxS,
          transition: 'all 150ms ease',
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible', // allows toolbar to be seen
          opacity: 1,
          zIndex: 5,
        }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Toolbar - appears above when selected */}
        {selected && (
          <div 
            style={{
              position: 'absolute',
              top: -56,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              padding: '4px 6px',
              borderRadius: '9999px',
              background: isDark ? '#1F2937' : '#ffffff',
              border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ToolbarButton onClick={handleEdit} title="Edit">
              <Pencil className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton onClick={handleDuplicate} title="Duplicate">
              <Copy className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton onClick={handleDelete} title="Delete" hoverClass="hover:text-red-500">
              <Trash2 className="w-3.5 h-3.5" />
            </ToolbarButton>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
            <ToolbarButton onClick={handleStatusChange} title="Toggle Status">
              <Activity className="w-3.5 h-3.5" style={{ color: statusColor }} />
            </ToolbarButton>
            <ToolbarButton onClick={handleColorChange} title="Change Color">
              <Palette className="w-3.5 h-3.5" style={{ color: accentColor }} />
            </ToolbarButton>
          </div>
        )}

        {/* Colored shine overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: BORDER_RADIUS,
          background: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.04)} 0%, transparent 60%)`,
          pointerEvents: 'none',
          zIndex: 1,
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px 4px', flex: 1 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: `${iconColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2.5, background: iconColor }} />
          </div>
          <p style={{ 
            fontSize: styles.fontSize, 
            fontWeight: 700, // Bold
            color: styles.titleColor, 
            margin: 0, 
            lineHeight: 1.3, 
            flex: 1, 
            wordBreak: 'break-word' 
          }} title={data.label}>
            {data.label}
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px 8px' }}>
          {nodeData.subtitle && (
            <p style={{ 
              fontSize: styles.subFontSize, 
              color: styles.subtitleColor, 
              margin: 0, 
              lineHeight: 1.2, 
              flex: 1, 
              wordBreak: 'break-word' 
            }} title={nodeData.subtitle}>
              {nodeData.subtitle}
            </p>
          )}
          {showStatus && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
            </div>
          )}
        </div>

        {/* Floating handles positioned outside node */}
        <FloatingHandles nodeId={id} />
      </div>
    </div>
  );
}

export const SystemNode = memo(SystemNodeComponent);
export default SystemNode;
