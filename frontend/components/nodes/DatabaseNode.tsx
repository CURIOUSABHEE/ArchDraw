'use client';

import { memo, useState } from 'react';
import { NodeProps } from 'reactflow';
import { useDiagramStore, NodeData } from '@/store/diagramStore';
import { useTheme } from '@/lib/theme';
import { motion } from 'framer-motion';
import { Database, HardDrive, Table2, Server } from 'lucide-react';
import { FloatingHandles } from './FloatingHandles';

interface DatabaseNodeData extends NodeData {
  variant?: 'primary' | 'replica' | 'sharded';
  showReadReplica?: boolean;
}

function DatabaseNodeComponent({ id, data, selected }: NodeProps<DatabaseNodeData>) {
  const setSelectedNodeId = useDiagramStore((s) => s.setSelectedNodeId);
  const { isDark } = useTheme();
  const accent = data.accentColor ?? data.color ?? '#f97316';
  const [isHovered, setIsHovered] = useState(false);

  const variant = data.variant || 'primary';

  const nodeSurfaceStyles: React.CSSProperties = {
    width: 160,
    minWidth: 160,
    minHeight: 140,
    maxHeight: 160,
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
    transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
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

  const getDbIcon = () => {
    const iconSize = 14;
    switch (variant) {
      case 'replica':
        return <Server size={iconSize} style={{ color: accent }} />;
      case 'sharded':
        return <Table2 size={iconSize} style={{ color: accent }} />;
      default:
        return <Database size={iconSize} style={{ color: accent }} />;
    }
  };

  const getVariantBadge = () => {
    const badges = {
      primary: { label: 'Primary', color: accent },
      replica: { label: 'Replica', color: '#10b981' },
      sharded: { label: 'Sharded', color: '#3b82f6' },
    };
    const badge = badges[variant];

    return (
      <div style={{
        position: 'absolute',
        top: 8,
        right: 8,
        padding: '2px 6px',
        borderRadius: 4,
        background: isDark ? `${badge.color}20` : `${badge.color}15`,
        border: `1px solid ${badge.color}40`,
      }}>
        <span style={{
          fontSize: 7,
          fontWeight: 600,
          color: badge.color,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {badge.label}
        </span>
      </div>
    );
  };

  const dataLayers = [
    { height: 6, opacity: 0.25 },
    { height: 6, opacity: 0.2 },
    { height: 6, opacity: 0.15 },
    { height: 6, opacity: 0.1 },
    { height: 4, opacity: 0.08 },
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
              ? `0 4px 20px ${accent}30`
              : `0 4px 20px ${accent}25`;
          }
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
          if (!selected) {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
            e.currentTarget.style.boxShadow = isDark
              ? '0 4px 12px rgba(0,0,0,0.4)'
              : '0 4px 12px rgba(0,0,0,0.15)';
          }
        }}
      >
      <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-10 bg-gradient-to-br from-white/8 via-white/[0.02] to-transparent" />

      {/* Floating handles positioned outside node */}
      <FloatingHandles nodeId={id} />

      <div style={{
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        height: '100%',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: isDark ? `${accent}20` : `${accent}12`,
            border: `1px solid ${accent}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {getDbIcon()}
          </div>
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: isDark ? '#e5e7eb' : '#1e293b',
          }}>
            {data.label || 'SQL Database'}
          </span>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px 0',
        }}>
          <div style={{
            position: 'relative',
            width: 80,
            height: 70,
          }}>
            <motion.div
              animate={isHovered ? {
                boxShadow: [
                  `0 0 10px ${accent}20`,
                  `0 0 20px ${accent}30`,
                  `0 0 10px ${accent}20`,
                ],
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                position: 'absolute',
                inset: 0,
                background: isDark
                  ? `radial-gradient(ellipse at center, ${accent}15 0%, transparent 70%)`
                  : `radial-gradient(ellipse at center, ${accent}08 0%, transparent 70%)`,
                borderRadius: 8,
              }}
            />

            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 14,
              background: isDark ? `${accent}30` : `${accent}18`,
              borderRadius: '50%',
              border: `1px solid ${accent}50`,
              transform: 'scaleY(0.5)',
            }} />

            <div style={{
              position: 'absolute',
              top: 8,
              left: 0,
              right: 0,
              bottom: 8,
              background: isDark ? `${accent}15` : `${accent}08`,
              borderLeft: `1px solid ${accent}40`,
              borderRight: `1px solid ${accent}40`,
              borderBottom: `1px solid ${accent}40`,
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
            }} />

            <div style={{
              position: 'absolute',
              bottom: 6,
              left: 4,
              right: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              alignItems: 'center',
            }}>
              {dataLayers.map((layer, i) => (
                <motion.div
                  key={i}
                  animate={isHovered ? {
                    opacity: [layer.opacity, layer.opacity * 1.5, layer.opacity],
                  } : {}}
                  transition={{ duration: 1 + i * 0.1, repeat: Infinity }}
                  style={{
                    width: '100%',
                    height: layer.height,
                    background: isDark
                      ? `linear-gradient(90deg, ${accent}60 0%, ${accent}80 50%, ${accent}60 100%)`
                      : `linear-gradient(90deg, ${accent}40 0%, ${accent}60 50%, ${accent}40 100%)`,
                    borderRadius: 2,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {getVariantBadge()}
         </div>
      </div>
    </div>
  );
}

export const DatabaseNode = memo(DatabaseNodeComponent);
