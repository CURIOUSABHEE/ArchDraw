import { describe, it, expect } from 'vitest';
import { applyLayout, getLayerHint, normalizeLayer } from './stage6-layout';
import type { ValidatedDiagram, RawNode } from './types';

describe('Layout Engine Enhancements & Regression Tests', () => {
  describe('Layer Normalization', () => {
    it('should map presentation to client', () => {
      expect(normalizeLayer('presentation')).toBe('client');
    });

    it('should map compute/application to application', () => {
      expect(normalizeLayer('compute/application')).toBe('application');
      expect(normalizeLayer('compute')).toBe('application');
      expect(normalizeLayer('application')).toBe('application');
    });

    it('should map async to queue', () => {
      expect(normalizeLayer('async')).toBe('queue');
    });

    it('should map observe to observability', () => {
      expect(normalizeLayer('observe')).toBe('observability');
    });

    it('should map thirdparty to external', () => {
      expect(normalizeLayer('thirdparty')).toBe('external');
    });
  });

  describe('getLayerHint with fallback', () => {
    it('should trust node.layer first', () => {
      const node: RawNode = { id: '1', label: 'My Custom App', layer: 'observe' };
      expect(getLayerHint(node)).toBe(6); // observability column
    });

    it('should fall back to non-greedy regex matches on label when layer is missing', () => {
      const node1: RawNode = { id: '1', label: 'auth-service', layer: undefined as any };
      // Default fallback is 3 (application) since no regex explicitly matches auth-service label
      expect(getLayerHint(node1)).toBe(3);

      const node2: RawNode = { id: '2', label: 'Postgres DB', layer: undefined as any };
      expect(getLayerHint(node2)).toBe(5); // data tier
    });
  });

  describe('applyLayout logic checks', () => {
    it('should place group children inside group bounds', async () => {
      const validated: ValidatedDiagram = {
        nodes: [
          { id: 'group1', label: 'Compute Group', layer: 'application', isGroup: true },
          { id: 'node1', label: 'App Worker', layer: 'application', parentId: 'group1' },
          { id: 'node2', label: 'App Server', layer: 'application', parentId: 'group1' },
        ],
        edges: []
      };

      const result = await applyLayout(validated);
      const layoutNodes = result.nodes;

      // Group layout should be applied
      expect(result.diagnostics.groupLayoutApplied).toBe(true);

      const group = layoutNodes.find(n => n.id === 'group1')!;
      const child1 = layoutNodes.find(n => n.id === 'node1')!;
      const child2 = layoutNodes.find(n => n.id === 'node2')!;

      expect(group).toBeDefined();
      expect(child1).toBeDefined();
      expect(child2).toBeDefined();

      // Child coordinates should be parent-relative (converted)
      // Group bounds: min(childX) - 40, min(childY) - 40, etc.
      // So relative child position should be exactly 40 (inside group padding)
      expect(child1.x).toBeGreaterThanOrEqual(40);
      expect(child1.y).toBeGreaterThanOrEqual(40);
      expect(child2.x).toBeGreaterThanOrEqual(40);
      expect(child2.y).toBeGreaterThanOrEqual(40);
    });

    it('should run collision pass and resolve overlaps', async () => {
      const validated: ValidatedDiagram = {
        nodes: [
          { id: 'n1', label: 'Service A', layer: 'application' },
          { id: 'n2', label: 'Service B', layer: 'application' },
        ],
        edges: []
      };

      const result = await applyLayout(validated);
      expect(result.diagnostics.collisionCountAfter).toBe(0);
    });

    it('should preserve tier order in fallback layout', async () => {
      const validated: ValidatedDiagram = {
        nodes: [
          { id: 'n1', label: 'My Client', layer: 'presentation' },
          { id: 'n2', label: 'My DB', layer: 'data' },
          { id: 'n3', label: 'My Gateway', layer: 'gateway' },
        ],
        edges: []
      };

      const result = await applyLayout(validated);
      const clientNode = result.nodes.find(n => n.id === 'n1')!;
      const gatewayNode = result.nodes.find(n => n.id === 'n3')!;
      const dbNode = result.nodes.find(n => n.id === 'n2')!;

      // Left-to-right alignment: Client x < Gateway x < DB x
      expect(clientNode.x).toBeLessThan(gatewayNode.x);
      expect(gatewayNode.x).toBeLessThan(dbNode.x);
    });
  });
});
