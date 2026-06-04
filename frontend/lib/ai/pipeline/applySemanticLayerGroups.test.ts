import { describe, it, expect } from 'vitest';
import { applySemanticLayerGroups } from './applySemanticLayerGroups';
import type { LayoutedNode } from './types';

function leaf(
  id: string,
  layer: string,
  x: number,
  y: number
): LayoutedNode {
  return {
    id,
    label: id,
    layer: layer as LayoutedNode['layer'],
    x,
    y,
    width: 180,
    height: 80,
  };
}

describe('applySemanticLayerGroups', () => {
  it('creates a group when two or more nodes share a layer', () => {
    const input = [
      leaf('db1', 'data', 100, 100),
      leaf('db2', 'data', 100, 250),
      leaf('api1', 'application', 500, 100),
    ];

    const result = applySemanticLayerGroups(input);
    const groups = result.filter((n) => n.isGroup);
    const db1 = result.find((n) => n.id === 'db1')!;
    const api1 = result.find((n) => n.id === 'api1')!;

    expect(groups).toHaveLength(1);
    expect(groups[0].groupLabel).toBe('Data Stores');
    expect(db1.parentId).toBe(groups[0].id);
    expect(db1.x).toBeGreaterThanOrEqual(40);
    expect(api1.parentId).toBeUndefined();
  });

  it('leaves singleton layers ungrouped', () => {
    const input = [leaf('web', 'client', 0, 0), leaf('db', 'data', 0, 200), leaf('db2', 'data', 0, 320)];
    const result = applySemanticLayerGroups(input);

    expect(result.find((n) => n.id === 'web')?.parentId).toBeUndefined();
    expect(result.filter((n) => n.isGroup)).toHaveLength(1);
  });

  it('does not re-group nodes that already have a parent', () => {
    const input: LayoutedNode[] = [
      {
        id: 'g1',
        label: 'Custom',
        layer: 'application',
        isGroup: true,
        x: 0,
        y: 0,
        width: 400,
        height: 300,
      },
      {
        id: 'n1',
        label: 'Inside',
        layer: 'application',
        parentId: 'g1',
        x: 40,
        y: 40,
        width: 180,
        height: 80,
      },
      leaf('api2', 'application', 600, 100),
      leaf('api3', 'application', 600, 250),
    ];

    const result = applySemanticLayerGroups(input);
    expect(result.filter((n) => n.isGroup)).toHaveLength(2);
    expect(result.find((n) => n.id === 'n1')?.parentId).toBe('g1');
  });
});
