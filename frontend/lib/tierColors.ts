/* ═══════════════════════════════════════════════════════════════
   NEUTRAL SEMANTIC TIER COLORS
   Muted, architectural — color communicates structure
   Blue: services/compute, Amber: storage/data
   80-90% neutral, accents reserved for meaning
   ═══════════════════════════════════════════════════════════════ */

export const TIER_COLORS = {
  client: {
    color: '#5A5A5A',
    bg: 'rgba(90, 90, 90, 0.06)',
    label: 'Client',
    description: 'Browser, Mobile, Web',
  },
  edge: {
    color: '#6B7B8D',
    bg: 'rgba(107, 123, 141, 0.06)',
    label: 'Edge / Gateway',
    description: 'CDN, Load Balancer, API Gateway',
  },
  compute: {
    color: '#6FA8DC',
    bg: 'rgba(111, 168, 220, 0.07)',
    label: 'Compute / Service',
    description: 'Microservices, Business Logic',
  },
  async: {
    color: '#C4A86C',
    bg: 'rgba(196, 168, 108, 0.07)',
    label: 'Async / Queue',
    description: 'Message Queue, Event Bus',
  },
  data: {
    color: '#D8AA59',
    bg: 'rgba(216, 170, 89, 0.07)',
    label: 'Data / Storage',
    description: 'Database, Cache, Object Storage',
  },
  observe: {
    color: '#8A8A8A',
    bg: 'rgba(138, 138, 138, 0.06)',
    label: 'Observe',
    description: 'Monitoring, Logging, Tracing',
  },
  external: {
    color: '#9A8575',
    bg: 'rgba(154, 133, 117, 0.06)',
    label: 'External',
    description: 'Third-party APIs, Payment',
  },
} as const;

export const TIER_COLORS_DARK = {
  client: {
    color: '#9A9A9A',
    bg: 'rgba(154, 154, 154, 0.08)',
    label: 'Client',
    description: 'Browser, Mobile, Web',
  },
  edge: {
    color: '#8B9BAD',
    bg: 'rgba(139, 155, 173, 0.08)',
    label: 'Edge / Gateway',
    description: 'CDN, Load Balancer, API Gateway',
  },
  compute: {
    color: '#7DB8E8',
    bg: 'rgba(125, 184, 232, 0.1)',
    label: 'Compute / Service',
    description: 'Microservices, Business Logic',
  },
  async: {
    color: '#D4B87C',
    bg: 'rgba(212, 184, 124, 0.08)',
    label: 'Async / Queue',
    description: 'Message Queue, Event Bus',
  },
  data: {
    color: '#E0B868',
    bg: 'rgba(224, 184, 104, 0.08)',
    label: 'Data / Storage',
    description: 'Database, Cache, Object Storage',
  },
  observe: {
    color: '#A8A8A8',
    bg: 'rgba(168, 168, 168, 0.08)',
    label: 'Observe',
    description: 'Monitoring, Logging, Tracing',
  },
  external: {
    color: '#B09E8E',
    bg: 'rgba(176, 158, 142, 0.08)',
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
  client: '#F6F6F4',
  edge: '#F5F6F8',
  compute: '#F4F7FA',
  async: '#FAF8F2',
  data: '#FAF6EE',
  observe: '#F7F7F5',
  external: '#F8F5F2',
};

export const ZONE_BACKGROUNDS_DARK: Record<TierType, string> = {
  client: '#181816',
  edge: '#171819',
  compute: '#151920',
  async: '#1A1914',
  data: '#1C1812',
  observe: '#181816',
  external: '#191715',
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
