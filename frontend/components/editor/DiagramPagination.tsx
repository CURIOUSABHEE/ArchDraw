'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDiagramStore } from '@/store/diagramStore';
import { toast } from 'sonner';

export function DiagramPagination() {
  const router = useRouter();
  const { canvases, activeCanvasId, addCanvas, switchCanvas } = useDiagramStore();
  
  const [isNavigating, setIsNavigating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Canvas list from store
  const canvasList = canvases || [];
  const total = canvasList.length;
  
  // Find current index (0-based)
  const currentIndex = canvasList.findIndex(c => c.id === activeCanvasId);
  const currentCanvas = canvasList[currentIndex];
  const currentName = currentCanvas?.name || 'Untitled';
  
  // Previous button: disabled at first position
  const canGoPrev = currentIndex > 0;
  
  // Next button: NEVER disabled - creates new if at last
  const isAtLast = currentIndex === total - 1;

  const navigateTo = useCallback(async (canvasId: string, isNew?: boolean) => {
    if (!canvasId) return;
    if (canvasId === activeCanvasId) return;
    
    if (isNew) {
      setIsCreating(true);
    } else {
      setIsNavigating(true);
    }
    
    try {
      router.push(`/editor?canvas=${canvasId}`);
      switchCanvas(canvasId);
      if (isNew) {
        toast.success('Created new canvas');
      }
    } catch {
      toast.error('Failed to load canvas');
    } finally {
      setIsNavigating(false);
      setIsCreating(false);
    }
  }, [activeCanvasId, router, switchCanvas]);

  // Previous: go to previous (lower position)
  const handlePrev = useCallback(() => {
    if (canGoPrev && currentIndex > 0) {
      const prevId = canvasList[currentIndex - 1]?.id;
      if (prevId) navigateTo(prevId);
    }
  }, [canGoPrev, currentIndex, canvasList, navigateTo]);

  // Next: go to next if exists, otherwise create new
  const handleNext = useCallback(async () => {
    if (isAtLast) {
      // At last position - create new canvas
      addCanvas();
    } else {
      // Navigate to existing next
      const nextId = canvasList[currentIndex + 1]?.id;
      if (nextId) navigateTo(nextId);
    }
  }, [isAtLast, currentIndex, canvasList, navigateTo, addCanvas]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleNext();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  // Don't render if no canvases or invalid state
  if (total === 0 || currentIndex < 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {/* Previous - disabled at position 1 */}
      <Button
        variant="ghost"
        size="sm"
        className="h-9 px-2 text-muted-foreground"
        onClick={handlePrev}
        disabled={!canGoPrev || isNavigating || isCreating}
      >
        {isNavigating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>

      {/* Current canvas name */}
      <div className="px-3 py-1.5 rounded-md bg-muted/50 text-sm font-medium">
        <span className="text-xs font-medium truncate max-w-[150px] block">
          {currentName}
        </span>
      </div>

      {/* Next - NEVER disabled */}
      <Button
        variant="ghost"
        size="sm"
        className="h-9 px-2 text-muted-foreground"
        onClick={handleNext}
        disabled={isNavigating || isCreating}
      >
        {isCreating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isAtLast ? (
          <Plus className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}