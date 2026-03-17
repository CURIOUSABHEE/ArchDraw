'use client';

import { getBezierPath, BaseEdge, EdgeProps } from 'reactflow';

export function CustomBezierEdge({
  id,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition,
  targetPosition,
  label,
  markerEnd,
  style,
  animated,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const isDark = document.documentElement.classList.contains('dark');
  const labelBg   = isDark ? '#1e293b' : '#f8fafc';
  const labelFill = isDark ? '#94a3b8' : '#475569';
  const labelStr  = label ? String(label) : '';
  const labelWidth = Math.max(80, labelStr.length * 7 + 16);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeDasharray: animated ? '6 3' : undefined,
        }}
      />
      {labelStr && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <rect
            x={-(labelWidth / 2)}
            y={-11}
            width={labelWidth}
            height={20}
            rx={5}
            ry={5}
            fill={labelBg}
            stroke="rgba(148,163,184,0.2)"
            strokeWidth={1}
          />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fontSize={10}
            fill={labelFill}
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight={500}
          >
            {labelStr}
          </text>
        </g>
      )}
    </>
  );
}
