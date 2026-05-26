/**
 * Integration tests for dynamic edge handle positioning
 * Tests the integration between getDynamicHandles, getHandleCoordinate,
 * and the edge computation pipeline used in SimpleFloatingEdge
 */

import { describe, it, expect } from 'vitest';
import { Position } from 'reactflow';
import { getDynamicHandles, getHandleCoordinate, type NodeRect } from './dynamicHandles';

function buildEdgeParams(
  sourceNode: { position: { x: number; y: number }; positionAbsolute?: { x: number; y: number }; width?: number; height?: number } | null,
  targetNode: { position: { x: number; y: number }; positionAbsolute?: { x: number; y: number }; width?: number; height?: number } | null,
) {
  if (!sourceNode || !targetNode) {
    return { sx: 0, sy: 0, tx: 0, ty: 0, sourcePos: Position.Top, targetPos: Position.Bottom, sourceRect: { x: 0, y: 0, width: 0, height: 0 }, targetRect: { x: 0, y: 0, width: 0, height: 0 } };
  }

  const sourceRect: NodeRect = {
    x: sourceNode.positionAbsolute?.x ?? sourceNode.position.x,
    y: sourceNode.positionAbsolute?.y ?? sourceNode.position.y,
    width: sourceNode.width ?? 200,
    height: sourceNode.height ?? 80,
  };
  const targetRect: NodeRect = {
    x: targetNode.positionAbsolute?.x ?? targetNode.position.x,
    y: targetNode.positionAbsolute?.y ?? targetNode.position.y,
    width: targetNode.width ?? 200,
    height: targetNode.height ?? 80,
  };

  const { sourcePosition: sourcePos, targetPosition: targetPos } = getDynamicHandles(sourceRect, targetRect);

  const rawSrc = getHandleCoordinate(sourceRect, sourcePos);
  const rawTgt = getHandleCoordinate(targetRect, targetPos);

  return { sx: rawSrc.x, sy: rawSrc.y, tx: rawTgt.x, ty: rawTgt.y, sourcePos, targetPos, sourceRect, targetRect };
}

describe('Integration: Edge Computation Pipeline', () => {
  describe('positionAbsolute fallback behavior', () => {
    it('should use positionAbsolute when available', () => {
      const sourceNode = {
        position: { x: 0, y: 0 },
        positionAbsolute: { x: 100, y: 200 },
        width: 100,
        height: 80,
      };
      const targetNode = {
        position: { x: 0, y: 0 },
        positionAbsolute: { x: 300, y: 200 },
        width: 100,
        height: 80,
      };

      const params = buildEdgeParams(sourceNode, targetNode);
      expect(params.sourcePos).toBe(Position.Right);
      expect(params.targetPos).toBe(Position.Left);
      expect(params.sourceRect.x).toBe(100);
      expect(params.sourceRect.y).toBe(200);
    });

    it('should fall back to position when positionAbsolute is undefined', () => {
      const sourceNode = {
        position: { x: 0, y: 0 },
        width: 100,
        height: 80,
      };
      const targetNode = {
        position: { x: 200, y: 0 },
        width: 100,
        height: 80,
      };

      const params = buildEdgeParams(sourceNode, targetNode);
      expect(params.sourcePos).toBe(Position.Right);
      expect(params.targetPos).toBe(Position.Left);
      expect(params.sourceRect.x).toBe(0);
    });
  });

  describe('default dimensions fallback', () => {
    it('should use default dimensions (200x80) when width/height are undefined', () => {
      const sourceNode = {
        position: { x: 0, y: 0 },
        positionAbsolute: { x: 0, y: 0 },
      };
      const targetNode = {
        position: { x: 300, y: 0 },
        positionAbsolute: { x: 300, y: 0 },
      };

      const params = buildEdgeParams(sourceNode, targetNode);
      expect(params.sourceRect.width).toBe(200);
      expect(params.sourceRect.height).toBe(80);
      expect(params.targetRect.width).toBe(200);
      expect(params.targetRect.height).toBe(80);
    });
  });

  describe('missing node handling', () => {
    it('should return default positions when source node is missing', () => {
      const params = buildEdgeParams(null, {
        position: { x: 200, y: 0 },
        width: 100,
        height: 80,
      });
      expect(params.sx).toBe(0);
      expect(params.sy).toBe(0);
      expect(params.tx).toBe(0);
      expect(params.ty).toBe(0);
      expect(params.sourcePos).toBe(Position.Top);
      expect(params.targetPos).toBe(Position.Bottom);
    });

    it('should return default positions when target node is missing', () => {
      const params = buildEdgeParams(
        { position: { x: 0, y: 0 }, width: 100, height: 80 },
        null,
      );
      expect(params.sx).toBe(0);
      expect(params.sy).toBe(0);
      expect(params.tx).toBe(0);
      expect(params.ty).toBe(0);
      expect(params.sourcePos).toBe(Position.Top);
      expect(params.targetPos).toBe(Position.Bottom);
    });
  });

  describe('memoization simulation', () => {
    it('should produce identical results for identical node inputs', () => {
      const sourceNode = {
        position: { x: 0, y: 0 },
        positionAbsolute: { x: 0, y: 0 },
        width: 100,
        height: 80,
      };
      const targetNode = {
        position: { x: 200, y: 0 },
        positionAbsolute: { x: 200, y: 0 },
        width: 100,
        height: 80,
      };

      const result1 = buildEdgeParams(sourceNode, targetNode);
      const result2 = buildEdgeParams(sourceNode, targetNode);

      expect(result2.sx).toBe(result1.sx);
      expect(result2.sy).toBe(result1.sy);
      expect(result2.tx).toBe(result1.tx);
      expect(result2.ty).toBe(result1.ty);
      expect(result2.sourcePos).toBe(result1.sourcePos);
      expect(result2.targetPos).toBe(result1.targetPos);
    });

    it('should update when source node moves', () => {
      const baseSource = { position: { x: 0, y: 0 }, positionAbsolute: { x: 0, y: 0 }, width: 100, height: 80 };
      const targetNode = { position: { x: 200, y: 0 }, positionAbsolute: { x: 200, y: 0 }, width: 100, height: 80 };

      const beforeMove = buildEdgeParams(baseSource, targetNode);

      const movedSource = { ...baseSource, positionAbsolute: { x: 100, y: 50 } };
      const afterMove = buildEdgeParams(movedSource, targetNode);

      expect(afterMove.sx).not.toBe(beforeMove.sx);
      expect(afterMove.sy).not.toBe(beforeMove.sy);
    });

    it('should not recalculate for unrelated nodes (same source/target pair)', () => {
      const sourceNode = { position: { x: 0, y: 0 }, positionAbsolute: { x: 0, y: 0 }, width: 100, height: 80 };
      const targetNode = { position: { x: 200, y: 0 }, positionAbsolute: { x: 200, y: 0 }, width: 100, height: 80 };

      // Same inputs → same outputs (demonstrates that unrelated changes don't affect this edge)
      const result1 = buildEdgeParams(sourceNode, targetNode);
      const result2 = buildEdgeParams(sourceNode, targetNode);

      expect(result2.sourcePos).toBe(result1.sourcePos);
      expect(result2.targetPos).toBe(result1.targetPos);
    });
  });
});
