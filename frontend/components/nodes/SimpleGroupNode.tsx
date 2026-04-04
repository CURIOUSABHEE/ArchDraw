'use client';

import { memo } from 'react';
import { NodeProps } from 'reactflow';

export interface SimpleGroupNodeData {
  groupLabel?: string;
  groupColor?: string;
  label?: string;
}

function SimpleGroupNodeComponent({ data }: NodeProps<SimpleGroupNodeData>) {
  const groupLabel = data.groupLabel || data.label || '';
  const groupColor = data.groupColor || '#6B7280';
  
  const bgColorWithAlpha = groupColor + '0A';
  
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: `1.5px solid ${groupColor}`,
        borderRadius: 8,
        background: bgColorWithAlpha,
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {groupLabel && (
        <div
          style={{
            position: 'absolute',
            top: -11,
            left: 16,
            background: 'var(--background)',
            padding: '0 6px',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: groupColor,
            zIndex: 10,
          }}
        >
          {groupLabel}
        </div>
      )}
    </div>
  );
}

export const SimpleGroupNode = memo(SimpleGroupNodeComponent);
