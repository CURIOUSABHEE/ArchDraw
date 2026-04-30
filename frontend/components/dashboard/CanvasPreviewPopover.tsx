'use client';

import { useEffect, useState } from 'react';
import { Node, Edge } from 'reactflow';
import { DiagramPreview } from '@/components/dashboard/DiagramPreview';

interface CanvasPreviewPopoverProps {
  canvas: {
    id: string;
    name: string;
    nodes: Node[];
    edges: Edge[];
  };
  position: { x: number; y: number };
  onClose: () => void;
}

export function CanvasPreviewPopover({ canvas, position, onClose }: CanvasPreviewPopoverProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(timer);
  }, []);

  if (!canvas) return null;

  return (
    <div
      className={`preview-popover ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '280px',
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border) / 0.2)',
      }}
      onMouseEnter={() => {}}
      onMouseLeave={onClose}
    >
      <div className="p-2">
        <DiagramPreview
          nodes={canvas.nodes}
          edges={canvas.edges}
          width={280}
          height={160}
        />
      </div>
      <div className="px-3 py-2 border-t border-[hsl(var(--border))/0.1]">
        <h4 className="text-sm font-medium text-[#1A1A1A] dark:text-white truncate">
          {canvas.name}
        </h4>
        <p className="text-[10px] text-[#6B6B6B] mt-0.5">
          {canvas.nodes?.length || 0} nodes • {canvas.edges?.length || 0} edges
        </p>
      </div>
    </div>
  );
}
