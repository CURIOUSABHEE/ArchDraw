'use client';

import { memo, useCallback, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { useDiagramStore, NodeData } from '@/store/diagramStore';
import { useCanvasTheme } from '@/lib/theme';
import { Activity, Palette, Pencil, Copy, Trash2 } from 'lucide-react';
import { FloatingHandles } from './nodes/FloatingHandles';

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
}

const LIGHT_STYLES: NodeStyleConfig = {
  background: '#fefefe',
  border: '#595959',
  borderHover: '#595959',
  shadow: '5px 5px 0 #e1e1da, 10px 10px 0 #efefe8, 0 1px 2px rgba(0,0,0,0.04)',
  shadowSelected: '0 0 0 2px rgba(95,164,219,0.35), 5px 5px 0 #dfdfd8, 10px 10px 0 #ecece5, 0 2px 5px rgba(0,0,0,0.06)',
  titleColor: '#595959',
  subtitleColor: '#7a7a7a',
};

const DARK_STYLES: NodeStyleConfig = {
  background: '#1F2937',
  border: '#374151',
  borderHover: '#4B5563',
  shadow: '0 1px 4px rgba(0,0,0,0.3)',
  shadowSelected: '0 0 0 2px rgba(129,140,248,0.5), 0 4px 12px rgba(129,140,248,0.25)',
  titleColor: '#F9FAFB',
  subtitleColor: '#9CA3AF',
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
    client: '#5fa4db',
    edge: '#5fa4db',
    compute: '#5fa4db',
    async: '#d8aa59',
    data: '#d8aa59',
    observe: '#bbbbbb',
    external: '#bbbbbb',
  };
  return colorMap[tier] || colorMap.compute;
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
    const colors = ['#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#22c55e', '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#6b7280'];
    const currentIndex = colors.indexOf(nodeData.accentColor || nodeData.color || '#6B7280');
    const nextColor = colors[(currentIndex + 1) % colors.length];
    useDiagramStore.getState().updateNodeData(id, { accentColor: nextColor });
  }, [id, nodeData.accentColor, nodeData.color]);
  
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    useDiagramStore.getState().setSidebarOpen(true);
  }, []);

  // Backplate layers — separate elements with z-index: 0 (BELOW edges)
  const backplateLayers = selected
    ? [
        { offset: 10, color: '#ecece5' },
        { offset: 5, color: '#dfdfd8' },
      ]
    : [
        { offset: 10, color: '#efefe8' },
        { offset: 5, color: '#e1e1da' },
      ];

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
          height: NODE_HEIGHT,
          borderRadius: BORDER_RADIUS,
          background: styles.background,
          borderTopWidth: 1.5,
          borderRightWidth: 1.5,
          borderBottomWidth: 1.5,
          borderLeftWidth: 1.5,
          borderTopStyle: 'solid',
          borderRightStyle: 'solid',
          borderBottomStyle: 'solid',
          borderLeftStyle: 'solid',
          borderTopColor: selected ? accentColor : styles.border,
          borderRightColor: selected ? accentColor : styles.border,
          borderBottomColor: selected ? accentColor : styles.border,
          borderLeftColor: selected ? accentColor : styles.border,
          boxShadow: selected
            ? `0 0 0 2px ${accentColor}, 0 3px 8px rgba(0,0,0,0.07)`
            : `0 2px 6px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.85)`,
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
          <div style={{ width: 24, height: 24, borderRadius: 6, background: `${accentColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2.5, background: accentColor }} />
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: styles.titleColor, margin: 0, lineHeight: 1.3, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={data.label}>
            {data.label}
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px 8px' }}>
          {nodeData.subtitle && (
            <p style={{ fontSize: 10, color: styles.subtitleColor, margin: 0, lineHeight: 1.2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={nodeData.subtitle}>
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
