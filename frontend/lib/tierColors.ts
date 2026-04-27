export const TIER_COLORS = {
  client: {
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.1)',
    label: 'Client',
    description: 'Browser, Mobile, Web',
  },
  edge: {
    color: '#6366F1',
    bg: 'rgba(99, 102, 241, 0.1)',
    label: 'Edge / Gateway',
    description: 'CDN, Load Balancer, API Gateway',
  },
  compute: {
    color: '#0D9488',
    bg: 'rgba(13, 148, 136, 0.1)',
    label: 'Compute / Service',
    description: 'Microservices, Business Logic',
  },
  async: {
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.1)',
    label: 'Async / Queue',
    description: 'Message Queue, Event Bus',
  },
  data: {
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.1)',
    label: 'Data / Storage',
    description: 'Database, Cache, Object Storage',
  },
  observe: {
    color: '#6B7280',
    bg: 'rgba(107, 114, 128, 0.1)',
    label: 'Observe',
    description: 'Monitoring, Logging, Tracing',
  },
  external: {
    color: '#F43F5E',
    bg: 'rgba(244, 63, 94, 0.1)',
    label: 'External',
    description: 'Third-party APIs, Payment',
  },
} as const;

export const TIER_COLORS_DARK = {
  client: {
    color: '#A78BFA',
    bg: 'rgba(167, 139, 250, 0.15)',
    label: 'Client',
    description: 'Browser, Mobile, Web',
  },
  edge: {
    color: '#818CF8',
    bg: 'rgba(129, 140, 248, 0.15)',
    label: 'Edge / Gateway',
    description: 'CDN, Load Balancer, API Gateway',
  },
  compute: {
    color: '#2DD4BF',
    bg: 'rgba(45, 212, 191, 0.15)',
    label: 'Compute / Service',
    description: 'Microservices, Business Logic',
  },
  async: {
    color: '#FBBF24',
    bg: 'rgba(251, 191, 36, 0.15)',
    label: 'Async / Queue',
    description: 'Message Queue, Event Bus',
  },
  data: {
    color: '#60A5FA',
    bg: 'rgba(96, 165, 250, 0.15)',
    label: 'Data / Storage',
    description: 'Database, Cache, Object Storage',
  },
  observe: {
    color: '#9CA3AF',
    bg: 'rgba(156, 163, 175, 0.15)',
    label: 'Observe',
    description: 'Monitoring, Logging, Tracing',
  },
  external: {
    color: '#FB7185',
    bg: 'rgba(251, 113, 133, 0.15)',
    label: 'External',
    description: 'Third-party APIs, Payment',
  },
} as const;

export type TierType = keyof typeof TIER_COLORS;

export const EDGE_STYLES = {
  sync: {
    color: '#94A3B8',
    dash: '',
    animated: false,
    label: 'REST',
  },
  async: {
    color: '#F59E0B',
    dash: '6,3',
    animated: true,
    label: 'async',
  },
  stream: {
    color: '#10B981',
    dash: '2,2',
    animated: true,
    label: 'stream',
  },
  event: {
    color: '#EC4899',
    dash: '2,3',
    animated: true,
    label: 'event',
  },
  dep: {
    color: '#94A3B8',
    dash: '6,6',
    animated: false,
    label: 'dep',
  },
} as const;

export const EDGE_STYLES_DARK = {
  sync: {
    color: '#94A3B8',
    dash: '',
    animated: false,
    label: 'REST',
  },
  async: {
    color: '#FBBF24',
    dash: '6,3',
    animated: true,
    label: 'async',
  },
  stream: {
    color: '#34D399',
    dash: '2,2',
    animated: true,
    label: 'stream',
  },
  event: {
    color: '#F472B6',
    dash: '2,3',
    animated: true,
    label: 'event',
  },
  dep: {
    color: '#64748B',
    dash: '6,6',
    animated: false,
    label: 'dep',
  },
} as const;

export const ZONE_BACKGROUNDS: Record<TierType, string> = {
  client: '#F5F3FF',
  edge: '#EEF2FF',
  compute: '#F0FDFA',
  async: '#FFFBEB',
  data: '#EFF6FF',
  observe: '#F9FAFB',
  external: '#FFF1F2',
};

export const ZONE_BACKGROUNDS_DARK: Record<TierType, string> = {
  client: '#1E1B4B',
  edge: '#1E1B4B',
  compute: '#134E4A',
  async: '#451A03',
  data: '#1E3A5F',
  observe: '#1F2937',
  external: '#4C0519',
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
