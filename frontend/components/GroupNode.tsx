'use client';

import { NodeProps } from 'reactflow';

export default function GroupNode({ data }: NodeProps) {
  const color = (data as { groupColor?: string })?.groupColor || '#e2e8f0';

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const bg = hexToRgba(color, 0.04);
  const borderColor = hexToRgba(color, 0.35);
  const tagBorder = hexToRgba(color, 0.5);
  const tagText = hexToRgba(color, 0.9);
  const tagBg = hexToRgba(color, 0.08);

  const label =
    (data as { groupLabel?: string; label?: string })?.groupLabel ||
    (data as { label?: string })?.label ||
    '';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: bg,
        border: `1.5px dashed ${borderColor}`,
        borderRadius: 16,
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Text tag with pill outline */}
      <div
        style={{
          position: 'absolute',
          top: -12,
          left: 16,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 10px',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: tagText,
          background: tagBg,
          border: `1px solid ${tagBorder}`,
          borderRadius: 6,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          pointerEvents: 'none',
          userSelect: 'none',
          lineHeight: 1.4,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </div>
  );
}

export { GroupNode };
