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

export type TierType = keyof typeof TIER_COLORS;

export const EDGE_STYLES = {
  sync: {
    color: '#6366F1',
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

export const ZONE_BACKGROUNDS: Record<TierType, string> = {
  client: '#F5F3FF',
  edge: '#EEF2FF',
  compute: '#F0FDFA',
  async: '#FFFBEB',
  data: '#EFF6FF',
  observe: '#F9FAFB',
  external: '#FFF1F2',
};

export function getTierColor(tier?: string): string {
  if (!tier) return TIER_COLORS.compute.color;
  const normalizedTier = tier.toLowerCase();
  return TIER_COLORS[normalizedTier as TierType]?.color ?? TIER_COLORS.compute.color;
}

export function getTierInfo(tier?: string): typeof TIER_COLORS[TierType] {
  if (!tier) return TIER_COLORS.compute;
  const normalizedTier = tier.toLowerCase();
  return TIER_COLORS[normalizedTier as TierType] ?? TIER_COLORS.compute;
}

export function getEdgeStyle(type?: string): { color: string; dash: string; animated: boolean; label: string } {
  if (!type) return EDGE_STYLES.sync;
  return EDGE_STYLES[type as keyof typeof EDGE_STYLES] ?? EDGE_STYLES.sync;
}
