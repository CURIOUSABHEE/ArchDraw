import { useEffect, useCallback, useRef } from 'react';
import { useDiagramStore } from '@/store/diagramStore';
import { canvasCache, type CachedCanvas } from './canvasCache';

export function useCanvasPreload() {
  const preloadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { canvases, activeCanvasId } = useDiagramStore();

  const preloadCanvas = useCallback(async (canvasId: string) => {
    if (canvasCache.has(canvasId)) return;
    
    try {
      const response = await fetch(`/api/diagram/load?id=${canvasId}`);
      if (!response.ok) return;
      
      const data = await response.json();
      
      if (data.nodes && data.edges) {
        canvasCache.set(canvasId, {
          id: canvasId,
          name: data.label || 'Untitled',
          nodes: data.nodes,
          edges: data.edges,
        });
      }
    } catch (error) {
      console.error('Failed to preload canvas:', error);
    }
  }, []);

  const preloadAdjacent = useCallback(() => {
    if (!activeCanvasId || canvases.length < 2) return;
    
    // Find current index
    const currentIndex = canvases.findIndex(c => c.id === activeCanvasId);
    if (currentIndex === -1) return;
    
    // Preload previous and next
    const prevId = currentIndex > 0 ? canvases[currentIndex - 1]?.id : null;
    const nextId = currentIndex < canvases.length - 1 ? canvases[currentIndex + 1]?.id : null;
    
    if (prevId) preloadCanvas(prevId);
    if (nextId) preloadCanvas(nextId);
  }, [activeCanvasId, canvases, preloadCanvas]);

  // Preload adjacent on canvas change
  useEffect(() => {
    if (preloadTimerRef.current) {
      clearTimeout(preloadTimerRef.current);
    }
    
    preloadTimerRef.current = setTimeout(() => {
      preloadAdjacent();
    }, 500);
    
    return () => {
      if (preloadTimerRef.current) {
        clearTimeout(preloadTimerRef.current);
      }
    };
  }, [activeCanvasId, preloadAdjacent]);

  // Preload on hover (for navigation buttons)
  const handleHoverPreload = useCallback((canvasId: string) => {
    if (!canvasCache.has(canvasId)) {
      preloadCanvas(canvasId);
    }
  }, [preloadCanvas]);

  return {
    preloadCanvas,
    preloadAdjacent,
    handleHoverPreload,
  };
}