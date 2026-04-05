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

  const getAgentLabel = (phase: string): string => {
    const phaseMap: Record<string, string> = {
      'planning': 'Analyzing requirements',
      'components': 'Generating components',
      'edges': 'Creating connections',
      'layout': 'Computing layout',
      'scoring': 'Evaluating quality',
      'complete': 'Complete',
      'error': 'Error'
    };
    return phaseMap[phase] || phase;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-300"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        {getIcon()}
        
        <div className="flex flex-col gap-2 min-w-[280px]">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-gray-700">
              {getAgentLabel(progress.phase)}
            </span>
            <span className="text-sm font-bold text-indigo-600 shrink-0">
              {progress.progress}%
            </span>
          </div>
          
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500 ease-out"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">
              {progress.currentAgent && (
                <span className="font-medium text-gray-500 capitalize">{progress.currentAgent}</span>
              )}
            </span>
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
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            title="Cancel"
          >
            <XCircle className="w-4 h-4 text-gray-400" />
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
