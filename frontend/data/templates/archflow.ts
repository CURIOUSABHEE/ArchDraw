import { Node, Edge } from 'reactflow';

// All positions are { x: 0, y: 0 } — Dagre calculates layout on load

export const archflowNodes: Node[] = [
  // Col 0 — Client & Entry
  { id: 'af_browser',     type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'User Browser',         category: 'Client & Entry',     color: '#6366f1', icon: 'Monitor'      } },
  { id: 'af_cdn',         type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Vercel CDN',           category: 'Client & Entry',     color: '#6366f1', icon: 'RadioTower'   } },

  // Col 1 — Gateway
  { id: 'af_approuter',   type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Next.js App Router',   category: 'Client & Entry',     color: '#6366f1', icon: 'Webhook'      } },
  { id: 'af_edge',        type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Vercel Edge Network',  category: 'Client & Entry',     color: '#6366f1', icon: 'Globe'        } },

  // Col 2 — Frontend
  { id: 'af_canvas',      type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'React + ReactFlow',    category: 'Compute',            color: '#3b82f6', icon: 'Boxes'        } },
  { id: 'af_zustand',     type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Zustand State',        category: 'Caching',            color: '#ef4444', icon: 'Layers'       } },
  { id: 'af_localstorage',type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'localStorage',         category: 'Caching',            color: '#ef4444', icon: 'HardDrive'    } },

  // Col 3 — Auth
  { id: 'af_sbauth',      type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Supabase Auth',        category: 'Auth & Security',    color: '#8b5cf6', icon: 'Shield'       } },
  { id: 'af_otp',         type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Magic Link OTP',       category: 'Auth & Security',    color: '#8b5cf6', icon: 'KeyRound'     } },
  { id: 'af_emailmodal',  type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Email Capture Modal',  category: 'Compute',            color: '#3b82f6', icon: 'Mail'         } },

  // Col 4 — API / Server
  { id: 'af_apiroutes',   type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Next.js API Routes',   category: 'Compute',            color: '#3b82f6', icon: 'Server'       } },
  { id: 'af_sharehandler',type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Share Handler',        category: 'Compute',            color: '#3b82f6', icon: 'Share2'       } },
  { id: 'af_exporthandler',type:'systemNode', position: { x: 0, y: 0 }, data: { label: 'Export Handler',       category: 'Compute',            color: '#3b82f6', icon: 'Download'     } },
  { id: 'af_templates',   type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Template Engine',      category: 'Compute',            color: '#3b82f6', icon: 'LayoutTemplate'} },

  // Col 5 — Email + Database
  { id: 'af_email',       type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Resend Email',         category: 'Messaging & Events', color: '#f59e0b', icon: 'Send'         } },
  { id: 'af_postgres',    type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Supabase PostgreSQL',  category: 'Data Storage',       color: '#334155', icon: 'Database'     } },
  { id: 'af_shared_table',type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'shared_canvases',      category: 'Data Storage',       color: '#334155', icon: 'Table'        } },
  { id: 'af_user_table',  type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'user_canvases',        category: 'Data Storage',       color: '#334155', icon: 'Table'        } },

  // Col 6 — Storage & Export
  { id: 'af_dagre',       type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Dagre Auto Layout',    category: 'Compute',            color: '#3b82f6', icon: 'GitBranch'    } },
  { id: 'af_htmltoimage', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'html-to-image',        category: 'Compute',            color: '#3b82f6', icon: 'Image'        } },
  { id: 'af_pngexport',   type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'PNG Export',           category: 'Data Storage',       color: '#334155', icon: 'FileImage'    } },

  // Col 7 — Observability
  { id: 'af_analytics',   type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Vercel Analytics',     category: 'Observability',      color: '#06b6d4', icon: 'BarChart2'    } },
  { id: 'af_logs',        type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'Vercel Logs',          category: 'Observability',      color: '#06b6d4', icon: 'ScrollText'   } },
];

const E = (id: string, source: string, target: string, label: string): Edge => ({
  id, source, target,
  type: 'default',
  animated: true,
  style: { stroke: '#94a3b8', strokeWidth: 1.5 },
  label,
});

export const archflowEdges: Edge[] = [
  E('af_e1',  'af_browser',      'af_cdn',          'static assets'),
  E('af_e2',  'af_browser',      'af_approuter',    'HTTPS requests'),
  E('af_e3',  'af_edge',         'af_approuter',    'route requests'),
  E('af_e4',  'af_approuter',    'af_canvas',       'render canvas'),
  E('af_e5',  'af_approuter',    'af_apiroutes',    'API calls'),
  E('af_e6',  'af_canvas',       'af_zustand',      'read/write state'),
  E('af_e7',  'af_zustand',      'af_localstorage', 'persist guest canvas'),
  E('af_e8',  'af_approuter',    'af_sbauth',       'auth check'),
  E('af_e9',  'af_sbauth',       'af_otp',          'send magic link'),
  E('af_e10', 'af_otp',          'af_email',        'deliver email'),
  E('af_e11', 'af_emailmodal',   'af_sbauth',       'trigger OTP'),
  E('af_e12', 'af_apiroutes',    'af_sharehandler', 'share request'),
  E('af_e13', 'af_apiroutes',    'af_exporthandler','export request'),
  E('af_e14', 'af_apiroutes',    'af_templates',    'load template'),
  E('af_e15', 'af_sharehandler', 'af_postgres',     'save canvas'),
  E('af_e16', 'af_sharehandler', 'af_shared_table', 'write share record'),
  E('af_e17', 'af_exporthandler','af_htmltoimage',  'capture canvas'),
  E('af_e18', 'af_htmltoimage',  'af_pngexport',    'generate file'),
  E('af_e19', 'af_templates',    'af_dagre',        'calculate positions'),
  E('af_e20', 'af_apiroutes',    'af_postgres',     'read/write user data'),
  E('af_e21', 'af_postgres',     'af_user_table',   'store canvases'),
  E('af_e22', 'af_approuter',    'af_analytics',    'page events'),
  E('af_e23', 'af_analytics',    'af_logs',         'track events'),
];
