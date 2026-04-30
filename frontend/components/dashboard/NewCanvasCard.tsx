'use client';

import { Plus, FileText, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface NewCanvasCardProps {
  onClick: () => void;
  onTemplate: () => void;
  onAI: () => void;
}

export function NewCanvasCard({ onClick, onTemplate, onAI }: NewCanvasCardProps) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div
      className="draft-border grid-bg rounded-[20px] canvas-card relative group cursor-pointer"
      style={{ height: '280px' }}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#6B6B6B] flex items-center justify-center">
          <Plus className="w-6 h-6 text-[#6B6B6B]" />
        </div>
        <span className="text-sm font-medium text-[#6B6B6B]">New Canvas</span>
      </div>

      {showOptions && (
        <div className="absolute inset-0 bg-white/95 dark:bg-[#1a1a2e]/95 rounded-[20px] flex flex-col items-center justify-center gap-2 z-10 animate-fade-in">
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-sm font-medium text-white bg-[#1A1A1A] dark:bg-white dark:text-[#1A1A1A] transition-all hover:scale-[1.02] active:scale-[0.98] w-36"
          >
            <Plus className="w-4 h-4" />
            Scratch
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); onTemplate(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] w-36"
            style={{ background: 'hsl(var(--card))', boxShadow: '0 2px 8px hsl(var(--foreground) / 0.06)' }}
          >
            <FileText className="w-4 h-4" />
            Template
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); onAI(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] w-36"
            style={{ background: 'hsl(var(--card))', boxShadow: '0 2px 8px hsl(var(--foreground) / 0.06)' }}
          >
            <Sparkles className="w-4 h-4" />
            AI
          </button>
        </div>
      )}
    </div>
  );
}
