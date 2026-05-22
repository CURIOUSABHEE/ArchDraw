import { TIER_COLORS, type TierType } from './theme/stylingConstants';
import logger from './logger';

/* ═══════════════════════════════════════════════════════════════
   NEUTRAL SEMANTIC TIER COLORS
   Muted, architectural — color communicates structure
   Blue: services/compute, Amber: storage/data
   80-90% neutral, accents reserved for interaction/status
   ═══════════════════════════════════════════════════════════════ */

export const TIER_THEME: Record<string, { main: string; light: string; dark: string }> = {
  client:   { main: '#64748b', light: '#f1f5f9', dark: '#1e293b' }, // slate
  edge:     { main: '#6366f1', light: '#eef2ff', dark: '#312e81' }, // indigo
  compute:  { main: '#0d9488', light: '#f0fdfa', dark: '#134e4a' }, // teal
  async:    { main: '#d97706', light: '#fffbeb', dark: '#78350f' }, // amber
  data:     { main: '#3b82f6', light: '#eff6ff', dark: '#1e3a8a' }, // blue
  observe:  { main: '#8b5cf6', light: '#f5f3ff', dark: '#4c1d95' }, // violet
  external: { main: '#ec4899', light: '#fdf2f8', dark: '#831843' }, // rose
  // Category fallbacks
  infrastructure: { main: '#6366f1', light: '#eef2ff', dark: '#312e81' }, // edge
  security:       { main: '#6366f1', light: '#eef2ff', dark: '#312e81' }, // edge
  services:       { main: '#0d9488', light: '#f0fdfa', dark: '#134e4a' }, // compute
  database:       { main: '#3b82f6', light: '#eff6ff', dark: '#1e3a8a' }, // data
  cache:          { main: '#3b82f6', light: '#eff6ff', dark: '#1e3a8a' }, // data
};

// Background colors for large architectural zones/groups
export const ZONE_BACKGROUNDS = {
  client:   'rgba(100, 116, 139, 0.06)', 
  edge:     'rgba(99, 102, 241, 0.06)',
  compute:  'rgba(13, 148, 136, 0.07)',
  async:    'rgba(217, 119, 6, 0.07)',
  data:     'rgba(59, 130, 246, 0.07)',
  observe:  'rgba(139, 92, 246, 0.06)',
  external: 'rgba(236, 72, 153, 0.06)',
};

export const ZONE_BACKGROUNDS_DARK = {
  client:   'rgba(100, 116, 139, 0.15)',
  edge:     'rgba(99, 102, 241, 0.15)',
  compute:  'rgba(13, 148, 136, 0.15)',
  async:    'rgba(217, 119, 6, 0.15)',
  data:     'rgba(59, 130, 246, 0.15)',
  observe:  'rgba(139, 92, 246, 0.15)',
  external: 'rgba(236, 72, 153, 0.15)',
};

/**
 * Returns the canonical color for an architectural tier.
 */
export function getTierColor(tier?: string, isDark = false): string {
  if (!tier) return TIER_COLORS.services.color;
  
  const t = tier.toLowerCase();
  
  // Mapping architectural layers to tier colors
  if (t === 'client') return TIER_COLORS.infrastructure.color;
  if (t === 'edge') return TIER_COLORS.infrastructure.color;
  if (t === 'compute') return TIER_COLORS.services.color;
  if (t === 'async') return TIER_COLORS.async.color;
  if (t === 'data') return TIER_COLORS.database.color;
  if (t === 'observe') return TIER_COLORS.services.color;
  if (t === 'external') return TIER_COLORS.infrastructure.color;

  // Exact matching for categories
  const key = t as TierType;
  const config = TIER_COLORS[key];
  if (config) {
    return config.color;
  }
  
  logger.warn(`[tierColors] Unknown tier requested: ${tier}`);
  return TIER_COLORS.services.color;
}

/**
 * Returns a semi-transparent background color for an architectural zone/group.
 */
export function getZoneBackground(tier?: string, isDark = false): string {
  if (!tier) return isDark ? ZONE_BACKGROUNDS_DARK.compute : ZONE_BACKGROUNDS.compute;
  const t = tier.toLowerCase();
  
  if (t === 'client') return isDark ? ZONE_BACKGROUNDS_DARK.client : ZONE_BACKGROUNDS.client;
  if (t === 'edge') return isDark ? ZONE_BACKGROUNDS_DARK.edge : ZONE_BACKGROUNDS.edge;
  if (t === 'compute') return isDark ? ZONE_BACKGROUNDS_DARK.compute : ZONE_BACKGROUNDS.compute;
  if (t === 'async') return isDark ? ZONE_BACKGROUNDS_DARK.async : ZONE_BACKGROUNDS.async;
  if (t === 'data') return isDark ? ZONE_BACKGROUNDS_DARK.data : ZONE_BACKGROUNDS.data;
  if (t === 'observe') return isDark ? ZONE_BACKGROUNDS_DARK.observe : ZONE_BACKGROUNDS.observe;
  if (t === 'external') return isDark ? ZONE_BACKGROUNDS_DARK.external : ZONE_BACKGROUNDS.external;

  // Fallbacks for node categories
  if (t === 'infrastructure') return isDark ? ZONE_BACKGROUNDS_DARK.edge : ZONE_BACKGROUNDS.edge;
  if (t === 'security') return isDark ? ZONE_BACKGROUNDS_DARK.edge : ZONE_BACKGROUNDS.edge;
  if (t === 'services') return isDark ? ZONE_BACKGROUNDS_DARK.compute : ZONE_BACKGROUNDS.compute;
  if (t === 'database') return isDark ? ZONE_BACKGROUNDS_DARK.data : ZONE_BACKGROUNDS.data;
  if (t === 'cache') return isDark ? ZONE_BACKGROUNDS_DARK.data : ZONE_BACKGROUNDS.data;

  return isDark ? ZONE_BACKGROUNDS_DARK.compute : ZONE_BACKGROUNDS.compute;
}
