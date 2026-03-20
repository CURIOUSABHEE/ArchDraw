'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, PenSquare, RotateCcw, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { getTutorialById, isLiveTutorial, isLeveledTutorial, TUTORIALS } from '@/data/tutorials';
import { useTutorialStore } from '@/store/tutorialStore';
import { validateStep } from '@/lib/tutorialValidation';
import { GuidePanel } from '@/components/tutorial/GuidePanel';
import { TutorialComplete } from '@/components/tutorial/TutorialComplete';
import type { TutorialData } from '@/data/tutorials';
import type { Tutorial, TutorialLevel } from '@/lib/tutorial/types';
import type { TutorialLevelData } from '@/data/tutorials';
const _TutorialLevelData: TutorialLevelData = null as unknown as TutorialLevel;

// Dynamic import to avoid SSR issues with ReactFlow
const TutorialCanvas = dynamic(
  () => import('@/components/tutorial/TutorialCanvas').then((m) => ({ default: m.TutorialCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center" style={{ background: '#080c14' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-600">Loading canvas…</span>
        </div>
      </div>
    ),
  }
);


// ── Level Complete Screen ────────────────────────────────────────────────────
function LevelCompleteScreen({
  level,
  nextLevel,
  nodeCount,
  edgeCount,
  onContinue,
  onSave,
}: {
  level: TutorialLevelData;
  nextLevel: TutorialLevelData;
  nodeCount: number;
  edgeCount: number;
  onContinue: () => void;
  onSave: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(8,12,20,0.85)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm mx-4 rounded-2xl p-6 flex flex-col gap-5" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
            Level {level.level} Complete
          </span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white leading-snug">
            You built the {level.title.toLowerCase()} of this architecture.
          </h2>
          <p className="text-sm text-slate-400 mt-1">{nodeCount} components · {edgeCount} connections</p>
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Ready for Level {nextLevel.level}?</p>
          <p className="text-sm text-slate-300">{nextLevel.description}</p>
          <p className="text-xs text-slate-500 mt-2">You'll add {nextLevel.steps.length} more components on top of what you built.</p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={onContinue}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
            style={{ background: '#4f46e5' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#6366f1')}
            onMouseLeave={e => (e.currentTarget.style.background = '#4f46e5')}
          >
            Continue to Level {nextLevel.level} →
          </button>
          <button
            onClick={onSave}
            className="w-full py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Save &amp; come back later
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TutorialPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const tutorial = getTutorialById(id);
  const isLeveled = tutorial ? isLeveledTutorial(tutorial.id) : false;

  const {
    currentStep, totalSteps, nodes, edges,
    messages, isTyping, validationStatus, validationError,
    isComplete, isLevelComplete,
    currentLevel, completedLevels,
    startTutorial, setValidationStatus,
    addMessage, advanceStep, skipStep, resetTutorial,
    completeTutorial, advanceLevel, dismissLevelComplete,
    activeTutorialId, clearTutorialCanvas,
    loadFromSupabase, getProgress, saveProgress,
  } = useTutorialStore();

  const hasStarted = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const [headerRestartConfirm, setHeaderRestartConfirm] = useState(false);
  const headerRestartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [panelRatio, setPanelRatio] = useState<'3:7' | '4:6'>('3:7');
  const [canvasTheme, setCanvasTheme] = useState<'dark' | 'light'>('dark');

  // If navigating to a different tutorial, clear the persisted canvas
  useEffect(() => {
    if (!tutorial) return;
    if (activeTutorialId && activeTutorialId !== tutorial.id) {
      clearTutorialCanvas();
    }
    useTutorialStore.setState({ activeTutorialId: tutorial.id });
  }, [tutorial, activeTutorialId, clearTutorialCanvas]);

  const levels: TutorialLevelData[] = isLeveled && tutorial ? (tutorial as Tutorial).levels ?? [] : [];
  const allSteps = tutorial
    ? (isLeveled
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (tutorial as any).levels?.flatMap((l: { steps: unknown[] }) => l.steps) ?? []
        : (tutorial as TutorialData).steps ?? [])
    : [];
  const currentLevelData = levels[currentLevel - 1] ?? null;
  const currentLevelSteps = currentLevelData?.steps ?? allSteps;

  // Start tutorial on mount
  useEffect(() => {
    if (!tutorial || hasStarted.current) return;
    hasStarted.current = true;
    if (isLeveled && levels.length > 0) {
      const levelSteps = levels[currentLevel - 1]?.steps ?? [];
      startTutorial(tutorial.id, levelSteps.length);
    } else {
      startTutorial(tutorial.id, allSteps.length);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorial]);

  // Restore rich progress on mount (Supabase first, then localStorage)
  useEffect(() => {
    if (!tutorial) return;
    const tutorialId = tutorial.id;

    const restore = async () => {
      // Try Supabase first (authenticated users)
      const supabaseProgress = await loadFromSupabase(tutorialId);
      const progress = supabaseProgress ?? getProgress(tutorialId);
      if (!progress || progress.currentStep <= 1) return;

      // Restore level/step state
      useTutorialStore.setState({
        currentLevel: progress.currentLevel,
        currentStep: progress.currentStep,
        completedLevels: progress.completedLevels,
      });

      // Update legacy tutorialProgress map too
      useTutorialStore.setState((s) => ({
        tutorialProgress: {
          ...s.tutorialProgress,
          [tutorialId]: progress.currentStep,
        },
      }));

      toast.success(
        `Resumed from Level ${progress.currentLevel} · Step ${progress.currentStep}`,
        { duration: 3000 }
      );
    };

    restore().catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorial?.id]);

  const handleValidate = useCallback(() => {
    if (!tutorial) return;
    const step = currentLevelSteps[currentStep - 1];
    if (!step) return;

    const result = validateStep(step, nodes, edges);
    if (result.valid) {
      setValidationStatus('success');
      addMessage('success', result.message);
      setTimeout(() => {
        if (!mountedRef.current) return;
        if (isLeveled && currentStep >= totalSteps) {
          const nextLevelData = levels[currentLevel]; // 0-indexed, so currentLevel = next
          if (nextLevelData) {
            useTutorialStore.setState({ isLevelComplete: true });
          } else {
            completeTutorial();
          }
        } else if (!isLeveled && currentStep >= totalSteps) {
          completeTutorial();
        } else {
          advanceStep();
        }
      }, 1500);
    } else {
      setValidationStatus('error', result.message);
      addMessage('error', result.message);
    }
  }, [tutorial, currentStep, nodes, edges, setValidationStatus, addMessage, advanceStep,
      completeTutorial, totalSteps, isLeveled, currentLevel, levels, currentLevelSteps]);

  const handleSkip = useCallback(() => {
    setValidationStatus('idle');
    skipStep();
  }, [setValidationStatus, skipStep]);

  const handleRetry = useCallback(() => {
    if (!tutorial) return;
    resetTutorial(tutorial.id);
    hasStarted.current = false;
  }, [tutorial, resetTutorial]);

  const handleRestart = useCallback(() => {
    if (!tutorial) return;
    resetTutorial(tutorial.id);
    hasStarted.current = false;
    setHeaderRestartConfirm(false);
    if (headerRestartTimer.current) clearTimeout(headerRestartTimer.current);

    // Fire-and-forget: delete Supabase row for authenticated users
    import('@/lib/supabase').then(({ isSupabaseConfigured, getSupabaseClient }) => {
      if (!isSupabaseConfigured) return;
      import('@/store/authStore').then(({ useAuthStore }) => {
        const { user } = useAuthStore.getState();
        if (!user) return;
        void getSupabaseClient()
          .from('tutorial_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('tutorial_id', tutorial.id);
      });
    });

    toast.success('Tutorial restarted');
  }, [tutorial, resetTutorial]);

  const showHeaderConfirm = useCallback(() => {
    setHeaderRestartConfirm(true);
    if (headerRestartTimer.current) clearTimeout(headerRestartTimer.current);
    headerRestartTimer.current = setTimeout(() => setHeaderRestartConfirm(false), 3000);
  }, []);

  const handleGoToCanvas = useCallback(() => { router.push('/editor'); }, [router]);

  const handleNextTutorial = useCallback(() => {
    const currentIndex = TUTORIALS.findIndex((t) => t.id === id);
    const next = TUTORIALS[(currentIndex + 1) % TUTORIALS.length];
    router.push(`/tutorials/${next.id}`);
  }, [id, router]);

  const handleContinueToNextLevel = useCallback(() => {
    if (!tutorial || !levels.length) return;
    const nextLevelData = levels[currentLevel]; // currentLevel is 1-indexed, levels is 0-indexed
    if (!nextLevelData) return;
    advanceLevel(nextLevelData.steps.length);
  }, [tutorial, levels, currentLevel, advanceLevel]);

  const handleSaveAndLeave = useCallback(() => {
    dismissLevelComplete();
    router.push('/tutorials');
  }, [dismissLevelComplete, router]);

  if (!tutorial) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080c14', color: '#f1f5f9' }}>
        <div className="text-center">
          <p className="text-slate-400 mb-4">Tutorial not found.</p>
          <Link href="/tutorials" className="text-indigo-400 hover:text-indigo-300 text-sm">← Back to tutorials</Link>
        </div>
      </div>
    );
  }

  const step = currentLevelSteps[currentStep - 1];
  const nextLevelData = isLeveled ? (levels[currentLevel] ?? null) : null;
  const stepLabel = isLeveled && currentLevelData
    ? `Level ${currentLevel} · Step ${currentStep}/${totalSteps}`
    : `Step ${currentStep} of ${totalSteps}`;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: '#080c14' }}>
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-4 shrink-0 z-20" style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/tutorials" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Tutorials</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white hidden md:block">{tutorial.title}</span>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
            {stepLabel}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-slate-500">{Math.round((currentStep / totalSteps) * 100)}%</span>
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
            </div>
          </div>
          <button
            onClick={() => setCanvasTheme((t) => t === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white transition-colors flex-shrink-0"
            style={{ border: '1px solid rgba(255,255,255,0.12)' }}
            title={canvasTheme === 'dark' ? 'Switch to light canvas' : 'Switch to dark canvas'}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
          >
            {canvasTheme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          {headerRestartConfirm ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Are you sure?</span>
              <button onClick={handleRestart} className="px-2.5 py-1 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: '#ef4444' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#f87171')} onMouseLeave={(e) => (e.currentTarget.style.background = '#ef4444')}>Yes, restart</button>
              <button onClick={() => { setHeaderRestartConfirm(false); if (headerRestartTimer.current) clearTimeout(headerRestartTimer.current); }} className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.06)' }}>Cancel</button>
            </div>
          ) : (
            <button onClick={showHeaderConfirm} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-medium transition-colors flex-shrink-0" style={{ border: '1px solid rgba(255,255,255,0.12)' }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')} onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}>
              <RotateCcw className="w-3.5 h-3.5" />
              Restart
            </button>
          )}
          <a href="/editor" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-colors flex-shrink-0" style={{ background: '#4f46e5' }} onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = '#6366f1')} onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = '#4f46e5')}>
            <PenSquare className="w-3.5 h-3.5" />
            Create your own
          </a>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="shrink-0 overflow-hidden flex flex-col h-full transition-all duration-300" style={{ width: panelRatio === '3:7' ? '30%' : '40%' }}>
          {step && (
            <GuidePanel
              step={step}
              currentStep={currentStep}
              totalSteps={totalSteps}
              tutorial={tutorial as TutorialData}
              isLive={isLiveTutorial(tutorial.id)}
              messages={messages}
              isTyping={isTyping}
              validationStatus={validationStatus}
              validationError={validationError}
              onValidate={handleValidate}
              onSkip={handleSkip}
              onRestart={handleRestart}
              currentLevel={isLeveled ? currentLevel : undefined}
              totalLevels={isLeveled ? levels.length : undefined}
              completedLevels={isLeveled ? completedLevels : undefined}
              onNextLevel={isLeveled && levels[currentLevel] ? handleContinueToNextLevel : undefined}
            />
          )}
        </div>
        <div className="shrink-0 flex items-center justify-center cursor-pointer group z-10" style={{ width: 20, background: '#0d1117', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }} onClick={() => setPanelRatio((r) => r === '3:7' ? '4:6' : '3:7')} title={panelRatio === '3:7' ? 'Expand chat (4:6)' : 'Shrink chat (3:7)'}>
          <div className="flex flex-col gap-1 opacity-30 group-hover:opacity-80 transition-opacity">
            <div className="w-0.5 h-3 rounded-full bg-slate-400" />
            <div className="w-0.5 h-3 rounded-full bg-slate-400" />
            <div className="w-0.5 h-3 rounded-full bg-slate-400" />
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <TutorialCanvas theme={canvasTheme} />
        </div>

        {/* Level complete overlay */}
        {isLevelComplete && isLeveled && currentLevelData && nextLevelData && (
          <LevelCompleteScreen
            level={currentLevelData}
            nextLevel={nextLevelData}
            nodeCount={nodes.length}
            edgeCount={edges.length}
            onContinue={handleContinueToNextLevel}
            onSave={handleSaveAndLeave}
          />
        )}
      </div>

      {isComplete && (
        <TutorialComplete
          tutorial={tutorial as TutorialData}
          onRetry={handleRetry}
          onNext={handleNextTutorial}
          onGoToCanvas={handleGoToCanvas}
        />
      )}
    </div>
  );
}
