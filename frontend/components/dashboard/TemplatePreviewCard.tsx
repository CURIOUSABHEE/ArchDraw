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

function simplifyForPreview(nodes: Node[], edges: Edge[], maxNodes = 8) {
  if (nodes.length <= maxNodes) return { nodes, edges };
  
  const degreeMap = new Map<string, number>();
  edges.forEach(e => {
    degreeMap.set(e.source, (degreeMap.get(e.source) || 0) + 1);
    degreeMap.set(e.target, (degreeMap.get(e.target) || 0) + 1);
  });
  
  const sorted = [...nodes].sort((a, b) => 
    (degreeMap.get(b.id) || 0) - (degreeMap.get(a.id) || 0)
  );
  const selected = sorted.slice(0, maxNodes);
  const selectedIds = new Set(selected.map(n => n.id));
  
  const filteredEdges = edges.filter(
    e => selectedIds.has(e.source) && selectedIds.has(e.target)
  );
  
  return { nodes: selected, edges: filteredEdges };
}

export function TemplatePreviewCard({ title, description, techTags, nodes, edges, onClick }: TemplatePreviewCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { nodes: simplifiedNodes, edges: simplifiedEdges } = simplifyForPreview(nodes, edges);

  return (
    <div
      className="template-card canvas-card rounded-[20px] bg-[hsl(var(--card))] overflow-hidden cursor-pointer"
      style={{ boxShadow: '0 2px 8px hsl(var(--foreground) / 0.06)' }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-40 overflow-hidden">
        <DiagramPreview 
          nodes={simplifiedNodes} 
          edges={simplifiedEdges} 
          width={280} 
          height={160}
          simplified
        />
        
        {isHovered && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center animate-fade-in z-10">
            <button className="px-4 py-2 bg-white text-[#1A1A1A] rounded-[14px] text-sm font-medium hover:scale-[1.02] transition-all">
              Use Template
            </button>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-[#1A1A1A] dark:text-white mb-1 truncate">{title}</h3>
        <p className="text-xs text-[#6B6B6B] dark:text-gray-400 line-clamp-1 mb-2">{description}</p>
        {techTags && techTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {techTags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[#6B6B6B]">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="text-[10px] text-[#6B6B6B] mt-2">
          {simplifiedNodes.length} nodes
        </div>
      </div>
    </div>
  );
}
