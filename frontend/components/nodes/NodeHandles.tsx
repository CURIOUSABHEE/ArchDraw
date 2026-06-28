'use client';

import { Handle, Position } from 'reactflow';
import type { HandleId } from '@/hooks/useNodeHandles';

type Side = 'left' | 'right' | 'top' | 'bottom';
const SIDES: Side[] = ['left', 'right', 'top', 'bottom'];
const TYPES = ['source', 'target'] as const;

interface NodeHandleProps {
  side: Side;
  type: 'source' | 'target';
  needed?: Set<HandleId>;
  style?: React.CSSProperties;
}

function SingleHandle({ side, type, needed, style }: NodeHandleProps) {
  const id = `${type}-${side}`;
  if (needed && !needed.has(id as HandleId)) return null;

  const both = needed?.has(`target-${side}`) && needed?.has(`source-${side}`);
  const offset = both ? 'calc(50% - 12px)' : '50%';
  const offsetPlus = both ? 'calc(50% + 12px)' : '50%';

  const isHorizontal = side === 'left' || side === 'right';
  const pos = side === 'left' ? Position.Left : side === 'right' ? Position.Right : side === 'top' ? Position.Top : Position.Bottom;

  const base: React.CSSProperties = {
    position: 'absolute',
    ...(isHorizontal
      ? {
          left: side === 'left' ? -4 : undefined,
          right: side === 'right' ? -4 : undefined,
          top: type === 'target' ? offset : offsetPlus,
          transform: 'translateY(-50%)',
        }
      : {
          top: side === 'top' ? -4 : undefined,
          bottom: side === 'bottom' ? -4 : undefined,
          left: type === 'target' ? offset : offsetPlus,
          transform: 'translateX(-50%)',
        }),
    ...style,
  };

  return <Handle type={type} position={pos} id={id} style={base} />;
}

interface NodeHandlesProps {
  needed?: Set<HandleId>;
  handleStyle?: React.CSSProperties;
  /** Always render all 8 handles (no conditional hiding) */
  alwaysRender?: boolean;
  /** Omit the centered fallback handles */
  noFallback?: boolean;
  /** Sides to render (defaults to all four) */
  sides?: Side[];
}

export function NodeHandles({ needed, handleStyle, alwaysRender, noFallback, sides = SIDES }: NodeHandlesProps) {
  const fallback: React.CSSProperties = {
    opacity: 0,
    pointerEvents: 'none',
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    width: 1,
    height: 1,
    border: 'none',
    background: 'transparent',
    minWidth: 0,
    minHeight: 0,
  };

  return (
    <>
      {!noFallback && (
        <>
          <Handle type="source" position={Position.Top} style={fallback} />
          <Handle type="target" position={Position.Top} style={fallback} />
        </>
      )}
      {sides.map((side) =>
        TYPES.map((type) => (
          <SingleHandle
            key={`${type}-${side}`}
            side={side}
            type={type}
            needed={alwaysRender ? undefined : needed}
            style={handleStyle}
          />
        ))
      )}
    </>
  );
}
