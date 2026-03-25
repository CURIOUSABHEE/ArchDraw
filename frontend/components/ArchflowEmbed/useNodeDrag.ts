import { useState, useCallback, RefObject } from 'react';
import type { NodeDef } from './types';

const NODE_WIDTH = 100;
const NODE_HEIGHT = 70;

interface Position {
  x: number;
  y: number;
}

export function useNodeDrag(
  initialNodes: NodeDef[],
  containerRef: RefObject<HTMLDivElement | null>,
  interactive: boolean = true
) {
  const [positions, setPositions] = useState<Record<string, Position>>(() => {
    const initial: Record<string, Position> = {};
    initialNodes.forEach((node) => {
      initial[node.id] = { x: node.x ?? 0, y: node.y ?? 0 };
    });
    return initial;
  });

  const [draggingId, setDraggingId] = useState<string | null>(null);

  const onMouseDown = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      if (!interactive) return;
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX - positions[nodeId].x;
      const startY = e.clientY - positions[nodeId].y;

      setDraggingId(nodeId);

      const onMove = (moveEvent: MouseEvent) => {
        if (!containerRef.current) return;
        const container = containerRef.current.getBoundingClientRect();

        const newX = moveEvent.clientX - startX;
        const newY = moveEvent.clientY - startY;

        const clampedX = Math.max(0, Math.min(newX, container.width - NODE_WIDTH));
        const clampedY = Math.max(0, Math.min(newY, container.height - NODE_HEIGHT));

        setPositions((prev) => ({
          ...prev,
          [nodeId]: { x: clampedX, y: clampedY },
        }));
      };

      const onUp = () => {
        setDraggingId(null);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [interactive, positions, containerRef]
  );

  const onTouchStart = useCallback(
    (nodeId: string, e: React.TouchEvent) => {
      if (!interactive) return;
      e.preventDefault();
      e.stopPropagation();

      const touch = e.touches[0];
      const startX = touch.clientX - positions[nodeId].x;
      const startY = touch.clientY - positions[nodeId].y;

      setDraggingId(nodeId);

      const onMove = (moveEvent: TouchEvent) => {
        if (!containerRef.current) return;
        const container = containerRef.current.getBoundingClientRect();
        const moveTouch = moveEvent.touches[0];

        const newX = moveTouch.clientX - startX;
        const newY = moveTouch.clientY - startY;

        const clampedX = Math.max(0, Math.min(newX, container.width - NODE_WIDTH));
        const clampedY = Math.max(0, Math.min(newY, container.height - NODE_HEIGHT));

        setPositions((prev) => ({
          ...prev,
          [nodeId]: { x: clampedX, y: clampedY },
        }));
      };

      const onEnd = () => {
        setDraggingId(null);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onEnd);
      };

      window.addEventListener('touchmove', onMove);
      window.addEventListener('touchend', onEnd);
    },
    [interactive, positions, containerRef]
  );

  return {
    positions,
    draggingId,
    onMouseDown,
    onTouchStart,
  };
}
