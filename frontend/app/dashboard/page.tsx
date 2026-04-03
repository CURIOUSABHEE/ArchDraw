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
  FolderOpen,
  Sparkles,
  Clock,
  Trash2,
  Share2,
  Edit3,
  ChevronDown,
  ChevronRight,
  Play,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDiagramStore } from '@/store/diagramStore';
import { TEMPLATES } from '@/data/templates';

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
        {isOpen ? (
          <ChevronDown className="w-4 h-4" style={{ color: '#6B6B6B' }} />
        ) : (
          <ChevronRight className="w-4 h-4" style={{ color: '#6B6B6B' }} />
        )}
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

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
}

function StatCard({ title, value, subtitle, icon: Icon }: StatCardProps) {
  return (
    <div
      className="bg-white rounded-[20px] p-5 transition-all duration-200"
      style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm" style={{ color: '#6B6B6B' }}>{title}</p>
          <div
            className="w-10 h-10 rounded-[12px] flex items-center justify-center"
            style={{ background: '#F2F2F2' }}
          >
            <Icon className="w-5 h-5" />
          </div>
      </div>
      <p className="text-3xl font-bold text-[#1A1A1A]">{value}</p>
      {subtitle && (
        <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>{subtitle}</p>
      )}
    </div>
  );
}

interface CanvasItemProps {
  name: string;
  updatedAt?: number;
  onClick: () => void;
  onDelete: () => void;
}

function CanvasItem({ name, updatedAt, onClick, onDelete }: CanvasItemProps) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className="group relative bg-white rounded-[16px] p-4 cursor-pointer transition-all duration-200"
      style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}
      onClick={onClick}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-[12px] flex items-center justify-center"
          style={{ background: '#F2F2F2' }}
        >
          <FileText className="w-5 h-5" style={{ color: '#6B6B6B' }} />
        </div>
        {showDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-[10px] text-muted-foreground hover:text-red-500 transition-colors"
            style={{ background: '#F2F2F2' }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <h3 className="font-semibold text-[#1A1A1A] text-sm mb-1 truncate">{name}</h3>
      {updatedAt && (
        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6B6B6B' }}>
          <Clock className="w-3 h-3" />
          {formatRelativeTime(updatedAt)}
        </div>
      )}
    </div>
  );
}

interface QuickStartCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}

function QuickStartCard({ title, description, icon, onClick }: QuickStartCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex-1 min-w-[200px] p-4 rounded-[16px] bg-white text-left transition-all duration-200"
      style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="font-semibold text-[#1A1A1A] mb-1">{title}</h3>
      <p className="text-xs mb-3" style={{ color: '#6B6B6B' }}>{description}</p>
      <div className="flex items-center gap-1 text-xs font-medium" style={{ color: '#6366f1' }}>
        <Play className="w-3 h-3" />
        Generate
      </div>
    </button>
  );
}

interface ActivityItemProps {
  action: string;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
}

function ActivityItem({ action, time, icon: Icon }: ActivityItemProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className="w-8 h-8 rounded-[10px] flex items-center justify-center"
        style={{ background: '#F2F2F2' }}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-[#1A1A1A]">{action}</p>
        <p className="text-xs" style={{ color: '#6B6B6B' }}>{time}</p>
      </div>
    </div>
  );
}

interface TemplateItemProps {
  name: string;
  icon: string;
  onClick: () => void;
}

function TemplateItem({ name, icon, onClick }: TemplateItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-[12px] transition-all duration-200 hover:bg-[#F2F2F2]"
    >
      <div className="text-xl">{icon}</div>
      <span className="text-sm text-[#1A1A1A] flex-1 text-left">{name}</span>
      <span className="text-xs font-medium" style={{ color: '#6366f1' }}>Use</span>
    </button>
  );
}

const quickStartTemplates = [
  { id: 'saas', title: 'SaaS Architecture', description: 'Multi-tenant SaaS with auth, billing', icon: '☁️' },
  { id: 'ecommerce', title: 'E-commerce System', description: 'Cart, payments, inventory', icon: '🛒' },
  { id: 'chatapp', title: 'Chat App', description: 'Real-time messaging with WebSocket', icon: '💬' },
  { id: 'datapipeline', title: 'Data Pipeline', description: 'ETL with Kafka and Spark', icon: '🔄' },
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

  const handleOpenTemplate = (templateId: string) => {
    router.push(`/editor?template=${templateId}`);
  };

  const recentCanvases = [...canvases]
    .filter((c) => c.nodes.length > 0)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 6);

  const lastEdited = recentCanvases[0]?.updatedAt
    ? formatRelativeTime(recentCanvases[0].updatedAt)
    : 'Never';

  return (
    <div className="min-h-screen p-6" style={{ background: '#F4F4F4' }}>
      <div className="max-w-[1400px] mx-auto" style={{ display: 'grid', gridTemplateColumns: '240px 1fr 320px', gap: 24 }}>
        
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
              onClick={() => setActiveMenu('Dashboard')}
            />

            <CollapsibleGroup icon={FileText} label="Canvases" defaultOpen>
              <SubmenuItem
                label="All Canvases"
                active={activeMenu === 'Canvases-All'}
                onClick={() => setActiveMenu('Canvases-All')}
              />
              <SubmenuItem
                label="Shared with me"
                active={activeMenu === 'Canvases-Shared'}
                onClick={() => setActiveMenu('Canvases-Shared')}
              />
            </CollapsibleGroup>

            <SidebarItem
              icon={LayoutTemplate}
              label="Templates"
              active={activeMenu === 'Templates'}
              onClick={() => setActiveMenu('Templates')}
            />
            <SidebarItem
              icon={GraduationCap}
              label="Learn"
              active={activeMenu === 'Learn'}
              onClick={() => router.push('/tutorials')}
            />
            <SidebarItem
              icon={Settings}
              label="Settings"
              active={activeMenu === 'Settings'}
              onClick={() => setActiveMenu('Settings')}
            />
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="space-y-6">
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

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            <StatCard title="Your Canvases" value={String(canvases.length)} subtitle="Total diagrams" icon={FileText} />
            <StatCard title="AI Generations" value="24" subtitle="Diagrams generated" icon={Sparkles} />
            <StatCard title="Last Active" value={lastEdited} icon={Clock} />
          </div>

          {/* Recent Canvases */}
          <div
            className="rounded-[20px] p-5"
            style={{ background: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#1A1A1A]">Recent Canvases</h2>
              {recentCanvases.length > 0 && (
                <button
                  onClick={() => router.push('/editor')}
                  className="text-sm font-medium transition-opacity flex items-center gap-1"
                  style={{ color: '#6366f1' }}
                >
                  View all →
                </button>
              )}
            </div>
            {recentCanvases.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {recentCanvases.slice(0, 6).map((canvas) => (
                  <CanvasItem
                    key={canvas.id}
                    name={canvas.name}
                    updatedAt={canvas.updatedAt}
                    onClick={() => handleOpenCanvas(canvas.id)}
                    onDelete={() => handleDeleteCanvas(canvas.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 rounded-[16px] flex items-center justify-center mb-4" style={{ background: '#F2F2F2' }}>
                  <Plus className="w-8 h-8" style={{ color: '#6B6B6B' }} />
                </div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">No canvases yet</h3>
                <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>Create your first architecture diagram</p>
                <button
                  onClick={handleNewCanvas}
                  className="px-5 py-2.5 rounded-[12px] text-sm font-medium text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  Create New Canvas
                </button>
              </div>
            )}
          </div>

          {/* Quick Start */}
          <div
            className="rounded-[20px] p-5"
            style={{ background: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5" style={{ color: '#6366f1' }} />
              <h2 className="text-base font-semibold text-[#1A1A1A]">Quick Start</h2>
            </div>
            <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>Generate a diagram from a template</p>
            <div className="flex gap-4 overflow-x-auto">
              {quickStartTemplates.map((template) => (
                <QuickStartCard
                  key={template.id}
                  title={template.title}
                  description={template.description}
                  icon={template.icon}
                  onClick={() => router.push(`/editor?template=${template.id}`)}
                />
              ))}
            </div>
          </div>
        </main>

        {/* RIGHT PANEL */}
        <aside className="space-y-6">
          {/* Templates */}
          <div
            className="rounded-[20px] p-5"
            style={{ background: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <LayoutTemplate className="w-5 h-5" style={{ color: '#6366f1' }} />
              <h2 className="text-base font-semibold text-[#1A1A1A]">Templates</h2>
            </div>
            <div className="space-y-1">
              {TEMPLATES.slice(0, 5).map((template) => (
                <TemplateItem
                  key={template.id}
                  name={template.name}
                  icon={template.icon}
                  onClick={() => handleOpenTemplate(template.id)}
                />
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div
            className="rounded-[20px] p-5"
            style={{ background: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}
          >
            <h2 className="text-base font-semibold text-[#1A1A1A] mb-2">Recent Activity</h2>
            <div className="space-y-1">
              <ActivityItem
                action="Generated diagram"
                time="2 minutes ago"
                icon={Sparkles}
              />
              <ActivityItem
                action="Edited canvas"
                time="1 hour ago"
                icon={Edit3}
              />
              <ActivityItem
                action="Created new canvas"
                time="3 hours ago"
                icon={Plus}
              />
              <ActivityItem
                action="Deleted node"
                time="Yesterday"
                icon={Trash2}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}