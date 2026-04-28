'use client';

import { memo, useCallback } from 'react';
import { Position, NodeProps, Handle } from 'reactflow';
import { useDiagramStore, NodeData } from '@/store/diagramStore';
import { useCanvasTheme } from '@/lib/theme';
import { Activity, Palette, Pencil, Copy, Trash2 } from 'lucide-react';

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
  background: '#FFFFFF',
  border: '#E5E7EB',
  borderHover: '#D1D5DB',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowSelected: '0 0 0 2px rgba(99,102,241,0.4), 0 4px 12px rgba(99,102,241,0.2)',
  titleColor: '#111827',
  subtitleColor: '#6B7280',
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

function getHandleStyle(position: Position, type: 'source' | 'target'): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    width: 12,
    height: 12,
    background: '#fff',
    border: '2px solid #6366f1',
    borderRadius: '50%',
    zIndex: 10,
  };
  
  if (position === Position.Left) {
    return { ...baseStyle, left: -6, top: '50%', transform: 'translateY(-50%)' };
  }
  if (position === Position.Right) {
    return { ...baseStyle, right: -6, top: '50%', transform: 'translateY(-50%)' };
  }
  if (position === Position.Top) {
    return { ...baseStyle, top: -6, left: '50%', transform: 'translateX(-50%)' };
  }
  return { ...baseStyle, bottom: -6, left: '50%', transform: 'translateX(-50%)' };
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
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#22c55e', '#14b8a6', '#0ea5e9', '#3b82f6', '#6b7280'];
    const currentIndex = colors.indexOf(nodeData.accentColor || nodeData.color || '#6366f1');
    const nextColor = colors[(currentIndex + 1) % colors.length];
    useDiagramStore.getState().updateNodeData(id, { accentColor: nextColor });
  }, [id, nodeData.accentColor, nodeData.color]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    useDiagramStore.getState().setSidebarOpen(true);
  }, []);

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
        boxShadow: selected ? styles.shadowSelected : styles.shadow,
        transition: 'all 150ms ease',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      onClick={handleClick}
    >
      {/* Toolbar - appears above when selected */}
      {selected && (
        <div 
          className="absolute -top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0.5 px-1.5 py-1 rounded-lg shadow-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
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
        <div style={{ width: 24, height: 24, borderRadius: 6, background: `${accentColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: accentColor }} />
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

      <Handle type="target" position={Position.Left} id="target-left" style={getHandleStyle(Position.Left, 'target')} />
      <Handle type="source" position={Position.Right} id="source-right" style={getHandleStyle(Position.Right, 'source')} />
      <Handle type="target" position={Position.Top} id="target-top" style={getHandleStyle(Position.Top, 'target')} />
      <Handle type="source" position={Position.Bottom} id="source-bottom" style={getHandleStyle(Position.Bottom, 'source')} />
    </div>
  );
}

export const SystemNode = memo(SystemNodeComponent);
export default SystemNode;
