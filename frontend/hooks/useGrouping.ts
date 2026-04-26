import { useCallback, useEffect, useRef, useState } from 'react';
import type { Node } from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';
import { useReactFlow } from 'reactflow';
import { toast } from 'sonner';

export interface UseGroupingResult {
  selectionRect: { x: number; y: number; width: number; height: number } | null;
  isDrawingGroup: boolean;
  isShiftPressed: boolean;
}

function getNodesInRectAtScreen(
  nodes: Node[],
  rect: { x: number; y: number; width: number; height: number },
  screenToFlowPosition: (pos: { x: number; y: number }) => { x: number; y: number }
): Node[] {
  const topLeft = screenToFlowPosition({ x: rect.x, y: rect.y });
  const bottomRight = screenToFlowPosition({ x: rect.x + rect.width, y: rect.y + rect.height });

  const flowRect = {
    x: topLeft.x,
    y: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };

  return nodes.filter((node) => {
    if (node.type === 'groupNode' || node.type === 'group') return false;
    
    const nodeWidth = node.width ?? 160;
    const nodeHeight = node.height ?? 80;
    const nodeCenterX = node.position.x + nodeWidth / 2;
    const nodeCenterY = node.position.y + nodeHeight / 2;

    return (
      nodeCenterX >= flowRect.x &&
      nodeCenterX <= flowRect.x + flowRect.width &&
      nodeCenterY >= flowRect.y &&
      nodeCenterY <= flowRect.y + flowRect.height
    );
  });
}

export function useGrouping(): UseGroupingResult {
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isDrawingGroup, setIsDrawingGroup] = useState(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const rectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const { screenToFlowPosition } = useReactFlow();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      setIsShiftPressed(true);
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      setIsShiftPressed(false);
    }
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!e.shiftKey) return;
    
    const target = e.target as HTMLElement;
    const pane = target.closest('.react-flow__pane');
    if (pane) {
      e.stopPropagation();
      const bounds = pane.getBoundingClientRect();
      startPosRef.current = { x: e.clientX - bounds.left, y: e.clientY - bounds.top };
      setIsDrawingGroup(true);
      setSelectionRect(null);
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!startPosRef.current) return;
    const target = e.target as HTMLElement;
    const pane = target.closest('.react-flow__pane');
    const bounds = pane?.getBoundingClientRect();
    if (!bounds) return;

    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    const start = startPosRef.current;

    const rect = {
      x: Math.min(start.x, x),
      y: Math.min(start.y, y),
      width: Math.abs(x - start.x),
      height: Math.abs(y - start.y),
    };
    
    rectRef.current = rect;
    setSelectionRect(rect);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!startPosRef.current) return;
    
    startPosRef.current = null;
    setIsDrawingGroup(false);
    const rect = rectRef.current;
    rectRef.current = null;
    setSelectionRect(null);
    
    if (!rect || rect.width < 50 || rect.height < 50) return;

    const currentNodes = useDiagramStore.getState().nodes;
    const nodesInRect = getNodesInRectAtScreen(
      currentNodes,
      rect,
      screenToFlowPosition
    );

    if (nodesInRect.length >= 2) {
      useDiagramStore.getState().pushHistory();
      useDiagramStore.getState().setSelectedNodeIds(nodesInRect.map((n) => n.id));
      useDiagramStore.getState().createGroup();
      toast.success(`Created group with ${nodesInRect.length} nodes`);
    } else if (nodesInRect.length === 1) {
      toast.info('Select at least 2 nodes to create a group');
    }
  }, [screenToFlowPosition]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown, true);
    window.addEventListener('mousemove', handleMouseMove, true);
    window.addEventListener('mouseup', handleMouseUp, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown, true);
      window.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('mouseup', handleMouseUp, true);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseDown, handleMouseMove, handleMouseUp]);

  return { selectionRect, isDrawingGroup, isShiftPressed };
}