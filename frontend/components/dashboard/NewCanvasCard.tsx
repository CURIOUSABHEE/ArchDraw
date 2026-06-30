'use client';

import { Plus, FileText, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NewCanvasCardProps {
  onClick: () => void;
  onTemplate: () => void;
  onAI: () => void;
}

export function NewCanvasCard({ onClick, onTemplate, onAI }: NewCanvasCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  const handleCardClick = () => {
    if (isTouch) {
      setShowOptions(!showOptions);
    } else {
      onClick();
    }
  };

  return (
    <div
      className="draft-border grid-bg rounded-xl canvas-card relative group cursor-pointer overflow-hidden border border-border"
      style={{ height: '280px', backgroundColor: 'var(--surface-page)' }}
      onMouseEnter={() => !isTouch && setShowOptions(true)}
      onMouseLeave={() => !isTouch && setShowOptions(false)}
      onClick={handleCardClick}
    >
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-12 h-12 rounded-xl border border-dashed border-border-strong bg-surface-card/72 flex items-center justify-center shadow-sm">
          <Plus className="w-6 h-6 text-text-muted" />
        </div>
        <span className="text-sm font-semibold text-text-muted">New Canvas</span>
      </div>

      {showOptions && (
        <div className="absolute inset-0 bg-surface-panel/96 rounded-xl flex flex-col items-center justify-center gap-2 z-10 animate-fade-in backdrop-blur-sm">
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-all hover:scale-[1.02] active:scale-[0.98] w-36 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Scratch
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); onTemplate(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] w-36 text-text-primary cursor-pointer"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <FileText className="w-4 h-4" />
            Template
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); onAI(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] w-36 text-text-primary cursor-pointer"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <Sparkles className="w-4 h-4" />
            AI
          </button>
        </div>
      )}
    </div>
  );
}
