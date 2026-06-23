'use client';

import { useEffect } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import { useDiagramStore } from '@/store/diagramStore';

function ThemeSync() {
  const { resolvedTheme } = useNextTheme();

  useEffect(() => {
    if (resolvedTheme) {
      const isDark = resolvedTheme === 'dark';
      if (useDiagramStore.getState().darkMode !== isDark) {
        useDiagramStore.setState({ darkMode: isDark });
      }
    }
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({ 
  children, 
  ...props 
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeSync />
      {children}
    </NextThemesProvider>
  );
}
