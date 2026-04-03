'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Bell,
  LayoutDashboard,
  FileText,
  LayoutTemplate,
  GraduationCap,
  Settings,
  Clock,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  Calendar,
  Copy,
  Pencil,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDiagramStore } from '@/store/diagramStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
}

function SidebarItem({ icon: Icon, label, active, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-[14px] transition-all duration-200"
      style={{
        background: active ? '#EDEDED' : 'transparent',
        color: active ? '#1A1A1A' : '#6B6B6B',
      }}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function CollapsibleGroup({
  icon: Icon,
  label,
  children,
  defaultOpen = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-[14px] transition-all duration-200 hover:bg-[#F2F2F2]"
        style={{ color: '#1A1A1A' }}
      >
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium flex-1 text-left">{label}</span>
      </button>
      {isOpen && <div className="mt-1 pl-7 space-y-1">{children}</div>}
    </div>
  );
}

function SubmenuItem({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2 rounded-[12px] transition-all duration-200"
      style={{
        background: active ? 'white' : 'transparent',
        boxShadow: active ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
        color: active ? '#1A1A1A' : '#6B6B6B',
      }}
    >
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

interface TemplateCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}

function TemplateCard({ title, description, icon, onClick }: TemplateCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-56 p-4 rounded-[16px] text-left transition-all duration-200 hover:scale-[1.02]"
      style={{ background: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}
    >
      <div
        className="w-10 h-10 rounded-[12px] flex items-center justify-center text-xl mb-3"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-[#1A1A1A] text-sm mb-1">{title}</h3>
      <p className="text-xs line-clamp-2" style={{ color: '#6B6B6B' }}>{description}</p>
    </button>
  );
}

interface CanvasCardProps {
  name: string;
  nodes: any[];
  edges: any[];
  updatedAt?: number;
  onClick: () => void;
  onDelete: () => void;
  onRename: () => void;
  onDuplicate: () => void;
}

function CanvasCard({ name, nodes, edges, updatedAt, onClick, onDelete, onRename, onDuplicate }: CanvasCardProps) {
  const [showActions, setShowActions] = useState(false);

  const nodeCount = nodes?.length || 0;
  const edgeCount = edges?.length || 0;

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
      {/* Canvas Preview */}
      <div
        className="h-40 relative overflow-hidden"
        style={{ background: '#FAFAFA' }}
      >
        {nodeCount > 0 ? (
          <div className="absolute inset-0 p-4">
            {nodes.slice(0, 8).map((node: any, index: number) => (
              <div
                key={node.id || index}
                className="absolute rounded-md flex items-center justify-center text-[7px] font-medium shadow-sm"
                style={{
                  width: Math.max((node.width || 40) * 0.6, 30),
                  height: Math.max((node.height || 28) * 0.6, 20),
                  left: Math.min(((node.position?.x || 0) + 50) / 8, 200),
                  top: Math.min(((node.position?.y || 0) + 40) / 8, 110),
                  background: node.data?.color || '#6366f1',
                  color: 'white',
                }}
              >
                {(node.data?.label || '').slice(0, 2) || '?'}
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-[12px] flex items-center justify-center mx-auto mb-2" style={{ background: '#F2F2F2' }}>
                <FileText className="w-6 h-6" style={{ color: '#B0B0B0' }} />
              </div>
            </div>
          </div>
        )}
        
        {/* 3-dot Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="absolute top-3 right-3 p-1.5 rounded-[10px] transition-all opacity-0 group-hover:opacity-100"
              style={{ background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4" style={{ color: '#6B6B6B' }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-40 p-1"
            style={{ background: 'white', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: 'none' }}
          >
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onRename(); }}
              className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-sm cursor-pointer"
              style={{ color: '#1A1A1A' }}
            >
              <Pencil className="w-4 h-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
              className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-sm cursor-pointer"
              style={{ color: '#1A1A1A' }}
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-sm cursor-pointer"
              style={{ color: '#E5484D' }}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Node count badge */}
        {nodeCount > 0 && (
          <div
            className="absolute bottom-3 right-3 px-2.5 py-1 rounded-[8px] text-[10px] font-medium"
            style={{ background: 'rgba(255,255,255,0.9)', color: '#6B6B6B' }}
          >
            {nodeCount} · {edgeCount}
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-4">
        <h3 className="font-semibold text-[#1A1A1A] text-base mb-2 truncate">{name}</h3>
        {updatedAt && (
          <div className="flex items-center gap-2 text-xs" style={{ color: '#6B6B6B' }}>
            <Calendar className="w-3.5 h-3.5" />
            <span>Opened {formatDate(updatedAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

const quickStartTemplates = [
  { id: 'blank', title: 'Blank Canvas', description: 'Start from scratch', icon: '+' },
  { id: 'saas', title: 'SaaS Architecture', description: 'Multi-tenant system', icon: '☁️' },
  { id: 'microservices', title: 'Microservices', description: 'Distributed system', icon: '🔄' },
  { id: 'chatapp', title: 'Chat App', description: 'Real-time messaging', icon: '💬' },
  { id: 'datapipeline', title: 'Data Pipeline', description: 'ETL with Kafka', icon: '📊' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();
  const { canvases, addCanvas, removeCanvas, switchCanvas } = useDiagramStore();
  const [mounted, setMounted] = useState(false);
  const [activeMenu, setActiveMenu] = useState('Dashboard');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && initialized && !user) {
      router.push('/');
    }
  }, [mounted, initialized, user, router]);

  if (!mounted || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F4F4F4' }}>
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
    <div className="min-h-screen p-6" style={{ background: '#F4F4F4' }}>
      <div className="max-w-[1400px] mx-auto" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
        
        {/* LEFT SIDEBAR */}
        <aside
          className="rounded-[20px] p-4 self-start"
          style={{ background: '#FAFAFA', boxShadow: '0 10px 40px rgba(0,0,0,0.06)', height: 'fit-content' }}
        >
          <div className="flex items-center gap-3 px-2 mb-6">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z" />
              </svg>
            </div>
            <span className="font-semibold text-[#1A1A1A]">ArchDraw</span>
          </div>
          <nav className="space-y-1">
            <SidebarItem
              icon={LayoutDashboard}
              label="Dashboard"
              active={activeMenu === 'Dashboard'}
              onClick={() => {}}
            />

            <CollapsibleGroup icon={FileText} label="Canvases" defaultOpen>
              <SubmenuItem
                label="All Canvases"
                active={activeMenu === 'Canvases-All'}
                onClick={() => router.push('/editor')}
              />
              <SubmenuItem
                label="Shared with me"
                active={activeMenu === 'Canvases-Shared'}
                onClick={() => {}}
              />
            </CollapsibleGroup>

            <SidebarItem
              icon={LayoutTemplate}
              label="Templates"
              active={activeMenu === 'Templates'}
              onClick={() => router.push('/templates')}
            />
            <SidebarItem
              icon={GraduationCap}
              label="Learn"
              active={activeMenu === 'Learn'}
              onClick={() => router.push('/learn')}
            />
            <SidebarItem
              icon={Settings}
              label="Settings"
              active={activeMenu === 'Settings'}
              onClick={() => {}}
            />
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="space-y-8">
          {/* Header */}
          <header
            className="flex items-center justify-between px-5 py-3 rounded-[20px]"
            style={{ background: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}
          >
            <h1 className="text-xl font-bold text-[#1A1A1A]">Dashboard</h1>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-[12px]"
                style={{ background: '#F2F2F2' }}
              >
                <Search className="w-4 h-4" style={{ color: '#6B6B6B' }} />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent outline-none text-sm w-32"
                  style={{ color: '#1A1A1A' }}
                />
              </div>
              <button
                onClick={handleNewCanvas}
                className="flex items-center gap-2 px-4 py-2 rounded-[12px] text-sm font-medium text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                <Plus className="w-4 h-4" />
                New Canvas
              </button>
              <button
                className="p-2 rounded-[12px] transition-colors"
                style={{ background: '#F2F2F2', color: '#6B6B6B' }}
              >
                <Bell className="w-5 h-5" />
              </button>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                {user?.email ? user.email[0].toUpperCase() : 'U'}
              </div>
            </div>
          </header>

          {/* Quick Start Section */}
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Start from template</h2>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
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
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Your Canvases</h2>
            {canvases.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
              <div
                className="flex flex-col items-center justify-center py-16 rounded-[20px]"
                style={{ background: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}
              >
                <div className="w-20 h-20 rounded-[20px] flex items-center justify-center mb-4" style={{ background: '#F2F2F2' }}>
                  <FileText className="w-10 h-10" style={{ color: '#6B6B6B' }} />
                </div>
                <h3 className="font-semibold text-[#1A1A1A] text-xl mb-2">No canvases yet</h3>
                <p className="text-base mb-6" style={{ color: '#6B6B6B' }}>Create your first architecture diagram</p>
                <button
                  onClick={handleNewCanvas}
                  className="flex items-center gap-2 px-6 py-3 rounded-[14px] text-sm font-medium text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  <Plus className="w-4 h-4" />
                  Create your first canvas
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}