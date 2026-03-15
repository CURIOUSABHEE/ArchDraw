'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Command } from 'lucide-react';
import componentsData from '@/data/components.json';
import { useDiagramStore } from '@/store/diagramStore';

/** Command palette triggered by ⌘K — searches components and adds to canvas on click */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const addNode = useDiagramStore((s) => s.addNode);

  const filtered = componentsData.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  // Listen for ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        setSearch('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleSelect = useCallback((comp: typeof componentsData[0]) => {
    addNode(comp.id, comp.label, comp.category);
    setOpen(false);
    setSearch('');
  }, [addNode]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Palette */}
      <div className="relative w-full max-w-lg mx-4 bg-card rounded-xl border border-border overflow-hidden"
        style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 16px 48px -8px rgba(0,0,0,0.2)' }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search components..."
            className="flex-1 py-3.5 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No components found</p>
          )}
          {filtered.map((comp, i) => (
            <button
              key={comp.id}
              onClick={() => handleSelect(comp)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                i === selectedIndex
                  ? 'bg-primary/10 text-foreground'
                  : 'text-secondary-foreground hover:bg-muted'
              }`}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: comp.color }} />
              <span className="flex-1 text-left font-medium">{comp.label}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{comp.category}</span>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/50 text-[10px] text-muted-foreground">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
        </div>
      </div>
    </div>
  );
}
