/* ═══════════════════════════════════════════════════════════════
   NEUTRAL SEMANTIC TIER COLORS
   Muted, architectural — color communicates structure
   Blue: services/compute, Amber: storage/data
   80-90% neutral, accents reserved for meaning
   ═══════════════════════════════════════════════════════════════ */

export const TIER_COLORS = {
  client: {
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.06)',
    label: 'Client',
    description: 'Browser, Mobile, Web',
  },
  edge: {
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.06)',
    label: 'Edge / Gateway',
    description: 'CDN, Load Balancer, API Gateway',
  },
  compute: {
    color: '#0d9488',
    bg: 'rgba(13, 148, 136, 0.07)',
    label: 'Compute / Service',
    description: 'Microservices, Business Logic',
  },
  async: {
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.07)',
    label: 'Async / Queue',
    description: 'Message Queue, Event Bus',
  },
  data: {
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.07)',
    label: 'Data / Storage',
    description: 'Database, Cache, Object Storage',
  },
  observe: {
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.06)',
    label: 'Observe',
    description: 'Monitoring, Logging, Tracing',
  },
  external: {
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.06)',
    label: 'External',
    description: 'Third-party APIs, Payment',
  },
} as const;

export const TIER_COLORS_DARK = {
  client: {
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.08)',
    label: 'Client',
    description: 'Browser, Mobile, Web',
  },
  edge: {
    color: '#818cf8',
    bg: 'rgba(129, 140, 248, 0.08)',
    label: 'Edge / Gateway',
    description: 'CDN, Load Balancer, API Gateway',
  },
  compute: {
    color: '#2dd4bf',
    bg: 'rgba(45, 212, 191, 0.1)',
    label: 'Compute / Service',
    description: 'Microservices, Business Logic',
  },
  async: {
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.08)',
    label: 'Async / Queue',
    description: 'Message Queue, Event Bus',
  },
  data: {
    color: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.08)',
    label: 'Data / Storage',
    description: 'Database, Cache, Object Storage',
  },
  observe: {
    color: '#a78bfa',
    bg: 'rgba(167, 139, 250, 0.08)',
    label: 'Observe',
    description: 'Monitoring, Logging, Tracing',
  },
  external: {
    color: '#f472b6',
    bg: 'rgba(244, 114, 182, 0.08)',
    label: 'External',
    description: 'Third-party APIs, Payment',
  },
} as const;

export type TierType = keyof typeof TIER_COLORS;

/* Edge styles — muted neutral, subtle semantic hints */
export const EDGE_STYLES = {
  sync: {
    color: '#7A7A7A',
    dash: '',
    animated: false,
    label: 'sync',
  },
  async: {
    color: '#B89E60',
    dash: '6,3',
    animated: true,
    label: 'async',
  },
  stream: {
    color: '#7BA89A',
    dash: '2,2',
    animated: true,
    label: 'stream',
  },
  event: {
    color: '#A89080',
    dash: '2,3',
    animated: true,
    label: 'event',
  },
  dep: {
    color: '#9A9A9A',
    dash: '6,6',
    animated: false,
    label: 'dep',
  },
} as const;

export const EDGE_STYLES_DARK = {
  sync: {
    color: '#8A8A8A',
    dash: '',
    animated: false,
    label: 'sync',
  },
  async: {
    color: '#C8B070',
    dash: '6,3',
    animated: true,
    label: 'async',
  },
  stream: {
    color: '#8BB8AA',
    dash: '2,2',
    animated: true,
    label: 'stream',
  },
  event: {
    color: '#B8A090',
    dash: '2,3',
    animated: true,
    label: 'event',
  },
  dep: {
    color: '#707070',
    dash: '6,6',
    animated: false,
    label: 'dep',
  },
} as const;

/* Zone backgrounds — barely perceptible, warm neutrals */
export const ZONE_BACKGROUNDS: Record<TierType, string> = {
  client: '#f1f5f9', // slate tint
  edge: '#eef2ff', // indigo tint
  compute: '#f0fdfa', // teal tint
  async: '#fffbeb', // amber tint
  data: '#eff6ff', // blue tint
  observe: '#f5f3ff', // violet tint
  external: '#fdf2f8', // rose tint
};

export const ZONE_BACKGROUNDS_DARK: Record<TierType, string> = {
  client: '#0f172a',
  edge: '#1e1b4b',
  compute: '#042f2e',
  async: '#451a03',
  data: '#172554',
  observe: '#2e1065',
  external: '#500724',
};

export function getTierColor(tier?: string, isDark = false): string {
  if (!tier) return isDark ? TIER_COLORS_DARK.compute.color : TIER_COLORS.compute.color;
  const normalizedTier = tier.toLowerCase();
  const colors = isDark ? TIER_COLORS_DARK : TIER_COLORS;
  return colors[normalizedTier as TierType]?.color ?? colors.compute.color;
}

export function getTierBg(tier?: string, isDark = false): string {
  if (!tier) return isDark ? TIER_COLORS_DARK.compute.bg : TIER_COLORS.compute.bg;
  const normalizedTier = tier.toLowerCase();
  const colors = isDark ? TIER_COLORS_DARK : TIER_COLORS;
  return colors[normalizedTier as TierType]?.bg ?? colors.compute.bg;
}

export function getTierInfo(tier?: string, isDark = false): { color: string; bg: string; label: string; description: string } {
  if (!tier) return isDark ? { ...TIER_COLORS_DARK.compute } : { ...TIER_COLORS.compute };
  const normalizedTier = tier.toLowerCase();
  const colors = isDark ? TIER_COLORS_DARK : TIER_COLORS;
  const info = colors[normalizedTier as TierType];
  return info ? { ...info } : { ...colors.compute };
}

export function getEdgeStyle(type?: string, isDark = false): { color: string; dash: string; animated: boolean; label: string } {
  if (!type) return isDark ? { ...EDGE_STYLES_DARK.sync } : { ...EDGE_STYLES.sync };
  const styles = isDark ? EDGE_STYLES_DARK : EDGE_STYLES;
  const style = styles[type as keyof typeof EDGE_STYLES];
  return style ? { ...style } : { ...styles.sync };
}

export function getZoneBackground(tier?: TierType, isDark = false): string {
  if (!tier) return isDark ? ZONE_BACKGROUNDS_DARK.compute : ZONE_BACKGROUNDS.compute;
  return isDark ? ZONE_BACKGROUNDS_DARK[tier] : ZONE_BACKGROUNDS[tier];
}
