'use client';

import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useDiagramStore, NodeData } from '@/store/diagramStore';
import { Layers, Activity, Radio } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageBrokerNodeData extends NodeData {
  brokerType?: 'rabbitmq' | 'kafka' | 'sqs' | 'pubsub';
  queueCount?: number;
}

function MessageBrokerNodeComponent({ id, data, selected }: NodeProps<MessageBrokerNodeData>) {
  const setSelectedNodeId = useDiagramStore((s) => s.setSelectedNodeId);
  const { isDark } = useTheme();
  const accent = data.accentColor ?? data.color ?? '#f59e0b';
  const [isHovered, setIsHovered] = useState(false);
  
  const brokerType = data.brokerType || 'pubsub';
  const brokerLabel = {
    rabbitmq: 'RabbitMQ',
    kafka: 'Kafka',
    sqs: 'SQS',
    pubsub: 'Pub/Sub',
  }[brokerType];

  const nodeStyles: React.CSSProperties = {
    width: data.nodeWidth ?? 220,
    minWidth: 220,
    minHeight: 140,
    maxHeight: 180,
    height: 'auto',
    boxSizing: 'border-box',
    borderRadius: 16,
    background: isDark
      ? 'linear-gradient(145deg, #1e2138 0%, #161928 100%)'
      : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
    border: selected
      ? `1px solid ${accent}`
      : isDark
        ? `1px solid ${accent}30`
        : `1px solid ${accent}25`,
    boxShadow: selected
      ? `0 0 0 2px ${accent}, 0 4px 20px ${accent}50`
      : isDark
        ? '0 2px 8px rgba(0,0,0,0.3)'
        : '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const handleStyle: React.CSSProperties = {
    width: 10,
    height: 10,
    background: isDark ? '#161b22' : '#ffffff',
    border: `1px solid rgba(255,255,255,0.12)`,
    borderRadius: '50%',
    transition: 'all 0.15s ease',
  };

  const sideHandleStyle = (side: 'left' | 'right' | 'top' | 'bottom', kind: 'target' | 'source'): React.CSSProperties => {
    const axisOffset = kind === 'source' ? 8 : -8;
    const offsetStyle =
      side === 'left'
        ? { left: -5, top: '50%', transform: `translateY(calc(-50% + ${axisOffset}px))` }
        : side === 'right'
          ? { right: -5, top: '50%', transform: `translateY(calc(-50% + ${axisOffset}px))` }
          : side === 'top'
            ? { top: -5, left: '50%', transform: `translateX(calc(-50% + ${axisOffset}px))` }
            : { bottom: -5, left: '50%', transform: `translateX(calc(-50% + ${axisOffset}px))` };

    return {
      ...handleStyle,
      ...offsetStyle,
      opacity: isHovered ? 1 : 0.7,
      boxShadow: isHovered ? `0 0 8px ${accent}60` : 'none',
    };
  };

  const messageVariants = {
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

  const queueMessages = Array.from({ length: 5 }, (_, i) => i);

  return (
    <div
      className="relative group"
      style={nodeStyles}
      onClick={() => setSelectedNodeId(id)}
      onMouseEnter={(e) => {
        setIsHovered(true);
        if (!selected) {
          e.currentTarget.style.borderColor = `${accent}80`;
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = isDark
            ? `0 4px 16px ${accent}30`
            : `0 4px 16px ${accent}25`;
        }
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        if (!selected) {
          e.currentTarget.style.borderColor = isDark ? `${accent}30` : `${accent}25`;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isDark
            ? '0 2px 8px rgba(0,0,0,0.3)'
            : '0 2px 8px rgba(0,0,0,0.1)';
        }
      }}
    >
      <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-10 bg-gradient-to-br from-white/10 via-white/[0.03] to-transparent dark:from-white/10 dark:via-white/[0.03] dark:to-transparent" />
      
      <Handle type="target" position={Position.Left} id="target-left" style={sideHandleStyle('left', 'target')} />
      <Handle type="source" position={Position.Left} id="source-left" style={sideHandleStyle('left', 'source')} />
      <Handle type="target" position={Position.Right} id="target-right" style={sideHandleStyle('right', 'target')} />
      <Handle type="source" position={Position.Right} id="source-right" style={sideHandleStyle('right', 'source')} />
      <Handle type="target" position={Position.Top} id="target-top" style={sideHandleStyle('top', 'target')} />
      <Handle type="source" position={Position.Top} id="source-top" style={sideHandleStyle('top', 'source')} />
      <Handle type="target" position={Position.Bottom} id="target-bottom" style={sideHandleStyle('bottom', 'target')} />
      <Handle type="source" position={Position.Bottom} id="source-bottom" style={sideHandleStyle('bottom', 'source')} />

      {/* Back-compat handles for persisted edges */}
      <Handle type="target" position={Position.Left} id="left" style={sideHandleStyle('left', 'target')} />
      <Handle type="source" position={Position.Right} id="right" style={sideHandleStyle('right', 'source')} />

      <div style={{
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: '100%',
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
            background: isDark ? `${accent}15` : `${accent}10`,
            border: isDark ? `1px solid ${accent}30` : `1px solid ${accent}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Layers size={16} style={{ color: accent }} />
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
              lineHeight: 1.3,
            }}>
              {data.label}
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: 400,
              color: isDark ? '#94a3b8' : '#64748b',
            }}>
              Queue / Pub-Sub
            </span>
          </div>

          <div style={{
            padding: '2px 6px',
            borderRadius: 4,
            background: isDark ? `${accent}15` : `${accent}10`,
            border: isDark ? `1px solid ${accent}25` : `1px solid ${accent}15`,
          }}>
            <span style={{
              fontSize: 8,
              fontWeight: 600,
              color: accent,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {brokerLabel}
            </span>
          </div>
        </div>

        <div style={{
          marginTop: 4,
          padding: '8px 10px',
          background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
          borderRadius: 8,
          border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          overflow: 'hidden',
        }}>
          <Activity size={12} style={{ color: accent, flexShrink: 0 }} />
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flex: 1,
            justifyContent: 'flex-start',
          }}>
            <AnimatePresence>
              {queueMessages.map((_, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  style={{
                    width: 24,
                    height: 14,
                    borderRadius: 3,
                    background: isDark 
                      ? `linear-gradient(90deg, ${accent}60 0%, ${accent}90 50%, ${accent}60 100%)`
                      : `linear-gradient(90deg, ${accent}40 0%, ${accent}70 50%, ${accent}40 100%)`,
                    border: isDark 
                      ? `1px solid ${accent}50` 
                      : `1px solid ${accent}30`,
                    flexShrink: 0,
                  }}
                />
              ))}
            </AnimatePresence>
          </div>

          <Radio size={12} style={{ color: accent, flexShrink: 0, opacity: 0.6 }} />
        </div>
      </div>
    </div>
  );
}

export const MessageBrokerNode = memo(MessageBrokerNodeComponent);
