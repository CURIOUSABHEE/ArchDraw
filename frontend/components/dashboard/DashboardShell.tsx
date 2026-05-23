'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Bell,
  LayoutDashboard,
  FolderOpen,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDiagramStore } from '@/store/diagramStore';
import { UserAvatar, SettingsPanel } from '@/components/UserAvatar';
import { RecentCanvases } from './RecentCanvases';

interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
  badge?: string;
}

function SidebarItem({ icon: Icon, label, active, onClick, badge }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-[14px] transition-all duration-200"
      style={{
        background: active ? 'hsl(var(--muted))' : 'transparent',
        color: active ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
      }}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium flex-1 text-left">{label}</span>
      {badge && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1A1A1A] text-white">
          {badge}
        </span>
      )}
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
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-[14px] transition-all duration-200 hover:bg-[hsl(var(--muted)/0.5)]"
        style={{ color: 'hsl(var(--foreground))' }}
      >
        <Icon className="w-5 h-5" />
        <span className="text-xs font-semibold flex-1 text-left tracking-wider uppercase opacity-60">
          {label}
        </span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
        ) : (
          <ChevronRight className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
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
        background: active ? 'hsl(var(--card))' : 'transparent',
        boxShadow: active ? '0 2px 8px hsl(var(--foreground) / 0.06)' : 'none',
        color: active ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
      }}
    >
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

interface DashboardShellProps {
  children: React.ReactNode;
  activePage: string;
}

export function DashboardShell({ children, activePage }: DashboardShellProps) {
  const router = useRouter();
  const { initialized } = useAuthStore();
  const { addCanvas, canvases } = useDiagramStore();
  
  // Use state with initial value from a ref or just skip setMounted if not needed
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleNewCanvas = () => {
    addCanvas();
    router.push('/editor');
  };

  const openCanvases = canvases.filter(c => c.isOpen);
  const stats = `${canvases.length} canvases • ${openCanvases.length} open`;

  if (!mounted || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
        <div className="w-8 h-8 border-2 border-[hsl(var(--border))] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'hsl(var(--canvas-bg))' }}>
      <div className="max-w-[1400px] mx-auto grid md:grid-cols-[260px_1fr] gap-4 md:gap-6">
        {/* LEFT SIDEBAR */}
        <aside
          className="hidden md:block rounded-xl p-4 self-start sticky top-6 border border-[hsl(var(--border)/0.14)]"
          style={{ background: 'hsl(var(--card) / 0.88)', boxShadow: '0 8px 28px hsl(var(--foreground) / 0.05)', height: 'fit-content' }}
        >
          {/* Logo & Title */}
          <div className="flex items-center gap-3 px-2 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'hsl(var(--foreground))' }}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z" />
              </svg>
            </div>
            <div>
              <span className="font-semibold text-[hsl(var(--foreground))] block leading-tight">ArchDraw</span>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Workspace</span>
            </div>
          </div>

          {/* Stats */}
          <div className="px-2 mb-4 text-[11px] text-[hsl(var(--muted-foreground))]">
            {stats}
          </div>

          <div className="border-b border-[hsl(var(--border)/0.2)] mb-4" />

          {/* Navigation */}
          <nav className="space-y-3">
            {/* HOME Section */}
            <div>
              <div className="px-4 mb-1">
                <span className="text-[10px] font-semibold tracking-wider uppercase opacity-60 text-[hsl(var(--muted-foreground))]">
                  Home
                </span>
              </div>
              <SidebarItem
                icon={LayoutDashboard}
                label="Dashboard"
                active={activePage === 'Dashboard'}
                onClick={() => router.push('/dashboard')}
              />
            </div>

            {/* QUICK ACCESS Section */}
            <CollapsibleGroup icon={FolderOpen} label="Quick Access" defaultOpen>
              <RecentCanvases />
            </CollapsibleGroup>

            {/* LIBRARY Section */}
            <div>
              <div className="px-4 mb-1">
                <span className="text-[10px] font-semibold tracking-wider uppercase opacity-60 text-[hsl(var(--muted-foreground))]">
                  Library
                </span>
              </div>
              <SubmenuItem
                label="All Canvases"
                active={activePage === 'Canvases-All'}
                onClick={() => router.push('/editor')}
              />
              <SubmenuItem
                label="Templates"
                active={activePage === 'Templates'}
                onClick={() => router.push('/dashboard/templates')}
              />
              <SubmenuItem
                label="Tutorials"
                active={activePage === 'Learn'}
                onClick={() => router.push('/dashboard/learn')}
              />
              <SubmenuItem
                label="Docs"
                active={activePage === 'Docs'}
                onClick={() => router.push('/docs')}
              />
              <SubmenuItem
                label="Blog"
                active={activePage === 'Blog'}
                onClick={() => router.push('/blogs')}
              />
            </div>

            {/* AI TOOLS Section */}
            <div>
              <div className="px-4 mb-1">
                <span className="text-[10px] font-semibold tracking-wider uppercase opacity-60 text-[hsl(var(--muted-foreground))]">
                  AI Tools
                </span>
              </div>
              <SidebarItem
                icon={Sparkles}
                label="AI Generate"
                onClick={() => {}}
              />
            </div>
          </nav>

          <div className="border-b border-[hsl(var(--border))/0.2] my-4" />

          {/* Footer - Storage */}
          <div className="px-2 py-2 text-[10px] text-[hsl(var(--muted-foreground))]">
            Storage: 2.1MB / 5MB
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="space-y-6 md:space-y-8 overflow-hidden">
          {/* Header */}
          <header
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 px-4 md:px-5 py-3 rounded-xl border border-[hsl(var(--border)/0.14)]"
            style={{ background: 'hsl(var(--card) / 0.9)', boxShadow: '0 8px 28px hsl(var(--foreground) / 0.05)' }}
          >
            <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">
              {activePage === 'Dashboard' && 'Dashboard'}
              {activePage === 'Templates' && 'Architecture Templates'}
              {activePage === 'Learn' && 'System Design Tutorials'}
              {activePage === 'Canvases-All' && 'All Canvases'}
              {activePage === 'Docs' && 'Documentation'}
              {activePage === 'Blog' && 'Engineering Blog'}
            </h1>
            <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto overflow-x-auto">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg shrink-0 border border-[hsl(var(--border)/0.12)]"
                style={{ background: 'hsl(var(--background))' }}
              >
                <Search className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent outline-none text-sm w-20 md:w-32"
                  style={{ color: 'hsl(var(--foreground))' }}
                />
              </div>
              <button
                onClick={handleNewCanvas}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all shrink-0"
                style={{ background: 'hsl(var(--foreground))' }}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Canvas</span>
              </button>
              <button
                className="p-2 rounded-lg transition-colors shrink-0"
                style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
              >
                <Bell className="w-5 h-5" />
              </button>
              <UserAvatar />
            </div>
          </header>

          {/* Page Content */}
          {children}
        </main>
      </div>

      <SettingsPanel open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
}
