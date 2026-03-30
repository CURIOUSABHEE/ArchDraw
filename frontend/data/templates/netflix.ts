import { Node, Edge } from 'reactflow';

export const netflixNodes: Node[] = [
  // Layer 1: Client Layer
  { id: 'web', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Web Client', category: 'Client', color: '#6366f1', icon: 'Globe' } },
  { id: 'mobile', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Mobile App', category: 'Client', color: '#6366f1', icon: 'Smartphone' } },
  { id: 'smarttv', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Smart TV', category: 'Client', color: '#6366f1', icon: 'Tv' } },

  // Layer 2: Edge Layer
  { id: 'cdn', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'CDN (Open Connect)', category: 'Edge', color: '#f59e0b', icon: 'Cloud' } },
  { id: 'dns', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'DNS Routing', category: 'Edge', color: '#f59e0b', icon: 'Globe' } },

  // Layer 3: API Gateway Layer
  { id: 'gateway', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'API Gateway', category: 'Gateway', color: '#8b5cf6', icon: 'Gateway' } },

  // Layer 4: Microservices - User Domain
  { id: 'auth', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Auth Service', category: 'User Domain', color: '#3b82f6', icon: 'Lock' } },
  { id: 'profile', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Profile Service', category: 'User Domain', color: '#3b82f6', icon: 'User' } },

  // Layer 4: Microservices - Content Domain
  { id: 'catalog', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Catalog Service', category: 'Content Domain', color: '#10b981', icon: 'Boxes' } },
  { id: 'metadata', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Metadata Service', category: 'Content Domain', color: '#10b981', icon: 'FileText' } },

  // Layer 4: Microservices - Streaming Domain
  { id: 'playback', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Playback Service', category: 'Streaming Domain', color: '#ef4444', icon: 'Play' } },
  { id: 'orchestrator', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Orchestrator', category: 'Streaming Domain', color: '#ef4444', icon: 'Cpu' } },

  // Layer 4: Microservices - Other
  { id: 'recommendation', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Recommendation', category: 'Recommendation', color: '#ec4899', icon: 'Brain' } },
  { id: 'billing', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Billing Service', category: 'Billing', color: '#f97316', icon: 'CreditCard' } },

  // Layer 5: Data Layer
  { id: 'cassandra', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Cassandra', category: 'Database', color: '#334155', icon: 'Database' } },
  { id: 'mysql', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'MySQL', category: 'Database', color: '#334155', icon: 'Database' } },
  { id: 'redis', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Redis Cache', category: 'Cache', color: '#dc2626', icon: 'Zap' } },
  { id: 'elasticsearch', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Elasticsearch', category: 'Search', color: '#0ea5e9', icon: 'Search' } },

  // Layer 6: Streaming Pipeline
  { id: 'ingestion', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Content Ingestion', category: 'Pipeline', color: '#a855f7', icon: 'Upload' } },
  { id: 'transcoding', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Transcoding', category: 'Pipeline', color: '#a855f7', icon: 'Cpu' } },
  { id: 'abr', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'ABR Encoding', category: 'Pipeline', color: '#a855f7', icon: 'Layers' } },
  { id: 'storage', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'S3 Storage', category: 'Storage', color: '#eab308', icon: 'HardDrive' } },

  // Layer 7: Data & Analytics
  { id: 'kafka', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Kafka', category: 'Event Stream', color: '#06b6d4', icon: 'Activity' } },
  { id: 'realtime', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Real-time Processing', category: 'Analytics', color: '#06b6d4', icon: 'Zap' } },
  { id: 'batch', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Batch Processing', category: 'Analytics', color: '#06b6d4', icon: 'Clock' } },
];

const E = (id: string, source: string, target: string, label: string, animated = false): Edge => ({
  id, source, target,
  type: 'custom',
  animated,
  data: { edgeType: animated ? 'async' : 'sync', connectionType: 'smooth', label },
  style: { stroke: '#94a3b8', strokeWidth: 1.5 },
  label,
});

export const netflixEdges: Edge[] = [
  // Client to Edge
  E('e1', 'web', 'dns', 'DNS Query'),
  E('e2', 'mobile', 'dns', 'DNS Query'),
  E('e3', 'smarttv', 'dns', 'DNS Query'),
  E('e4', 'dns', 'cdn', 'Route to Edge'),

  // Edge to Gateway
  E('e5', 'cdn', 'gateway', 'API Request'),

  // Gateway to Services
  E('e6', 'gateway', 'auth', 'Auth Request'),
  E('e7', 'gateway', 'profile', 'Profile Request'),
  E('e8', 'gateway', 'catalog', 'Catalog Request'),
  E('e9', 'gateway', 'playback', 'Playback Request'),
  E('e10', 'gateway', 'recommendation', 'Rec Request'),
  E('e11', 'gateway', 'billing', 'Billing Request'),

  // Service to Data Layer
  E('e12', 'auth', 'cassandra', 'User Data'),
  E('e13', 'profile', 'redis', 'Cache Lookup'),
  E('e14', 'profile', 'mysql', 'Profile DB'),
  E('e15', 'catalog', 'elasticsearch', 'Search'),
  E('e16', 'metadata', 'cassandra', 'Metadata'),
  E('e17', 'playback', 'orchestrator', 'Orchestrate'),
  E('e18', 'playback', 'redis', 'Session Cache'),

  // Streaming Pipeline
  E('e19', 'ingestion', 'transcoding', 'Raw Video'),
  E('e20', 'transcoding', 'abr', 'Transcoded'),
  E('e21', 'abr', 'storage', 'ABR Chunks'),
  E('e22', 'storage', 'cdn', 'Push to Edge'),

  // Client to CDN for streaming
  E('e23', 'web', 'cdn', 'Video Request', true),
  E('e24', 'mobile', 'cdn', 'Video Request', true),
  E('e25', 'smarttv', 'cdn', 'Video Request', true),

  // Data & Analytics Flow
  E('e26', 'playback', 'kafka', 'User Events', true),
  E('e27', 'catalog', 'kafka', 'Content Events', true),
  E('e28', 'kafka', 'realtime', 'Event Stream', true),
  E('e29', 'kafka', 'batch', 'Event Archive', true),
  E('e30', 'realtime', 'recommendation', 'Real-time Feedback', true),
  E('e31', 'batch', 'recommendation', 'Batch Insights', true),
];
