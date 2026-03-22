export type EdgeType = 'sync' | 'async' | 'stream' | 'event' | 'dep';

export interface EdgeTypeConfig {
  id: EdgeType;
  label: string;
  description: string;
  color: string;           // hex, used for stroke + arrowhead + label badge
  strokeWidth: number;
  strokeDasharray: string; // SVG dasharray string, '' = solid
  animated: boolean;       // whether React Flow animates the marching-ants
  animationDuration: string; // CSS animation-duration for custom dash animation
  markerEnd: 'arrow' | 'arrowclosed'; // React Flow marker type
  markerStart?: 'arrow' | 'arrowclosed'; // only for 'event' type (bidirectional)
  badgeColor: string;      // bg color for the type badge on the edge label
  badgeTextColor: string;
}

export interface EdgeData {
  edgeType: EdgeType;
  label?: string; // user-defined custom label; if undefined/empty, show edgeType id
}

export const EDGE_TYPE_CONFIGS: Record<EdgeType, EdgeTypeConfig> = {
  sync: {
    id: 'sync',
    label: 'Synchronous',
    description: 'Blocking request — waits for response (REST, gRPC)',
    color: '#6366f1',
    strokeWidth: 2,
    strokeDasharray: '',        // solid line
    animated: true,             // flowing animation
    animationDuration: '1s',
    markerEnd: 'arrowclosed',   // solid arrow
    badgeColor: '#1e2050',
    badgeTextColor: '#a5b4fc',
  },

  async: {
    id: 'async',
    label: 'Asynchronous',
    description: 'Fire-and-forget — queue, pub-sub, message broker',
    color: '#22d3ee',
    strokeWidth: 2,
    strokeDasharray: '8 4',     // dashed to show async
    animated: true,             // flowing animation
    animationDuration: '1.5s',  // slightly slower = async feel
    markerEnd: 'arrowclosed',   // solid arrow
    badgeColor: '#0c2433',
    badgeTextColor: '#67e8f9',
  },

  stream: {
    id: 'stream',
    label: 'High-frequency stream',
    description: 'Real-time data — WebSocket, SSE, Kafka consumer',
    color: '#f59e0b',
    strokeWidth: 2.5,           // thicker = high frequency feel
    strokeDasharray: '',        // solid — streams are continuous
    animated: true,             // fast flowing animation
    animationDuration: '0.5s',  // fast = high frequency
    markerEnd: 'arrowclosed',
    badgeColor: '#1c1400',
    badgeTextColor: '#fcd34d',
  },

  event: {
    id: 'event',
    label: 'Event / bidirectional',
    description: 'Webhook, callback, or two-way communication',
    color: '#a78bfa',
    strokeWidth: 2,
    strokeDasharray: '4 4',     // short dashes = event pulses
    animated: true,
    animationDuration: '1.2s',
    markerEnd: 'arrowclosed',
    markerStart: 'arrowclosed', // bidirectional arrows
    badgeColor: '#1a1340',
    badgeTextColor: '#c4b5fd',
  },

  dep: {
    id: 'dep',
    label: 'Dependency / static',
    description: 'Config reference, build dep, or passive link',
    color: '#6b7280',
    strokeWidth: 1.5,
    strokeDasharray: '6 6',     // long dashes = passive/static
    animated: false,            // deps don't flow — intentionally static
    animationDuration: '0s',
    markerEnd: 'arrow',         // open arrow = passive reference
    badgeColor: '#1a1b1f',
    badgeTextColor: '#9ca3af',
  },
};

export const DEFAULT_EDGE_TYPE: EdgeType = 'sync';
