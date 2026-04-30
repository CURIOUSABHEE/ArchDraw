'use client';

import { Plus, FileText, Sparkles } from 'lucide-react';

interface NewCanvasBannerProps {
  onFromScratch: () => void;
  onFromTemplate: () => void;
  onAIGenerate: () => void;
}

export function NewCanvasBanner({ onFromScratch, onFromTemplate, onAIGenerate }: NewCanvasBannerProps) {
  return (
    <div className="draft-border grid-bg rounded-[20px] p-8 md:p-12 relative overflow-hidden canvas-card">
      <div className="max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] dark:text-white mb-2">
          Create your first canvas
        </h1>
        <p className="text-sm md:text-base text-[#6B6B6B] dark:text-gray-400 mb-6">
          Start designing your architecture
        </p>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onFromScratch}
            className="flex items-center gap-2 px-5 py-3 rounded-[14px] text-sm font-medium text-white bg-[#1A1A1A] dark:bg-white dark:text-[#1A1A1A] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            From Scratch
          </button>
          
          <button
            onClick={onFromTemplate}
            className="flex items-center gap-2 px-5 py-3 rounded-[14px] text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'hsl(var(--card))', boxShadow: '0 2px 8px hsl(var(--foreground) / 0.06)' }}
          >
            <FileText className="w-4 h-4" />
            From Template
          </button>
          
          <button
            onClick={onAIGenerate}
            className="flex items-center gap-2 px-5 py-3 rounded-[14px] text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'hsl(var(--card))', boxShadow: '0 2px 8px hsl(var(--foreground) / 0.06)' }}
          >
            <Sparkles className="w-4 h-4" />
            AI Generate
          </button>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 w-24 h-24 rounded-full border border-dashed border-[#6B6B6B] opacity-20" />
      <div className="absolute bottom-4 right-12 w-16 h-16 rounded-full border border-dashed border-[#6B6B6B] opacity-15" />
    </div>
  );
}
