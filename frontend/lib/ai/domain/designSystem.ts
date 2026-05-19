import type { TierType } from './tiers';

export interface TierTheme {
  name: string;
  colors: {
    primary: string;
    light: string;
    dark: string;
    bg: string;
    border: string;
  };
  icon: string;
  description: string;
}

export interface TierThemes {
  client: TierTheme;
  edge: TierTheme;
  compute: TierTheme;
  async: TierTheme;
  data: TierTheme;
  observe: TierTheme;
  external: TierTheme;
}

const createTierTheme = (
  name: string,
  primary: string,
  icon: string,
  description: string
): TierTheme => ({
  name,
  colors: {
    primary,
    light: `${primary}33`,
    dark: `${primary}99`,
    bg: `${primary}15`,
    border: `${primary}40`,
  },
  icon,
  description,
});

export const TIER_THEMES: TierThemes = {
  client: createTierTheme('Client', '#64748b', 'monitor', 'User-facing applications'),
  edge: createTierTheme('Edge', '#6366f1', 'globe', 'CDN, Load Balancer, API Gateway, WAF'),
  compute: createTierTheme('Compute', '#0d9488', 'server', 'App Servers, Microservices, Functions'),
  async: createTierTheme('Async', '#d97706', 'message-square', 'Message Queue, Event Bus'),
  data: createTierTheme('Data', '#3b82f6', 'database', 'Database, Cache, Storage'),
  observe: createTierTheme('Observe', '#8b5cf6', 'activity', 'Monitoring, Logging, Tracing'),
  external: createTierTheme('External', '#ec4899', 'external-link', 'Third-party services'),
};

export const getTierTheme = (tier: TierType): TierTheme => {
  return TIER_THEMES[tier];
};

export const getTierColor = (tier: TierType): string => {
  return TIER_THEMES[tier].colors.primary;
};

export const getTierColorLight = (tier: TierType): string => {
  return TIER_THEMES[tier].colors.light;
};

export const getTierIcon = (tier: TierType): string => {
  return TIER_THEMES[tier].icon;
};

export const CLIENT_TIER = 'client';
export const EDGE_TIER = 'edge';
export const COMPUTE_TIER = 'compute';
export const ASYNC_TIER = 'async';
export const DATA_TIER = 'data';
export const OBSERVE_TIER = 'observe';
export const EXTERNAL_TIER = 'external';
