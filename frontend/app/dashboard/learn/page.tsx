'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { TUTORIALS } from '@/data/tutorials';

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
  const { initialized } = useAuthStore();

  if (!initialized) {
    return (
      <div className="flex items-center justify-center" style={{ background: '#F4F4F4' }}>
        <div className="w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2">System Design Tutorials</h2>
        <p className="text-lg" style={{ color: '#6B6B6B' }}>Master system design by building real architectures from top tech companies</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {TUTORIALS.map((tutorial) => {
          const tutorialAny = tutorial as { id: string; title: string; description: string; difficulty: string; estimatedTime?: string };
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
    </div>
  );
}
