/**
 * Unit tests for dynamic handle positioning
 * Tests specific examples and edge cases for handle selection logic
 */

import { describe, it, expect } from 'vitest';
import { Position } from 'reactflow';
import { getDynamicHandles, getHandleCoordinate, type NodeRect } from './dynamicHandles';

describe('getDynamicHandles', () => {
  describe('horizontal dominance scenarios', () => {
    it('should select Right → Left when target is to the right', () => {
      const sourceRect: NodeRect = { x: 0, y: 0, width: 100, height: 80 };
      const targetRect: NodeRect = { x: 200, y: 10, width: 100, height: 80 };

      const result = getDynamicHandles(sourceRect, targetRect);

      expect(result.sourcePosition).toBe(Position.Right);
      expect(result.targetPosition).toBe(Position.Left);
    });

    it('should select Left → Right when target is to the left', () => {
      const sourceRect: NodeRect = { x: 200, y: 0, width: 100, height: 80 };
      const targetRect: NodeRect = { x: 0, y: 10, width: 100, height: 80 };

      const result = getDynamicHandles(sourceRect, targetRect);

      expect(result.sourcePosition).toBe(Position.Left);
      expect(result.targetPosition).toBe(Position.Right);
    });
  });

  describe('vertical dominance scenarios', () => {
    it('should select Bottom → Top when target is below', () => {
      const sourceRect: NodeRect = { x: 0, y: 0, width: 100, height: 80 };
      const targetRect: NodeRect = { x: 10, y: 200, width: 100, height: 80 };

      const result = getDynamicHandles(sourceRect, targetRect);

      expect(result.sourcePosition).toBe(Position.Bottom);
      expect(result.targetPosition).toBe(Position.Top);
    });

    it('should select Top → Bottom when target is above', () => {
      const sourceRect: NodeRect = { x: 0, y: 200, width: 100, height: 80 };
      const targetRect: NodeRect = { x: 10, y: 0, width: 100, height: 80 };

      const result = getDynamicHandles(sourceRect, targetRect);

      expect(result.sourcePosition).toBe(Position.Top);
      expect(result.targetPosition).toBe(Position.Bottom);
    });
  });

  describe('tie-breaking and edge cases', () => {
    it('should prefer horizontal handles when distances are equal', () => {
      const sourceRect: NodeRect = { x: 0, y: 0, width: 100, height: 80 };
      const targetRect: NodeRect = { x: 100, y: 100, width: 100, height: 80 };

      const result = getDynamicHandles(sourceRect, targetRect);

      // When |dx| === |dy|, horizontal handles should be selected
      expect(result.sourcePosition).toBe(Position.Right);
      expect(result.targetPosition).toBe(Position.Left);
    });

    it('should handle identical positions with default Right → Left', () => {
      const sourceRect: NodeRect = { x: 100, y: 100, width: 100, height: 80 };
      const targetRect: NodeRect = { x: 100, y: 100, width: 100, height: 80 };

      const result = getDynamicHandles(sourceRect, targetRect);

      // When nodes are at the same position, dx = 0, dy = 0
      // |dx| >= |dy| is true (0 >= 0), and dx >= 0 is true
      expect(result.sourcePosition).toBe(Position.Right);
      expect(result.targetPosition).toBe(Position.Left);
    });

    it('should work with different node dimensions', () => {
      const sourceRect: NodeRect = { x: 0, y: 0, width: 200, height: 100 };
      const targetRect: NodeRect = { x: 300, y: 50, width: 150, height: 60 };

      const result = getDynamicHandles(sourceRect, targetRect);

      // Target is to the right (horizontal dominance)
      expect(result.sourcePosition).toBe(Position.Right);
      expect(result.targetPosition).toBe(Position.Left);
    });
  });
});

describe('getHandleCoordinate', () => {
  const rect: NodeRect = { x: 100, y: 200, width: 200, height: 80 };

  it('should calculate Top handle coordinate correctly', () => {
    const coord = getHandleCoordinate(rect, Position.Top);
    
    // Top handle: (centerX, y)
    expect(coord.x).toBe(200); // 100 + 200/2
    expect(coord.y).toBe(200); // y
  });

  it('should calculate Bottom handle coordinate correctly', () => {
    const coord = getHandleCoordinate(rect, Position.Bottom);
    
    // Bottom handle: (centerX, y + height)
    expect(coord.x).toBe(200); // 100 + 200/2
    expect(coord.y).toBe(280); // 200 + 80
  });

  it('should calculate Left handle coordinate correctly', () => {
    const coord = getHandleCoordinate(rect, Position.Left);
    
    // Left handle: (x, centerY)
    expect(coord.x).toBe(100); // x
    expect(coord.y).toBe(240); // 200 + 80/2
  });

  it('should calculate Right handle coordinate correctly', () => {
    const coord = getHandleCoordinate(rect, Position.Right);
    
    // Right handle: (x + width, centerY)
    expect(coord.x).toBe(300); // 100 + 200
    expect(coord.y).toBe(240); // 200 + 80/2
  });

  it('should work with different node dimensions', () => {
    const smallRect: NodeRect = { x: 50, y: 50, width: 100, height: 60 };
    
    const topCoord = getHandleCoordinate(smallRect, Position.Top);
    expect(topCoord.x).toBe(100); // 50 + 100/2
    expect(topCoord.y).toBe(50);

    const rightCoord = getHandleCoordinate(smallRect, Position.Right);
    expect(rightCoord.x).toBe(150); // 50 + 100
    expect(rightCoord.y).toBe(80); // 50 + 60/2
  });
});

describe('backward compatibility and error handling', () => {
  it('should ignore legacy sourceHandle/targetHandle and use dynamic positions', () => {
    // The function is pure and doesn't accept legacy handle props
    // It computes positions purely from rect geometry
    const sourceRect: NodeRect = { x: 0, y: 0, width: 100, height: 80 };
    const targetRect: NodeRect = { x: 200, y: 0, width: 100, height: 80 };

    const result = getDynamicHandles(sourceRect, targetRect);

    // Dynamic calculation always wins regardless of any legacy props
    expect(result.sourcePosition).toBe(Position.Right);
    expect(result.targetPosition).toBe(Position.Left);
  });

  it('should handle missing node dimensions via zero-width/height gracefully', () => {
    const sourceRect: NodeRect = { x: 0, y: 0, width: 0, height: 0 };
    const targetRect: NodeRect = { x: 100, y: 0, width: 0, height: 0 };

    const result = getDynamicHandles(sourceRect, targetRect);

    // Should still produce valid positions
    const validPositions = [Position.Top, Position.Right, Position.Bottom, Position.Left];
    expect(validPositions).toContain(result.sourcePosition);
    expect(validPositions).toContain(result.targetPosition);
  });
});
