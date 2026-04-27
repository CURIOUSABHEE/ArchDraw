'use client';

import { memo, useState } from 'react';
import { Position, NodeProps } from 'reactflow';
import { useDiagramStore, NodeData } from '@/store/diagramStore';
import { useTheme } from '@/lib/theme';
import { motion } from 'framer-motion';
import { Layers, Zap, Activity, Circle } from 'lucide-react';

interface CacheNodeData extends NodeData {
  showHitMiss?: boolean;
  hitRate?: number;
}

function CacheNodeComponent({ id, data, selected }: NodeProps<CacheNodeData>) {
  const setSelectedNodeId = useDiagramStore((s) => s.setSelectedNodeId);
  const { isDark } = useTheme();
  const accent = data.accentColor ?? data.color ?? '#ef4444';
  const [isHovered, setIsHovered] = useState(false);

  const showHitMiss = data.showHitMiss ?? false;
  const hitRate = data.hitRate ?? 85;

  const isHit = hitRate >= 70;

  const nodeStyles: React.CSSProperties = {
    width: 180,
    minWidth: 180,
    minHeight: 130,
    maxHeight: 150,
    height: 'auto',
    boxSizing: 'border-box',
    borderRadius: 12,
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: isDark
      ? 'linear-gradient(145deg, #1e2138 0%, #161928 100%)'
      : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
    border: selected
      ? `2px solid ${accent}`
      : `1px solid ${accent}40`,
    boxShadow: selected
      ? `0 0 0 2px ${accent}, 0 4px 20px ${accent}40`
      : isDark
        ? `0 2px 10px rgba(0,0,0,0.3), inset 0 0 30px ${accent}08`
        : `0 2px 10px rgba(0,0,0,0.1), inset 0 0 30px ${accent}05`,
    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
  };

  const layers = [
    { offset: 0, height: 22 },
    { offset: 4, height: 20 },
    { offset: 8, height: 18 },
  ];

  const shimmerKeyframes = {
    backgroundPosition: ['200% 0', '-200% 0'],
  };

  return (
    <div
      className="relative group"
      style={nodeStyles}
      onClick={() => setSelectedNodeId(id)}
      onMouseEnter={(e) => {
        setIsHovered(true);
        if (!selected) {
          e.currentTarget.style.borderColor = `${accent}80`;
          e.currentTarget.style.boxShadow = isDark
            ? `0 4px 20px ${accent}35, inset 0 0 40px ${accent}12`
            : `0 4px 20px ${accent}25, inset 0 0 40px ${accent}08`;
        }
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        if (!selected) {
          e.currentTarget.style.borderColor = `${accent}40`;
          e.currentTarget.style.boxShadow = isDark
            ? `0 2px 10px rgba(0,0,0,0.3), inset 0 0 30px ${accent}08`
            : `0 2px 10px rgba(0,0,0,0.1), inset 0 0 30px ${accent}05`;
        }
      }}
    >
      <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-10 bg-gradient-to-br from-white/10 via-white/[0.02] to-transparent" />

      {/* No handles needed — FloatingEdge computes boundary intersection mathematically */}

      <div style={{
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        height: '100%',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: isDark ? `${accent}15` : `${accent}10`,
              border: `1px solid ${accent}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Layers size={12} style={{ color: accent }} />
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: isDark ? '#e5e7eb' : '#1e293b',
            }}>
              {data.label || 'Cache'}
            </span>
          </div>

          {showHitMiss && (
            <motion.div
              animate={isHovered ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 6px',
                borderRadius: 4,
                background: isDark ? `${isHit ? '#10b981' : '#ef4444'}15` : `${isHit ? '#10b981' : '#ef4444'}10`,
                border: `1px solid ${isHit ? '#10b981' : '#ef4444'}30`,
              }}
            >
              <Circle
                size={6}
                fill={isHit ? '#10b981' : '#ef4444'}
                style={{ color: isHit ? '#10b981' : '#ef4444' }}
              />
              <span style={{
                fontSize: 7,
                fontWeight: 600,
                color: isHit ? '#10b981' : '#ef4444',
              }}>
                {isHit ? 'HIT' : 'MISS'}
              </span>
            </motion.div>
          )}
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px 0',
          position: 'relative',
        }}>
          <motion.div
            animate={isHovered ? {
              boxShadow: [
                `0 0 15px ${accent}30`,
                `0 0 25px ${accent}40`,
                `0 0 15px ${accent}30`,
              ],
            } : {
              boxShadow: [
                `0 0 8px ${accent}15`,
                `0 0 15px ${accent}20`,
                `0 0 8px ${accent}15`,
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              position: 'relative',
              width: 90,
              height: 50,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 3,
              padding: '4px 6px',
              background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)',
              borderRadius: 6,
              border: `1px solid ${accent}25`,
            }}
          >
            {layers.map((layer, i) => (
              <motion.div
                key={i}
                animate={isHovered ? {
                  opacity: [0.6, 1, 0.6],
                } : {
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 0.8 + i * 0.15,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  width: '100%',
                  height: layer.height,
                  borderRadius: 3,
                  background: isDark
                    ? `linear-gradient(90deg, ${accent}30 0%, ${accent}50 50%, ${accent}30 100%)`
                    : `linear-gradient(90deg, ${accent}20 0%, ${accent}35 50%, ${accent}20 100%)`,
                  border: `1px solid ${accent}40`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  animate={shimmerKeyframes}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `linear-gradient(90deg, transparent 0%, ${accent}30 50%, transparent 100%)`,
                    backgroundSize: '200% 100%',
                  }}
                />
              </motion.div>
            ))}

            <motion.div
              animate={isHovered ? { rotate: 360 } : {}}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 14,
                height: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={10} style={{ color: accent, opacity: 0.8 }} />
            </motion.div>
          </motion.div>
        </div>

        {showHitMiss && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}>
            <Activity size={8} style={{ color: accent, opacity: 0.6 }} />
            <span style={{
              fontSize: 8,
              fontWeight: 500,
              color: isDark ? '#94a3b8' : '#64748b',
            }}>
              {hitRate}% hit rate
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export const CacheNode = memo(CacheNodeComponent);
