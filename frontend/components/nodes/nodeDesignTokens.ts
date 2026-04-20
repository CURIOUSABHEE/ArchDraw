export const NODE_DIMENSIONS = {
  width: 110,
  height: 130,
  iconAreaSize: 64,
  iconSize: 32,
  headerHeight: 20,
  labelAreaHeight: 44,
  borderRadius: 12,
  padding: 8,
} as const;

export const NODE_BORDER = {
  defaultOpacity: 0.3,
  hoverOpacity: 0.6,
  selectedOpacity: 1.0,
  selectedWidth: 2,
  defaultWidth: 1,
  externalDashArray: '5 3',
} as const;

export const STATUS_COLORS = {
  healthy: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  unknown: '#94a3b8',
} as const;

export const FRAME_COLORS: Record<string, string> = {
  default: '#94a3b8',
  red: '#ef4444',
  blue: '#3b82f6',
  amber: '#f59e0b',
  green: '#22c55e',
  purple: '#8b5cf6',
};

export type NodeShapeVariant = 
  | 'ROUNDED_SQUARE'
  | 'CYLINDER'
  | 'PILL_HORIZONTAL'
  | 'DIAMOND'
  | 'CLOUD'
  | 'HEXAGON'
  | 'SHIELD'
  | 'MONITOR_SCREEN'
  | 'MOBILE_PHONE'
  | 'USER_CIRCLE'
  | 'GEAR'
  | 'CHART';

export const NODE_SHAPE_MAP: Record<string, NodeShapeVariant> = {
  service: 'ROUNDED_SQUARE',
  api: 'ROUNDED_SQUARE',
  worker: 'ROUNDED_SQUARE',
  auth: 'ROUNDED_SQUARE',
  gateway: 'ROUNDED_SQUARE',
  proxy: 'ROUNDED_SQUARE',
  function: 'ROUNDED_SQUARE',
  scheduler: 'ROUNDED_SQUARE',
  
  database: 'CYLINDER',
  postgres: 'CYLINDER',
  mysql: 'CYLINDER',
  mongodb: 'CYLINDER',
  redis: 'CYLINDER',
  cassandra: 'CYLINDER',
  dynamodb: 'CYLINDER',
  elasticsearch: 'CYLINDER',
  neo4j: 'CYLINDER',
  sqlite: 'CYLINDER',
  firestore: 'CYLINDER',
  supabase: 'CYLINDER',
  
  queue: 'PILL_HORIZONTAL',
  kafka: 'PILL_HORIZONTAL',
  rabbitmq: 'PILL_HORIZONTAL',
  sqs: 'PILL_HORIZONTAL',
  sns: 'PILL_HORIZONTAL',
  pubsub: 'PILL_HORIZONTAL',
  eventbus: 'PILL_HORIZONTAL',
  nats: 'PILL_HORIZONTAL',
  kinesis: 'PILL_HORIZONTAL',
  
  cache: 'DIAMOND',
  memcached: 'DIAMOND',
  elasticache: 'DIAMOND',
  cdn: 'DIAMOND',
  varnish: 'DIAMOND',
  
  external: 'CLOUD',
  thirdparty: 'CLOUD',
  saas: 'CLOUD',
  stripe: 'CLOUD',
  twilio: 'CLOUD',
  sendgrid: 'CLOUD',
  aws: 'CLOUD',
  gcp: 'CLOUD',
  azure: 'CLOUD',
  firebase: 'CLOUD',
  vercel: 'CLOUD',
  netlify: 'CLOUD',
  cloudflare: 'CLOUD',
  
  loadbalancer: 'HEXAGON',
  ingress: 'HEXAGON',
  traefik: 'HEXAGON',
  nginx: 'HEXAGON',
  haproxy: 'HEXAGON',
  istio: 'HEXAGON',
  envoy: 'HEXAGON',
  
  firewall: 'SHIELD',
  waf: 'SHIELD',
  vault: 'SHIELD',
  keycloak: 'SHIELD',
  oauth: 'SHIELD',
  jwt: 'SHIELD',
  ssl: 'SHIELD',
  tls: 'SHIELD',
  certmanager: 'SHIELD',
  
  client: 'MONITOR_SCREEN',
  browser: 'MONITOR_SCREEN',
  webapp: 'MONITOR_SCREEN',
  frontend: 'MONITOR_SCREEN',
  spa: 'MONITOR_SCREEN',
  pwa: 'MONITOR_SCREEN',
  desktop: 'MONITOR_SCREEN',
  
  mobile: 'MOBILE_PHONE',
  ios: 'MOBILE_PHONE',
  android: 'MOBILE_PHONE',
  reactnative: 'MOBILE_PHONE',
  flutter: 'MOBILE_PHONE',
  
  user: 'USER_CIRCLE',
  actor: 'USER_CIRCLE',
  person: 'USER_CIRCLE',
  customer: 'USER_CIRCLE',
  admin: 'USER_CIRCLE',
  operator: 'USER_CIRCLE',
  developer: 'USER_CIRCLE',
  
  backgroundjob: 'GEAR',
  cronjob: 'GEAR',
  processor: 'GEAR',
  consumer: 'GEAR',
  daemon: 'GEAR',
  
  monitoring: 'CHART',
  observability: 'CHART',
  logging: 'CHART',
  metrics: 'CHART',
  prometheus: 'CHART',
  grafana: 'CHART',
  datadog: 'CHART',
  sentry: 'CHART',
  opentelemetry: 'CHART',
  jaeger: 'CHART',
  zipkin: 'CHART',
};
