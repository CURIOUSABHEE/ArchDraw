import { Node, Edge } from 'reactflow';

// Column x positions
// Col 0: x=0    — Client
// Col 1: x=350  — CDN, API Gateway
// Col 2: x=700  — Load Balancer, Auth Service
// Col 3: x=1050 — Chat Service, Streaming Service
// Col 4: x=1400 — LLM API, Embedding, Cache, MQ, RAG
// Col 5: x=1750 — Vector DB, NoSQL, Object Storage, SQL DB, Worker
// Col 6: x=2100 — Logger, Metrics

export const chatgptNodes: Node[] = [
  // Col 0 — 1 node, centered at y=400
  { id: 'cg_client',    type: 'systemNode', position: { x: 0,    y: 400  }, data: { label: 'Client (Web / Mobile)', category: 'Client & Entry',    color: '#6366f1', icon: 'Monitor'       } },
  // Col 1 — 2 nodes, centered at y=400, spacing 180 → y=310, 490
  { id: 'cg_cdn',       type: 'systemNode', position: { x: 350,  y: 310  }, data: { label: 'CDN',                   category: 'Client & Entry',    color: '#6366f1', icon: 'RadioTower'    } },
  { id: 'cg_apigw',     type: 'systemNode', position: { x: 350,  y: 490  }, data: { label: 'API Gateway',           category: 'Client & Entry',    color: '#6366f1', icon: 'Webhook'       } },
  // Col 2 — 2 nodes → y=310, 490
  { id: 'cg_lb',        type: 'systemNode', position: { x: 700,  y: 310  }, data: { label: 'Load Balancer',         category: 'Client & Entry',    color: '#6366f1', icon: 'Scale'         } },
  { id: 'cg_jwt',       type: 'systemNode', position: { x: 700,  y: 490  }, data: { label: 'Auth Service (JWT)',    category: 'Auth & Security',   color: '#8b5cf6', icon: 'Shield'        } },
  // Col 3 — 3 nodes, centered at y=400, spacing 180 → y=220, 400, 580
  { id: 'cg_auth_ms',   type: 'systemNode', position: { x: 1050, y: 220  }, data: { label: 'Auth Service',          category: 'Compute',           color: '#3b82f6', icon: 'Boxes'         } },
  { id: 'cg_chat_ms',   type: 'systemNode', position: { x: 1050, y: 400  }, data: { label: 'Chat Service',          category: 'Compute',           color: '#3b82f6', icon: 'Boxes'         } },
  { id: 'cg_stream_ms', type: 'systemNode', position: { x: 1050, y: 580  }, data: { label: 'Streaming Service',     category: 'Compute',           color: '#3b82f6', icon: 'Boxes'         } },
  // Col 4 — 5 nodes, centered at y=400, spacing 180 → y=40, 220, 400, 580, 760
  { id: 'cg_llm',       type: 'systemNode', position: { x: 1400, y: 40   }, data: { label: 'LLM API (GPT / Claude)',category: 'AI / ML',           color: '#ec4899', icon: 'Brain'         } },
  { id: 'cg_embed',     type: 'systemNode', position: { x: 1400, y: 220  }, data: { label: 'Embedding Service',     category: 'AI / ML',           color: '#ec4899', icon: 'Network'       } },
  { id: 'cg_cache',     type: 'systemNode', position: { x: 1400, y: 400  }, data: { label: 'In-Memory Cache',       category: 'Caching',           color: '#ef4444', icon: 'Layers'        } },
  { id: 'cg_mq',        type: 'systemNode', position: { x: 1400, y: 580  }, data: { label: 'Message Queue',         category: 'Messaging & Events',color: '#f59e0b', icon: 'MessageSquare' } },
  { id: 'cg_rag',       type: 'systemNode', position: { x: 1400, y: 760  }, data: { label: 'RAG Pipeline',          category: 'AI / ML',           color: '#ec4899', icon: 'GitMerge'      } },
  // Col 5 — 5 nodes, centered at y=400, spacing 180 → y=40, 220, 400, 580, 760
  { id: 'cg_sql',       type: 'systemNode', position: { x: 1750, y: 40   }, data: { label: 'SQL Database',          category: 'Data Storage',      color: '#334155', icon: 'Database'      } },
  { id: 'cg_nosql',     type: 'systemNode', position: { x: 1750, y: 220  }, data: { label: 'NoSQL Database',        category: 'Data Storage',      color: '#334155', icon: 'Leaf'          } },
  { id: 'cg_vector',    type: 'systemNode', position: { x: 1750, y: 400  }, data: { label: 'Vector Database',       category: 'AI / ML',           color: '#ec4899', icon: 'Cpu'           } },
  { id: 'cg_objstore',  type: 'systemNode', position: { x: 1750, y: 580  }, data: { label: 'Object Storage',        category: 'Data Storage',      color: '#334155', icon: 'HardDrive'     } },
  { id: 'cg_worker',    type: 'systemNode', position: { x: 1750, y: 760  }, data: { label: 'Worker / Background Job',category:'Compute',           color: '#3b82f6', icon: 'Timer'         } },
  // Col 6 — 2 nodes → y=310, 490
  { id: 'cg_logger',    type: 'systemNode', position: { x: 2100, y: 310  }, data: { label: 'Logger',                category: 'Observability',     color: '#06b6d4', icon: 'ScrollText'    } },
  { id: 'cg_metrics',   type: 'systemNode', position: { x: 2100, y: 490  }, data: { label: 'Metrics Collector',     category: 'Observability',     color: '#06b6d4', icon: 'BarChart2'     } },
];

const E = (id: string, source: string, target: string, label: string): Edge => ({
  id, source, target, type: 'default', animated: true,
  style: { stroke: '#94a3b8', strokeWidth: 1.5 },
  label,
});

export const chatgptEdges: Edge[] = [
  E('cg_e1',  'cg_client',   'cg_cdn',      'static assets'),
  E('cg_e2',  'cg_client',   'cg_apigw',    'HTTPS requests'),
  E('cg_e3',  'cg_apigw',    'cg_lb',       'routes traffic'),
  E('cg_e4',  'cg_lb',       'cg_auth_ms',  'auth check'),
  E('cg_e5',  'cg_lb',       'cg_chat_ms',  'chat requests'),
  E('cg_e6',  'cg_lb',       'cg_stream_ms','stream requests'),
  E('cg_e7',  'cg_chat_ms',  'cg_llm',      'prompt + context'),
  E('cg_e8',  'cg_chat_ms',  'cg_cache',    'session cache'),
  E('cg_e9',  'cg_chat_ms',  'cg_nosql',    'store chat history'),
  E('cg_e10', 'cg_chat_ms',  'cg_embed',    'generate embeddings'),
  E('cg_e11', 'cg_embed',    'cg_vector',   'store/query vectors'),
  E('cg_e12', 'cg_vector',   'cg_rag',      'retrieved chunks'),
  E('cg_e13', 'cg_rag',      'cg_llm',      'augmented prompt'),
  E('cg_e14', 'cg_chat_ms',  'cg_mq',       'async tasks'),
  E('cg_e15', 'cg_mq',       'cg_worker',   'process jobs'),
  E('cg_e16', 'cg_auth_ms',  'cg_sql',      'user records'),
  E('cg_e17', 'cg_auth_ms',  'cg_jwt',      'token validation'),
  E('cg_e18', 'cg_auth_ms',  'cg_logger',   'logs'),
  E('cg_e19', 'cg_chat_ms',  'cg_logger',   'logs'),
  E('cg_e20', 'cg_stream_ms','cg_logger',   'logs'),
  E('cg_e21', 'cg_auth_ms',  'cg_metrics',  'metrics'),
  E('cg_e22', 'cg_chat_ms',  'cg_metrics',  'metrics'),
  E('cg_e23', 'cg_chat_ms',  'cg_objstore', 'file uploads'),
];
