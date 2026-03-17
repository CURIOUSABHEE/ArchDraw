'use client';

import { useState } from 'react';
import { X, Search, LayoutTemplate } from 'lucide-react';
import { TEMPLATES, type Template } from '@/data/templates/index';
import { useDiagramStore } from '@/store/diagramStore';
import { toast } from 'sonner';

interface Props { onClose: () => void }

export function TemplateModal({ onClose }: Props) {
  const [query, setQuery] = useState('');
  const { nodes, loadTemplate, fitView, addCanvas } = useDiagramStore();
  const renameCanvas = useDiagramStore((s) => s.renameCanvas);

  const filtered = TEMPLATES.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
  );

  const handleLoad = (t: Template) => {
    if (nodes.length > 0) {
      addCanvas();
      setTimeout(() => {
        const { activeCanvasId } = useDiagramStore.getState();
        useDiagramStore.getState().renameCanvas(activeCanvasId, t.name);
        useDiagramStore.getState().loadTemplate(t.nodes, t.edges);
        setTimeout(() => useDiagramStore.getState().fitView(), 80);
      }, 0);
      toast.success(`"${t.name}" loaded in new tab`);
      onClose();
      return;
    }
    apply(t);
  };

  const apply = (t: Template) => {
    const { activeCanvasId } = useDiagramStore.getState();
    renameCanvas(activeCanvasId, t.name);
    loadTemplate(t.nodes, t.edges);
    setTimeout(() => fitView(), 80);
    toast.success(`"${t.name}" loaded`);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[10px]" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
        onClick={onClose}
      >
        <div
          className="pointer-events-auto w-full max-w-xl bg-card border border-border/80 rounded-xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: '75vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 shrink-0">
            <div className="w-6 h-6 rounded-md bg-indigo-500/15 flex items-center justify-center">
              <LayoutTemplate className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">Templates</p>
              <p className="text-[10px] text-muted-foreground">Load a pre-built architecture to get started</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-2.5 border-b border-border/40 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates…"
                autoFocus
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-muted/60 border border-border/60 rounded-md outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 text-foreground placeholder:text-muted-foreground/60 transition-colors"
              />
            </div>
          </div>

          {/* Template list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Search className="w-6 h-6 mb-2 opacity-30" />
                <p className="text-xs">No templates match "{query}"</p>
              </div>
            ) : (
              filtered.map((t) => (
                <TemplateRow key={t.id} template={t} onLoad={() => handleLoad(t)} />
              ))
            )}
          </div>
        </div>
      </div>

    </>
  );
}

function TemplateRow({ template, onLoad }: { template: Template; onLoad: () => void }) {
  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/50 bg-background/50 hover:border-indigo-500/40 hover:bg-accent/30 transition-all cursor-default">
      {/* Icon */}
      <div className="w-9 h-9 shrink-0 rounded-lg bg-muted flex items-center justify-center text-lg">
        {template.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">{template.name}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 leading-relaxed">{template.description}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          {template.tags.map((tag) => (
            <span key={tag} className="px-1.5 py-px text-[9px] font-medium rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
              {tag}
            </span>
          ))}
          <span className="text-[9px] text-muted-foreground/60 ml-auto">
            {template.nodes.length}n · {template.edges.length}e
          </span>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onLoad}
        className="shrink-0 px-3 py-1.5 text-[11px] font-medium rounded-md bg-indigo-500/10 hover:bg-indigo-500 text-indigo-500 hover:text-white border border-indigo-500/20 hover:border-indigo-500 transition-all active:scale-95"
      >
        Load
      </button>
    </div>
  );
}
