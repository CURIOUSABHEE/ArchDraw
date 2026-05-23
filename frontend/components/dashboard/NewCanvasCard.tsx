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
      className="draft-border grid-bg rounded-xl canvas-card relative group cursor-pointer overflow-hidden"
      style={{ height: '280px', backgroundColor: 'hsl(var(--canvas-bg))' }}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-12 h-12 rounded-xl border border-dashed border-[hsl(var(--border)/0.65)] bg-[hsl(var(--card)/0.72)] flex items-center justify-center shadow-sm">
          <Plus className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
        </div>
        <span className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">New Canvas</span>
      </div>

      {showOptions && (
        <div className="absolute inset-0 bg-[hsl(var(--card)/0.96)] rounded-xl flex flex-col items-center justify-center gap-2 z-10 animate-fade-in backdrop-blur-sm">
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[hsl(var(--foreground))] dark:bg-white dark:text-[#1A1A1A] transition-all hover:scale-[1.02] active:scale-[0.98] w-36"
          >
            <Plus className="w-4 h-4" />
            Scratch
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); onTemplate(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] w-36"
            style={{ background: 'hsl(var(--card))', boxShadow: '0 2px 8px hsl(var(--foreground) / 0.06)' }}
          >
            <FileText className="w-4 h-4" />
            Template
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); onAI(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] w-36"
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
