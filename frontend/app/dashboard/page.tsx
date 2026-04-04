'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Clock, Trash2, Layers, Pencil, Copy } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDiagramStore } from '@/store/diagramStore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Node, Edge } from 'reactflow';

function formatRelativeTime(timestamp: number): string {
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

function CanvasPreview({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  const nodeCount = nodes?.length || 0;
  
  if (nodeCount === 0) {
    return (
      <div className="absolute inset-0" style={{ 
        background: '#FAFAFA',
        backgroundImage: 'radial-gradient(circle, #E0E0E0 1px, transparent 1px)',
        backgroundSize: '16px 16px'
      }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Layers className="w-5 h-5" style={{ color: '#B0B0B0' }} />
          </div>
        </div>
      </div>
    );
  }

  const SCALE = 0.25;
  const PADDING = 20;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach((node) => {
    const x = node.position?.x || 0;
    const y = node.position?.y || 0;
    const w = node.width || 160;
    const h = node.height || 80;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  });

  const contentWidth = maxX - minX || 400;
  const contentHeight = maxY - minY || 300;

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#FAFAFA' }}>
      <svg
        className="absolute inset-0"
        width="100%"
        height="100%"
        viewBox={`0 0 ${contentWidth + PADDING * 2} ${contentHeight + PADDING * 2}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {edges?.map((edge, idx) => {
          const source = nodes.find((n) => n.id === edge.source);
          const target = nodes.find((n) => n.id === edge.target);
          if (!source || !target) return null;
          
          const sx = (source.position?.x || 0) - minX + (source.width || 160) / 2 + PADDING;
          const sy = (source.position?.y || 0) - minY + (source.height || 80) / 2 + PADDING;
          const tx = (target.position?.x || 0) - minX + (target.width || 160) / 2 + PADDING;
          const ty = (target.position?.y || 0) - minY + (target.height || 80) / 2 + PADDING;
          
          const midX = (sx + tx) / 2;
          const midY = (sy + ty) / 2;
          const path = `M ${sx} ${sy} Q ${midX} ${sy} ${midX} ${midY} T ${tx} ${ty}`;
          
          return (
            <path
              key={edge.id || idx}
              d={path}
              fill="none"
              stroke="#CCCCCC"
              strokeWidth="1.5"
            />
          );
        })}
        
        {nodes.map((node, idx) => {
          const x = (node.position?.x || 0) - minX + PADDING;
          const y = (node.position?.y || 0) - minY + PADDING;
          const w = (node.width || 160) * SCALE;
          const h = (node.height || 80) * SCALE;
          
          const nodeColor = node.data?.color || '#E0E0E0';
          const isLightColor = ['#ffffff', '#f8f8f8', '#fafafa', '#f0f0f0'].some(c => 
            nodeColor.toLowerCase() === c.toLowerCase()
          );
          
          return (
            <g key={node.id || idx}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={Math.max(4, w * 0.15)}
                fill={isLightColor ? '#E8E8E8' : nodeColor}
                stroke={isLightColor ? '#CCCCCC' : 'none'}
                strokeWidth="1"
                opacity="0.85"
              />
              {node.data?.label && (
                <text
                  x={x + w / 2}
                  y={y + h / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.max(8, w * 0.25)}
                  fontWeight="500"
                  fill={isLightColor ? '#666666' : 'white'}
                >
                  {node.data.label.slice(0, 8)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface CanvasCardProps {
  name: string;
  nodes: Node[];
  edges: Edge[];
  updatedAt?: number;
  onClick: () => void;
  onDelete: () => void;
  onRename: () => void;
  onDuplicate: () => void;
}

function CanvasCard({ name, nodes, edges, updatedAt, onClick, onDelete, onRename, onDuplicate }: CanvasCardProps) {
  const [showActions, setShowActions] = useState(false);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      className="group relative bg-white rounded-[20px] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1"
      style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="h-40 relative overflow-hidden rounded-t-[20px]" style={{ background: '#FAFAFA' }}>
        <CanvasPreview nodes={nodes} edges={edges} />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all z-10 ${
                showActions ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-0.5">
                <div className="w-1 h-1 rounded-full" style={{ background: '#6B6B6B' }} />
                <div className="w-1 h-1 rounded-full" style={{ background: '#6B6B6B' }} />
                <div className="w-1 h-1 rounded-full" style={{ background: '#6B6B6B' }} />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-40"
            style={{ background: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
            align="end"
          >
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }} className="text-sm">
              <Pencil className="w-4 h-4 mr-2" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="text-sm">
              <Copy className="w-4 h-4 mr-2" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-sm text-red-500">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-[#1A1A1A] mb-1 truncate">{name}</h3>
        <p className="text-xs" style={{ color: '#6B6B6B' }}>
          {updatedAt ? formatDate(updatedAt) : 'Just now'}
        </p>
      </div>
    </div>
  );
}

function TemplateCard({ title, description, icon, onClick }: { title: string; description: string; icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-44 md:w-56 p-3 md:p-4 rounded-[16px] text-left transition-all duration-200 hover:scale-[1.02]"
      style={{ background: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}
    >
      <div
        className="w-10 h-10 rounded-[12px] flex items-center justify-center text-xl mb-3"
        style={{ background: '#F2F2F2' }}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-[#1A1A1A] text-sm mb-1">{title}</h3>
      <p className="text-xs line-clamp-2" style={{ color: '#6B6B6B' }}>{description}</p>
    </button>
  );
}

const quickStartTemplates = [
  { id: 'microservices', title: 'Microservices', description: 'Distributed system architecture', icon: '🔄' },
  { id: 'ml pipeline', title: 'ML Pipeline', description: 'Machine learning workflow', icon: '🤖' },
  { id: 'saas', title: 'SaaS Platform', description: 'Multi-tenant architecture', icon: '☁️' },
  { id: 'e-commerce', title: 'E-commerce', description: 'Online store system', icon: '🛒' },
  { id: 'chatapp', title: 'Chat App', description: 'Real-time messaging', icon: '💬' },
  { id: 'datapipeline', title: 'Data Pipeline', description: 'ETL with Kafka', icon: '📊' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();
  const { canvases, addCanvas, removeCanvas, switchCanvas } = useDiagramStore();

  useEffect(() => {
    if (initialized && !user) {
      router.push('/');
    }
  }, [initialized, user, router]);

  if (!initialized) {
    return (
      <div className="flex items-center justify-center" style={{ background: '#F4F4F4' }}>
        <div className="w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleNewCanvas = () => {
    addCanvas();
    router.push('/editor');
  };

  const handleOpenCanvas = (id: string) => {
    switchCanvas(id);
    router.push('/editor');
  };

  const handleDeleteCanvas = (id: string) => {
    if (canvases.length > 1) {
      removeCanvas(id);
    }
  };

  const handleUseTemplate = (templateId: string) => {
    if (templateId === 'blank') {
      handleNewCanvas();
    } else {
      router.push(`/editor?template=${templateId}`);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Quick Start Section */}
      <div>
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-3 md:mb-4">Start from template</h2>
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 px-1 -mx-1" style={{ scrollbarWidth: 'none' }}>
          {quickStartTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              title={template.title}
              description={template.description}
              icon={template.icon}
              onClick={() => handleUseTemplate(template.id)}
            />
          ))}
        </div>
      </div>

      {/* Your Canvases Section */}
      <div>
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-3 md:mb-4">Your Canvases</h2>
        {canvases.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {canvases.map((canvas) => (
              <CanvasCard
                key={canvas.id}
                name={canvas.name}
                nodes={canvas.nodes}
                edges={canvas.edges}
                updatedAt={canvas.updatedAt}
                onClick={() => handleOpenCanvas(canvas.id)}
                onDelete={() => handleDeleteCanvas(canvas.id)}
                onRename={() => {}}
                onDuplicate={() => {}}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16" style={{ background: 'white', borderRadius: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
            <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-4" style={{ background: '#F8F8F8' }}>
              <Layers className="w-8 h-8" style={{ color: '#B0B0B0' }} />
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">No canvases yet</h3>
            <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>Create your first architecture diagram</p>
            <button
              onClick={handleNewCanvas}
              className="flex items-center gap-2 px-6 py-3 rounded-[14px] text-sm font-medium text-white transition-all"
              style={{ background: '#1A1A1A' }}
            >
              <Plus className="w-4 h-4" />
              Create your first canvas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
