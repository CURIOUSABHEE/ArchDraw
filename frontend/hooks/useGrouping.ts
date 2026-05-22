import { useCallback, useEffect, useState } from 'react';

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
    if (e.key === 'Shift') {
      setIsShiftPressed(true);
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
