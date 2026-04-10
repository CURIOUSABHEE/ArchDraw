import type { TierType } from '../types/index.js';

export function inferTierFromLabel(label: string): TierType {
  const lowerLabel = label.toLowerCase();
  
  if (lowerLabel.includes('client') || lowerLabel.includes('browser') || 
      lowerLabel.includes('mobile') || lowerLabel.includes('web app') ||
      lowerLabel.includes('mobile app') || lowerLabel.includes('web client')) {
    return 'client';
  }
  
  if (lowerLabel.includes('cdn') || lowerLabel.includes('load balancer') ||
      lowerLabel.includes('gateway') || lowerLabel.includes('waf') || 
      lowerLabel.includes('dns') || lowerLabel.includes('reverse proxy') ||
      lowerLabel.includes('loadbalancer') || lowerLabel.includes('api gateway')) {
    return 'edge';
  }
  
  if (lowerLabel.includes('queue') || lowerLabel.includes('event bus') ||
      lowerLabel.includes('kafka') || lowerLabel.includes('rabbitmq') ||
      lowerLabel.includes('sns') || lowerLabel.includes('sqs') ||
      lowerLabel.includes('message') || lowerLabel.includes('redis') && lowerLabel.includes('queue') ||
      lowerLabel.includes('pubsub') || lowerLabel.includes('pub/sub')) {
    return 'async';
  }
  
  if (lowerLabel.includes('database') || lowerLabel.includes('db') ||
      lowerLabel.includes('cache') || lowerLabel.includes('redis') ||
      lowerLabel.includes('storage') || lowerLabel.includes('s3') ||
      lowerLabel.includes('postgres') || lowerLabel.includes('postgresql') ||
      lowerLabel.includes('mongodb') || lowerLabel.includes('mysql') ||
      lowerLabel.includes('dynamodb') || lowerLabel.includes('sql') ||
      lowerLabel.includes('object store')) {
    return 'data';
  }
  
  if (lowerLabel.includes('monitor') || lowerLabel.includes('logging') ||
      lowerLabel.includes('tracing') || lowerLabel.includes('cloudwatch') ||
      lowerLabel.includes('grafana') || lowerLabel.includes('prometheus') ||
      lowerLabel.includes('observab') || lowerLabel.includes('logs') ||
      lowerLabel.includes('sentry') || lowerLabel.includes('datadog')) {
    return 'observe';
  }
  
  if (lowerLabel.includes('stripe') || lowerLabel.includes('payment') ||
      lowerLabel.includes('twilio') || lowerLabel.includes('sendgrid') ||
      lowerLabel.includes('external') || lowerLabel.includes('third party') ||
      lowerLabel.includes('3rd party') || lowerLabel.includes('third-party')) {
    return 'external';
  }
  
  return 'compute';
}

export function generateNodeId(label: string, index: number): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 30) + '-' + index;
}

export const TIER_COLORS: Record<TierType, string> = {
  client: '#a855f7',
  edge: '#8b5cf6',
  compute: '#14b8a6',
  async: '#f59e0b',
  data: '#3b82f6',
  observe: '#6b7280',
  external: '#64748b',
};

export const COMMUNICATION_COLORS: Record<string, { color: string; dash: string; animated: boolean }> = {
  sync: { color: '#6366f1', dash: '', animated: false },
  async: { color: '#f59e0b', dash: '8,4', animated: true },
  stream: { color: '#10b981', dash: '4,2', animated: true },
  event: { color: '#ec4899', dash: '2,3', animated: true },
  dep: { color: '#94a3b8', dash: '6,6', animated: false },
};

export const TIER_ORDER: TierType[] = [
  'client',
  'edge',
  'compute',
  'async',
  'data',
  'observe',
  'external',
];

export const TIER_X_POSITIONS: Record<string, Record<TierType, number>> = {
  RIGHT: {
    client: 50,
    edge: 320,
    compute: 650,
    async: 1000,
    data: 1350,
    observe: 1700,
    external: 2050,
  },
  DOWN: {
    client: 50,
    edge: 50,
    compute: 50,
    async: 50,
    data: 50,
    observe: 50,
    external: 50,
  },
  LEFT: {
    client: 2050,
    edge: 1780,
    compute: 1450,
    async: 1100,
    data: 750,
    observe: 400,
    external: 50,
  },
  UP: {
    client: 1700,
    edge: 1350,
    compute: 1000,
    async: 650,
    data: 320,
    observe: 50,
    external: 0,
  },
};

export const LAYER_DESCRIPTIONS: Record<TierType, string> = {
  client: 'Browser, Mobile App, Web Client',
  edge: 'CDN, Load Balancer, API Gateway, WAF, DNS',
  compute: 'API Server, Auth Service, Business Logic, Workers, Functions, Containers',
  async: 'Message Queue, Event Bus, Task Queue (own column)',
  data: 'Database, Cache, Object Storage, File System',
  observe: 'Monitoring, Logging, Tracing',
  external: 'Third-party APIs, Payment gateways',
};

export const TIER_TO_CATEGORY: Record<TierType, string[]> = {
  client: ['Client & Entry'],
  edge: ['Client & Entry'],
  compute: ['Compute', 'AI Agents', 'LLM Models', 'RAG', 'Vector Databases', 'ML Infrastructure', 'ML Serving', 'MLOps', 'LLM Ops', 'AI Frameworks', 'AI Data Pipeline', 'Speech & Audio', 'Vision AI', 'Real-time', 'Auth & Security', 'DevOps / Infra'],
  async: ['Messaging & Events'],
  data: ['Data Storage', 'Caching'],
  observe: ['Observability'],
  external: ['External Services'],
};
