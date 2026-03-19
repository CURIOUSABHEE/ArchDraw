'use client';

import { Trophy, Check } from 'lucide-react';
import type { TutorialData } from '@/data/tutorials';

interface TutorialCompleteProps {
  tutorial: TutorialData;
  onRetry: () => void;
  onNext: () => void;
  onGoToCanvas: () => void;
}

const LEARNED: Record<string, string[]> = {
  'chatgpt-architecture': [
    'How LLMs connect to chat services',
    'Why vector databases enable memory',
    'How load balancers enable scale',
    'Why observability is non-negotiable',
  ],
  'instagram-architecture': [
    'How CDNs serve media at global scale',
    'Why Kafka decouples microservices',
    'How feed pre-computation works',
    'Why NoSQL fits social graph data',
  ],
};

export function TutorialComplete({ tutorial, onRetry, onNext, onGoToCanvas }: TutorialCompleteProps) {
  const learned = LEARNED[tutorial.id] ?? [];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="max-w-md w-full mx-4 text-center rounded-2xl p-8"
        style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
        >
          <Trophy className="w-8 h-8 text-indigo-400" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Tutorial Complete!</h2>
        <p className="text-slate-400 mb-6 text-sm leading-relaxed">
          You just designed the {tutorial.title.replace('How to Design ', '')} from scratch.
          You now understand how this system works at a production level.
        </p>

        {learned.length > 0 && (
          <div
            className="text-left rounded-xl p-4 mb-6"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">What you learned</p>
            <div className="space-y-2">
              {learned.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  <span className="text-xs text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={onGoToCanvas}
            className="w-full py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
            style={{ background: '#4f46e5' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#6366f1')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#4f46e5')}
          >
            Open this diagram in Canvas →
          </button>
          <button
            onClick={onNext}
            className="w-full py-2.5 rounded-lg text-white text-sm transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          >
            Try next tutorial
          </button>
          <button
            onClick={onRetry}
            className="w-full py-2 text-xs text-slate-500 hover:text-slate-400 transition-colors"
          >
            Retry this tutorial
          </button>
        </div>
      </div>
    </div>
  );
}
