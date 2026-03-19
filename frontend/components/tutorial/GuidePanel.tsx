'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { TutorialStep, TutorialData } from '@/data/tutorials';
import type { TutorialMessage } from '@/store/tutorialStore';
import { useTutorialStore } from '@/store/tutorialStore';
import { useTutorialChat } from '@/hooks/useTutorialChat';
import type { Node } from 'reactflow';
import staticCacheData from '@/data/tutorialCache.json';

// ── Types ────────────────────────────────────────────────────────────────────
type Phase = 'context' | 'intro' | 'teaching' | 'action' | 'celebration';

interface Chip {
  label: string;
  nextPhase: Phase | 'next_step' | 'reteach' | 'context_more';
}

// ── Fix 1: Fuzzy node matching ───────────────────────────────────────────────
function nodeMatchesRequired(nodeLabel: string, requiredRaw: string): boolean {
  const label = nodeLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
  const required = requiredRaw.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!required) return false;
  if (label.includes(required)) return true;
  if (required.includes(label) && label.length >= 3) return true;
  const prefix = required.slice(0, 6);
  if (prefix.length >= 3 && label.includes(prefix)) return true;
  return false;
}

// ── Pure chip logic ──────────────────────────────────────────────────────────
function getChips(
  phase: Phase,
  isLastStep: boolean,
  explainCount: number,
  contextTellMoreCount: number,
): Chip[] {
  switch (phase) {
    case 'context':
      return [
        { label: "Let's build it →", nextPhase: 'intro' },
        ...(contextTellMoreCount < 2 ? [{ label: 'Tell me more', nextPhase: 'context_more' as const }] : []),
      ];
    case 'intro':
      return [
        { label: 'Yes, I know it', nextPhase: 'action' },
        { label: 'No, explain it', nextPhase: 'teaching' },
      ];
    case 'teaching':
      if (explainCount >= 3) {
        return [{ label: "Let's just build it", nextPhase: 'action' }];
      }
      return [
        { label: "Got it, let's add it", nextPhase: 'action' },
        { label: 'Explain more', nextPhase: 'reteach' },
      ];
    case 'action':
      return [];
    case 'celebration':
      if (isLastStep) return [];
      return [{ label: 'Next step →', nextPhase: 'next_step' }];
    default:
      return [];
  }
}

// ── Word-by-word stream hook ─────────────────────────────────────────────────
const WORD_DELAY_MS = 48;

function useWordByWordStream(fullText: string, isStreaming: boolean) {
  const [displayed, setDisplayed] = useState('');
  const wordIdxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetRef = useRef('');

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!fullText) {
      setDisplayed('');
      targetRef.current = '';
      wordIdxRef.current = 0;
      return;
    }

    const isNewMessage = targetRef.current !== '' && !fullText.startsWith(targetRef.current);
    if (isNewMessage || targetRef.current === '') {
      wordIdxRef.current = 0;
    }
    targetRef.current = fullText;

    const words = fullText.trim().split(/\s+/);

    if (!isStreaming) {
      setDisplayed(fullText);
      wordIdxRef.current = words.length;
      return;
    }

    const tick = () => {
      if (wordIdxRef.current >= words.length) return;
      wordIdxRef.current += 1;
      setDisplayed(words.slice(0, wordIdxRef.current).join(' '));
      if (wordIdxRef.current < words.length) {
        timerRef.current = setTimeout(tick, WORD_DELAY_MS);
      }
    };

    if (wordIdxRef.current < words.length) {
      timerRef.current = setTimeout(tick, WORD_DELAY_MS);
    }

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [fullText, isStreaming]);

  return displayed;
}

// ── Props ────────────────────────────────────────────────────────────────────
interface GuidePanelProps {
  step: TutorialStep;
  currentStep: number;
  totalSteps: number;
  tutorial: TutorialData;
  isLive: boolean;
  messages: TutorialMessage[];
  isTyping: boolean;
  validationStatus: 'idle' | 'success' | 'error';
  validationError: string;
  onValidate: () => void;
  onSkip: () => void;
  onRestart: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────
export function GuidePanel({
  step,
  currentStep,
  totalSteps,
  tutorial,
  isLive,
}: GuidePanelProps) {
  const [committedPhase, setCommittedPhase] = useState<Phase>('context');
  const pendingPhaseRef = useRef<Phase>('context');
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [explainCount, setExplainCount] = useState(0);
  const [reminderText, setReminderText] = useState<string | null>(null);

  // Context phase state
  const [hasShownContext, setHasShownContext] = useState(false);
  const [contextTellMoreCount, setContextTellMoreCount] = useState(0);

  // Dead-end fix refs
  const stepCompletedRef = useRef(false);
  const pendingCelebration = useRef(false);

  // Escape hatch state
  const [showEscapeHatch, setShowEscapeHatch] = useState(false);
  const escapeHatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detection flash state
  const [detectionFlash, setDetectionFlash] = useState(false);

  const {
    advanceStep, completeTutorial, nodes,
    savePhase, getPersistedPhase,
  } = useTutorialStore();

  const { sendMessage, isLoading, streamingContent, clearHistory, abort } = useTutorialChat({
    tutorialId: tutorial.id,
    stepNumber: currentStep,
    stepTitle: step.title,
    stepExplanation: step.explanation,
  });

  // Stable refs
  const stepRef = useRef(step);
  stepRef.current = step;
  const tutorialRef = useRef(tutorial);
  tutorialRef.current = tutorial;
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;
  const totalStepsRef = useRef(totalSteps);
  totalStepsRef.current = totalSteps;
  const committedPhaseRef = useRef(committedPhase);
  committedPhaseRef.current = committedPhase;
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Build phase prompt ───────────────────────────────────────────────────
  const buildPrompt = useCallback((p: Phase, extra?: string): string => {
    const s = stepRef.current;
    const t = tutorialRef.current;
    const cs = currentStepRef.current;
    const ts = totalStepsRef.current;
    const base = `TUTORIAL:${t.id} STEP:${cs}/${ts} COMPONENT:"${s.title}"`;
    switch (p) {
      case 'context':
        return `TUTORIAL:${t.id} PHASE:CONTEXT`;
      case 'intro':
        return `${base} PHASE:INTRO`;
      case 'teaching':
        return extra === 'reteach'
          ? `${base} PHASE:TEACHING RETEACH:true EXPLANATION:"${s.explanation}" WHY:"${s.why}"`
          : `${base} PHASE:TEACHING EXPLANATION:"${s.explanation}" WHY:"${s.why}"`;
      case 'action':
        if (extra === 'force') {
          return `${base} PHASE:ACTION INSTRUCTION:"${s.action}" NOTE:"User has seen enough explanation — keep this very short and direct."`;
        }
        return `${base} PHASE:ACTION INSTRUCTION:"${s.action}"`;
      case 'celebration':
        return `${base} PHASE:CELEBRATION`;
    }
  }, []);

  // ── Commit phase + persist ───────────────────────────────────────────────
  const commitPhase = useCallback((p: Phase) => {
    setCommittedPhase(p);
    if (p !== 'context') {
      savePhase(tutorialRef.current.id, currentStepRef.current, p);
    }
  }, [savePhase]);

  // ── Trigger AI ───────────────────────────────────────────────────────────
  const triggerPhase = useCallback(async (p: Phase, extra?: string) => {
    pendingPhaseRef.current = p;
    setReminderText(null);

    if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
    streamTimeoutRef.current = setTimeout(() => {
      console.warn('[GuidePanel] stream timeout — aborting and force committing phase', p);
      abort();
      if (!streamingContent) {
        setReminderText(stepRef.current.explanation || 'Let\'s continue building.');
      }
      commitPhase(p);
    }, 10_000);

    try {
      await sendMessage(buildPrompt(p, extra));
    } catch {
      setReminderText(stepRef.current.explanation || 'Something went wrong. Try adding the component to continue.');
      commitPhase('action');
      return;
    } finally {
      if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
    }

    commitPhase(p);
  }, [sendMessage, buildPrompt, commitPhase, abort, streamingContent]);

  // ── Step/tutorial change: reset and fire CONTEXT or INTRO ────────────────
  const lastFiredRef = useRef<string>('');

  useEffect(() => {
    if (currentStep > totalSteps) return;
    if (!tutorial.id || !step?.title || currentStep < 1) return;

    const key = `${tutorial.id}:${currentStep}`;
    if (lastFiredRef.current === key) return;
    lastFiredRef.current = key;

    clearHistory();
    pendingPhaseRef.current = 'intro';
    setCommittedPhase('intro');
    setShowInput(false);
    setInputValue('');
    setExplainCount(0);
    setReminderText(null);
    setShowEscapeHatch(false);
    setDetectionFlash(false);

    // Reset dead-end refs on every step change
    stepCompletedRef.current = false;
    pendingCelebration.current = false;

    // Clear escape hatch timer
    if (escapeHatchTimerRef.current) clearTimeout(escapeHatchTimerRef.current);

    // First step of tutorial: show context phase (once per tutorial session)
    if (currentStep === 1 && !hasShownContext) {
      const contextKey = `${tutorial.id}:context`;
      const contextText = (staticCacheData as Record<string, string>)[contextKey];
      if (contextText) {
        setReminderText(contextText);
        pendingPhaseRef.current = 'context';
        setTimeout(() => commitPhase('context'), 0);
        return;
      }
      // Netflix live AI: call Groq for context
      if (isLive) {
        const t = setTimeout(() => triggerPhase('context'), 50);
        return () => clearTimeout(t);
      }
      // No context entry — fall through to intro
    }

    // Normal step flow
    const persisted = getPersistedPhase(tutorial.id, currentStep);
    const startPhase: Phase = (persisted === 'action' || persisted === 'celebration')
      ? (persisted as Phase)
      : 'intro';

    if (!isLive) {
      const resolveStaticText = (): string => {
        if (currentStep <= 3) {
          const cacheKey = `${tutorial.id}:${currentStep}:intro:0`;
          const cached = (staticCacheData as Record<string, string>)[cacheKey];
          if (cached) return cached;
        }
        return step.openingMessage ?? step.explanation ?? step.action;
      };
      const text = resolveStaticText();
      pendingPhaseRef.current = startPhase;
      setReminderText(text);
      setTimeout(() => commitPhase(startPhase), 0);
      return;
    }

    const t = setTimeout(() => triggerPhase(startPhase), 50);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, tutorial.id, step?.title]);

  // ── Chunk-level stall timeout ────────────────────────────────────────────
  const prevContentRef = useRef('');
  useEffect(() => {
    if (!isLoading) {
      prevContentRef.current = '';
      return;
    }
    if (streamingContent !== prevContentRef.current) {
      prevContentRef.current = streamingContent;
      if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
      streamTimeoutRef.current = setTimeout(() => {
        console.warn('[GuidePanel] chunk stall — force committing phase', pendingPhaseRef.current);
        commitPhase(pendingPhaseRef.current);
      }, 3_000);
    }
  }, [streamingContent, isLoading, commitPhase]);

  // ── Pending celebration trigger (separate from canvas watcher) ───────────
  useEffect(() => {
    if (committedPhase === 'celebration' && pendingCelebration.current) {
      pendingCelebration.current = false;
      if (!isLive) {
        const s = stepRef.current;
        const celebText = s.validation?.successMessage ?? `Great job adding the ${s.title}!`;
        setReminderText(celebText);
      } else {
        triggerPhase('celebration');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committedPhase]);

  // ── Escape hatch timer (action phase > 30s) ──────────────────────────────
  useEffect(() => {
    if (committedPhase !== 'action') {
      setShowEscapeHatch(false);
      if (escapeHatchTimerRef.current) clearTimeout(escapeHatchTimerRef.current);
      return;
    }
    if (escapeHatchTimerRef.current) clearTimeout(escapeHatchTimerRef.current);
    escapeHatchTimerRef.current = setTimeout(() => {
      setShowEscapeHatch(true);
    }, 30_000);
    return () => {
      if (escapeHatchTimerRef.current) clearTimeout(escapeHatchTimerRef.current);
    };
  }, [committedPhase]);

  // ── Canvas watcher ───────────────────────────────────────────────────────
  const prevNodeIdsRef = useRef<Set<string>>(new Set());
  const wrongNodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (committedPhase !== 'action') {
      prevNodeIdsRef.current = new Set(nodes.map((n: Node) => n.id));
      return;
    }

    const requiredNodes = step.validation?.requiredNodes;
    if (currentStep > totalSteps || !requiredNodes?.length) return;

    // Guard: step already completed
    if (stepCompletedRef.current) return;

    const newNodes = nodes.filter((n: Node) => !prevNodeIdsRef.current.has(n.id));
    if (newNodes.length === 0) return;

    // Update snapshot
    prevNodeIdsRef.current = new Set(nodes.map((n: Node) => n.id));

    // Reset escape hatch timer on any node addition
    setShowEscapeHatch(false);
    if (escapeHatchTimerRef.current) clearTimeout(escapeHatchTimerRef.current);
    escapeHatchTimerRef.current = setTimeout(() => setShowEscapeHatch(true), 30_000);

    const correctNode = newNodes.find((n: Node) =>
      requiredNodes.some(req => nodeMatchesRequired(n.data?.label as string ?? '', req))
    );

    if (correctNode) {
      // Mark step completed immediately to prevent double-fire
      stepCompletedRef.current = true;
      if (wrongNodeTimerRef.current) clearTimeout(wrongNodeTimerRef.current);

      // Show detection flash for 500ms
      setDetectionFlash(true);
      setReminderText('Component detected — great work! Loading next step...');

      setTimeout(() => {
        setDetectionFlash(false);
        setReminderText(null);
        // Set pending flag THEN update phase — separate useEffect handles the message
        pendingCelebration.current = true;
        commitPhase('celebration');
      }, 500);
    } else {
      // Wrong component
      if (wrongNodeTimerRef.current) clearTimeout(wrongNodeTimerRef.current);
      wrongNodeTimerRef.current = setTimeout(() => {
        const addedLabel = newNodes[0]?.data?.label ?? 'that component';
        const neededRaw = requiredNodes[0];
        if (!isLive) {
          const s = stepRef.current;
          setReminderText(`That's not quite right — search for "${s.title}" in ⌘K to find the right component.`);
          commitPhase('action');
        } else {
          sendMessage(
            `TUTORIAL:${tutorial.id} STEP:${currentStep}/${totalSteps} COMPONENT:"${step.title}" PHASE:WRONG_COMPONENT ADDED:"${addedLabel}" NEEDED:"${neededRaw}"`
          ).then(() => commitPhase('action'));
        }
      }, 1_500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, committedPhase]);

  // ── Palette close watcher ────────────────────────────────────────────────
  const paletteCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodeCountAtPaletteOpenRef = useRef(0);

  useEffect(() => {
    (window as Window & { __onPaletteOpen?: () => void; __onPaletteClose?: () => void }).__onPaletteOpen = () => {
      nodeCountAtPaletteOpenRef.current = nodesRef.current.length;
      if (paletteCloseTimerRef.current) clearTimeout(paletteCloseTimerRef.current);
    };
    (window as Window & { __onPaletteOpen?: () => void; __onPaletteClose?: () => void }).__onPaletteClose = () => {
      if (committedPhaseRef.current !== 'action') return;
      paletteCloseTimerRef.current = setTimeout(() => {
        if (nodesRef.current.length <= nodeCountAtPaletteOpenRef.current) {
          setTimeout(() => {
            if (committedPhaseRef.current === 'action') {
              const s = stepRef.current;
              setReminderText(`Still need the ${s.title} — press ⌘K to find it.`);
            }
          }, 1_000);
        }
      }, 2_000);
    };
    return () => {
      delete (window as Window & { __onPaletteOpen?: () => void; __onPaletteClose?: () => void }).__onPaletteOpen;
      delete (window as Window & { __onPaletteOpen?: () => void; __onPaletteClose?: () => void }).__onPaletteClose;
    };
  }, []);

  // ── Chip click ───────────────────────────────────────────────────────────
  const handleChipClick = useCallback((chip: Chip) => {
    if (chip.nextPhase === 'next_step') {
      if (currentStepRef.current >= totalStepsRef.current) {
        completeTutorial();
        return;
      }
      advanceStep();
      return;
    }

    // Context phase: "Let's build it →"
    if (chip.nextPhase === 'intro' && committedPhaseRef.current === 'context') {
      setHasShownContext(true);
      setReminderText(null);
      if (!isLive) {
        const cacheKey = `${tutorialRef.current.id}:1:intro:0`;
        const text = (staticCacheData as Record<string, string>)[cacheKey]
          ?? stepRef.current.openingMessage
          ?? stepRef.current.explanation
          ?? stepRef.current.action;
        setReminderText(text);
        commitPhase('intro');
      } else {
        triggerPhase('intro');
      }
      return;
    }

    // Context phase: "Tell me more"
    if (chip.nextPhase === 'context_more') {
      const newCount = contextTellMoreCount + 1;
      setContextTellMoreCount(newCount);
      const moreKey = `${tutorialRef.current.id}:context:more`;
      const moreText = (staticCacheData as Record<string, string>)[moreKey];
      if (moreText) {
        setReminderText(moreText);
        commitPhase('context');
      } else if (isLive) {
        triggerPhase('context', 'more');
      }
      // If maxed out (count was already 1, now 2), chips will hide "Tell me more"
      return;
    }

    if (!isLive) {
      const s = stepRef.current;
      let text: string;
      if (chip.nextPhase === 'teaching' || chip.nextPhase === 'reteach') {
        const ec = chip.nextPhase === 'reteach' ? explainCount + 1 : explainCount;
        const cacheKey = `${tutorialRef.current.id}:${currentStepRef.current}:teaching:${ec}`;
        text = (staticCacheData as Record<string, string>)[cacheKey] ?? s.explanation ?? s.action;
        if (chip.nextPhase === 'reteach') setExplainCount(c => c + 1);
      } else if (chip.nextPhase === 'action') {
        text = s.action;
      } else if (chip.nextPhase === 'celebration') {
        text = s.validation?.successMessage ?? `Great job adding the ${s.title}!`;
      } else {
        text = s.explanation ?? s.action;
      }
      setReminderText(text);
      commitPhase(chip.nextPhase as Phase);
      return;
    }

    if (chip.nextPhase === 'reteach') {
      setExplainCount(c => c + 1);
      triggerPhase('teaching', 'reteach');
      return;
    }
    if (chip.nextPhase === 'action' && explainCount >= 3) {
      triggerPhase('action', 'force');
      return;
    }
    triggerPhase(chip.nextPhase as Phase);
  }, [advanceStep, completeTutorial, triggerPhase, commitPhase, explainCount, isLive, contextTellMoreCount]);

  // ── Escape hatch click ───────────────────────────────────────────────────
  const handleEscapeHatch = useCallback(() => {
    stepCompletedRef.current = true;
    setShowEscapeHatch(false);
    if (escapeHatchTimerRef.current) clearTimeout(escapeHatchTimerRef.current);
    const s = stepRef.current;
    const celebText = s.validation?.successMessage ?? `Great job adding the ${s.title}!`;
    setReminderText(celebText);
    commitPhase('celebration');
  }, [commitPhase]);

  // ── Free-text send ───────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const q = inputValue.trim();
    if (!q || isLoading) return;
    setInputValue('');
    setReminderText(null);
    if (!isLive) {
      setReminderText(stepRef.current.explanation ?? stepRef.current.action);
      commitPhase(committedPhaseRef.current);
      return;
    }
    await sendMessage(q);
    commitPhase(committedPhaseRef.current);
  }, [inputValue, isLoading, sendMessage, commitPhase, isLive]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Derived display ──────────────────────────────────────────────────────
  const effectivelyLoading = isLive ? isLoading : false;
  const showLoadingDots = effectivelyLoading && streamingContent === '' && !reminderText;
  const bubbleText = reminderText ?? (isLive ? streamingContent : '');
  const displayedText = useWordByWordStream(bubbleText, effectivelyLoading && !reminderText);
  const isLastStep = currentStep >= totalSteps;
  const chips = getChips(committedPhase, isLastStep, explainCount, contextTellMoreCount);

  return (
    <div className="h-full flex flex-col" style={{ background: '#0d1117', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Progress bar */}
      <div className="p-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">Step {currentStep} of {totalSteps}</span>
          <span className="text-xs text-indigo-400 font-medium">
            {Math.round((currentStep / totalSteps) * 100)}%
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* AI message bubble */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col justify-end min-h-0">
        <div
          className="rounded-2xl p-4"
          style={{
            background: detectionFlash ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
            border: detectionFlash ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
            transition: 'background 0.2s, border-color 0.2s',
          }}
        >
          {showLoadingDots ? (
            <div className="flex gap-1 items-center h-5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {displayedText}
                {(effectivelyLoading && !reminderText) && (
                  <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 align-middle animate-pulse" />
                )}
              </p>
              {!effectivelyLoading && displayedText && committedPhase !== 'context' && (
                <p className="text-[10px] text-slate-600 mt-3 uppercase tracking-wider">
                  {step.title}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action phase hint */}
      {committedPhase === 'action' && !effectivelyLoading && (
        <div className="px-4 pb-2 shrink-0">
          <p className="text-[11px] text-slate-500 text-center animate-pulse">
            ↑ Add the component to the canvas
          </p>
        </div>
      )}

      {/* Escape hatch */}
      {showEscapeHatch && committedPhase === 'action' && (
        <div className="px-4 pb-2 shrink-0">
          <button
            onClick={handleEscapeHatch}
            className="w-full text-center text-[11px] text-slate-500 hover:text-indigo-400 transition-colors py-1"
          >
            Added it already? →
          </button>
        </div>
      )}

      {/* Chips */}
      {!effectivelyLoading && chips.length > 0 && (
        <div className="px-4 pb-3 flex flex-col gap-2 shrink-0">
          {chips.map((chip, i) => {
            const isNext = chip.nextPhase === 'next_step' || chip.nextPhase === 'intro';
            return (
              <button
                key={i}
                onClick={() => handleChipClick(chip)}
                className="w-full text-left px-4 py-2.5 rounded-xl text-xs transition-all duration-150 active:scale-[0.98]"
                style={{
                  border: isNext ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  background: isNext ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                  color: isNext ? '#a5b4fc' : '#cbd5e1',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isNext ? 'rgba(99,102,241,0.22)' : 'rgba(255,255,255,0.07)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isNext ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)';
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Ask something else */}
      <div className="px-4 pb-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {!showInput ? (
          <button
            onClick={() => setShowInput(true)}
            className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors pt-3 block w-full text-center"
          >
            ask something else ↓
          </button>
        ) : (
          <div className="flex items-center gap-2 pt-3">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              disabled={isLoading}
              autoFocus
              className="flex-1 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none transition-colors disabled:opacity-40"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <span className="text-[10px] text-white/70 font-mono">⌘↵</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
