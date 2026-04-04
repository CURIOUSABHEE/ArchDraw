'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Plus,
  Search,
  Bell,
  LayoutDashboard,
  FileText,
  LayoutTemplate,
  GraduationCap,
  FolderOpen,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDiagramStore } from '@/store/diagramStore';
import { UserAvatar, SettingsPanel } from '@/components/UserAvatar';

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

interface DashboardShellProps {
  children: React.ReactNode;
  activePage: string;
}

export function DashboardShell({ children, activePage }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, initialized } = useAuthStore();
  const { addCanvas, canvases } = useDiagramStore();
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && initialized && !user) {
      router.push('/');
    }
  }, [mounted, initialized, user, router]);

  const handleNewCanvas = () => {
    addCanvas();
    router.push('/editor');
  };

  if (!mounted || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F4F4F4' }}>
        <div className="w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: '#F4F4F4' }}>
      <div className="max-w-[1400px] mx-auto grid md:grid-cols-[240px_1fr] gap-4 md:gap-6">
        {/* LEFT SIDEBAR - Persistent */}
        <aside
          className="hidden md:block rounded-[20px] p-4 self-start sticky top-6"
          style={{ background: '#FAFAFA', boxShadow: '0 10px 40px rgba(0,0,0,0.06)', height: 'fit-content' }}
        >
          <div className="flex items-center gap-3 px-2 mb-6">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: '#1A1A1A' }}
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
              active={activePage === 'Dashboard'}
              onClick={() => router.push('/dashboard')}
            />

            <CollapsibleGroup icon={FileText} label="Canvases" defaultOpen>
              <SubmenuItem
                label="All Canvases"
                active={activePage === 'Canvases-All'}
                onClick={() => router.push('/editor')}
              />
              <SubmenuItem
                label="Shared with me"
                active={activePage === 'Canvases-Shared'}
                onClick={() => {}}
              />
            </CollapsibleGroup>

            <SidebarItem
              icon={LayoutTemplate}
              label="Templates"
              active={activePage === 'Templates'}
              onClick={() => router.push('/dashboard/templates')}
            />
            <SidebarItem
              icon={GraduationCap}
              label="Learn"
              active={activePage === 'Learn'}
              onClick={() => router.push('/dashboard/learn')}
            />
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="space-y-6 md:space-y-8 overflow-hidden">
          {/* Header - Persistent */}
          <header
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 px-4 md:px-5 py-3 rounded-[20px]"
            style={{ background: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}
          >
            <h1 className="text-xl font-bold text-[#1A1A1A]">
              {activePage === 'Dashboard' && 'Dashboard'}
              {activePage === 'Templates' && 'Architecture Templates'}
              {activePage === 'Learn' && 'Learn System Design'}
              {activePage === 'Canvases-All' && 'All Canvases'}
            </h1>
            <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto overflow-x-auto">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-[12px] shrink-0"
                style={{ background: '#F2F2F2' }}
              >
                <Search className="w-4 h-4" style={{ color: '#6B6B6B' }} />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent outline-none text-sm w-20 md:w-32"
                  style={{ color: '#1A1A1A' }}
                />
              </div>
              <button
                onClick={handleNewCanvas}
                className="flex items-center gap-2 px-4 py-2 rounded-[12px] text-sm font-medium text-white transition-all shrink-0"
                style={{ background: '#1A1A1A' }}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Canvas</span>
              </button>
              <button
                className="p-2 rounded-[12px] transition-colors shrink-0"
                style={{ background: '#F2F2F2', color: '#6B6B6B' }}
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
