'use client';

import { Plus, FileText, Sparkles } from 'lucide-react';

interface NewCanvasBannerProps {
  onFromScratch: () => void;
  onFromTemplate: () => void;
  onAIGenerate: () => void;
}

export function NewCanvasBanner({ onFromScratch, onFromTemplate, onAIGenerate }: NewCanvasBannerProps) {
  return (
    <div className="draft-border grid-bg rounded-[20px] p-8 md:p-12 relative overflow-hidden canvas-card border border-border bg-surface-panel">
      <div className="max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
          Create your first canvas
        </h1>
        <p className="text-sm md:text-base text-text-secondary mb-6">
          Start designing your architecture
        </p>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onFromScratch}
            className="flex items-center gap-2 px-5 py-3 rounded-[14px] text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            From Scratch
          </button>
          
          <button
            onClick={onFromTemplate}
            className="flex items-center gap-2 px-5 py-3 rounded-[14px] text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] text-text-primary cursor-pointer"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <FileText className="w-4 h-4" />
            From Template
          </button>
          
          <button
            onClick={onAIGenerate}
            className="flex items-center gap-2 px-5 py-3 rounded-[14px] text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] text-text-primary cursor-pointer"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <Sparkles className="w-4 h-4" />
            AI Generate
          </button>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 w-24 h-24 rounded-full border border-dashed border-border opacity-20" />
      <div className="absolute bottom-4 right-12 w-16 h-16 rounded-full border border-dashed border-border opacity-15" />
    </div>
  );
}
