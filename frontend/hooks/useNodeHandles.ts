'use client';

import { useMemo } from 'react';
import { useDiagramStore } from '@/store/diagramStore';

export type HandleId =
  | 'source-left'
  | 'target-left'
  | 'source-right'
  | 'target-right'
  | 'source-top'
  | 'target-top'
  | 'source-bottom'
  | 'target-bottom';

/**
 * Returns the set of handle IDs that are actually referenced by edges
 * connected to the given node.
 *
 * If no edges are connected, returns an empty Set — callers should fall
 * back to a single centered (fallback) handle.
 */
export function useNodeHandles(nodeId: string): Set<HandleId> {
  const edges = useDiagramStore((s) => s.edges);

  return useMemo(() => {
    const needed = new Set<HandleId>();

    for (const edge of edges || []) {
      if (edge.source === nodeId && edge.sourceHandle) {
        needed.add(edge.sourceHandle as HandleId);
      }
      if (edge.target === nodeId && edge.targetHandle) {
        needed.add(edge.targetHandle as HandleId);
      }
    }

    return needed;
  }, [edges, nodeId]);
}
