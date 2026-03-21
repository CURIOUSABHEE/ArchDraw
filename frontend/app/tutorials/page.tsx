'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft, Clock, Layers, Brain, Image, BarChart2, Video, ArrowRight,
  CheckCircle, Share2, Check, Car, MessageCircle, Twitter, CreditCard,
  Github, Link as LinkIcon, Bot, FileText, Home, Music, Linkedin, 
  PenTool, ShoppingBag, Bike, RotateCcw, X, Sparkles, Zap, BookOpen,
  ChevronRight,
} from 'lucide-react';
import { TUTORIALS, isLiveTutorial } from '@/data/tutorials';
import { useTutorialStore } from '@/store/tutorialStore';
import type { TutorialData } from '@/data/tutorials';
import { toast } from 'sonner';

const ICON_MAP: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  Brain,
  Image,
  BarChart2,
  Video,
  Car,
  MessageCircle,
  Twitter,
  CreditCard,
  Github,
  Link: LinkIcon,
  Bot,
  FileText,
  Home,
  Music,
  Linkedin,
  PenTool,
  ShoppingBag,
  Bike,
};

const DIFFICULTY_CONFIG = {
  Beginner: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', label: 'Beginner' },
  Intermediate: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'Intermediate' },
  Advanced: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'Advanced' },
};

function getTutorialMeta(tutorial: TutorialData): { nodeCount: number; stepCount: number } {
  const t = tutorial as Record<string, unknown>;
  if (t.stepCount != null && t.nodeCount != null) {
    return { nodeCount: t.nodeCount as number, stepCount: t.stepCount as number };
  }
  const levels = (t.levels ?? []) as Array<{ steps?: Array<{ requiredNodes?: string[] }>; stepCount?: number }>;
  const firstLevel = levels[0];
  const steps = firstLevel?.steps ?? [];
  const stepCount = firstLevel?.stepCount ?? steps.length;
  const nodeCount = steps.reduce(
    (acc, s) => acc + (s.requiredNodes?.length ?? 0),
    0
  );
  return { nodeCount, stepCount };
}

function TutorialCard({ tutorial }: { tutorial: TutorialData }) {
  const router = useRouter();
  const { tutorialProgress, completedTutorials } = useTutorialStore();
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const progress = tutorialProgress[tutorial.id] ?? 0;
  const { nodeCount, stepCount } = getTutorialMeta(tutorial);
  const isCompleted = completedTutorials.includes(tutorial.id);
  const isInProgress = progress > 0 && !isCompleted;
  const diffConfig = DIFFICULTY_CONFIG[tutorial.difficulty] ?? DIFFICULTY_CONFIG.Intermediate;
  const IconComp = ICON_MAP[tutorial.icon];
  const completionPercent = stepCount > 0 ? (progress / stepCount) * 100 : 0;

  function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    const url = `${window.location.origin}/tutorials/${tutorial.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => router.push(`/tutorials/${tutorial.id}`)}
    >
      <div
        className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300"
        style={{
          background: isHovered 
            ? 'linear-gradient(135deg, rgba(30,35,50,0.95) 0%, rgba(20,25,40,0.98) 100%)'
            : 'linear-gradient(135deg, rgba(25,30,45,0.6) 0%, rgba(15,20,35,0.8) 100%)',
          border: isHovered 
            ? '1px solid rgba(99,102,241,0.3)' 
            : '1px solid rgba(255,255,255,0.06)',
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: isHovered 
            ? '0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,102,241,0.1)' 
            : '0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        <div 
          className="absolute inset-0 opacity-0 transition-opacity duration-300"
          style={{ 
            opacity: isHovered ? 1 : 0,
            background: 'radial-gradient(ellipse at top right, rgba(99,102,241,0.08) 0%, transparent 50%)',
          }} 
        />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300"
                style={{ 
                  background: `linear-gradient(135deg, ${tutorial.color}20 0%, ${tutorial.color}10 100%)`,
                  border: `1px solid ${tutorial.color}30`,
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {IconComp && (
                  <IconComp 
                    className="w-5 h-5 transition-transform duration-300" 
                    style={{ color: tutorial.color }} 
                  />
                )}
              </div>
              <div>
                <div 
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium mb-1"
                  style={{ background: diffConfig.bg, color: diffConfig.color }}
                >
                  {diffConfig.label}
                </div>
                <div className="text-xs text-slate-500">{tutorial.category}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isLiveTutorial(tutorial.id) && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
                >
                  <Sparkles className="w-3 h-3" />
                  AI
                </div>
              )}
              {isCompleted && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
              )}
              <button
                onClick={handleShare}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                style={{ 
                  background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
                  color: copied ? '#4ade80' : '#64748b',
                }}
                onMouseEnter={(e) => { if (!copied) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={(e) => { if (!copied) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex-1 mb-4">
            <h3 className="text-lg font-semibold text-white mb-2 tracking-tight transition-colors duration-200" style={{ letterSpacing: '-0.02em' }}>
              {tutorial.title}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
              {tutorial.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4 max-h-20 overflow-hidden">
            {tutorial.tags.slice(0, 4).map((tag: string) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-1 rounded-md font-medium"
                style={{ background: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {tutorial.estimatedTime}
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              {nodeCount} nodes
            </span>
            <span>{stepCount} steps</span>
          </div>

          {isInProgress && (
            <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">{progress}/{stepCount} steps</span>
                <span className="text-xs font-medium" style={{ color: '#818cf8' }}>{Math.round(completionPercent)}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${completionPercent}%`,
                    background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)',
                  }}
                />
              </div>
            </div>
          )}

          <button
            className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 group/btn"
            style={{ 
              background: isInProgress ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'rgba(255,255,255,0.06)',
              color: isInProgress ? '#ffffff' : '#e2e8f0',
              border: isInProgress ? 'none' : '1px solid rgba(255,255,255,0.1)',
            }}
            onMouseEnter={(e) => {
              if (isInProgress) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)';
              } else {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (isInProgress) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
              } else {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              }
            }}
            onClick={(e) => { e.stopPropagation(); router.push(`/tutorials/${tutorial.id}`); }}
          >
            {isInProgress ? 'Resume' : isCompleted ? 'Redo' : 'Start'}
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TutorialsPage() {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const clearAllProgress = useTutorialStore((s) => s.clearAllProgress);
  const router = useRouter();

  const completedCount = useTutorialStore((s) => s.completedTutorials.length);
  const totalCount = TUTORIALS.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  function handleReset() {
    clearAllProgress();
    setShowResetConfirm(false);
    toast.success('All tutorial progress has been reset');
    router.refresh();
  }

  return (
    <div className="min-h-screen" style={{ background: '#080c14', color: '#f1f5f9' }}>
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.08) 0%, transparent 50%)',
        }}
      />

      <header 
        className="sticky top-0 z-20 backdrop-blur-xl"
        style={{ background: 'rgba(8,12,20,0.8)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/editor"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Canvas</span>
            </Link>
            <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-sm">Tutorials</span>
            </div>
          </div>

          {completedCount > 0 && (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </header>

      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowResetConfirm(false); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: 'linear-gradient(135deg, #141824 0%, #0d1117 100%)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
                  <RotateCcw className="w-5 h-5" style={{ color: '#f87171' }} />
                </div>
                <h2 className="text-lg font-semibold text-white" style={{ letterSpacing: '-0.02em' }}>Reset Progress</h2>
              </div>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              This will permanently delete all your progress across every tutorial. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-300 transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-200"
                style={{ background: '#ef4444' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f87171'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#ef4444'; }}
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="relative max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#6366f1' }} />
            {totalCount} tutorials available
          </div>
          
          <h1 
            className="text-5xl md:text-6xl font-bold text-white mb-6"
            style={{ letterSpacing: '-0.04em', lineHeight: 1.1 }}
          >
            Learn System Design
          </h1>
          
          <p className="text-lg text-slate-400 leading-relaxed max-w-xl mb-8" style={{ lineHeight: 1.7 }}>
            Build real architectures step by step. From messaging apps to AI agents — each tutorial teaches you how production systems work by guiding you to design them yourself.
          </p>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <Zap className="w-4 h-4" style={{ color: '#818cf8' }} />
              <span className="text-sm text-slate-300">Interactive Canvas</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <BookOpen className="w-4 h-4" style={{ color: '#4ade80' }} />
              <span className="text-sm text-slate-300">Step-by-step</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <Sparkles className="w-4 h-4" style={{ color: '#fbbf24' }} />
              <span className="text-sm text-slate-300">AI Mentor</span>
            </div>
          </div>
        </div>

        {completedCount > 0 && (
          <div className="mb-12 p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.03) 100%)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.2)' }}>
                  <CheckCircle className="w-5 h-5" style={{ color: '#818cf8' }} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Your Progress</div>
                  <div className="text-xs text-slate-400">{completedCount} of {totalCount} tutorials completed</div>
                </div>
              </div>
              <div className="text-2xl font-bold" style={{ color: '#818cf8' }}>{completionPercent}%</div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ 
                  width: `${completionPercent}%`,
                  background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)',
                }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold text-white" style={{ letterSpacing: '-0.02em' }}>All Tutorials</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TUTORIALS.map((tutorial) => (
            <TutorialCard key={tutorial.id} tutorial={tutorial as TutorialData} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-slate-500">
            More tutorials coming soon
            <span className="inline-flex items-center gap-1 ml-2" style={{ color: '#6366f1' }}>
              <Sparkles className="w-3.5 h-3.5" />
              AI Agent System, RAG Application, URL Shortener
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
