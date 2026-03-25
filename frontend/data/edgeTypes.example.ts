import type { Edge } from 'reactflow';
import type { EdgeData, EdgeType, PathType } from './edgeTypes';

/**
 * Example: Creating edges with different path types
 */

const edges: Edge<EdgeData>[] = [
  {
    id: 'e1',
    source: 'node1',
    target: 'node2',
    type: 'custom',
    data: {
      edgeType: 'sync',
      pathType: 'smooth', // Uses smooth curve
      label: 'Sync Call',
    },
  },
  {
    id: 'e2',
    source: 'node2',
    target: 'node3',
    type: 'custom',
    data: {
      edgeType: 'async',
      pathType: 'bezier', // Uses natural curve
      label: 'Async Message',
    },
  },
  {
    id: 'e3',
    source: 'node3',
    target: 'node4',
    type: 'custom',
    data: {
      edgeType: 'stream',
      pathType: 'straight', // Uses direct line
      label: 'Stream',
    },
  },
  {
    id: 'e4',
    source: 'node4',
    target: 'node5',
    type: 'custom',
    data: {
      edgeType: 'dep',
      pathType: 'step', // Uses right-angle path
      label: 'Dependency',
    },
  },
  {
    id: 'e5',
    source: 'node5',
    target: 'node6',
    type: 'custom',
    data: {
      edgeType: 'event',
      pathType: 'smooth', // Uses smooth curve (default for event)
      label: 'Event',
    },
  },
  {
    id: 'e6',
    source: 'node6',
    target: 'node7',
    type: 'custom',
    data: {
      edgeType: 'sync',
      label: 'No pathType - uses default from edgeType',
    },
  },
];

/**
 * Edge Type Defaults:
 * 
 * sync    → smooth  (purple, solid)
 * async   → bezier  (amber, dashed, animated)
 * stream  → straight (green, dash-dot, animated)
 * event   → smooth  (pink, dashed)
 * dep     → step    (gray, solid)
 */

/**
 * Usage in React Flow:
 * 
 * 1. Import EDGE_TYPES with FlowEdge:
 *    const EDGE_TYPES = { custom: FlowEdge };
 * 
 * 2. Set default edge options:
 *    <ReactFlow defaultEdgeOptions={{ type: 'custom', data: { edgeType: 'sync' } }}>
 * 
 * 3. Create edges with data:
 *    <Edge
 *      id="e1"
 *      source="n1"
 *      target="n2"
 *      type="custom"
 *      data={{ edgeType: 'async', pathType: 'bezier' }}
 *    />
 * 
 * 4. Programmatic creation:
 *    const newEdge = {
 *      id: `edge-${Date.now()}`,
 *      source: sourceId,
 *      target: targetId,
 *      type: 'custom',
 *      data: { edgeType: 'sync', pathType: 'smooth' },
 *    };
 */
