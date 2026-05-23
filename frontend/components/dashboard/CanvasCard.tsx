'use client';

import { useState } from 'react';
import { ExternalLink, Copy, Trash2, Star } from 'lucide-react';
import { Node, Edge } from 'reactflow';
import { DiagramPreview } from '@/components/dashboard/DiagramPreview';
import { useDiagramStore } from '@/store/diagramStore';

interface CanvasCardProps {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  updatedAt?: number;
  isPinned?: boolean;
  isFavorite?: boolean;
  onClick: () => void;
}

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return 'Just now';
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function getCanvasType(nodes: Node[]): string {
  if (nodes.length === 0) return 'Blank';
  if (nodes.some(n => n.data?.layer)) return 'Architecture';
  return 'Sequence';
}

export function CanvasCard({ id, name, nodes, edges, updatedAt, isPinned, isFavorite, onClick }: CanvasCardProps) {
  const [showActions, setShowActions] = useState(false);
  const { toggleFavorite, duplicateCanvas, removeCanvas } = useDiagramStore();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this canvas?')) {
      removeCanvas(id);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateCanvas?.(id);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(id);
  };

  const nodeCount = nodes?.length || 0;
  const edgeCount = edges?.length || 0;
  const canvasType = getCanvasType(nodes);

  return (
    <div
      className="canvas-card h-[280px] rounded-xl overflow-hidden cursor-pointer bg-[hsl(var(--card))] border border-[hsl(var(--border)/0.16)] flex flex-col"
      style={{ boxShadow: '0 8px 24px hsl(var(--foreground) / 0.05)' }}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="h-[188px] relative overflow-hidden border-b border-[hsl(var(--border)/0.12)]">
        <DiagramPreview nodes={nodes} edges={edges} width={320} height={188} />
        
        {/* Type tag */}
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[hsl(var(--card)/0.92)] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border)/0.12)] backdrop-blur-sm">
          {canvasType}
        </div>
        
        {/* Pin indicator */}
        {isPinned && (
          <div className="absolute top-2 left-14">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          </div>
        )}
        
        {/* Hover actions */}
        {showActions && (
          <div className="absolute top-2 right-2 flex gap-1 animate-fade-in z-10">
            <button
              onClick={handleFavorite}
              className="p-1.5 rounded-lg bg-white/90 dark:bg-[#1a1a2e]/90 hover:scale-110 transition-transform"
            >
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-[#6B6B6B]'}`} />
            </button>
            <button
              onClick={onClick}
              className="p-1.5 rounded-lg bg-white/90 dark:bg-[#1a1a2e]/90 hover:scale-110 transition-transform"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#1A1A1A] dark:text-white" />
            </button>
            <button
              onClick={handleDuplicate}
              className="p-1.5 rounded-lg bg-white/90 dark:bg-[#1a1a2e]/90 hover:scale-110 transition-transform"
            >
              <Copy className="w-3.5 h-3.5 text-[#6B6B6B]" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg bg-white/90 dark:bg-[#1a1a2e]/90 hover:scale-110 transition-transform"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
            </button>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-center">
        <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2 truncate">{name}</h3>
        <div className="flex items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))]">
          <span>{nodeCount} nodes</span>
          <span>•</span>
          <span>{edgeCount} edges</span>
          <span>•</span>
          <span>{formatRelativeTime(updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
