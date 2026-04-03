'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  LayoutTemplate,
  GraduationCap,
  MoreHorizontal,
  Clock,
  Trash2,
  MoreVertical,
  ArrowRight,
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

interface CanvasCardProps {
  id: string;
  name: string;
  updatedAt?: number;
  onClick: () => void;
  onDelete: () => void;
}

function CanvasCard({ id, name, updatedAt, onClick, onDelete }: CanvasCardProps) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className="group relative bg-white rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
      style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}
      onClick={onClick}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </div>
        {showDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <h3 className="font-semibold text-foreground mb-1 truncate">{name}</h3>
      {updatedAt && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {formatRelativeTime(updatedAt)}
        </div>
      )}
    </div>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: '#6366f1' }}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  );
}

function TemplateCard({
  name,
  description,
  icon,
  onClick,
}: {
  name: string;
  description: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-64 p-5 rounded-2xl bg-white text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-foreground mb-1">{name}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
    </button>
  );
}

function LearnCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 min-w-[280px] p-5 rounded-2xl bg-white text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: '#f0f0f0' }}
        >
          <GraduationCap className="w-5 h-5" style={{ color: '#6366f1' }} />
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="mt-3 flex items-center gap-1 text-xs text-primary font-medium">
        Explore <ArrowRight className="w-3 h-3" />
      </div>
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();
  const { canvases, addCanvas, removeCanvas, switchCanvas } = useDiagramStore();
  const [mounted, setMounted] = useState(false);

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
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const recentCanvases = [...canvases]
    .filter((c) => c.nodes.length > 0)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 6);

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

  return (
    <div className="min-h-screen py-8 px-6" style={{ background: '#F4F4F4' }}>
      <div className="max-w-5xl mx-auto">
        {/* Floating Navbar */}
        <nav
          className="flex items-center justify-between px-6 py-4 mb-8"
          style={{ background: 'white', borderRadius: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z" />
              </svg>
            </div>
            <span className="font-semibold text-foreground">ArchDraw</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/editor')}
              className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              Editor
            </button>
          </div>
        </nav>

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </h1>
          <p className="text-muted-foreground">Here&apos;s an overview of your workspaces</p>
        </div>

        {/* Quick Actions */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Quick Actions
          </h2>
          <div className="flex gap-4">
            <QuickActionButton icon={Plus} label="New Canvas" onClick={handleNewCanvas} />
            <QuickActionButton
              icon={LayoutTemplate}
              label="Templates"
              onClick={() => router.push('/editor')}
            />
            <QuickActionButton
              icon={GraduationCap}
              label="Learn"
              onClick={() => router.push('/tutorials')}
            />
          </div>
        </section>

        {/* Recent Canvases */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Recent Canvases
            </h2>
            {recentCanvases.length > 0 && (
              <button
                onClick={() => router.push('/editor')}
                className="text-sm text-primary font-medium hover:opacity-80 transition-opacity flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
          {recentCanvases.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentCanvases.map((canvas) => (
                <CanvasCard
                  key={canvas.id}
                  id={canvas.id}
                  name={canvas.name}
                  updatedAt={canvas.updatedAt}
                  onClick={() => handleOpenCanvas(canvas.id)}
                  onDelete={() => handleDeleteCanvas(canvas.id)}
                />
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-12 rounded-2xl bg-white"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#f5f5f5' }}>
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No canvases yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create your first architecture diagram</p>
              <button
                onClick={handleNewCanvas}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                Create New Canvas
              </button>
            </div>
          )}
        </section>

        {/* Templates */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Templates
            </h2>
            <button
              onClick={() => router.push('/editor')}
              className="text-sm text-primary font-medium hover:opacity-80 transition-opacity flex items-center gap-1"
            >
              Browse all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {TEMPLATES.slice(0, 4).map((template) => (
              <TemplateCard
                key={template.id}
                name={template.name}
                description={template.description}
                icon={template.icon}
                onClick={() => handleOpenTemplate(template.id)}
              />
            ))}
          </div>
        </section>

        {/* Learn Section */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Learn System Design
          </h2>
          <div className="flex gap-4 flex-wrap">
            <LearnCard
              title="Netflix Architecture"
              description="Learn how Netflix handles 200M+ streaming users globally"
              onClick={() => router.push('/learn/netflix-architecture')}
            />
            <LearnCard
              title="ChatGPT Architecture"
              description="Explore LLM-powered chat with RAG and vector databases"
              onClick={() => router.push('/learn/chatgpt-architecture')}
            />
            <LearnCard
              title="Uber Architecture"
              description="Real-time matching and dispatch system design"
              onClick={() => router.push('/learn/uber-architecture')}
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            © 2026 ArchDraw — Built for engineers who think in systems
          </p>
        </footer>
      </div>
    </div>
  );
}