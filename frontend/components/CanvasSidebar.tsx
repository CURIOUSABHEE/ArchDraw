'use client';

import { useDiagramStore } from '@/store/diagramStore';
import { toast } from 'sonner';
import { X, Pin, Plus, MoreVertical, Trash2, Search } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CanvasSidebarProps {
  onClose: () => void;
}

export function CanvasSidebar({ onClose }: CanvasSidebarProps) {
  const {
    canvases,
    activeCanvasId,
    openCanvas,
    closeCanvas,
    togglePinCanvas,
    removeCanvas,
    renameCanvas,
    addCanvas,
  } = useDiagramStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCanvases = canvases
    .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.lastAccessedAt || 0) - (a.lastAccessedAt || 0);
    });

  const handleCanvasClick = (id: string) => {
    openCanvas(id);
    onClose();
  };

  const handleRename = (id: string) => {
    if (editDraft.trim()) {
      renameCanvas(id, editDraft.trim());
    }
    setEditingId(null);
  };

  const handleRemove = (id: string, hasContent: boolean) => {
    if (hasContent) {
      if (confirm('Delete this canvas? This action cannot be undone.')) {
        removeCanvas(id);
        toast.success('Canvas deleted');
      }
    } else {
      removeCanvas(id);
    }
    setContextMenuId(null);
  };

  return (
    <div className="w-64 h-full flex flex-col border-r bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-sm font-semibold">Canvases</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={addCanvas}
            className="p-1 rounded hover:bg-accent"
            title="New canvas"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-accent"
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search canvases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filteredCanvases.map((canvas) => (
          <div
            key={canvas.id}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              canvas.id === activeCanvasId
                ? 'bg-accent'
                : 'hover:bg-accent/50'
            }`}
            onClick={() => handleCanvasClick(canvas.id)}
          >
            {canvas.isPinned && (
              <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />
            )}
            
            {editingId === canvas.id ? (
              <input
                autoFocus
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                onBlur={() => handleRename(canvas.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(canvas.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-transparent border-b border-primary outline-none text-sm"
              />
            ) : (
              <span className="flex-1 text-sm truncate">{canvas.name}</span>
            )}

            <DropdownMenu open={contextMenuId === canvas.id} onOpenChange={(open) => !open && setContextMenuId(null)}>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    setContextMenuId(canvas.id);
                  }}
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(canvas.id);
                    setEditDraft(canvas.name);
                    setContextMenuId(null);
                  }}
                >
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePinCanvas(canvas.id);
                    setContextMenuId(null);
                  }}
                >
                  {canvas.isPinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(canvas.id, (canvas.nodes?.length || 0) > 0);
                  }}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

        {canvases.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No canvases yet
          </p>
        )}
      </div>

      <div className="p-3 border-t text-xs text-muted-foreground">
        {canvases.length} canvas{canvases.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
