import { useCallback, useEffect, useState } from 'react';
import { useDiagramStore } from '@/store/diagramStore';

export interface UseGroupingResult {
  selectionRect: { x: number; y: number; width: number; height: number } | null;
  isDrawingGroup: boolean;
  isShiftPressed: boolean;
}

/**
 * useGrouping hook - now simplified to only track keyboard state.
 * Actual grouping logic is moved to the Context Menu to prevent
 * interference with standard React Flow selection.
 */
export function useGrouping(): UseGroupingResult {
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in an input or textarea
    if (
      document.activeElement?.tagName === 'INPUT' ||
      document.activeElement?.tagName === 'TEXTAREA' ||
      (document.activeElement as HTMLElement)?.isContentEditable
    ) {
      return;
    }

    if (e.key === 'Shift') {
      setIsShiftPressed(true);
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'g') {
      e.preventDefault();
      
      const store = useDiagramStore.getState();
      
      if (e.shiftKey) {
        // Cmd + Shift + G: Ungroup selected groups
        const selectedIds = store.selectedNodeIds;
        if (selectedIds.length > 0) {
          selectedIds.forEach(id => {
            const node = store.nodes.find(n => n.id === id);
            if (node?.type === 'groupNode' || node?.type === 'group') {
              store.ungroupNodes(id);
            }
          });
        }
      } else {
        // Cmd + G: Group selected nodes
        if (store.selectedNodeIds.length > 1) {
          store.createGroup();
        }
      }
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      setIsShiftPressed(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return { 
    selectionRect: null, 
    isDrawingGroup: false, 
    isShiftPressed 
  };
}
