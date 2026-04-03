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
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDiagramStore } from '@/store/diagramStore';
import { TUTORIALS } from '@/data/tutorials';

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

function TutorialCard({
  title,
  description,
  difficulty,
  time,
  onClick,
}: {
  title: string;
  description: string;
  difficulty: string;
  time: string;
  onClick: () => void;
}) {
  const getDifficultyColor = (level: string) => {
    const l = level.toLowerCase();
    if (l === 'beginner') return { bg: '#DFF5E3', color: '#166534' };
    if (l === 'intermediate') return { bg: '#FFE4D6', color: '#9A3412' };
    if (l === 'advanced') return { bg: '#FEE2E2', color: '#991B1B' };
    return { bg: '#F2F2F2', color: '#6B6B6B' };
  };

  const colors = getDifficultyColor(difficulty);

  return (
    <button
      onClick={onClick}
      className="p-5 rounded-[20px] text-left transition-all duration-200 hover:scale-[1.02]"
      style={{ background: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          📖
        </div>
        <span
          className="px-2.5 py-1 rounded-[8px] text-xs font-medium"
          style={{ background: colors.bg, color: colors.color }}
        >
          {difficulty}
        </span>
      </div>
      <h3 className="font-semibold text-[#1A1A1A] text-lg mb-2">{title}</h3>
      <p className="text-sm mb-3 line-clamp-2" style={{ color: '#6B6B6B' }}>{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: '#6B6B6B' }}>{time}</span>
        <div className="flex items-center gap-1 text-sm font-medium" style={{ color: '#6366f1' }}>
          Start <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </button>
  );
}

export default function LearnPage() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();
  const { addCanvas } = useDiagramStore();
  const [mounted, setMounted] = useState(false);
  const [activeMenu, setActiveMenu] = useState('Learn');

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
              onClick={() => router.push('/dashboard')}
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
              onClick={() => router.push('/dashboard')}
            />
            <SidebarItem
              icon={GraduationCap}
              label="Learn"
              active={activeMenu === 'Learn'}
              onClick={() => router.push('/dashboard')}
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
        <main className="space-y-6">
          {/* Header */}
          <header
            className="flex items-center justify-between px-5 py-3 rounded-[20px]"
            style={{ background: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}
          >
            <h1 className="text-xl font-bold text-[#1A1A1A]">Learn System Design</h1>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-[12px]"
                style={{ background: '#F2F2F2' }}
              >
                <Search className="w-4 h-4" style={{ color: '#6B6B6B' }} />
                <input
                  type="text"
                  placeholder="Search tutorials..."
                  className="bg-transparent outline-none text-sm w-40"
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

          {/* Page Title */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2">System Design Tutorials</h2>
            <p className="text-lg" style={{ color: '#6B6B6B' }}>Master system design by building real architectures from top tech companies</p>
          </div>

          {/* Tutorial Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {TUTORIALS.map((tutorial) => {
              const tutorialAny = tutorial as any;
              return (
                <TutorialCard
                  key={tutorial.id}
                  title={tutorial.title}
                  description={tutorial.description}
                  difficulty={tutorial.difficulty}
                  time={tutorialAny.estimatedTime || '~30 mins'}
                  onClick={() => router.push(`/tutorials/${tutorial.id}`)}
                />
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}