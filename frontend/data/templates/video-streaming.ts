import { Node, Edge } from 'reactflow';

export const videoStreamingNodes: Node[] = [
  { id: 'user', type: 'customNode', position: { x: 0, y: 0 }, data: { label: 'User', category: 'Client', color: '#6366f1', icon: 'Monitor' } },
  { id: 'cdn', type: 'customNode', position: { x: 0, y: 0 }, data: { label: 'CDN', category: 'Gateway', color: '#f59e0b', icon: 'Globe' } },
  { id: 'gateway', type: 'customNode', position: { x: 0, y: 0 }, data: { label: 'API Gateway', category: 'Gateway', color: '#8b5cf6', icon: 'Gateway' } },
  { id: 'playback', type: 'customNode', position: { x: 0, y: 0 }, data: { label: 'Playback Service', category: 'Compute', color: '#3b82f6', icon: 'Play' } },
  { id: 'cache', type: 'customNode', position: { x: 0, y: 0 }, data: { label: 'Cache', category: 'Caching', color: '#ef4444', icon: 'Zap' } },
  { id: 'database', type: 'customNode', position: { x: 0, y: 0 }, data: { label: 'Database', category: 'Data Storage', color: '#334155', icon: 'Database' } },
];

const E = (id: string, source: string, target: string, label: string, animated = false): Edge => ({
  id, source, target,
  type: 'simpleFloating',
  animated,
  data: { edgeType: 'sync', connectionType: 'smooth', label },
  style: { stroke: '#94a3b8', strokeWidth: 2 },
  label,
});

export const videoStreamingEdges: Edge[] = [
  E('e1', 'user', 'cdn', 'Video Request'),
  E('e2', 'cdn', 'user', 'Video Stream'),
  E('e3', 'user', 'gateway', 'API Request'),
  E('e4', 'gateway', 'playback', 'Forward Request'),
  E('e5', 'playback', 'cache', 'Cache Lookup'),
  E('e6', 'playback', 'database', 'Query'),
];
