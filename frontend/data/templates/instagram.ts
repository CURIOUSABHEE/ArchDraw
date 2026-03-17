import { Node, Edge } from 'reactflow';

export const instagramNodes: Node[] = [
  // Entry
  { id: 'ig_client',   type: 'systemNode', position: { x: 600, y: 0   }, data: { label: 'Client (Web / Mobile)', category: 'Client & Entry',    color: '#6366f1', icon: 'Monitor'       } },
  { id: 'ig_dns',      type: 'systemNode', position: { x: 300, y: 140 }, data: { label: 'DNS',                   category: 'Client & Entry',    color: '#6366f1', icon: 'Globe'         } },
  { id: 'ig_cdn',      type: 'systemNode', position: { x: 600, y: 140 }, data: { label: 'CDN',                   category: 'Client & Entry',    color: '#6366f1', icon: 'RadioTower'    } },
  { id: 'ig_apigw',    type: 'systemNode', position: { x: 900, y: 140 }, data: { label: 'API Gateway',           category: 'Client & Entry',    color: '#6366f1', icon: 'Webhook'       } },
  { id: 'ig_lb',       type: 'systemNode', position: { x: 900, y: 280 }, data: { label: 'Load Balancer',         category: 'Client & Entry',    color: '#6366f1', icon: 'Scale'         } },
  // Microservices
  { id: 'ig_user_svc', type: 'systemNode', position: { x: 200, y: 420 }, data: { label: 'User Service',          category: 'Compute',           color: '#3b82f6', icon: 'Boxes'         } },
  { id: 'ig_feed_svc', type: 'systemNode', position: { x: 600, y: 420 }, data: { label: 'Feed Service',          category: 'Compute',           color: '#3b82f6', icon: 'Boxes'         } },
  { id: 'ig_media_svc',type: 'systemNode', position: { x: 900, y: 420 }, data: { label: 'Media Service',         category: 'Compute',           color: '#3b82f6', icon: 'Boxes'         } },
  { id: 'ig_notif_svc',type: 'systemNode', position: { x: 1200, y: 420}, data: { label: 'Notification Service',  category: 'Compute',           color: '#3b82f6', icon: 'Boxes'         } },
  { id: 'ig_search_svc',type:'systemNode', position: { x: 400, y: 420 }, data: { label: 'Search Service',        category: 'Compute',           color: '#3b82f6', icon: 'Boxes'         } },
  // Data
  { id: 'ig_sql',      type: 'systemNode', position: { x: 0,   y: 580 }, data: { label: 'SQL Database',          category: 'Data Storage',      color: '#334155', icon: 'Database'      } },
  { id: 'ig_nosql',    type: 'systemNode', position: { x: 600, y: 580 }, data: { label: 'NoSQL Database',        category: 'Data Storage',      color: '#334155', icon: 'Leaf'          } },
  { id: 'ig_s3',       type: 'systemNode', position: { x: 900, y: 580 }, data: { label: 'Object Storage (S3)',   category: 'Data Storage',      color: '#334155', icon: 'HardDrive'     } },
  { id: 'ig_cache',    type: 'systemNode', position: { x: 400, y: 580 }, data: { label: 'In-Memory Cache',       category: 'Caching',           color: '#ef4444', icon: 'Layers'        } },
  { id: 'ig_elastic',  type: 'systemNode', position: { x: 200, y: 580 }, data: { label: 'Search Engine',         category: 'Data Storage',      color: '#334155', icon: 'Search'        } },
  // Messaging
  { id: 'ig_kafka',    type: 'systemNode', position: { x: 900, y: 720 }, data: { label: 'Kafka / Streaming',     category: 'Messaging & Events',color: '#f59e0b', icon: 'Activity'      } },
  { id: 'ig_mq',       type: 'systemNode', position: { x: 700, y: 720 }, data: { label: 'Message Queue',         category: 'Messaging & Events',color: '#f59e0b', icon: 'MessageSquare' } },
  { id: 'ig_eventbus', type: 'systemNode', position: { x: 1100, y: 720}, data: { label: 'Event Bus / Pub-Sub',   category: 'Messaging & Events',color: '#f59e0b', icon: 'Radio'         } },
  { id: 'ig_worker',   type: 'systemNode', position: { x: 900, y: 860 }, data: { label: 'Worker / Background Job',category:'Compute',           color: '#3b82f6', icon: 'Timer'         } },
  // Auth
  { id: 'ig_auth',     type: 'systemNode', position: { x: 0,   y: 280 }, data: { label: 'Auth Service (JWT)',    category: 'Auth & Security',   color: '#8b5cf6', icon: 'Shield'        } },
  { id: 'ig_oauth',    type: 'systemNode', position: { x: 0,   y: 420 }, data: { label: 'OAuth / Identity Provider',category:'Auth & Security', color: '#8b5cf6', icon: 'KeyRound'      } },
  // Notifications
  { id: 'ig_push',     type: 'systemNode', position: { x: 1400, y: 580}, data: { label: 'SMS / Push Notification',category:'External Services', color: '#10b981', icon: 'Smartphone'    } },
  // Observability
  { id: 'ig_logger',   type: 'systemNode', position: { x: 1400, y: 420}, data: { label: 'Logger',                category: 'Observability',     color: '#06b6d4', icon: 'ScrollText'    } },
  { id: 'ig_metrics',  type: 'systemNode', position: { x: 1400, y: 280}, data: { label: 'Metrics Collector',     category: 'Observability',     color: '#06b6d4', icon: 'BarChart2'     } },
  { id: 'ig_dashboard',type: 'systemNode', position: { x: 1400, y: 140}, data: { label: 'Dashboard (Grafana)',   category: 'Observability',     color: '#06b6d4', icon: 'LayoutDashboard'} },
  { id: 'ig_dw',       type: 'systemNode', position: { x: 1200, y: 860}, data: { label: 'Data Warehouse',        category: 'Data Storage',      color: '#334155', icon: 'Building2'     } },
];

const E = (id: string, source: string, target: string, label: string): Edge => ({
  id, source, target, type: 'custom', animated: true,
  data: { label, edgeStyle: 'solid', connectionType: 'smoothstep', color: '#94a3b8' },
  style: { stroke: '#94a3b8', strokeWidth: 1.5 },
});

export const instagramEdges: Edge[] = [
  E('ig_e1',  'ig_client',    'ig_dns',       'resolve domain'),
  E('ig_e2',  'ig_dns',       'ig_cdn',       'static content'),
  E('ig_e3',  'ig_client',    'ig_apigw',     'API calls'),
  E('ig_e4',  'ig_apigw',     'ig_lb',        'distribute'),
  E('ig_e5',  'ig_lb',        'ig_user_svc',  'user ops'),
  E('ig_e6',  'ig_lb',        'ig_feed_svc',  'feed requests'),
  E('ig_e7',  'ig_lb',        'ig_media_svc', 'upload/download'),
  E('ig_e8',  'ig_lb',        'ig_search_svc','search queries'),
  E('ig_e9',  'ig_media_svc', 'ig_s3',        'store media'),
  E('ig_e10', 'ig_media_svc', 'ig_worker',    'trigger processing'),
  E('ig_e11', 'ig_worker',    'ig_kafka',     'processed events'),
  E('ig_e12', 'ig_kafka',     'ig_feed_svc',  'feed update events'),
  E('ig_e13', 'ig_kafka',     'ig_notif_svc', 'trigger notifications'),
  E('ig_e14', 'ig_feed_svc',  'ig_cache',     'cache feed'),
  E('ig_e15', 'ig_feed_svc',  'ig_nosql',     'persist posts'),
  E('ig_e16', 'ig_user_svc',  'ig_sql',       'user data'),
  E('ig_e17', 'ig_search_svc','ig_elastic',   'index & query'),
  E('ig_e18', 'ig_notif_svc', 'ig_push',      'send notifications'),
  E('ig_e19', 'ig_eventbus',  'ig_dw',        'analytics events'),
  E('ig_e20', 'ig_auth',      'ig_oauth',     'social login'),
  E('ig_e21', 'ig_metrics',   'ig_dashboard', 'visualize metrics'),
  E('ig_e22', 'ig_user_svc',  'ig_logger',    'logs'),
  E('ig_e23', 'ig_feed_svc',  'ig_logger',    'logs'),
  E('ig_e24', 'ig_media_svc', 'ig_logger',    'logs'),
  E('ig_e25', 'ig_user_svc',  'ig_metrics',   'metrics'),
  E('ig_e26', 'ig_feed_svc',  'ig_metrics',   'metrics'),
  E('ig_e27', 'ig_mq',        'ig_eventbus',  'events'),
];
