'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTutorialStore, useTutorialHelpers } from '@/store/tutorialStore';
import type { PhaseName, PhaseContent } from '@/lib/tutorial/schema';
import { validateStep } from '@/lib/tutorialValidation';

const PHASE_BUTTONS: Record<PhaseName, { label: string; action: PhaseName | 'next_step' }> = {
  context: { label: 'Got it', action: 'intro' },
  intro: { label: 'Tell me more', action: 'teaching' },
  teaching: { label: "Let's do it", action: 'action' },
  action: { label: 'Continue', action: 'next_step' },
  connecting: { label: 'Continue', action: 'next_step' },
  celebration: { label: 'Next Step', action: 'next_step' },
};

function PhaseRenderer({
  phase,
  content,
  onContinue,
  continueAfterMs = 45000,
  validationError,
}: {
  phase: PhaseName;
  content: PhaseContent;
  onContinue: () => void;
  continueAfterMs?: number;
  validationError?: string | null;
}) {
  const [showContinueAnyway, setShowContinueAnyway] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setShowContinueAnyway(false);
    setShowHint(false);
    
    if (phase === 'action' || phase === 'connecting') {
      timerRef.current = setTimeout(() => {
        setShowContinueAnyway(true);
      }, continueAfterMs);

      hintTimerRef.current = setTimeout(() => {
        setShowHint(true);
      }, 15000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, [phase, continueAfterMs]);

  const buttonConfig = PHASE_BUTTONS[phase];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{content.heading}</h3>
        <div className="text-sm text-muted-foreground whitespace-pre-wrap">{content.body}</div>
      </div>

      {showHint && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
          <span className="font-medium text-amber-700 dark:text-amber-400">Hint:</span>{' '}
          <span className="text-amber-600 dark:text-amber-300">
            Press ⌘K to search and add components to your canvas
          </span>
        </div>
      )}

      {validationError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm">
          <span className="font-medium text-red-700 dark:text-red-400">Not ready:</span>{' '}
          <span className="text-red-600 dark:text-red-300">{validationError}</span>
        </div>
      )}

      <button
        onClick={onContinue}
        className="self-end px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
      >
        {buttonConfig.label}
      </button>

      {showContinueAnyway && (
        <button
          onClick={onContinue}
          className="self-end text-sm text-muted-foreground hover:text-foreground underline"
        >
          Continue anyway
        </button>
      )}
    </div>
  );
}

export function GuidePanel() {
  const { activeTutorial, session, advancePhase, advanceManually, isLoading, exitTutorial, nodes, edges } = useTutorialStore();
  const { currentStep, currentPhase, progress, isComplete } = useTutorialHelpers();
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleContinue = useCallback(() => {
    setValidationError(null);
    
    if (session?.phase === 'action' || session?.phase === 'connecting') {
      if (currentStep) {
        const result = validateStep(currentStep as any, nodes, edges);
        if (!result.valid) {
          setValidationError(result.message);
          return;
        }
      }
      advanceManually();
    } else {
      advancePhase();
    }
  }, [session, advancePhase, advanceManually, currentStep, nodes, edges]);

  if (isLoading || !activeTutorial || !session) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading tutorial...</div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-green-600 mb-4">Tutorial Complete!</h2>
        <p className="text-muted-foreground mb-4">
          You've completed {activeTutorial.title}
        </p>
        <button
          onClick={exitTutorial}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          Finish
        </button>
      </div>
    );
  }

  if (!currentStep || !currentPhase) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">No active step</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold">{activeTutorial.title}</h2>
        <div className="text-sm text-muted-foreground mt-1">
          {progress.levelLabel} • Step {session.stepIndex + 1}
        </div>
        <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="mb-4">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {session.phase}
          </span>
        </div>

        <PhaseRenderer
          phase={session.phase}
          content={currentPhase}
          onContinue={handleContinue}
          continueAfterMs={currentStep.continueAfterMs ?? 45000}
          validationError={validationError}
        />

        {currentStep.hints.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Hints</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {currentStep.hints.map((hint, i) => (
                <li key={i}>• {hint}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
