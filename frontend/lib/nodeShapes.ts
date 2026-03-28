export type NodeShape = 
  | 'rounded-square'
  | 'pill'
  | 'cylinder'
  | 'stack'
  | 'queue'
  | 'dashed-rect'
  | 'shield'
  | 'minimal'
  | 'gradient-glow'
  | 'worker';

export type NodeSize = 'small' | 'normal' | 'medium' | 'large';

export interface ShapeConfig {
  shape: NodeShape;
  size: NodeSize;
  visualWeight: 'low' | 'normal' | 'high';
  minWidth: number;
  minHeight: number;
  maxHeight: number;
}

export const SHAPE_CONFIGS: Record<string, ShapeConfig> = {
  // Client & Entry - Pill shape, medium size, normal weight
  'Client & Entry': { shape: 'pill', size: 'medium', visualWeight: 'normal', minWidth: 200, minHeight: 48, maxHeight: 48 },
  'CDN & Edge': { shape: 'pill', size: 'medium', visualWeight: 'normal', minWidth: 180, minHeight: 44, maxHeight: 44 },
  'DNS & Network': { shape: 'pill', size: 'normal', visualWeight: 'normal', minWidth: 160, minHeight: 44, maxHeight: 44 },
  'API Gateway': { shape: 'pill', size: 'medium', visualWeight: 'normal', minWidth: 180, minHeight: 48, maxHeight: 48 },
  'Load Balancer': { shape: 'pill', size: 'medium', visualWeight: 'normal', minWidth: 180, minHeight: 48, maxHeight: 48 },

  // Compute - Segmented rectangle, normal size, normal weight
  'Compute': { shape: 'rounded-square', size: 'normal', visualWeight: 'normal', minWidth: 160, minHeight: 110, maxHeight: 140 },
  'Serverless': { shape: 'rounded-square', size: 'normal', visualWeight: 'normal', minWidth: 160, minHeight: 110, maxHeight: 140 },
  
  // Data Storage - Cylinder, large size, high weight
  'Data Storage': { shape: 'cylinder', size: 'large', visualWeight: 'high', minWidth: 180, minHeight: 150, maxHeight: 180 },
  'Database': { shape: 'cylinder', size: 'large', visualWeight: 'high', minWidth: 180, minHeight: 150, maxHeight: 180 },

  // Caching - Stacked layers, normal size, normal weight
  'Caching': { shape: 'stack', size: 'normal', visualWeight: 'normal', minWidth: 170, minHeight: 120, maxHeight: 150 },
  'Cache & Storage': { shape: 'stack', size: 'normal', visualWeight: 'normal', minWidth: 170, minHeight: 120, maxHeight: 150 },

  // Messaging - Multi-box queue, medium size, normal weight
  'Messaging & Events': { shape: 'queue', size: 'medium', visualWeight: 'normal', minWidth: 200, minHeight: 130, maxHeight: 160 },

  // External Services - Dashed border, normal size, low weight
  'External Services': { shape: 'dashed-rect', size: 'normal', visualWeight: 'low', minWidth: 160, minHeight: 100, maxHeight: 130 },

  // Auth & Security - Shield, normal size, high weight
  'Auth & Security': { shape: 'shield', size: 'normal', visualWeight: 'high', minWidth: 160, minHeight: 110, maxHeight: 140 },
  'Authentication': { shape: 'shield', size: 'normal', visualWeight: 'high', minWidth: 160, minHeight: 110, maxHeight: 140 },

  // Observability - Minimal, small size, low weight
  'Observability': { shape: 'minimal', size: 'small', visualWeight: 'low', minWidth: 140, minHeight: 80, maxHeight: 100 },

  // AI / ML - Gradient glow, normal size, high weight
  'AI / ML': { shape: 'gradient-glow', size: 'normal', visualWeight: 'high', minWidth: 170, minHeight: 120, maxHeight: 150 },
  'AI & ML': { shape: 'gradient-glow', size: 'normal', visualWeight: 'high', minWidth: 170, minHeight: 120, maxHeight: 150 },

  // Worker - Worker shape, normal size, normal weight
  'Worker': { shape: 'worker', size: 'normal', visualWeight: 'normal', minWidth: 160, minHeight: 110, maxHeight: 140 },
};

export const DEFAULT_SHAPE_CONFIG: ShapeConfig = {
  shape: 'rounded-square',
  size: 'normal',
  visualWeight: 'normal',
  minWidth: 160,
  minHeight: 110,
  maxHeight: 140,
};

export const NODE_SHAPES: Record<string, NodeShape> = Object.fromEntries(
  Object.entries(SHAPE_CONFIGS).map(([category, config]) => [category, config.shape])
);

export function getNodeShape(category: string): NodeShape {
  return SHAPE_CONFIGS[category]?.shape || DEFAULT_SHAPE_CONFIG.shape;
}

export function getShapeConfig(category: string): ShapeConfig {
  return SHAPE_CONFIGS[category] || DEFAULT_SHAPE_CONFIG;
}

export function getNodeSize(category: string): NodeSize {
  return SHAPE_CONFIGS[category]?.size || 'normal';
}

export function getVisualWeight(category: string): 'low' | 'normal' | 'high' {
  return SHAPE_CONFIGS[category]?.visualWeight || 'normal';
}
