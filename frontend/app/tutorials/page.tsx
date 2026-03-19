'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Clock, Layers, Brain, Image, BarChart2, Video, ArrowRight, CheckCircle, Share2, Check } from 'lucide-react';
import { TUTORIALS } from '@/data/tutorials';
import { useTutorialStore } from '@/store/tutorialStore';
import type { TutorialData } from '@/data/tutorials';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Brain:     ({ className }) => <Brain className={className} />,
  Image:     ({ className }) => <Image className={className} />,
  BarChart2: ({ className }) => <BarChart2 className={className} />,
  Video:     ({ className }) => <Video className={className} />,
};

const DIFFICULTY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Beginner:     { bg: 'rgba(34,197,94,0.1)',   text: '#4ade80', border: 'rgba(34,197,94,0.2)'   },
  Intermediate: { bg: 'rgba(245,158,11,0.1)',  text: '#fbbf24', border: 'rgba(245,158,11,0.2)'  },
  Advanced:     { bg: 'rgba(239,68,68,0.1)',   text: '#f87171', border: 'rgba(239,68,68,0.2)'   },
};

function TutorialCard({ tutorial }: { tutorial: TutorialData }) {
  const router = useRouter();
  const { tutorialProgress, completedTutorials } = useTutorialStore();
  const [copied, setCopied] = useState(false);

  const progress = tutorialProgress[tutorial.id] ?? 0;
  const isCompleted = completedTutorials.includes(tutorial.id);
  const isInProgress = progress > 0 && !isCompleted;
  const diffStyle = DIFFICULTY_STYLES[tutorial.difficulty] ?? DIFFICULTY_STYLES.Intermediate;
  const IconComp = ICON_MAP[tutorial.icon];

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
      className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-200 cursor-pointer group"
      style={{
        background: '#0d1117',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.4)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 1px rgba(99,102,241,0.1)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
      onClick={() => router.push(`/tutorials/${tutorial.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${tutorial.color}15`, border: `1px solid ${tutorial.color}25` }}
          >
            {IconComp && <IconComp className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: diffStyle.bg, color: diffStyle.text, border: `1px solid ${diffStyle.border}` }}
              >
                {tutorial.difficulty}
              </span>
              <span className="text-xs text-slate-500">{tutorial.category}</span>
            </div>
          </div>
        </div>
        {isCompleted && (
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
        )}
        <button
          onClick={handleShare}
          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', color: copied ? '#4ade80' : '#64748b' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          title="Copy link"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Title + description */}
      <div>
        <h3 className="text-base font-semibold text-white mb-1.5 group-hover:text-indigo-300 transition-colors">
          {tutorial.title}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{tutorial.description}</p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {tutorial.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {tutorial.estimatedTime}
        </span>
        <span className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          {tutorial.nodeCount} components
        </span>
        <span>{tutorial.stepCount} steps</span>
      </div>

      {/* Progress bar if in progress */}
      {isInProgress && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">
              {progress}/{tutorial.stepCount} steps completed
            </span>
            <span className="text-xs text-indigo-400">Resume →</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${(progress / tutorial.stepCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        className="w-full py-2.5 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors mt-auto"
        style={{ background: '#4f46e5' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#6366f1')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#4f46e5')}
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/tutorials/${tutorial.id}`);
        }}
      >
        {isInProgress ? 'Resume Tutorial' : isCompleted ? 'Redo Tutorial' : 'Start Tutorial'}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function TutorialsPage() {
  return (
    <div className="min-h-screen" style={{ background: '#080c14', color: '#f1f5f9' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 py-4 flex items-center gap-4"
        style={{ background: '#080c14', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Link
          href="/editor"
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Canvas
        </Link>
        <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-indigo-600 rounded-md flex items-center justify-center">
            <div className="w-2 h-2 border border-white/80 rounded-sm" />
          </div>
          <span className="font-semibold text-sm">ArchFlow</span>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Page header */}
        <div className="mb-12">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-6"
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              color: '#94a3b8',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            {TUTORIALS.length} tutorials available
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Interactive Tutorials</h1>
          <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
            Learn system design by building real architectures from scratch — step by step.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TUTORIALS.map((tutorial) => (
            <TutorialCard key={tutorial.id} tutorial={tutorial} />
          ))}
        </div>
      </div>
    </div>
  );
}
