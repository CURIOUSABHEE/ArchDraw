'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDiagramStore } from '@/store/diagramStore';
import { CanvasPreviewPopover } from './CanvasPreviewPopover';

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

function getColorByNodeCount(count: number): string {
  if (count === 0) return '#B0B0B0';
  if (count < 5) return '#3B82F6';
  if (count < 10) return '#10B981';
  return '#F59E0B';
}

export function RecentCanvases() {
  const router = useRouter();
  const { canvases, switchCanvas } = useDiagramStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });

  const recentCanvases = Array.from(
    new Map(canvases.map((c) => [c.id, c])).values()
  )
    .sort((a, b) => (b.lastAccessedAt || 0) - (a.lastAccessedAt || 0))
    .slice(0, 5);

  const handleMouseEnter = (id: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPopoverPos({ x: rect.right + 8, y: rect.top });
    setHoveredId(id);
  };

  const handleMouseLeave = () => {
    setHoveredId(null);
  };

  const handleClick = (id: string) => {
    switchCanvas(id);
    router.push('/editor');
  };

  return (
    <div className="mb-4">
      <h3 className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2 px-2">
        Recent
      </h3>
      <div className="space-y-0.5">
        {recentCanvases.map((canvas) => {
          const nodeCount = canvas.nodes?.length || 0;
          const isActive = hoveredId === canvas.id;
          
          return (
            <div
              key={canvas.id}
              className={`recent-item flex items-center gap-2 cursor-pointer ${
                isActive ? 'bg-[hsl(var(--muted))/0.5]' : ''
              }`}
              onClick={() => handleClick(canvas.id)}
              onMouseEnter={(e) => handleMouseEnter(canvas.id, e)}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: getColorByNodeCount(nodeCount) }}
              />
              <span className="text-sm truncate flex-1 text-[#1A1A1A] dark:text-white">
                {canvas.name.length > 20 ? canvas.name.slice(0, 20) + '..' : canvas.name}
              </span>
              <span className="text-[10px] text-[#6B6B6B] flex-shrink-0">
                {formatRelativeTime(canvas.lastAccessedAt)}
              </span>
            </div>
          );
        })}
      </div>

      {hoveredId && (
        <CanvasPreviewPopover
          canvas={canvases.find(c => c.id === hoveredId)!}
          position={popoverPos}
          onClose={() => setHoveredId(null)}
        />
      )}
    </div>
  );
}
