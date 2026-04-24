import type { LayerType } from '../types';

export type Direction = 'RIGHT' | 'DOWN' | 'LEFT' | 'UP';
export type NodeServiceType = 
  | 'client' 
  | 'cdn' 
  | 'gateway' 
  | 'loadbalancer' 
  | 'api' 
  | 'compute' 
  | 'worker'
  | 'queue' 
  | 'database' 
  | 'cache' 
  | 'storage' 
  | 'auth' 
  | 'monitor' 
  | 'generic';

export type TierType = 
  | 'client' 
  | 'edge' 
  | 'compute' 
  | 'async' 
  | 'data' 
  | 'observe' 
  | 'external';

export const TIER_ORDER: TierType[] = [
  'client',
  'edge',
  'compute',
  'async',
  'data',
  'observe',
  'external',
];

export const TIER_TO_LAYER: Record<TierType, LayerType> = {
  client: 'client',
  edge: 'edge',
  compute: 'compute',
  async: 'async',
  data: 'data',
  observe: 'observe',
  external: 'external',
};

export const LAYER_TO_TIER: Record<Exclude<LayerType, 'group'>, TierType> = {
  client: 'client',
  presentation: 'client',
  edge: 'edge',
  gateway: 'edge',
  compute: 'compute',
  application: 'compute',
  async: 'async',
  data: 'data',
  observe: 'observe',
  observability: 'observe',
  external: 'external',
};

export function getTierFromLayer(layer: LayerType): TierType | null {
  if (layer === 'group') return null;
  return LAYER_TO_TIER[layer];
}

export function getLayerFromTier(tier: TierType): LayerType {
  return TIER_TO_LAYER[tier];
}
