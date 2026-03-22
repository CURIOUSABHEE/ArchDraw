'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150
                 bg-white/[0.04] hover:bg-white/[0.08]
                 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]
                 border border-white/[0.08]
                 dark:border-white/[0.08]"
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
