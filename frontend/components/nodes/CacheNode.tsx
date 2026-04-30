'use client';

import { memo, useState } from 'react';
import { NodeProps } from 'reactflow';
import { useDiagramStore, NodeData } from '@/store/diagramStore';
import { useTheme } from '@/lib/theme';
import { motion } from 'framer-motion';
import { Layers, Zap, Activity, Circle } from 'lucide-react';
import { FloatingHandles } from './FloatingHandles';

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

  const nodeSurfaceStyles: React.CSSProperties = {
    width: 150,
    minWidth: 150,
    minHeight: 100,
    maxHeight: 120,
    height: 'auto',
    boxSizing: 'border-box',
    borderRadius: 10,
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: isDark
      ? 'linear-gradient(180deg, #252525 0%, #1a1a1a 100%)'
      : 'linear-gradient(180deg, #ffffff 0%, #f8f8f6 100%)',
    border: `1.5px solid ${isDark ? '#4a4a4a' : '#595959'}`,
    boxShadow: selected
      ? `0 0 0 2px ${accent}, 0 3px 8px rgba(0,0,0,0.07)`
      : `0 2px 6px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)`,
    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
    zIndex: 2,
  };

  /* Backplate layers — separate elements, BELOW edges */
  const backplateLayers = selected
    ? [
        { offset: 10, color: isDark ? 'rgba(0,0,0,0.04)' : '#ecece5' },
        { offset: 5, color: isDark ? 'rgba(0,0,0,0.06)' : '#dfdfd8' },
      ]
    : [
        { offset: 10, color: isDark ? 'rgba(0,0,0,0.05)' : '#f0f0e9' },
        { offset: 5, color: isDark ? 'rgba(0,0,0,0.08)' : '#e2e2db' },
      ];

  const layers = [
    { offset: 0, height: 18 },
    { offset: 3, height: 16 },
    { offset: 6, height: 14 },
  ];

  const shimmerKeyframes = {
    backgroundPosition: ['200% 0', '-200% 0'],
  };

   return (
    <div style={{ position: 'relative', zIndex: 2 /* node above edges */ }}>
      {/* Backplate layers — z-index: -1, below edges */}
      {backplateLayers.map((layer, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
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
        style={nodeSurfaceStyles}
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

      {/* Floating handles positioned outside node */}
      <FloatingHandles nodeId={id} />

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
              border: `1px solid ${isDark ? `${accent}30` : `${accent}25`}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Layers size={12} style={{ color: accent }} />
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              color: isDark ? '#e5e7eb' : '#374151',
              letterSpacing: '0.02em',
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
    </div>
  );
}

export const CacheNode = memo(CacheNodeComponent);
