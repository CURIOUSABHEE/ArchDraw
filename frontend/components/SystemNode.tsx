'use client';

import { memo, useCallback, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { useDiagramStore, NodeData } from '@/store/diagramStore';
import { useCanvasTheme } from '@/lib/theme';
import { Activity, Palette, Pencil, Copy, Trash2 } from 'lucide-react';
import { FloatingHandles } from './nodes/FloatingHandles';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 80;
const BORDER_RADIUS = 10;

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
  background: 'linear-gradient(135deg, #1E2235 0%, #141624 100%)',
  border: '#1E2130',
  borderHover: '#4B5563',
  shadow: '0 4px 16px rgba(0,0,0,0.5)',
  shadowSelected: '0 0 0 2px rgba(129,140,248,0.5), 0 4px 12px rgba(129,140,248,0.25)',
  titleColor: '#F1F5F9', // near white
  subtitleColor: '#94A3B8', // soft slate
  fontSize: 13,
  subFontSize: 11,
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

  // Backplate layers — completely disabled in dark mode for glass/glow effect
  const backplateLayers = isDark ? [] : (selected
    ? [
        { offset: 10, color: '#ecece5' },
        { offset: 5, color: '#dfdfd8' },
      ]
    : [
        { offset: 10, color: '#efefe8' },
        { offset: 5, color: '#e1e1da' },
      ]);

  // Dark mode details
  const catStyle = getDarkCategoryStyle(nodeData.layer);
  const borderCol = isDark ? catStyle.border : (selected ? accentColor : styles.border);
  
  let boxS = '';
  if (isDark) {
    boxS = `0 4px 16px rgba(0,0,0,0.5), inset 0 0 12px ${catStyle.glow}`;
    if (selected) {
      boxS = `0 0 0 2px ${catStyle.border}, 0 4px 16px rgba(0,0,0,0.5), inset 0 0 12px ${catStyle.glow}`;
    }
  } else {
    boxS = selected
      ? `0 0 0 2px ${accentColor}, 0 3px 8px rgba(0,0,0,0.07)`
      : `0 2px 6px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.85)`;
  }

  // Icon color: match category border at 90% brightness (default hex here is already bright)
  const iconColor = isDark ? catStyle.border : accentColor;

  return (
    <div style={{ position: 'relative', zIndex: 2 /* node above edges */ }}>
      {/* Backplate layers — z-index: -1, below edges */}
      {backplateLayers.map((layer, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: BORDER_RADIUS,
            transform: `translate(${layer.offset}px, ${layer.offset}px)`,
            background: layer.color,
            zIndex: -1,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Main node surface — z-index: 2, above edges */}
      <div
        className="group"
        style={{
          width: nodeData.nodeWidth || NODE_WIDTH,
          minWidth: nodeData.nodeWidth || NODE_WIDTH,
          height: nodeData.nodeHeight || NODE_HEIGHT,
          borderRadius: BORDER_RADIUS,
          background: styles.background,
          border: `1.5px solid ${borderCol}`,
          boxShadow: boxS,
          transition: 'all 150ms ease',
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          opacity: 1,
          zIndex: 2,
        }}
        onClick={handleClick}
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
