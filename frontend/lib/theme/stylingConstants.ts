/**
 * Shared styling constants for both React components (Canvas) 
 * and pure SVG generation (Export).
 * 
 * Changing a value here should update both environments simultaneously,
 * ensuring pixel-perfect identity.
 */

// Rule 2: Minimum node width: 180px.
export const NODE_WIDTH = 180;
export const NODE_HEIGHT = 110;
export const BORDER_RADIUS = 12;

export interface NodeStyleConfig {
  background: string;
  border: string;
  borderHover: string;
  shadow: string;
  shadowSelected: string;
  titleColor: string;
  subtitleColor: string;
  backplates: { offset: number; color: string }[];
}

export const LIGHT_NODE_STYLES: NodeStyleConfig = {
  background: '#ffffff',
  border: '#595959',
  borderHover: '#595959',
  shadow: '5px 5px 0 #e1e1da, 10px 10px 0 #efefe8, 0 1px 2px rgba(0,0,0,0.04)',
  shadowSelected: '0 0 0 2px rgba(95,164,219,0.35), 5px 5px 0 #dfdfd8, 10px 10px 0 #ecece5, 0 2px 5px rgba(0,0,0,0.06)',
  titleColor: '#595959',
  subtitleColor: '#7a7a7a',
  backplates: [
    { offset: 10, color: '#efefe8' },
    { offset: 5, color: '#e1e1da' },
  ],
};

export const DARK_NODE_STYLES: NodeStyleConfig = {
  background: '#ffffff',
  border: '#d1d5db',
  borderHover: '#9ca3af',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowSelected: '0 0 0 2px rgba(129,140,248,0.5), 0 2px 6px rgba(0,0,0,0.1)',
  titleColor: '#1f2937',
  subtitleColor: '#6b7280',
  backplates: [
    { offset: 10, color: '#e5e7eb' },
    { offset: 5, color: '#f3f4f6' },
  ],
};

export const STATUS_COLORS = {
  healthy: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  unknown: '#6B7280',
};

/**
 * Rule 6: Color-code nodes by category
 * Infrastructure → Gray (#6B7280)
 * Auth/Security  → Purple (#7C3AED)
 * Services       → Blue (#2563EB)
 * Async/Queue    → Orange (#D97706)
 * Databases      → Green (#059669)
 * Cache          → Teal (#0891B2)
 */
export const TIER_COLORS = {
  infrastructure: { color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)', label: 'Infrastructure' },
  security: { color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.1)', label: 'Security' },
  services: { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.1)', label: 'Services' },
  async: { color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)', label: 'Async' },
  database: { color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', label: 'Database' },
  cache: { color: '#0891B2', bg: 'rgba(8, 145, 178, 0.1)', label: 'Cache' },
} as const;

export type TierType = keyof typeof TIER_COLORS;

export const EDGE_STYLES = {
  sync: { color: '#6B7280', dash: '', animated: false },
  async: { color: '#D97706', dash: '8,6', animated: true },
} as const;

export function getTierColorNormalized(category?: string): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('auth') || cat.includes('security')) return TIER_COLORS.security.color;
  if (cat.includes('data') || cat.includes('db')) return TIER_COLORS.database.color;
  if (cat.includes('cache')) return TIER_COLORS.cache.color;
  if (cat.includes('message') || cat.includes('queue') || cat.includes('event')) return TIER_COLORS.async.color;
  if (cat.includes('compute') || cat.includes('server') || cat.includes('worker')) return TIER_COLORS.services.color;
  return TIER_COLORS.infrastructure.color;
}

export const FONTS = {
  body: '"Inter", "Roboto", system-ui, -apple-system, sans-serif',
  display: '"Inter", "Roboto", system-ui, sans-serif',
};
