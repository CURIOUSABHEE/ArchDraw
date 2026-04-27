import { MarkerType } from 'reactflow';

export type PathType = 'smooth' | 'Smoothstep' | 'bezier' | 'step' | 'straight';
export type EdgeType = 'sync' | 'async' | 'stream' | 'event' | 'dep';

export interface EdgeTypeConfig {
  id: EdgeType;
  label: string;
  color: string;
  dash: string;
  animated: boolean;
  markerStart: boolean;
  markerEnd: boolean;
  pathType: PathType;
}

export const EDGE_TYPE_CONFIGS: Record<EdgeType, EdgeTypeConfig> = {
  sync: {
    id: 'sync',
    label: 'Sync',
    color: '#94a3b8',
    dash: '',
    animated: false,
    markerStart: false,
    markerEnd: true,
    pathType: 'Smoothstep',
  },
  async: {
    id: 'async',
    label: 'Async',
    color: '#f59e0b',
    dash: '8 6',
    animated: true,
    markerStart: false,
    markerEnd: true,
    pathType: 'Smoothstep',
  },
  stream: {
    id: 'stream',
    label: 'Stream',
    color: '#22c55e',
    dash: '10 4 2 4',
    animated: true,
    markerStart: false,
    markerEnd: true,
    pathType: 'Smoothstep',
  },
  event: {
    id: 'event',
    label: 'Event',
    color: '#ec4899',
    dash: '4 4',
    animated: true,
    markerStart: false,
    markerEnd: true,
    pathType: 'Smoothstep',
  },
  dep: {
    id: 'dep',
    label: 'Dep',
    color: '#94a3b8',
    dash: '6 6',
    animated: true,
    markerStart: false,
    markerEnd: true,
    pathType: 'Smoothstep',
  },
};

export const PATH_TYPE_DEFAULTS: Record<PathType, { borderRadius?: number }> = {
  smooth: { borderRadius: 24 },
  Smoothstep: { borderRadius: 50 },
  bezier: {},
  step: { borderRadius: 0 },
  straight: {},
};

export const DEFAULT_EDGE_TYPE: EdgeType = 'sync';

export interface EdgeData {
  label?: string;
  edgeType?: EdgeType;
  pathType?: PathType;
  edgeVariant?: 'solid' | 'dashed' | 'dotted' | 'feedback';
  hideLabel?: boolean;
  communicationType?: 'sync' | 'async' | 'stream' | 'event' | 'dep';
}

export function getEdgeConfig(edgeType: EdgeType | undefined): EdgeTypeConfig {
  return EDGE_TYPE_CONFIGS[edgeType ?? DEFAULT_EDGE_TYPE];
}

export function getEffectivePathType(edgeType: EdgeType | undefined, pathType: PathType | undefined): PathType {
  if (pathType) return pathType;
  return getEdgeConfig(edgeType).pathType;
}
