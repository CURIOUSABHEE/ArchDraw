'use client';

import { useDiagramStore } from '@/store/diagramStore';
import { Sun, Moon, Monitor } from 'lucide-react';

export function CanvasThemeToggle() {
  const canvasDarkMode = useDiagramStore((s) => s.canvasDarkMode);
  const toggleCanvasDarkMode = useDiagramStore((s) => s.toggleCanvasDarkMode);

  return (
    <button
      onClick={toggleCanvasDarkMode}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150
                 bg-white/[0.04] hover:bg-white/[0.08]
                 border border-white/[0.08]"
      title={canvasDarkMode ? 'Switch canvas to light theme' : 'Switch canvas to dark theme'}
    >
      {canvasDarkMode ? (
        <Monitor className="w-4 h-4 text-slate-400 hover:text-white transition-colors" />
      ) : (
        <Moon className="w-4 h-4 text-slate-600 hover:text-slate-900 transition-colors" />
      )}
    </button>
  );
}
