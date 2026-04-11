'use client';

import { useMemo } from 'react';
import { useReactFlow, Node } from 'reactflow';
import { TIER_COLORS, ZONE_BACKGROUNDS, type TierType } from '@/lib/tierColors';

interface TierSwimlanesProps {
  nodes: Node[];
}

const TIER_ORDER: TierType[] = ['client', 'edge', 'compute', 'async', 'data', 'external', 'observe'];

const TIER_POSITIONS: Record<TierType, number> = {
  client: 50,
  edge: 320,
  compute: 650,
  async: 1000,
  data: 1350,
  external: 1700,
  observe: 2050,
};

const TIER_WIDTHS: Record<TierType, number> = {
  client: 240,
  edge: 300,
  compute: 320,
  async: 280,
  data: 320,
  external: 280,
  observe: 280,
};

export function TierSwimlanes({ nodes }: TierSwimlanesProps) {
  const reactFlowInstance = useReactFlow();
  
  const viewport = reactFlowInstance.getViewport();
  
  const swimlanes = useMemo(() => {
    if (nodes.length === 0) {
      return TIER_ORDER.map((tier, index) => ({
        tier,
        x: TIER_POSITIONS[tier],
        y: 0,
        width: TIER_WIDTHS[tier],
        height: 800,
        visible: true,
      }));
    }

    let minY = Infinity;
    let maxY = -Infinity;
    
    nodes.forEach(node => {
      const nodeY = node.position.y;
      const nodeHeight = node.height ?? 64;
      minY = Math.min(minY, nodeY);
      maxY = Math.max(maxY, nodeY + nodeHeight);
    });
    
    const padding = 60;
    const totalHeight = Math.max(maxY - minY + padding * 2, 600);

    return TIER_ORDER.map((tier) => {
      const tierNodes = nodes.filter(node => {
        const nodeTier = (node.data?.layer || node.data?.tier || '').toLowerCase();
        return nodeTier === tier;
      });

      if (tierNodes.length === 0) {
        return {
          tier,
          x: TIER_POSITIONS[tier],
          y: Math.max(0, minY - padding),
          width: TIER_WIDTHS[tier],
          height: totalHeight,
          visible: false,
        };
      }

      let tierMinY = Infinity;
      let tierMaxY = -Infinity;
      tierNodes.forEach(node => {
        const nodeY = node.position.y;
        const nodeHeight = node.height ?? 64;
        tierMinY = Math.min(tierMinY, nodeY);
        tierMaxY = Math.max(tierMaxY, nodeY + nodeHeight);
      });

      return {
        tier,
        x: TIER_POSITIONS[tier],
        y: tierMinY - padding,
        width: TIER_WIDTHS[tier],
        height: Math.max(tierMaxY - tierMinY + padding * 2, 200),
        visible: true,
      };
    });
  }, [nodes]);

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'visible',
      }}
    >
      <defs>
        <linearGradient id="swimlane-fade-right" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="20%" stopColor="currentColor" />
          <stop offset="80%" stopColor="currentColor" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
        <linearGradient id="swimlane-fade-bottom" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="15%" stopColor="currentColor" />
          <stop offset="85%" stopColor="currentColor" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      
      {swimlanes.map(({ tier, x, y, width, height, visible }) => {
        if (!visible) return null;
        
        const bgColor = ZONE_BACKGROUNDS[tier];
        const tierInfo = TIER_COLORS[tier];
        
        return (
          <g key={tier}>
            {/* Zone background */}
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill={bgColor}
              rx={16}
              ry={16}
              stroke="none"
            />
            
            {/* Zone label */}
            <text
              x={x + 12}
              y={y + 20}
              fill="#6B7280"
              fontSize={9}
              fontWeight={600}
              fontFamily="Inter, -apple-system, sans-serif"
              textAnchor="start"
              style={{
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {tierInfo.label}
            </text>
            
            {/* Left border accent */}
            <line
              x1={x + 3}
              y1={y + 28}
              x2={x + 3}
              y2={y + height - 12}
              stroke={tierInfo.color}
              strokeWidth={2}
              strokeOpacity={0.3}
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </svg>
  );
}
