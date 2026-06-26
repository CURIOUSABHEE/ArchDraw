import { useMemo } from 'react';
import { MarkerType } from 'reactflow';
import type { Edge } from 'reactflow';
import { useCanvasTheme } from '@/lib/theme';

const EDGE_COLORS = {
  default: '#94a3b8',
  defaultDark: '#cbd5e1',
};

export function useEdgeColors(edges: Edge[]): Edge[] {
  const { isDark } = useCanvasTheme();

  return useMemo(() => {
    const color = isDark ? EDGE_COLORS.defaultDark : EDGE_COLORS.default;
    return edges.map((edge) => ({
      ...edge,
      style: { ...edge.style, stroke: color, strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 20, height: 20 },
      labelStyle: { ...edge.labelStyle, fill: color },
    }));
  }, [edges, isDark]);
}

export function assignEdgeColors(edges: Edge[], isDark: boolean = true): Edge[] {
  const defaultColor = isDark ? EDGE_COLORS.defaultDark : EDGE_COLORS.default;
  return edges.map((edge) => ({
    ...edge,
    style: { ...edge.style, stroke: defaultColor, strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: defaultColor, width: 20, height: 20 },
    labelStyle: { ...edge.labelStyle, fill: defaultColor },
  }));
}
