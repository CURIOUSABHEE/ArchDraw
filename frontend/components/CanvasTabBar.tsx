'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { useDiagramStore } from '@/store/diagramStore';

export function CanvasTabBar() {
  const { canvases, activeCanvasId, addCanvas, removeCanvas, switchCanvas, renameCanvas } = useDiagramStore();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Focus rename input when editing starts
  useEffect(() => {
    if (editingId) {
      requestAnimationFrame(() => {
        editInputRef.current?.focus();
        editInputRef.current?.select();
      });
    }
  }, [editingId]);

  const startRename = useCallback((id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditDraft(currentName);
  }, []);

  const commitRename = useCallback(() => {
    if (editingId && editDraft.trim()) {
      renameCanvas(editingId, editDraft.trim());
    }
    setEditingId(null);
  }, [editingId, editDraft, renameCanvas]);

  const handleCloseClick = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const canvas = canvases.find((c) => c.id === id);
    if (canvas && canvas.nodes.length > 0) {
      setConfirmDeleteId(id);
    } else {
      removeCanvas(id);
    }
  }, [canvases, removeCanvas]);

  return (
    <>
      <div className="flex items-center border-b border-border/60 bg-card/60 shrink-0 h-8 px-1 gap-0">
        {/* Scrollable tab list + new tab button grouped together on the left */}
        <div
          ref={scrollRef}
          className="flex items-end overflow-x-auto gap-0.5 px-1 scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {canvases.map((canvas) => {
            const isActive = canvas.id === activeCanvasId;
            const isEditing = editingId === canvas.id;

            return (
              <div
                key={canvas.id}
                onClick={() => !isEditing && switchCanvas(canvas.id)}
                className={`group relative flex items-center gap-1.5 px-2.5 h-7 rounded-t-md text-[11px] font-medium cursor-pointer shrink-0 transition-all select-none ${
                  isActive
                    ? 'bg-background border border-b-0 border-border/60 text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
                style={{ minWidth: 80, maxWidth: 160 }}
              >
                {isEditing ? (
                  <input
                    ref={editInputRef}
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent outline-none border-none text-[11px] font-medium w-full min-w-0"
                    style={{ color: 'inherit' }}
                  />
                ) : (
                  <span
                    className="truncate flex-1"
                    onDoubleClick={(e) => startRename(canvas.id, canvas.name, e)}
                    title={canvas.name}
                  >
                    {canvas.name}
                  </span>
                )}

                {/* Close button — only show if more than 1 tab */}
                {canvases.length > 1 && !isEditing && (
                  <button
                    onClick={(e) => handleCloseClick(canvas.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/15 hover:text-destructive transition-all shrink-0"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}

          {/* New tab button — immediately after last tab */}
          <button
            onClick={addCanvas}
            className="shrink-0 self-center p-1 mx-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="New canvas"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-5 w-64">
            <p className="text-xs font-semibold text-foreground mb-1">Delete canvas?</p>
            <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
              This canvas has nodes. Deleting it is permanent.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-accent text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { removeCanvas(confirmDeleteId); setConfirmDeleteId(null); }}
                className="flex-1 py-1.5 text-xs font-medium rounded-md bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
