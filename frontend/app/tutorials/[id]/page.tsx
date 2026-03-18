'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, PenSquare } from 'lucide-react';
import { getTutorialById } from '@/data/tutorials';
import { useTutorialStore } from '@/store/tutorialStore';
import { validateStep } from '@/lib/tutorialValidation';
import { GuidePanel } from '@/components/tutorial/GuidePanel';
import { TutorialComplete } from '@/components/tutorial/TutorialComplete';
import { TUTORIALS } from '@/data/tutorials';

// Dynamic import to avoid SSR issues with ReactFlow
const TutorialCanvas = dynamic(
  () => import('@/components/tutorial/TutorialCanvas').then((m) => ({ default: m.TutorialCanvas })),
  { ssr: false }
);

export default function TutorialPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const tutorial = getTutorialById(id);

  const {
    currentStep, totalSteps, nodes, edges,
    messages, isTyping, validationStatus, validationError,
    isComplete,
    startTutorial, setValidationStatus,
    addMessage, advanceStep, skipStep, resetTutorial,
    completeTutorial,
  } = useTutorialStore();

  const hasStarted = useRef(false);

  // Start tutorial on mount
  useEffect(() => {
    if (!tutorial || hasStarted.current) return;
    hasStarted.current = true;
    startTutorial(tutorial.id, tutorial.steps.length);
  }, [tutorial, startTutorial]);



  const handleValidate = useCallback(() => {
    if (!tutorial) return;
    const step = tutorial.steps[currentStep - 1];
    if (!step) return;

    const result = validateStep(step, nodes, edges);
    if (result.valid) {
      setValidationStatus('success');
      addMessage('success', result.message);
      // Auto-advance after 1.5s
      setTimeout(() => {
        if (currentStep >= totalSteps) {
          completeTutorial();
        } else {
          advanceStep();
        }
      }, 1500);
    } else {
      setValidationStatus('error', result.message);
      addMessage('error', result.message);
    }
  }, [tutorial, currentStep, nodes, edges, setValidationStatus, addMessage, advanceStep, completeTutorial, totalSteps]);

  const handleSkip = useCallback(() => {
    setValidationStatus('idle');
    skipStep();
  }, [setValidationStatus, skipStep]);

  const handleRetry = useCallback(() => {
    if (!tutorial) return;
    resetTutorial(tutorial.id);
    hasStarted.current = false;
    router.refresh();
  }, [tutorial, resetTutorial, router]);

  const handleGoToCanvas = useCallback(() => {
    router.push('/editor');
  }, [router]);

  const handleNextTutorial = useCallback(() => {
    const currentIndex = TUTORIALS.findIndex((t) => t.id === id);
    const next = TUTORIALS[(currentIndex + 1) % TUTORIALS.length];
    router.push(`/tutorials/${next.id}`);
  }, [id, router]);

  if (!tutorial) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#080c14', color: '#f1f5f9' }}
      >
        <div className="text-center">
          <p className="text-slate-400 mb-4">Tutorial not found.</p>
          <Link href="/tutorials" className="text-indigo-400 hover:text-indigo-300 text-sm">
            ← Back to tutorials
          </Link>
        </div>
      </div>
    );
  }

  const step = tutorial.steps[currentStep - 1];

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{ background: '#080c14' }}
    >
      {/* Header bar */}
      <header
        className="h-12 flex items-center justify-between px-4 shrink-0 z-20"
        style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Left */}
        <Link
          href="/tutorials"
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Tutorials</span>
        </Link>

        {/* Center */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white hidden md:block">{tutorial.title}</span>
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            Step {currentStep} of {totalSteps}
          </span>
        </div>

        {/* Right — progress bar + create button */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-slate-500">{Math.round((currentStep / totalSteps) * 100)}%</span>
            <div
              className="w-24 h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
          <a
            href="/editor"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-colors flex-shrink-0"
            style={{ background: '#4f46e5' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = '#6366f1')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = '#4f46e5')}
          >
            <PenSquare className="w-3.5 h-3.5" />
            Create your own
          </a>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Guide panel — 20% */}
        <div className="w-72 shrink-0 overflow-hidden flex flex-col h-full">
          {step && (
            <GuidePanel
              step={step}
              currentStep={currentStep}
              totalSteps={totalSteps}
              tutorial={tutorial}
              messages={messages}
              isTyping={isTyping}
              validationStatus={validationStatus}
              validationError={validationError}
              onValidate={handleValidate}
              onSkip={handleSkip}
            />
          )}
        </div>

        {/* Canvas area — 80% */}
        <div className="flex flex-1 overflow-hidden">
          <TutorialCanvas />
        </div>
      </div>

      {/* Completion modal */}
      {isComplete && (
        <TutorialComplete
          tutorial={tutorial}
          onRetry={handleRetry}
          onNext={handleNextTutorial}
          onGoToCanvas={handleGoToCanvas}
        />
      )}
    </div>
  );
}
