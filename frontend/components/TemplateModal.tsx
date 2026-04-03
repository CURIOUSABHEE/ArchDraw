'use client';

import { useState } from 'react';
import { X, Search, LayoutTemplate } from 'lucide-react';
import { TEMPLATES, type Template } from '@/data/templates/index';
import { useDiagramStore } from '@/store/diagramStore';
import { getLayoutedElements } from '@/lib/layoutUtils';
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
    const { nodes: ln, edges: le } = getLayoutedElements(t.nodes, t.edges, 'LR');
    if (nodes.length > 0) {
      addCanvas();
      setTimeout(() => {
        const { activeCanvasId } = useDiagramStore.getState();
        useDiagramStore.getState().renameCanvas(activeCanvasId, t.name);
        useDiagramStore.getState().loadTemplate(ln, le);
        setTimeout(() => useDiagramStore.getState().fitView(), 80);
      }, 0);
      toast.success(`"${t.name}" loaded in new tab`);
      onClose();
      return;
    }
    apply(t, ln, le);
  };

  const apply = (t: Template, ln = getLayoutedElements(t.nodes, t.edges, 'LR').nodes, le = getLayoutedElements(t.nodes, t.edges, 'LR').edges) => {
    const { activeCanvasId } = useDiagramStore.getState();
    renameCanvas(activeCanvasId, t.name);
    loadTemplate(ln, le);
    setTimeout(() => fitView(), 80);
    toast.success(`"${t.name}" loaded`);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
        onClick={onClose}
      >
        <div
          className="pointer-events-auto w-full max-w-xl bg-card rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: '75vh', boxShadow: '0 24px 48px hsl(var(--foreground) / 0.15)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-accent/60 flex items-center justify-center">
              <LayoutTemplate className="w-5 h-5 text-foreground/70" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Templates</p>
              <p className="text-[11px] text-muted-foreground">Load a pre-built architecture to get started</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="px-5 pb-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates…"
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-accent/50 rounded-xl outline-none focus:ring-2 focus:ring-ring/30 text-foreground placeholder:text-muted-foreground transition-all"
              />
            </div>
          </div>

          {/* Template list */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="w-8 h-8 mb-3 opacity-30" />
                <p className="text-sm">No templates match &quot;{query}&quot;</p>
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
    <div className="group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-accent/40 transition-all cursor-default">
      {/* Icon */}
      <div className="w-10 h-10 shrink-0 rounded-xl bg-accent/50 flex items-center justify-center text-lg">
        {template.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{template.name}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1 leading-relaxed">{template.description}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          {template.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-accent text-muted-foreground">
              {tag}
            </span>
          ))}
          <span className="text-[10px] text-muted-foreground/50 ml-auto">
            {template.nodes.length} nodes
          </span>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onLoad}
        className="shrink-0 px-4 py-2 text-xs font-medium rounded-xl bg-primary text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all active:translate-y-0 active:scale-99"
      >
        Load
      </button>
    </div>
  );
}
