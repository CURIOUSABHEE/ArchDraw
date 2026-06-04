import { describe, it, expect } from 'vitest';
import { convertToReactFlow } from './stage7-convert';
import type { LayoutedNode } from './types';

describe('stage7-convert edge labels', () => {
  it('copies edge label into data.label for SimpleFloatingEdge', () => {
    const layouted: LayoutedNode[] = [
      {
        id: 'a',
        label: 'Service A',
        layer: 'application',
        x: 0,
        y: 0,
        width: 180,
        height: 70,
      },
      {
        id: 'b',
        label: 'Service B',
        layer: 'data',
        x: 300,
        y: 0,
        width: 180,
        height: 70,
      },
    ];

    const { edges } = convertToReactFlow(layouted, {
      nodes: layouted,
      edges: [
        {
          id: 'e1',
          source: 'a',
          target: 'b',
          label: 'reads records',
          async: false,
        },
      ],
    });

    expect(edges).toHaveLength(1);
    expect(edges[0].data?.label).toBe('reads records');
  });
});
