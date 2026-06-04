import { describe, it, expect } from 'vitest';
import { assignHandlesToEdges } from './portAllocator';
import type { ArchitectureNode, ArchitectureEdge } from '../types';

function node(
  id: string,
  x: number,
  y: number,
  width = 180,
  height = 70
): ArchitectureNode {
  return {
    id,
    type: 'architectureNode',
    position: { x, y },
    label: id,
    layer: 'application' as any,
    width,
    height,
    icon: 'box',
    metadata: {},
    subtitle: '',
    serviceType: 'service' as any,
  } as ArchitectureNode;
}

function edge(id: string, source: string, target: string): ArchitectureEdge {
  return {
    id,
    source,
    target,
    sourceHandle: 'right' as any,
    targetHandle: 'left' as any,
    communicationType: 'sync' as any,
    pathType: 'smooth' as any,
    label: 'test',
    labelPosition: 'center',
    animated: false,
    style: { stroke: '#000', strokeDasharray: '', strokeWidth: 1 },
    markerEnd: 'arrowclosed' as any,
    markerStart: 'none' as any,
  } as ArchitectureEdge;
}

describe('assignHandlesToEdges (directional)', () => {
  it('uses right->left handles when target is to the right', () => {
    const nodes = [node('a', 0, 0), node('b', 400, 0)];
    const edges = [edge('e1', 'a', 'b')];
    const out = assignHandlesToEdges(edges, nodes, new Map());
    expect(out[0].sourceHandle).toBe('source-right');
    expect(out[0].targetHandle).toBe('target-left');
  });

  it('uses left->right handles when target is to the left', () => {
    const nodes = [node('a', 400, 0), node('b', 0, 0)];
    const edges = [edge('e1', 'a', 'b')];
    const out = assignHandlesToEdges(edges, nodes, new Map());
    expect(out[0].sourceHandle).toBe('source-left');
    expect(out[0].targetHandle).toBe('target-right');
  });

  it('uses bottom->top handles when target is below', () => {
    const nodes = [node('a', 0, 0), node('b', 0, 300)];
    const edges = [edge('e1', 'a', 'b')];
    const out = assignHandlesToEdges(edges, nodes, new Map());
    expect(out[0].sourceHandle).toBe('source-bottom');
    expect(out[0].targetHandle).toBe('target-top');
  });

  it('uses top->bottom handles when target is above', () => {
    const nodes = [node('a', 0, 300), node('b', 0, 0)];
    const edges = [edge('e1', 'a', 'b')];
    const out = assignHandlesToEdges(edges, nodes, new Map());
    expect(out[0].sourceHandle).toBe('source-top');
    expect(out[0].targetHandle).toBe('target-bottom');
  });
});

