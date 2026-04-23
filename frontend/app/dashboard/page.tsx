'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Clock, Trash2, Layers, Pencil, Copy } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDiagramStore } from '@/store/diagramStore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Node, Edge } from 'reactflow';
import { DiagramPreview } from '@/components/dashboard/DiagramPreview';

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
      <div className="absolute inset-0 flex items-center justify-center" style={{ 
        background: '#FAFAFA',
        backgroundImage: 'radial-gradient(circle, #E0E0E0 1px, transparent 1px)',
        backgroundSize: '16px 16px'
      }}>
        <div className="w-12 h-12 rounded-[12px] flex items-center justify-center" style={{ background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Layers className="w-6 h-6" style={{ color: '#B0B0B0' }} />
        </div>
      </div>
    );
  }

  const PADDING = 16;
  const CARD_WIDTH = 160;
  const CARD_HEIGHT = 70;
  const CONTAINER_WIDTH = 280;
  const CONTAINER_HEIGHT = 160;

  // Calculate bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach((node) => {
    if (node.width && node.height) {
      const x = node.position?.x || 0;
      const y = node.position?.y || 0;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + (node.width || CARD_WIDTH));
      maxY = Math.max(maxY, y + (node.height || CARD_HEIGHT));
    }
  });

  if (minX === Infinity) {
    minX = 0; minY = 0; maxX = 400; maxY = 300;
  }

  const diagramWidth = maxX - minX;
  const diagramHeight = maxY - minY;
  
  // Calculate scale to fit container
  const scaleX = (CONTAINER_WIDTH - PADDING * 2) / diagramWidth;
  const scaleY = (CONTAINER_HEIGHT - PADDING * 2) / diagramHeight;
  const scale = Math.min(scaleX, scaleY, 0.5);
  
  // Center the diagram in container
  const offsetX = (CONTAINER_WIDTH - diagramWidth * scale) / 2 - minX * scale;
  const offsetY = (CONTAINER_HEIGHT - diagramHeight * scale) / 2 - minY * scale;

  const getNodeColor = (node: Node): string => {
    if (node.data?.color) return node.data.color;
    if (node.data?.layer) {
      const layerColors: Record<string, string> = {
        client: '#6366f1',
        gateway: '#8B5CF6',
        service: '#3B82F6',
        queue: '#F59E0B',
        database: '#10B981',
        cache: '#EC4899',
        external: '#6B7280',
        devops: '#F97316',
      };
      return layerColors[node.data.layer] || '#3B82F6';
    }
    return '#3B82F6';
  };

  // Generate edge path based on type
  const generateEdgePath = (
    x1: number, y1: number, 
    x2: number, y2: number, 
    pathType?: string
  ): string => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    switch (pathType) {
      case 'straight':
        return `M ${x1} ${y1} L ${x2} ${y2}`;
      case 'smoothstep': {
        const midX = x1 + dx * 0.5;
        return `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`;
      }
      case 'bezier':
      default: {
        const midX = (x1 + x2) / 2;
        return `M ${x1} ${y1} C ${midX} ${y1} ${midX} ${y2} ${x2} ${y2}`;
      }
    }
  };

  const getEdgeColor = (edge: Edge): string => {
    const edgeType = edge.data?.edgeType as string;
    return edgeType === 'async' ? '#F59E0B' 
      : edgeType === 'stream' ? '#10B981'
      : edgeType === 'event' ? '#EC4899'
      : '#6366F1';
  };

  const getDashArray = (edge: Edge): string => {
    const edgeType = edge.data?.edgeType as string;
    return edgeType === 'async' ? '4,2'
      : edgeType === 'event' ? '2,2'
      : '';
  };

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#FAFAFA' }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${CONTAINER_WIDTH} ${CONTAINER_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L6,3 z" fill="#94A3B8" />
          </marker>
        </defs>
        
        {/* Render edges first (behind nodes) */}
        {edges?.map((edge) => {
          const source = nodes.find((n) => n.id === edge.source);
          const target = nodes.find((n) => n.id === edge.target);
          if (!source || !target || !source.width || !target.width) return null;
          
          // Calculate edge endpoints (center of nodes)
          const sx = (source.position?.x || 0) + (source.width || CARD_WIDTH) / 2;
          const sy = (source.position?.y || 0) + (source.height || CARD_HEIGHT) / 2;
          const tx = (target.position?.x || 0) + (target.width || CARD_WIDTH) / 2;
          const ty = (target.position?.y || 0) + (target.height || CARD_HEIGHT) / 2;
          
          // Scale positions
          const x1 = sx * scale + offsetX;
          const y1 = sy * scale + offsetY;
          const x2 = tx * scale + offsetX;
          const y2 = ty * scale + offsetY;
          
          const pathType = (edge.data?.pathType as string) || 'bezier';
          
          return (
            <path
              key={edge.id}
              d={generateEdgePath(x1, y1, x2, y2, pathType)}
              fill="none"
              stroke={getEdgeColor(edge)}
              strokeWidth="1"
              strokeDasharray={getDashArray(edge)}
              markerEnd="url(#arrowhead)"
              opacity="0.6"
            />
          );
        })}
        
        {/* Render nodes */}
        {nodes.map((node) => {
          if (!node.width || !node.height) return null;
          
          const x = (node.position?.x || 0) * scale + offsetX;
          const y = (node.position?.y || 0) * scale + offsetY;
          const w = node.width * scale;
          const h = node.height * scale;
          
          // Skip nodes outside visible area
          if (x + w < -10 || x > CONTAINER_WIDTH + 10 || y + h < -10 || y > CONTAINER_HEIGHT + 10) return null;
          
          const nodeColor = getNodeColor(node);
          const isGroup = node.type === 'group' || node.data?.isGroup;
          
          if (isGroup) {
            return (
              <g key={node.id}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx="6"
                  fill={node.data?.groupColor || '#8B5CF6'}
                  opacity="0.15"
                  stroke={node.data?.groupColor || '#8B5CF6'}
                  strokeWidth="1"
                  strokeDasharray="4,2"
                />
              </g>
            );
          }
          
          return (
            <g key={node.id}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx="4"
                fill={nodeColor}
                opacity="0.9"
              />
              {node.data?.label && w > 25 && h > 15 && (
                <>
                  <text
                    x={x + w / 2}
                    y={y + h / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={Math.min(7, w * 0.18)}
                    fontWeight="600"
                    fill="white"
                  >
                    {node.data.label.length > 8 ? node.data.label.slice(0, 8) + '..' : node.data.label}
                  </text>
                  {w > 40 && h > 30 && (
                    <text
                      x={x + w / 2}
                      y={y + h / 2 + 9}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={Math.min(5, w * 0.12)}
                      fill="white"
                      opacity="0.7"
                    >
                      {node.data.layer || ''}
                    </text>
                  )}
                </>
              )}
            </g>
          );
        })}
      </svg>
      
      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-medium" 
           style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>
        {nodeCount} nodes
      </div>
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
        <DiagramPreview nodes={nodes} edges={edges} width={280} height={160} />
        
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
