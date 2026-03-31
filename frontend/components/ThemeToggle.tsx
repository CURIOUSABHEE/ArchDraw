'use client';

import { useTheme } from '@/lib/theme';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { isDark, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150
                 bg-white/[0.04] hover:bg-white/[0.08]
                 border border-white/[0.08]"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-slate-400 hover:text-white transition-colors" />
      ) : (
        <Moon className="w-4 h-4 text-slate-600 hover:text-slate-900 transition-colors" />
      )}
    </button>
  );
}
