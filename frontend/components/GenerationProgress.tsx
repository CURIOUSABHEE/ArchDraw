'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { GenerationProgress } from '@/lib/ai/types';

interface GenerationProgressProps {
  progress: GenerationProgress | null;
  onCancel?: () => void;
}

export function GenerationProgressDisplay({ progress, onCancel }: GenerationProgressProps) {
  if (!progress) return null;

  const getIcon = () => {
    switch (progress.phase) {
      case 'complete':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
    }
  };

  const getPhaseLabel = () => {
    return progress.phase.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card/95 backdrop-blur-md border border-border/60 shadow-lg">
        {getIcon()}
        
        <div className="flex flex-col gap-1 min-w-[200px]">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">{progress.message}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {progress.progress}%
            </span>
          </div>
          
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Iteration: {progress.iteration}</span>
            {progress.score > 0 && (
              <span className="flex items-center gap-1">
                Score: <span className={progress.score >= 85 ? 'text-emerald-500' : 'text-amber-500'}>
                  {progress.score}/100
                </span>
              </span>
            )}
            <span className="shrink-0">{getPhaseLabel()}</span>
          </div>
        </div>

        {onCancel && progress.phase !== 'complete' && progress.phase !== 'error' && (
          <button
            onClick={onCancel}
            className="p-1.5 rounded-md hover:bg-accent/50 transition-colors"
            title="Cancel"
          >
            <XCircle className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}

export function GenerationStatusBadge({ 
  isGenerating, 
  progress 
}: { 
  isGenerating: boolean; 
  progress: GenerationProgress | null;
}) {
  if (!isGenerating || !progress) return null;

  return (
    <div className="fixed top-14 right-4 z-40 animate-in slide-in-from-right-4 fade-in duration-300">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm border border-border/60 shadow-sm">
        <Loader2 className="w-3 h-3 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">
          Generating: {progress.phase.replace(/_/g, ' ')}
        </span>
        <span className="text-xs font-medium">
          {progress.progress}%
        </span>
      </div>
    </div>
  );
}
