'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Plus, X, ChevronDown, Check } from 'lucide-react';
import { useDiagramStore } from '@/store/diagramStore';

function formatRelative(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function CanvasTabBar() {
  const { 
    canvases, 
    activeCanvasId, 
    addCanvas, 
    removeCanvas, 
    switchCanvas, 
    renameCanvas,
    getVisibleCanvases,
    getOverflowCanvases,
  } = useDiagramStore();
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [overflowOpen, setOverflowOpen] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);

  // Memoize visible and overflow canvases to avoid recalculation
  const { visibleTabs, overflowTabs } = useMemo(() => {
    const visible = getVisibleCanvases();
    const overflow = getOverflowCanvases();
    return { visibleTabs: visible, overflowTabs: overflow };
  }, [canvases, activeCanvasId, getVisibleCanvases, getOverflowCanvases]);

  // Close overflow dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    };
    if (overflowOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [overflowOpen]);

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

  const handleOverflowClick = useCallback((id: string) => {
    switchCanvas(id);
    setOverflowOpen(false);
  }, [switchCanvas]);

  return (
    <>
      <div className="flex items-center bg-white shrink-0 h-9 px-2 gap-1"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: '12px 12px 0 0', margin: '8px 8px 0 8px' }}>
        {/* Visible tabs */}
        <div
          className="flex items-end overflow-x-auto gap-0.5 px-1 scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {visibleTabs.map((canvas) => {
            const isActive = canvas.id === activeCanvasId;
            const isEditing = editingId === canvas.id;

            return (
              <div
                key={canvas.id}
                onClick={() => !isEditing && switchCanvas(canvas.id)}
                className={`group relative flex items-center gap-1.5 px-3 h-7 rounded-lg text-[11px] font-medium cursor-pointer shrink-0 transition-all select-none ${
                  isActive
                    ? 'bg-gray-100 text-gray-700'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
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
                    title={canvas.updatedAt ? `Last edited ${formatRelative(canvas.updatedAt)}` : canvas.name}
                  >
                    {canvas.name}
                  </span>
                )}

                {/* Close button — only show if more than 1 tab */}
                {visibleTabs.length > 1 && !isEditing && (
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

          {/* New tab button */}
          <button
            onClick={() => addCanvas()}
            className="shrink-0 self-center p-1 mx-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="New canvas"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Overflow dropdown */}
        {overflowTabs.length > 0 && (
          <div className="relative" ref={overflowRef}>
            <button
              onClick={() => setOverflowOpen(!overflowOpen)}
              className="flex items-center gap-1 px-2 h-7 rounded-t-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors shrink-0"
            >
              <ChevronDown className="w-3 h-3" />
              <span>+{overflowTabs.length}</span>
            </button>

            {/* Dropdown menu */}
            {overflowOpen && (
              <div className="absolute top-full left-0 mt-2 min-w-[200px] max-h-[300px] overflow-y-auto bg-white rounded-xl z-50 py-1"
                style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
                {overflowTabs.map((canvas) => {
                  const isActive = canvas.id === activeCanvasId;
                  return (
                    <button
                      key={canvas.id}
                      onClick={() => handleOverflowClick(canvas.id)}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-[11px] text-left hover:bg-gray-100 transition-colors ${
                        isActive ? 'bg-gray-100 text-gray-700' : 'text-gray-500'
                      }`}
                    >
                      {isActive && <Check className="w-3 h-3 shrink-0" />}
                      <span className="truncate flex-1">{canvas.name}</span>
                      {canvas.isPinned && (
                        <span className="text-[9px] text-gray-400 shrink-0">Pinned</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-2xl p-6 w-72"
            style={{ boxShadow: '0 25px 70px rgba(0,0,0,0.08)' }}>
            <p className="text-sm font-semibold text-gray-700 mb-2">Delete canvas?</p>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
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
