'use client';

import { useState } from 'react';
import { Node, Edge } from 'reactflow';
import { DiagramPreview } from '@/components/dashboard/DiagramPreview';

interface TemplatePreviewCardProps {
  title: string;
  description: string;
  techTags?: string[];
  nodes: Node[];
  edges: Edge[];
  onClick: () => void;
}

export function TemplatePreviewCard({ title, description, techTags, nodes, edges, onClick }: TemplatePreviewCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="template-card canvas-card rounded-xl bg-surface-panel border border-border overflow-hidden cursor-pointer"
      style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.03)' }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-44 overflow-hidden border-b border-border">
        <DiagramPreview 
          nodes={nodes} 
          edges={edges} 
          width={280}
          height={176}
          simplified
        />
        
        {isHovered && (
          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center animate-fade-in z-10 backdrop-blur-[1px]">
            <button className="px-4 py-2 bg-accent text-white hover:bg-accent-hover rounded-lg text-sm font-semibold hover:scale-[1.02] transition-all shadow-soft-2 cursor-pointer">
              Use Template
            </button>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-text-primary mb-1 truncate">{title}</h3>
        <p className="text-xs text-text-muted line-clamp-2 min-h-8 mb-2">{description}</p>
        {techTags && techTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {techTags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-surface-page text-text-muted border border-border">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="text-[10px] text-text-muted mt-2">
          {nodes.length} nodes • {edges.length} edges
        </div>
      </div>
    </div>
  );
}
