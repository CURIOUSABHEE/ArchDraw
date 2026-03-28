'use client';

import { memo, useState, useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useDiagramStore, NodeData } from '@/store/diagramStore';
import { NodeIcon, resolveNodeColor } from '@/components/NodeIcon';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Activity, Radio, Database, Shield, Zap, Cpu, Server, Box, Globe, Cloud, Cpu as CpuIcon } from 'lucide-react';
import { getShapeConfig, getNodeShape, type NodeShape, type ShapeConfig } from '@/lib/nodeShapes';
import { getStrictPortConfig } from '@/lib/componentPorts';

interface BaseNodeData extends NodeData {
  shape?: NodeShape;
  inputCount?: number;
  outputCount?: number;
}

function BaseNodeComponent({ id, data, selected }: NodeProps<BaseNodeData>) {
  const setSelectedNodeId = useDiagramStore((s) => s.setSelectedNodeId);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const accent = data.accentColor ?? data.color ?? '#6366f1';
  const resolvedAccent = data.technology ? resolveNodeColor(data.technology, accent) : accent;
  const hasError = data.hasError;
  const shape = data.shape || getNodeShape(data.category);
  const [isHovered, setIsHovered] = useState(false);

  const shapeConfig = useMemo((): ShapeConfig => {
    if (data.shape) {
      return getShapeConfig(data.category);
    }
    return getShapeConfig(data.category);
  }, [data.category, data.shape]);

  const portConfig = useMemo(() => {
    const componentType = data.componentType || data.category.toLowerCase().replace(/[^a-z0-9]/g, '_');
    try {
      return getStrictPortConfig(componentType);
    } catch {
      // Fallback for unknown types - will throw error in strict mode
      return { inputs: 1, outputs: 1 };
    }
  }, [data.componentType, data.category]);
  
  const inputCount = useMemo((): number => {
    return portConfig.inputs;
  }, [portConfig.inputs]);

  const outputCount = useMemo((): number => {
    return portConfig.outputs;
  }, [portConfig.outputs]);

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
      transition: 'box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease',
    };

    switch (shape) {
      case 'pill':
        return { ...base, borderRadius: 999, minWidth: shapeConfig.minWidth, minHeight: shapeConfig.minHeight, maxHeight: shapeConfig.maxHeight };
      case 'cylinder':
        return { ...base, borderRadius: 8 };
      case 'stack':
        return { ...base, borderRadius: 12 };
      case 'queue':
        return { ...base, borderRadius: 16, minHeight: shapeConfig.minHeight, maxHeight: shapeConfig.maxHeight };
      case 'dashed-rect':
        return { ...base, borderRadius: 10, borderStyle: 'dashed' };
      case 'shield':
        return { ...base, borderRadius: 12 };
      case 'minimal':
        return { ...base, borderRadius: 8, borderWidth: 1 };
      case 'gradient-glow':
        return { ...base, borderRadius: 14 };
      case 'worker':
        return { ...base, borderRadius: 10 };
      default:
        return { ...base, borderRadius: 14 };
    }
  };

  const borderOpacity = getBorderOpacity();
  const borderWidth = getBorderWidth();
  
  const nodeStyles: React.CSSProperties = {
    ...getBaseStyles(),
    background: isDark
      ? 'linear-gradient(145deg, #1e2138 0%, #161928 100%)'
      : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
    border: selected
      ? `${borderWidth}px solid ${resolvedAccent}`
      : hasError
        ? '1px solid rgba(239,68,68,0.4)'
        : shape === 'minimal'
          ? `1px solid ${resolvedAccent}15`
          : shape === 'dashed-rect'
            ? `2px dashed ${resolvedAccent}${borderOpacity}`
            : `${borderWidth}px solid ${resolvedAccent}${borderOpacity}`,
    boxShadow: selected
      ? `0 0 0 2px ${resolvedAccent}, 0 4px 20px ${resolvedAccent}50`
      : hasError
        ? '0 0 0 1px rgba(239,68,68,0.3), 0 2px 8px rgba(0,0,0,0.3)'
        : visualWeight === 'high'
          ? isDark
            ? `0 4px 12px rgba(0,0,0,0.4), inset 0 0 20px ${resolvedAccent}10`
            : `0 4px 12px rgba(0,0,0,0.15), inset 0 0 20px ${resolvedAccent}08`
          : isDark
            ? '0 2px 8px rgba(0,0,0,0.3)'
            : '0 2px 8px rgba(0,0,0,0.1)',
  };

  const baseHandleStyle: React.CSSProperties = {
    width: 10,
    height: 10,
    background: isDark ? '#161b22' : '#ffffff',
    border: `1px solid rgba(255,255,255,0.12)`,
    borderRadius: '50%',
    transition: 'all 0.15s ease',
  };

  const getHandleOpacity = (hasConnections: boolean, isActive: boolean) => {
    if (hasConnections || isActive) return 1;
    return isHovered ? 0.9 : 0;
  };

  const getPortSpacing = (count: number) => {
    if (count <= 1) return 0;
    if (count === 2) return 24;
    if (count === 3) return 22;
    if (count === 4) return 20;
    return 18;
  };

  const renderInputHandles = () => {
    if (inputCount === 0) return null;
    
    const handles = [];
    const count = inputCount;
    const spacing = getPortSpacing(count);
    const startOffset = count > 1 ? -((count - 1) * spacing) / 2 : 0;
    
    for (let i = 0; i < count; i++) {
      const offset = count > 1 ? startOffset + i * spacing : 0;
      handles.push(
        <motion.div
          key={`input-${i}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: getHandleOpacity(false, isHovered),
            scale: isHovered ? 1.15 : 1,
          }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'absolute',
            left: -5,
            top: '50%',
            marginTop: offset,
            zIndex: 10,
          }}
        >
          <Handle
            type="target"
            position={Position.Left}
            id={`input-${i}`}
            style={{
              ...baseHandleStyle,
              background: isDark ? resolvedAccent : '#ffffff',
              border: `2px solid ${resolvedAccent}`,
              boxShadow: isHovered ? `0 0 10px ${resolvedAccent}70` : 'none',
            }}
          />
        </motion.div>
      );
    }
    return handles;
  };

  const renderOutputHandles = () => {
    if (outputCount === 0) return null;
    
    const handles = [];
    const count = outputCount;
    const spacing = getPortSpacing(count);
    const startOffset = count > 1 ? -((count - 1) * spacing) / 2 : 0;
    
    for (let i = 0; i < count; i++) {
      const offset = count > 1 ? startOffset + i * spacing : 0;
      handles.push(
        <motion.div
          key={`output-${i}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: getHandleOpacity(false, isHovered),
            scale: isHovered ? 1.15 : 1,
          }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'absolute',
            right: -5,
            top: '50%',
            marginTop: offset,
            zIndex: 10,
          }}
        >
          <Handle
            type="source"
            position={Position.Right}
            id={`output-${i}`}
            style={{
              ...baseHandleStyle,
              background: isDark ? resolvedAccent : '#ffffff',
              border: `2px solid ${resolvedAccent}`,
              boxShadow: isHovered ? `0 0 8px ${resolvedAccent}60` : 'none',
            }}
          />
        </motion.div>
      );
    }
    return handles;
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

  const renderHandles = () => {
    if (shape === 'pill') {
      return (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: getHandleOpacity(false, false) }}
            style={{ position: 'absolute', left: -5, zIndex: 10 }}
          >
            <Handle
              type="target"
              position={Position.Left}
              style={{
                ...baseHandleStyle,
                background: isDark ? resolvedAccent : '#ffffff',
                border: `2px solid ${resolvedAccent}`,
              }}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: getHandleOpacity(false, false) }}
            style={{ position: 'absolute', right: -5, zIndex: 10 }}
          >
            <Handle
              type="source"
              position={Position.Right}
              style={{
                ...baseHandleStyle,
                background: isDark ? resolvedAccent : '#ffffff',
                border: `2px solid ${resolvedAccent}`,
              }}
            />
          </motion.div>
        </>
      );
    }
    return (
      <>
        {renderInputHandles()}
        {renderOutputHandles()}
        <Handle type="target" position={Position.Top} style={{ ...baseHandleStyle, opacity: 0 }} />
        <Handle type="source" position={Position.Bottom} style={{ ...baseHandleStyle, opacity: 0 }} />
      </>
    );
  };

  return (
    <div
      className="relative group"
      style={nodeStyles}
      onClick={() => setSelectedNodeId(id)}
      onMouseEnter={(e) => {
        setIsHovered(true);
        if (!selected) {
          e.currentTarget.style.borderColor = `${resolvedAccent}80`;
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = isDark
            ? `0 4px 16px ${resolvedAccent}30`
            : `0 4px 16px ${resolvedAccent}25`;
        }
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        if (!selected) {
          e.currentTarget.style.borderColor = isDark ? `${resolvedAccent}30` : `${resolvedAccent}30`;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isDark
            ? '0 2px 8px rgba(0,0,0,0.3)'
            : '0 2px 8px rgba(0,0,0,0.1)';
        }
      }}
    >
      <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-10 bg-gradient-to-br from-white/10 via-white/[0.03] to-transparent group-hover:from-white/[0.15] group-hover:via-white/[0.06] transition-all duration-300 dark:from-white/10 dark:via-white/[0.03] dark:to-transparent" />
      
      {renderHandles()}
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
