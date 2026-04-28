'use client';

import { memo, useState, useMemo, useCallback } from 'react';
import { Position, NodeProps, Handle } from 'reactflow';
import { useDiagramStore, NodeData } from '@/store/diagramStore';
import { NodeIcon, resolveNodeColor } from '@/components/NodeIcon';
import { useTheme } from '@/lib/theme';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Activity, Radio, Database, Shield, Zap, Cpu, Server, Box, Globe, Cloud, Cpu as CpuIcon, Pencil, Copy, Trash2, Activity as StatusIcon, Palette } from 'lucide-react';
import { getShapeConfig, getNodeShape, type NodeShape, type ShapeConfig } from '@/lib/nodeShapes';
import { getStrictPortConfig } from '@/lib/componentPorts';

interface BaseNodeData extends NodeData {
  shape?: NodeShape;
}

function BaseNodeComponent({ id, data, selected }: NodeProps<BaseNodeData>) {
  const setSelectedNodeId = useDiagramStore((s) => s.setSelectedNodeId);
  const { isDark } = useTheme();
  const accent = data.accentColor ?? data.color ?? '#6366f1';
  const resolvedAccent = data.technology ? resolveNodeColor(data.technology, accent) : accent;
  const hasError = data.hasError;
  const shape = data.shape || getNodeShape(data.category);
  const [isHovered, setIsHovered] = useState(false);

  // Toolbar handlers
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
    const currentIndex = statuses.indexOf(data.status || 'healthy');
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    useDiagramStore.getState().updateNodeData(id, { status: nextStatus });
  }, [id, data.status]);

  const handleColorChange = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#22c55e', '#14b8a6', '#0ea5e9', '#3b82f6', '#6b7280'];
    const currentIndex = colors.indexOf(data.accentColor || data.color || '#6366f1');
    const nextColor = colors[(currentIndex + 1) % colors.length];
    useDiagramStore.getState().updateNodeData(id, { accentColor: nextColor });
  }, [id, data.accentColor, data.color]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    useDiagramStore.getState().setSidebarOpen(true);
  }, []);

  const ToolbarButton = ({ onClick, children, title, hoverClass = '' }: { onClick: (e: React.MouseEvent) => void; children: React.ReactNode; title?: string; hoverClass?: string }) => (
    <button onClick={onClick} title={title} className={`h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-center transition-colors ${hoverClass}`}>
      {children}
    </button>
  );

  const statusColor = data.status === 'warning' ? '#F59E0B' : data.status === 'error' ? '#EF4444' : data.status === 'unknown' ? '#6B7280' : '#10B981';

  const shapeConfig = useMemo((): ShapeConfig => {
    if (data.shape) {
      return getShapeConfig(data.category);
    }
    return getShapeConfig(data.category);
  }, [data.category, data.shape]);

  const visualWeight = shapeConfig.visualWeight;

  const getBorderOpacity = () => {
    switch (visualWeight) {
      case 'high': return '50';
      case 'low': return '20';
      default: return '30';
    }
  };

  const getBorderWidth = () => {
    switch (visualWeight) {
      case 'high': return selected ? 2 : 1;
      case 'low': return selected ? 1 : 1;
      default: return selected ? 2 : 1;
    }
  };

  const getBaseStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: data.nodeWidth ?? shapeConfig.minWidth,
      minWidth: shapeConfig.minWidth,
      minHeight: shapeConfig.minHeight,
      maxHeight: shapeConfig.maxHeight,
      height: 'auto',
      boxSizing: 'border-box',
      cursor: 'pointer',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    };

    switch (shape) {
      case 'pill':
        return { ...base, borderRadius: 999, minWidth: shapeConfig.minWidth, minHeight: shapeConfig.minHeight, maxHeight: shapeConfig.maxHeight };
      case 'cylinder':
        return { ...base, borderRadius: 12 };
      case 'stack':
        return { ...base, borderRadius: 14 };
      case 'queue':
        return { ...base, borderRadius: 16, minHeight: shapeConfig.minHeight, maxHeight: shapeConfig.maxHeight };
      case 'dashed-rect':
        return { ...base, borderRadius: 14 };
      case 'shield':
        return { ...base, borderRadius: 14 };
      case 'minimal':
        return { ...base, borderRadius: 12 };
      case 'gradient-glow':
        return { ...base, borderRadius: 16 };
      case 'worker':
        return { ...base, borderRadius: 14 };
      default:
        return { ...base, borderRadius: 14 };
    }
  };

  const borderOpacity = getBorderOpacity();
  const borderWidth = getBorderWidth();
  
  const nodeStyles: React.CSSProperties = {
    ...getBaseStyles(),
    background: isDark
      ? 'linear-gradient(145deg, hsl(220 18% 15%) 0%, hsl(220 18% 11%) 100%)'
      : 'linear-gradient(145deg, #ffffff 0%, hsl(0 0% 98%) 100%)',
    border: 'none',
    boxShadow: selected
      ? `0 0 0 2px ${resolvedAccent}, 0 8px 32px ${resolvedAccent}30, 0 4px 12px hsl(var(--foreground) / 0.1)`
      : hasError
        ? '0 0 0 2px rgba(239,68,68,0.5), 0 4px 16px rgba(239,68,68,0.2)'
        : visualWeight === 'high'
          ? isDark
            ? `0 8px 24px hsl(var(--foreground) / 0.3), inset 0 1px 0 hsl(var(--foreground) / 0.1)`
            : `0 6px 20px hsl(var(--foreground) / 0.1), inset 0 1px 0 hsl(var(--foreground) / 0.05)`
          : isDark
            ? `0 4px 16px hsl(var(--foreground) / 0.25), inset 0 1px 0 hsl(var(--foreground) / 0.08)`
            : '0 4px 16px hsl(var(--foreground) / 0.08), inset 0 1px 0 hsl(var(--foreground) / 0.03)',
  };






  const renderShapeContent = () => {
    switch (shape) {
      case 'cylinder':
        return <CylinderContent isDark={isDark} resolvedAccent={resolvedAccent} />;
      case 'stack':
        return <StackContent isDark={isDark} resolvedAccent={resolvedAccent} />;
      case 'queue':
        return <QueueContent isDark={isDark} resolvedAccent={resolvedAccent} />;
      case 'pill':
        return <PillContent data={data} isDark={isDark} resolvedAccent={resolvedAccent} />;
      case 'dashed-rect':
        return <ExternalContent data={data} isDark={isDark} resolvedAccent={resolvedAccent} />;
      case 'shield':
        return <ShieldContent data={data} isDark={isDark} resolvedAccent={resolvedAccent} />;
      case 'minimal':
        return <MinimalContent data={data} isDark={isDark} resolvedAccent={resolvedAccent} />;
      case 'gradient-glow':
        return <GradientGlowContent data={data} isDark={isDark} resolvedAccent={resolvedAccent} />;
      case 'worker':
        return <WorkerContent data={data} isDark={isDark} resolvedAccent={resolvedAccent} />;
      default:
        return <DefaultContent data={data} isDark={isDark} resolvedAccent={resolvedAccent} />;
    }
  };


  return (
    <div
      className="relative group"
      style={nodeStyles}
      onClick={() => setSelectedNodeId(id)}
      onMouseEnter={(e) => {
        setIsHovered(true);
        if (!selected) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = isDark
            ? `0 8px 24px hsl(var(--foreground) / 0.35), 0 0 0 1px ${resolvedAccent}40`
            : `0 8px 24px hsl(var(--foreground) / 0.12), 0 0 0 1px ${resolvedAccent}20`;
        }
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        if (!selected) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isDark
            ? `0 4px 16px hsl(var(--foreground) / 0.25), inset 0 1px 0 hsl(var(--foreground) / 0.08)`
            : '0 4px 16px hsl(var(--foreground) / 0.08), inset 0 1px 0 hsl(var(--foreground) / 0.03)';
        }
      }}
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
            <StatusIcon className="w-3.5 h-3.5" style={{ color: statusColor }} />
          </ToolbarButton>
          <ToolbarButton onClick={handleColorChange} title="Change Color">
            <Palette className="w-3.5 h-3.5" style={{ color: resolvedAccent }} />
          </ToolbarButton>
        </div>
      )}
      <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-10 bg-gradient-to-br from-white/8 via-white/[0.02] to-transparent dark:from-white/8 dark:via-white/[0.02] dark:to-transparent" />
      
      <Handle type="target" position={Position.Left} id="target-left" style={{ width: 10, height: 10, background: '#fff', border: `2px solid ${resolvedAccent}`, borderRadius: '50%' }} />
      <Handle type="source" position={Position.Right} id="source-right" style={{ width: 10, height: 10, background: '#fff', border: `2px solid ${resolvedAccent}`, borderRadius: '50%' }} />
      <Handle type="target" position={Position.Top} id="target-top" style={{ width: 10, height: 10, background: '#fff', border: `2px solid ${resolvedAccent}`, borderRadius: '50%' }} />
      <Handle type="source" position={Position.Bottom} id="source-bottom" style={{ width: 10, height: 10, background: '#fff', border: `2px solid ${resolvedAccent}`, borderRadius: '50%' }} />
      
      {renderShapeContent()}
    </div>
  );
}

function CylinderContent({ isDark, resolvedAccent }: { isDark: boolean; resolvedAccent: string }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        width: 60,
        height: 70,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 15,
          background: isDark ? `${resolvedAccent}30` : `${resolvedAccent}20`,
          borderRadius: '50%',
          border: `1px solid ${resolvedAccent}50`,
        }} />
        <div style={{
          position: 'absolute',
          top: 12,
          left: 0,
          right: 0,
          bottom: 0,
          background: isDark ? `${resolvedAccent}15` : `${resolvedAccent}10`,
          border: `1px solid ${resolvedAccent}40`,
          borderTop: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 20,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Database size={16} style={{ color: resolvedAccent }} />
        </div>
      </div>
    </div>
  );
}

function StackContent({ isDark, resolvedAccent }: { isDark: boolean; resolvedAccent: string }) {
  const layers = [
    { offset: 0, opacity: 1 },
    { offset: 4, opacity: 0.8 },
    { offset: 8, opacity: 0.6 },
  ];

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        position: 'relative',
        width: 70,
        height: 50,
      }}>
        {layers.map((layer, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: layer.offset,
              left: 0,
              right: 0,
              height: 18,
              background: isDark 
                ? `linear-gradient(180deg, ${resolvedAccent}${Math.round(layer.opacity * 40).toString(16).padStart(2, '0')} 0%, ${resolvedAccent}${Math.round(layer.opacity * 20).toString(16).padStart(2, '0')} 100%)`
                : `linear-gradient(180deg, ${resolvedAccent}${Math.round(layer.opacity * 30).toString(16).padStart(2, '0')} 0%, ${resolvedAccent}${Math.round(layer.opacity * 15).toString(16).padStart(2, '0')} 100%)`,
              border: `1px solid ${resolvedAccent}${Math.round(layer.opacity * 60).toString(16).padStart(2, '0')}`,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {i === 1 && (
              <Box size={10} style={{ color: resolvedAccent, opacity: 0.8 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const queueMessageVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: [0.4, 1, 0.4],
    x: 0,
    transition: {
      delay: i * 0.3,
      duration: 1.2,
      repeat: Infinity,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  }),
};

function QueueContent({ isDark, resolvedAccent }: { isDark: boolean; resolvedAccent: string }) {
  const queueMessages = Array.from({ length: 5 }, (_, i) => i);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: isDark ? `${resolvedAccent}15` : `${resolvedAccent}10`,
          border: isDark ? `1px solid ${resolvedAccent}30` : `1px solid ${resolvedAccent}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Layers size={16} style={{ color: resolvedAccent }} />
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#e5e7eb' : '#1e293b' }}>
            Queue
          </span>
          <span style={{ fontSize: 10, color: isDark ? '#94a3b8' : '#64748b' }}>
            Messages
          </span>
        </div>
      </div>

      <div style={{
        padding: '6px 8px',
        background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}>
        <Activity size={10} style={{ color: resolvedAccent }} />
        <div style={{ display: 'flex', gap: 3, flex: 1 }}>
          <AnimatePresence>
            {queueMessages.map((_, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={queueMessageVariants}
                initial="hidden"
                animate="visible"
                style={{
                  width: 20,
                  height: 12,
                  borderRadius: 2,
                  background: isDark 
                    ? `linear-gradient(90deg, ${resolvedAccent}60 0%, ${resolvedAccent}90 50%, ${resolvedAccent}60 100%)`
                    : `linear-gradient(90deg, ${resolvedAccent}40 0%, ${resolvedAccent}70 50%, ${resolvedAccent}40 100%)`,
                  border: isDark 
                    ? `1px solid ${resolvedAccent}50` 
                    : `1px solid ${resolvedAccent}30`,
                }}
              />
            ))}
          </AnimatePresence>
        </div>
        <Radio size={10} style={{ color: resolvedAccent, opacity: 0.6 }} />
      </div>
    </div>
  );
}

function PillContent({ data, isDark, resolvedAccent }: { data: NodeData; isDark: boolean; resolvedAccent: string }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        background: isDark ? `${resolvedAccent}15` : `${resolvedAccent}10`,
        border: isDark ? `1px solid ${resolvedAccent}30` : `1px solid ${resolvedAccent}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {data.technology ? (
          <NodeIcon technology={data.technology} size={14} />
        ) : (
          <NodeIcon technology={undefined} fallbackIcon={data.icon} fallbackColor={resolvedAccent} size={14} />
        )}
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
      }}>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: isDark ? '#e5e7eb' : '#1e293b',
          textAlign: 'left',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {data.label}
        </span>
        {data.sublabel && (
          <span style={{
            fontSize: 10,
            color: isDark ? '#94a3b8' : '#64748b',
            textAlign: 'left',
          }}>
            {data.sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

function ExternalContent({ data, isDark, resolvedAccent }: { data: NodeData; isDark: boolean; resolvedAccent: string }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      opacity: 0.85,
    }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        background: isDark ? `${resolvedAccent}10` : `${resolvedAccent}08`,
        border: `1px dashed ${resolvedAccent}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {data.technology ? (
          <NodeIcon technology={data.technology} size={18} />
        ) : (
          <NodeIcon technology={undefined} fallbackIcon={data.icon} fallbackColor={resolvedAccent} size={18} />
        )}
      </div>
      <span style={{
        fontSize: 12,
        fontWeight: 500,
        color: isDark ? '#e5e7eb' : '#1e293b',
        textAlign: 'center',
      }}>
        {data.label}
      </span>
    </div>
  );
}

function ShieldContent({ data, isDark, resolvedAccent }: { data: NodeData; isDark: boolean; resolvedAccent: string }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
    }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: isDark ? `${resolvedAccent}20` : `${resolvedAccent}12`,
        border: `2px solid ${resolvedAccent}50`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 12px ${resolvedAccent}20`,
      }}>
        <Shield size={20} style={{ color: resolvedAccent }} />
      </div>
      <span style={{
        fontSize: 12,
        fontWeight: 600,
        color: isDark ? '#e5e7eb' : '#1e293b',
        textAlign: 'center',
      }}>
        {data.label}
      </span>
    </div>
  );
}

function MinimalContent({ data, isDark, resolvedAccent }: { data: NodeData; isDark: boolean; resolvedAccent: string }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      opacity: 0.7,
    }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        background: isDark ? `${resolvedAccent}08` : `${resolvedAccent}05`,
        border: `1px solid ${resolvedAccent}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {data.technology ? (
          <NodeIcon technology={data.technology} size={14} />
        ) : (
          <NodeIcon technology={undefined} fallbackIcon={data.icon} fallbackColor={resolvedAccent} size={14} />
        )}
      </div>
      <span style={{
        fontSize: 11,
        fontWeight: 500,
        color: isDark ? '#94a3b8' : '#64748b',
        textAlign: 'center',
      }}>
        {data.label}
      </span>
    </div>
  );
}

function GradientGlowContent({ data, isDark, resolvedAccent }: { data: NodeData; isDark: boolean; resolvedAccent: string }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      background: isDark
        ? `radial-gradient(ellipse at center, ${resolvedAccent}15 0%, transparent 70%)`
        : `radial-gradient(ellipse at center, ${resolvedAccent}10 0%, transparent 70%)`,
    }}>
      <motion.div
        animate={{
          boxShadow: [
            `0 0 8px ${resolvedAccent}30`,
            `0 0 16px ${resolvedAccent}50`,
            `0 0 8px ${resolvedAccent}30`,
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: isDark ? `${resolvedAccent}20` : `${resolvedAccent}12`,
          border: `1px solid ${resolvedAccent}50`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Cpu size={20} style={{ color: resolvedAccent }} />
      </motion.div>
      <span style={{
        fontSize: 12,
        fontWeight: 600,
        color: isDark ? '#e5e7eb' : '#1e293b',
        textAlign: 'center',
      }}>
        {data.label}
      </span>
    </div>
  );
}

function WorkerContent({ data, isDark, resolvedAccent }: { data: NodeData; isDark: boolean; resolvedAccent: string }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
    }}>
      <div style={{
        position: 'relative',
        width: 40,
        height: 40,
        borderRadius: 10,
        background: isDark ? `${resolvedAccent}15` : `${resolvedAccent}10`,
        border: `1px solid ${resolvedAccent}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Server size={20} style={{ color: resolvedAccent }} />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 14,
            height: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Zap size={10} style={{ color: resolvedAccent }} />
        </motion.div>
      </div>
      <span style={{
        fontSize: 12,
        fontWeight: 600,
        color: isDark ? '#e5e7eb' : '#1e293b',
        textAlign: 'center',
      }}>
        {data.label}
      </span>
    </div>
  );
}

function DefaultContent({ data, isDark, resolvedAccent }: { data: NodeData; isDark: boolean; resolvedAccent: string }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
    }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: isDark ? `${resolvedAccent}15` : `${resolvedAccent}10`,
        border: isDark ? `1px solid ${resolvedAccent}30` : `1px solid ${resolvedAccent}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {data.technology ? (
          <NodeIcon technology={data.technology} size={18} />
        ) : (
          <NodeIcon technology={undefined} fallbackIcon={data.icon} fallbackColor={resolvedAccent} size={18} />
        )}
      </div>
      <span style={{
        fontSize: 12,
        fontWeight: 600,
        color: isDark ? '#e5e7eb' : '#1e293b',
        textAlign: 'center',
        lineHeight: 1.3,
      }}>
        {data.label}
      </span>
      {data.sublabel && (
        <span style={{
          fontSize: 10,
          color: isDark ? '#94a3b8' : '#64748b',
          textAlign: 'center',
        }}>
          {data.sublabel}
        </span>
      )}
    </div>
  );
}

export const BaseNode = memo(BaseNodeComponent);
