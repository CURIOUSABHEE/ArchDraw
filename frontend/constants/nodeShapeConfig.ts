import type { ServiceType } from '@/lib/ai/types';

export interface NodeShapeConfig {
  width: number;
  height: number;
  variant: string;
  fillOpacity: number;
  strokeOpacity: number;
}

const DEFAULT_CONFIG: NodeShapeConfig = {
  width: 160,
  height: 80,
  variant: 'ROUNDED_SQUARE',
  fillOpacity: 0.1,
  strokeOpacity: 0.4,
};

export const NODE_SHAPE_CONFIG: Record<string, NodeShapeConfig> = {
  // Service types
  service: { width: 160, height: 80, variant: 'ROUNDED_SQUARE', fillOpacity: 0.1, strokeOpacity: 0.4 },
  api: { width: 160, height: 80, variant: 'ROUNDED_SQUARE', fillOpacity: 0.1, strokeOpacity: 0.4 },
  worker: { width: 160, height: 80, variant: 'ROUNDED_SQUARE', fillOpacity: 0.1, strokeOpacity: 0.4 },
  auth: { width: 160, height: 100, variant: 'ROUNDED_SQUARE', fillOpacity: 0.1, strokeOpacity: 0.4 },
  gateway: { width: 160, height: 80, variant: 'ROUNDED_SQUARE', fillOpacity: 0.1, strokeOpacity: 0.4 },
  proxy: { width: 160, height: 80, variant: 'ROUNDED_SQUARE', fillOpacity: 0.1, strokeOpacity: 0.4 },
  function: { width: 160, height: 80, variant: 'ROUNDED_SQUARE', fillOpacity: 0.1, strokeOpacity: 0.4 },
  scheduler: { width: 160, height: 80, variant: 'ROUNDED_SQUARE', fillOpacity: 0.1, strokeOpacity: 0.4 },
  compute: { width: 160, height: 80, variant: 'ROUNDED_SQUARE', fillOpacity: 0.1, strokeOpacity: 0.4 },
  generic: { width: 160, height: 80, variant: 'ROUNDED_SQUARE', fillOpacity: 0.1, strokeOpacity: 0.4 },

  // Database types (cylinders are taller)
  database: { width: 160, height: 120, variant: 'CYLINDER', fillOpacity: 0.1, strokeOpacity: 0.4 },
  postgres: { width: 160, height: 120, variant: 'CYLINDER', fillOpacity: 0.1, strokeOpacity: 0.4 },
  mysql: { width: 160, height: 120, variant: 'CYLINDER', fillOpacity: 0.1, strokeOpacity: 0.4 },
  mongodb: { width: 160, height: 120, variant: 'CYLINDER', fillOpacity: 0.1, strokeOpacity: 0.4 },
  redis: { width: 160, height: 120, variant: 'CYLINDER', fillOpacity: 0.1, strokeOpacity: 0.4 },
  cassandra: { width: 160, height: 120, variant: 'CYLINDER', fillOpacity: 0.1, strokeOpacity: 0.4 },
  dynamodb: { width: 160, height: 120, variant: 'CYLINDER', fillOpacity: 0.1, strokeOpacity: 0.4 },
  elasticsearch: { width: 160, height: 120, variant: 'CYLINDER', fillOpacity: 0.1, strokeOpacity: 0.4 },
  neo4j: { width: 160, height: 120, variant: 'CYLINDER', fillOpacity: 0.1, strokeOpacity: 0.4 },
  sqlite: { width: 160, height: 120, variant: 'CYLINDER', fillOpacity: 0.1, strokeOpacity: 0.4 },
  firestore: { width: 160, height: 120, variant: 'CYLINDER', fillOpacity: 0.1, strokeOpacity: 0.4 },
  supabase: { width: 160, height: 120, variant: 'CYLINDER', fillOpacity: 0.1, strokeOpacity: 0.4 },

  // Cache types (diamonds)
  cache: { width: 100, height: 100, variant: 'DIAMOND', fillOpacity: 0.1, strokeOpacity: 0.4 },
  memcached: { width: 100, height: 100, variant: 'DIAMOND', fillOpacity: 0.1, strokeOpacity: 0.4 },
  elasticache: { width: 100, height: 100, variant: 'DIAMOND', fillOpacity: 0.1, strokeOpacity: 0.4 },

  // Queue types (pill-shaped)
  queue: { width: 200, height: 70, variant: 'PILL_HORIZONTAL', fillOpacity: 0.1, strokeOpacity: 0.4 },
  kafka: { width: 200, height: 70, variant: 'PILL_HORIZONTAL', fillOpacity: 0.1, strokeOpacity: 0.4 },
  rabbitmq: { width: 200, height: 70, variant: 'PILL_HORIZONTAL', fillOpacity: 0.1, strokeOpacity: 0.4 },
  sqs: { width: 200, height: 70, variant: 'PILL_HORIZONTAL', fillOpacity: 0.1, strokeOpacity: 0.4 },
  sns: { width: 200, height: 70, variant: 'PILL_HORIZONTAL', fillOpacity: 0.1, strokeOpacity: 0.4 },
  pubsub: { width: 200, height: 70, variant: 'PILL_HORIZONTAL', fillOpacity: 0.1, strokeOpacity: 0.4 },
  eventbus: { width: 200, height: 70, variant: 'PILL_HORIZONTAL', fillOpacity: 0.1, strokeOpacity: 0.4 },
  nats: { width: 200, height: 70, variant: 'PILL_HORIZONTAL', fillOpacity: 0.1, strokeOpacity: 0.4 },
  kinesis: { width: 200, height: 70, variant: 'PILL_HORIZONTAL', fillOpacity: 0.1, strokeOpacity: 0.4 },

  // CDN types (diamonds)
  cdn: { width: 100, height: 100, variant: 'DIAMOND', fillOpacity: 0.1, strokeOpacity: 0.4 },
  varnish: { width: 100, height: 100, variant: 'DIAMOND', fillOpacity: 0.1, strokeOpacity: 0.4 },

  // External/Cloud types
  external: { width: 180, height: 100, variant: 'CLOUD', fillOpacity: 0.08, strokeOpacity: 0.4 },
  thirdparty: { width: 180, height: 100, variant: 'CLOUD', fillOpacity: 0.08, strokeOpacity: 0.4 },
  saas: { width: 180, height: 100, variant: 'CLOUD', fillOpacity: 0.08, strokeOpacity: 0.4 },
  stripe: { width: 180, height: 100, variant: 'CLOUD', fillOpacity: 0.08, strokeOpacity: 0.4 },
  twilio: { width: 180, height: 100, variant: 'CLOUD', fillOpacity: 0.08, strokeOpacity: 0.4 },
  sendgrid: { width: 180, height: 100, variant: 'CLOUD', fillOpacity: 0.08, strokeOpacity: 0.4 },
  aws: { width: 180, height: 100, variant: 'CLOUD', fillOpacity: 0.08, strokeOpacity: 0.4 },
  gcp: { width: 180, height: 100, variant: 'CLOUD', fillOpacity: 0.08, strokeOpacity: 0.4 },
  azure: { width: 180, height: 100, variant: 'CLOUD', fillOpacity: 0.08, strokeOpacity: 0.4 },
  firebase: { width: 180, height: 100, variant: 'CLOUD', fillOpacity: 0.08, strokeOpacity: 0.4 },
  vercel: { width: 180, height: 100, variant: 'CLOUD', fillOpacity: 0.08, strokeOpacity: 0.4 },
  netlify: { width: 180, height: 100, variant: 'CLOUD', fillOpacity: 0.08, strokeOpacity: 0.4 },
  cloudflare: { width: 180, height: 100, variant: 'CLOUD', fillOpacity: 0.08, strokeOpacity: 0.4 },

  // Load balancer types (hexagon)
  loadbalancer: { width: 160, height: 90, variant: 'HEXAGON', fillOpacity: 0.1, strokeOpacity: 0.4 },
  ingress: { width: 160, height: 90, variant: 'HEXAGON', fillOpacity: 0.1, strokeOpacity: 0.4 },
  traefik: { width: 160, height: 90, variant: 'HEXAGON', fillOpacity: 0.1, strokeOpacity: 0.4 },
  nginx: { width: 160, height: 90, variant: 'HEXAGON', fillOpacity: 0.1, strokeOpacity: 0.4 },
  haproxy: { width: 160, height: 90, variant: 'HEXAGON', fillOpacity: 0.1, strokeOpacity: 0.4 },
  istio: { width: 160, height: 90, variant: 'HEXAGON', fillOpacity: 0.1, strokeOpacity: 0.4 },
  envoy: { width: 160, height: 90, variant: 'HEXAGON', fillOpacity: 0.1, strokeOpacity: 0.4 },

  // Firewall/Security types (shield)
  firewall: { width: 160, height: 100, variant: 'SHIELD', fillOpacity: 0.1, strokeOpacity: 0.4 },
  waf: { width: 160, height: 100, variant: 'SHIELD', fillOpacity: 0.1, strokeOpacity: 0.4 },
  vault: { width: 160, height: 100, variant: 'SHIELD', fillOpacity: 0.1, strokeOpacity: 0.4 },
  keycloak: { width: 160, height: 100, variant: 'SHIELD', fillOpacity: 0.1, strokeOpacity: 0.4 },
  oauth: { width: 160, height: 100, variant: 'SHIELD', fillOpacity: 0.1, strokeOpacity: 0.4 },
  jwt: { width: 160, height: 100, variant: 'SHIELD', fillOpacity: 0.1, strokeOpacity: 0.4 },
  ssl: { width: 160, height: 100, variant: 'SHIELD', fillOpacity: 0.1, strokeOpacity: 0.4 },
  tls: { width: 160, height: 100, variant: 'SHIELD', fillOpacity: 0.1, strokeOpacity: 0.4 },
  certmanager: { width: 160, height: 100, variant: 'SHIELD', fillOpacity: 0.1, strokeOpacity: 0.4 },

  // Client types (monitor screen)
  client: { width: 160, height: 110, variant: 'MONITOR_SCREEN', fillOpacity: 0.1, strokeOpacity: 0.4 },
  browser: { width: 160, height: 110, variant: 'MONITOR_SCREEN', fillOpacity: 0.1, strokeOpacity: 0.4 },
  webapp: { width: 160, height: 110, variant: 'MONITOR_SCREEN', fillOpacity: 0.1, strokeOpacity: 0.4 },
  frontend: { width: 160, height: 110, variant: 'MONITOR_SCREEN', fillOpacity: 0.1, strokeOpacity: 0.4 },
  spa: { width: 160, height: 110, variant: 'MONITOR_SCREEN', fillOpacity: 0.1, strokeOpacity: 0.4 },
  pwa: { width: 160, height: 110, variant: 'MONITOR_SCREEN', fillOpacity: 0.1, strokeOpacity: 0.4 },
  desktop: { width: 160, height: 110, variant: 'MONITOR_SCREEN', fillOpacity: 0.1, strokeOpacity: 0.4 },

  // Mobile types
  mobile: { width: 80, height: 120, variant: 'MOBILE_PHONE', fillOpacity: 0.1, strokeOpacity: 0.4 },
  ios: { width: 80, height: 120, variant: 'MOBILE_PHONE', fillOpacity: 0.1, strokeOpacity: 0.4 },
  android: { width: 80, height: 120, variant: 'MOBILE_PHONE', fillOpacity: 0.1, strokeOpacity: 0.4 },
  reactnative: { width: 80, height: 120, variant: 'MOBILE_PHONE', fillOpacity: 0.1, strokeOpacity: 0.4 },
  flutter: { width: 80, height: 120, variant: 'MOBILE_PHONE', fillOpacity: 0.1, strokeOpacity: 0.4 },

  // User types
  user: { width: 100, height: 100, variant: 'USER_CIRCLE', fillOpacity: 0.1, strokeOpacity: 0.4 },
  actor: { width: 100, height: 100, variant: 'USER_CIRCLE', fillOpacity: 0.1, strokeOpacity: 0.4 },
  person: { width: 100, height: 100, variant: 'USER_CIRCLE', fillOpacity: 0.1, strokeOpacity: 0.4 },
  customer: { width: 100, height: 100, variant: 'USER_CIRCLE', fillOpacity: 0.1, strokeOpacity: 0.4 },
  admin: { width: 100, height: 100, variant: 'USER_CIRCLE', fillOpacity: 0.1, strokeOpacity: 0.4 },
  operator: { width: 100, height: 100, variant: 'USER_CIRCLE', fillOpacity: 0.1, strokeOpacity: 0.4 },
  developer: { width: 100, height: 100, variant: 'USER_CIRCLE', fillOpacity: 0.1, strokeOpacity: 0.4 },

  // Background job types (gear)
  backgroundjob: { width: 100, height: 100, variant: 'GEAR', fillOpacity: 0.1, strokeOpacity: 0.4 },
  cronjob: { width: 100, height: 100, variant: 'GEAR', fillOpacity: 0.1, strokeOpacity: 0.4 },
  processor: { width: 100, height: 100, variant: 'GEAR', fillOpacity: 0.1, strokeOpacity: 0.4 },
  consumer: { width: 100, height: 100, variant: 'GEAR', fillOpacity: 0.1, strokeOpacity: 0.4 },
  daemon: { width: 100, height: 100, variant: 'GEAR', fillOpacity: 0.1, strokeOpacity: 0.4 },

  // Monitoring types (chart)
  monitoring: { width: 160, height: 100, variant: 'CHART', fillOpacity: 0.1, strokeOpacity: 0.4 },
  observability: { width: 160, height: 100, variant: 'CHART', fillOpacity: 0.1, strokeOpacity: 0.4 },
  logging: { width: 160, height: 100, variant: 'CHART', fillOpacity: 0.1, strokeOpacity: 0.4 },
  metrics: { width: 160, height: 100, variant: 'CHART', fillOpacity: 0.1, strokeOpacity: 0.4 },
  prometheus: { width: 160, height: 100, variant: 'CHART', fillOpacity: 0.1, strokeOpacity: 0.4 },
  grafana: { width: 160, height: 100, variant: 'CHART', fillOpacity: 0.1, strokeOpacity: 0.4 },
  datadog: { width: 160, height: 100, variant: 'CHART', fillOpacity: 0.1, strokeOpacity: 0.4 },
  sentry: { width: 160, height: 100, variant: 'CHART', fillOpacity: 0.1, strokeOpacity: 0.4 },
  opentelemetry: { width: 160, height: 100, variant: 'CHART', fillOpacity: 0.1, strokeOpacity: 0.4 },
  jaeger: { width: 160, height: 100, variant: 'CHART', fillOpacity: 0.1, strokeOpacity: 0.4 },
  zipkin: { width: 160, height: 100, variant: 'CHART', fillOpacity: 0.1, strokeOpacity: 0.4 },

  // Storage types (cylinder)
  storage: { width: 160, height: 120, variant: 'CYLINDER', fillOpacity: 0.1, strokeOpacity: 0.4 },

  // Monitor types
  monitor: { width: 160, height: 110, variant: 'MONITOR_SCREEN', fillOpacity: 0.1, strokeOpacity: 0.4 },
};

export function getNodeShapeConfig(serviceType?: string): NodeShapeConfig {
  if (!serviceType) return DEFAULT_CONFIG;
  return NODE_SHAPE_CONFIG[serviceType.toLowerCase()] || DEFAULT_CONFIG;
}

export function getNodeWidth(serviceType?: string): number {
  return getNodeShapeConfig(serviceType).width;
}

export function getNodeHeight(serviceType?: string): number {
  return getNodeShapeConfig(serviceType).height;
}
