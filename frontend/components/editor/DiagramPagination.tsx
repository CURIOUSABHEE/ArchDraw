'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDiagramStore } from '@/store/diagramStore';
import { toast } from 'sonner';

interface CanvasMeta {
  id: string;
  name: string;
  lastAccessedAt: number;
}

export function DiagramPagination() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canvases, activeCanvasId, addCanvas } = useDiagramStore();
  
  const [isNavigating, setIsNavigating] = useState(false);
  const [sortedCanvases, setSortedCanvases] = useState<CanvasMeta[]>([]);

  useEffect(() => {
    if (canvases.length > 0) {
      const sorted = [...canvases]
        .sort((a, b) => (b.lastAccessedAt || 0) - (a.lastAccessedAt || 0))
        .map(c => ({ id: c.id, name: c.name, lastAccessedAt: c.lastAccessedAt || 0 }));
      setSortedCanvases(sorted);
    }
  }, [canvases]);

  const currentIndex = sortedCanvases.findIndex(c => c.id === activeCanvasId);
  const currentCanvas = sortedCanvases[currentIndex];
  const totalCanvases = sortedCanvases.length;
  
  const canGoPrev = currentIndex > 0 && totalCanvases > 1;
  const canGoNext = currentIndex < totalCanvases - 1 && totalCanvases > 1;

  const navigateTo = useCallback(async (canvasId: string) => {
    if (isNavigating || canvasId === activeCanvasId) return;
    
    setIsNavigating(true);
    
    try {
      router.push(`/editor?canvas=${canvasId}`);
      toast.success('Diagram loaded');
    } catch {
      toast.error('Failed to load diagram');
    } finally {
      setTimeout(() => setIsNavigating(false), 300);
    }
  }, [isNavigating, activeCanvasId, router]);

  const handlePrev = useCallback(() => {
    if (canGoPrev) {
      navigateTo(sortedCanvases[currentIndex - 1].id);
    }
  }, [canGoPrev, currentIndex, sortedCanvases, navigateTo]);

  const handleNext = useCallback(() => {
    if (canGoNext) {
      navigateTo(sortedCanvases[currentIndex + 1].id);
    }
  }, [canGoNext, currentIndex, sortedCanvases, navigateTo]);

  const handleNew = useCallback(() => {
    addCanvas();
  }, [addCanvas]);

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

  if (totalCanvases === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {/* Previous button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-9 px-2 gap-1 text-muted-foreground"
        onClick={handlePrev}
        disabled={!canGoPrev || isNavigating}
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline text-xs">Prev</span>
      </Button>

      {/* Current diagram display */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 text-sm font-medium min-w-[140px] justify-center">
        <LayoutGrid className="w-4 h-4" />
        <span className="truncate max-w-[100px]">
          {currentCanvas?.name || 'Select'}
        </span>
        <span className="text-xs text-muted-foreground">
          {currentIndex + 1}/{totalCanvases}
        </span>
      </div>

      {/* Next button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-9 px-2 gap-1 text-muted-foreground"
        onClick={handleNext}
        disabled={!canGoNext || isNavigating}
      >
        <span className="hidden sm:inline text-xs">Next</span>
        <ChevronRight className="w-4 h-4" />
      </Button>

      {/* New button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-9 px-2 gap-1 ml-1 text-muted-foreground hover:text-foreground"
        onClick={handleNew}
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline text-xs">New</span>
      </Button>
    </div>
  );
}