'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, Loader2, FilePlus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDiagramStore } from '@/store/diagramStore';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
      addCanvas();
    } else {
      const nextId = canvasList[currentIndex + 1]?.id;
      if (nextId) navigateTo(nextId);
    }
  }, [isAtLast, currentIndex, canvasList, navigateTo, addCanvas]);

  // Create new canvas
  const handleCreateNew = useCallback(async () => {
    setIsCreating(true);
    try {
      addCanvas();
      toast.success('Created new canvas');
    } catch {
      toast.error('Failed to create canvas');
    } finally {
      setIsCreating(false);
    }
  }, [addCanvas]);

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

  // Calculate 5 canvases before and 5 after
  const startIdx = Math.max(0, currentIndex - 5);
  const endIdx = Math.min(total - 1, currentIndex + 5);
  const visibleCanvases = canvasList.slice(startIdx, endIdx + 1);

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

      {/* Current canvas name with Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="px-3 py-1.5 rounded-md bg-muted/50 hover:bg-muted text-sm font-medium transition-colors focus:outline-none flex items-center gap-1">
            <span className="text-xs font-medium truncate max-w-[150px] block">
              {currentName}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48 max-h-[300px] overflow-y-auto">
          {visibleCanvases.map((c) => (
            <DropdownMenuItem 
              key={c.id} 
              onClick={() => navigateTo(c.id)}
              className={`text-xs ${c.id === activeCanvasId ? 'bg-accent font-semibold' : ''}`}
            >
              <span className="truncate">{c.name || 'Untitled'}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

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

      {/* New Canvas button - always visible */}
      {total > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-2 text-muted-foreground"
          onClick={handleCreateNew}
          disabled={isCreating}
          title="Create new canvas"
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FilePlus className="w-4 h-4" />
          )}
        </Button>
      )}
    </div>
  );
}