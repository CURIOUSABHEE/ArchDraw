'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useDiagramStore } from '@/store/diagramStore';
import { componentRegistry, type ComponentDefinition } from '@/lib/componentRegistry';
import { createNode } from '@/lib/nodeFactory';
import { getViewportCenter } from '@/lib/utils';

let globalSearchVersion = 0;

function useCustomComponentListener() {
  const [version, setVersion] = useState(0);
  
  useEffect(() => {
    const handler = () => {
      globalSearchVersion++;
      setVersion(v => v + 1);
    };
    window.addEventListener('custom-component-added', handler);
    return () => window.removeEventListener('custom-component-added', handler);
  }, []);
  
  useEffect(() => {
    const handler = () => {
      globalSearchVersion++;
      setVersion(v => v + 1);
    };
    window.addEventListener('custom-component-deleted', handler);
    return () => window.removeEventListener('custom-component-deleted', handler);
  }, []);
  
  return version;
}

/** Command palette triggered by ⌘K — searches components and adds to canvas on click */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const addNode = useDiagramStore((s) => s.addNode);
  
  const registryVersion = useCustomComponentListener();
  const version = registryVersion + globalSearchVersion;

  useEffect(() => {
    const handler = () => {
      globalSearchVersion++;
    };
    window.addEventListener('custom-component-added', handler);
    return () => window.removeEventListener('custom-component-added', handler);
  }, []);

  const filtered = componentRegistry.search(search);

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

  // Auto-focus input when opened and refresh registry
  useEffect(() => {
    if (open) {
      globalSearchVersion++;
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Reset selection when search changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(0);
  }, [search]);

  const handleSelect = useCallback((comp: ComponentDefinition) => {
    const result = createNode(
      {
        componentId: comp.id,
        label: comp.label,
        category: comp.category,
        color: comp.color,
        icon: comp.icon,
        technology: comp.technology,
        position: getViewportCenter(),
      },
      'cmdk'
    );
    addNode(result.node);
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
      <div className="absolute inset-0 bg-black/20" onClick={() => setOpen(false)} />

      {/* Palette */}
      <div 
        className="relative w-full max-w-lg mx-4 bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search components..."
            className="flex-1 py-1 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground bg-gray-100 rounded">
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
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {comp.category}
                {comp.isCustom && <span className="ml-1 text-indigo-500">(custom)</span>}
              </span>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 text-[10px] text-muted-foreground">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
        </div>
      </div>
    </div>
  );
}
