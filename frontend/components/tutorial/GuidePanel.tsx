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

// ── Speed constants ──────────────────────────────────────────────────────────
const SPEED: Record<string, number> = {
  context: 14,
  normal: 18,
  celebration: 20,
  fallback: 12,
};

// ── useTypewriter ────────────────────────────────────────────────────────────
// Handles both static strings and live streaming buffers.
// For static: types the full string char by char.
// For streaming: advances a display pointer through a growing buffer.
function useTypewriter(
  text: string,
  speed: number,
  onComplete?: () => void,
) {
  const [displayed, setDisplayed] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Internal refs — avoid stale closures in interval
  const bufferRef = useRef('');       // full target text (grows for streaming)
  const posRef = useRef(0);           // how many chars we've shown
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const speedRef = useRef(speed);
  speedRef.current = speed;

  // Advance the display pointer one char at a time
  const startInterval = useCallback(() => {
    if (intervalRef.current) return; // already running
    intervalRef.current = setInterval(() => {
      const buf = bufferRef.current;
      if (posRef.current >= buf.length) {
        // Buffer exhausted — stop and wait for more text or completion signal
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        return;
      }
      posRef.current += 1;
      setDisplayed(buf.slice(0, posRef.current));
    }, speedRef.current);
  }, []);

  // When text changes: if it's a brand-new message (not an extension of current buffer),
  // reset everything. If it extends the buffer (streaming), just update buffer and
  // restart the interval if it stopped.
  useEffect(() => {
    if (!text) {
      // Clear
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      bufferRef.current = '';
      posRef.current = 0;
      setDisplayed('');
      setIsTyping(false);
      return;
    }

    const isExtension = text.startsWith(bufferRef.current) && bufferRef.current.length > 0;

    if (!isExtension) {
      // New message — full reset
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      bufferRef.current = text;
      posRef.current = 0;
      setDisplayed('');
      setIsTyping(true);
      startInterval();
    } else {
      // Streaming extension — update buffer, restart interval if it paused
      bufferRef.current = text;
      if (!intervalRef.current && posRef.current < text.length) {
        setIsTyping(true);
        startInterval();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // Poll for completion: when not streaming and display caught up
  useEffect(() => {
    if (!isTyping) return;
    const check = setInterval(() => {
      if (posRef.current >= bufferRef.current.length && bufferRef.current.length > 0) {
        clearInterval(check);
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        setIsTyping(false);
        onCompleteRef.current?.();
      }
    }, 50);
    return () => clearInterval(check);
  }, [isTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { displayed, isTyping };
}

// ── Fuzzy node matching ──────────────────────────────────────────────────────
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

// ── Chip logic ───────────────────────────────────────────────────────────────
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
      if (explainCount >= 3) return [{ label: "Let's just build it", nextPhase: 'action' }];
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

  // Single source of truth for the message being displayed
  const [activeMessage, setActiveMessage] = useState('');
  // Speed for current message
  const [typeSpeed, setTypeSpeed] = useState(SPEED.normal);
  // Chips only appear after typewriter completes
  const [showChips, setShowChips] = useState(false);

  // Context phase
  const [hasShownContext, setHasShownContext] = useState(false);
  const [contextTellMoreCount, setContextTellMoreCount] = useState(0);

  // Dead-end fix
  const stepCompletedRef = useRef(false);
  const pendingCelebration = useRef(false);

  // Escape hatch
  const [showEscapeHatch, setShowEscapeHatch] = useState(false);
  const escapeHatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detection flash
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
  const stepRef = useRef(step); stepRef.current = step;
  const tutorialRef = useRef(tutorial); tutorialRef.current = tutorial;
  const currentStepRef = useRef(currentStep); currentStepRef.current = currentStep;
  const totalStepsRef = useRef(totalSteps); totalStepsRef.current = totalSteps;
  const committedPhaseRef = useRef(committedPhase); committedPhaseRef.current = committedPhase;
  const nodesRef = useRef(nodes); nodesRef.current = nodes;
  const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Helper: set a new message with appropriate speed ────────────────────
  const showMessage = useCallback((text: string, phase: Phase) => {
    let speed = SPEED.normal;
    if (phase === 'context') speed = SPEED.context;
    else if (phase === 'celebration') speed = SPEED.celebration;
    setTypeSpeed(speed);
    setShowChips(false);
    setActiveMessage(text);
  }, []);

  // ── Typewriter: feeds on activeMessage, extends with streamingContent ────
  // For live AI: streamingContent grows as chunks arrive — we feed it as buffer extension
  const typewriterInput = (() => {
    if (!isLive || !streamingContent) return activeMessage;
    // If streaming is active and content is longer than activeMessage, use it as the buffer
    if (streamingContent.length > activeMessage.length) return streamingContent;
    return activeMessage;
  })();

  const { displayed, isTyping: typewriterRunning } = useTypewriter(
    typewriterInput,
    typeSpeed,
    () => setShowChips(true),
  );

  // ── Build phase prompt ───────────────────────────────────────────────────
  const buildPrompt = useCallback((p: Phase, extra?: string): string => {
    const s = stepRef.current;
    const t = tutorialRef.current;
    const cs = currentStepRef.current;
    const ts = totalStepsRef.current;
    const base = `TUTORIAL:${t.id} STEP:${cs}/${ts} COMPONENT:"${s.title}"`;
    switch (p) {
      case 'context': return `TUTORIAL:${t.id} PHASE:CONTEXT`;
      case 'intro': return `${base} PHASE:INTRO`;
      case 'teaching':
        return extra === 'reteach'
          ? `${base} PHASE:TEACHING RETEACH:true EXPLANATION:"${s.explanation}" WHY:"${s.why}"`
          : `${base} PHASE:TEACHING EXPLANATION:"${s.explanation}" WHY:"${s.why}"`;
      case 'action':
        return extra === 'force'
          ? `${base} PHASE:ACTION INSTRUCTION:"${s.action}" NOTE:"Keep this very short and direct."`
          : `${base} PHASE:ACTION INSTRUCTION:"${s.action}"`;
      case 'celebration': return `${base} PHASE:CELEBRATION`;
    }
  }, []);

  // ── Commit phase ─────────────────────────────────────────────────────────
  const commitPhase = useCallback((p: Phase) => {
    setCommittedPhase(p);
    if (p !== 'context') savePhase(tutorialRef.current.id, currentStepRef.current, p);
  }, [savePhase]);

  // ── Trigger AI phase ─────────────────────────────────────────────────────
  const triggerPhase = useCallback(async (p: Phase, extra?: string) => {
    pendingPhaseRef.current = p;
    // Clear active message so typewriter resets; streaming will fill it
    setShowChips(false);
    setActiveMessage('');
    setTypeSpeed(p === 'context' ? SPEED.context : p === 'celebration' ? SPEED.celebration : SPEED.normal);

    if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
    streamTimeoutRef.current = setTimeout(() => {
      abort();
      const fallback = stepRef.current.explanation || 'Let\'s continue building.';
      showMessage(fallback, 'action');
      commitPhase(p);
    }, 10_000);

    try {
      await sendMessage(buildPrompt(p, extra));
    } catch {
      const fallback = stepRef.current.explanation || 'Something went wrong. Try adding the component to continue.';
      setTypeSpeed(SPEED.fallback);
      setActiveMessage(fallback);
      commitPhase('action');
      return;
    } finally {
      if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
    }

    commitPhase(p);
  }, [sendMessage, buildPrompt, commitPhase, abort, showMessage]);

  // ── Step/tutorial change ─────────────────────────────────────────────────
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
    setActiveMessage('');
    setShowChips(false);
    setShowEscapeHatch(false);
    setDetectionFlash(false);
    stepCompletedRef.current = false;
    pendingCelebration.current = false;
    if (escapeHatchTimerRef.current) clearTimeout(escapeHatchTimerRef.current);

    // Context phase on first step (once per session)
    if (currentStep === 1 && !hasShownContext) {
      const contextKey = `${tutorial.id}:context`;
      const contextText = (staticCacheData as Record<string, string>)[contextKey];
      if (contextText) {
        pendingPhaseRef.current = 'context';
        setTimeout(() => {
          commitPhase('context');
          showMessage(contextText, 'context');
        }, 0);
        return;
      }
      if (isLive) {
        const t = setTimeout(() => triggerPhase('context'), 50);
        return () => clearTimeout(t);
      }
    }

    // Normal step flow
    const persisted = getPersistedPhase(tutorial.id, currentStep);
    const startPhase: Phase = (persisted === 'action' || persisted === 'celebration')
      ? (persisted as Phase) : 'intro';

    if (!isLive) {
      const resolveText = (): string => {
        if (currentStep <= 3) {
          const cached = (staticCacheData as Record<string, string>)[`${tutorial.id}:${currentStep}:intro:0`];
          if (cached) return cached;
        }
        return step.openingMessage ?? step.explanation ?? step.action;
      };
      pendingPhaseRef.current = startPhase;
      setTimeout(() => {
        commitPhase(startPhase);
        showMessage(resolveText(), startPhase);
      }, 0);
      return;
    }

    const t = setTimeout(() => triggerPhase(startPhase), 50);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, tutorial.id, step?.title]);

  // ── Chunk stall timeout ──────────────────────────────────────────────────
  const prevContentRef = useRef('');
  useEffect(() => {
    if (!isLoading) { prevContentRef.current = ''; return; }
    if (streamingContent !== prevContentRef.current) {
      prevContentRef.current = streamingContent;
      if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
      streamTimeoutRef.current = setTimeout(() => {
        commitPhase(pendingPhaseRef.current);
      }, 3_000);
    }
  }, [streamingContent, isLoading, commitPhase]);

  // ── When streaming completes, sync activeMessage so typewriter can finish ─
  useEffect(() => {
    if (!isLoading && streamingContent && streamingContent !== activeMessage) {
      // Stream done — make sure typewriter has the full text as its target
      setActiveMessage(streamingContent);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, streamingContent]);

  // ── Pending celebration ──────────────────────────────────────────────────
  useEffect(() => {
    if (committedPhase === 'celebration' && pendingCelebration.current) {
      pendingCelebration.current = false;
      if (!isLive) {
        const s = stepRef.current;
        showMessage(s.validation?.successMessage ?? `Great job adding the ${s.title}!`, 'celebration');
      } else {
        triggerPhase('celebration');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committedPhase]);

  // ── Escape hatch timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (committedPhase !== 'action') {
      setShowEscapeHatch(false);
      if (escapeHatchTimerRef.current) clearTimeout(escapeHatchTimerRef.current);
      return;
    }
    escapeHatchTimerRef.current = setTimeout(() => setShowEscapeHatch(true), 30_000);
    return () => { if (escapeHatchTimerRef.current) clearTimeout(escapeHatchTimerRef.current); };
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
    if (stepCompletedRef.current) return;

    const newNodes = nodes.filter((n: Node) => !prevNodeIdsRef.current.has(n.id));
    if (newNodes.length === 0) return;

    prevNodeIdsRef.current = new Set(nodes.map((n: Node) => n.id));

    // Reset escape hatch timer on any node addition
    setShowEscapeHatch(false);
    if (escapeHatchTimerRef.current) clearTimeout(escapeHatchTimerRef.current);
    escapeHatchTimerRef.current = setTimeout(() => setShowEscapeHatch(true), 30_000);

    const correctNode = newNodes.find((n: Node) =>
      requiredNodes.some(req => nodeMatchesRequired(n.data?.label as string ?? '', req))
    );

    if (correctNode) {
      stepCompletedRef.current = true;
      if (wrongNodeTimerRef.current) clearTimeout(wrongNodeTimerRef.current);

      // Detection flash — fast fallback speed, chips hidden
      setDetectionFlash(true);
      setTypeSpeed(SPEED.fallback);
      setShowChips(false);
      setActiveMessage('Component detected — great work! Loading next step...');

      setTimeout(() => {
        setDetectionFlash(false);
        pendingCelebration.current = true;
        commitPhase('celebration');
      }, 500);
    } else {
      if (wrongNodeTimerRef.current) clearTimeout(wrongNodeTimerRef.current);
      wrongNodeTimerRef.current = setTimeout(() => {
        const addedLabel = newNodes[0]?.data?.label ?? 'that component';
        const neededRaw = requiredNodes[0];
        if (!isLive) {
          const s = stepRef.current;
          setTypeSpeed(SPEED.fallback);
          setShowChips(false);
          setActiveMessage(`That's not quite right — search for "${s.title}" in ⌘K to find the right component.`);
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
              setTypeSpeed(SPEED.fallback);
              setShowChips(false);
              setActiveMessage(`Still need the ${s.title} — press ⌘K to find it.`);
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
      if (currentStepRef.current >= totalStepsRef.current) { completeTutorial(); return; }
      advanceStep();
      return;
    }

    // Context: "Let's build it →"
    if (chip.nextPhase === 'intro' && committedPhaseRef.current === 'context') {
      setHasShownContext(true);
      if (!isLive) {
        const cacheKey = `${tutorialRef.current.id}:1:intro:0`;
        const text = (staticCacheData as Record<string, string>)[cacheKey]
          ?? stepRef.current.openingMessage ?? stepRef.current.explanation ?? stepRef.current.action;
        commitPhase('intro');
        showMessage(text, 'intro');
      } else {
        triggerPhase('intro');
      }
      return;
    }

    // Context: "Tell me more"
    if (chip.nextPhase === 'context_more') {
      setContextTellMoreCount(c => c + 1);
      const moreText = (staticCacheData as Record<string, string>)[`${tutorialRef.current.id}:context:more`];
      if (moreText) {
        commitPhase('context');
        showMessage(moreText, 'context');
      } else if (isLive) {
        triggerPhase('context', 'more');
      }
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
      commitPhase(chip.nextPhase as Phase);
      showMessage(text, chip.nextPhase as Phase);
      return;
    }

    if (chip.nextPhase === 'reteach') { setExplainCount(c => c + 1); triggerPhase('teaching', 'reteach'); return; }
    if (chip.nextPhase === 'action' && explainCount >= 3) { triggerPhase('action', 'force'); return; }
    triggerPhase(chip.nextPhase as Phase);
  }, [advanceStep, completeTutorial, triggerPhase, commitPhase, showMessage, explainCount, isLive, contextTellMoreCount]);

  // ── Escape hatch click ───────────────────────────────────────────────────
  const handleEscapeHatch = useCallback(() => {
    stepCompletedRef.current = true;
    setShowEscapeHatch(false);
    if (escapeHatchTimerRef.current) clearTimeout(escapeHatchTimerRef.current);
    const s = stepRef.current;
    const celebText = s.validation?.successMessage ?? `Great job adding the ${s.title}!`;
    commitPhase('celebration');
    showMessage(celebText, 'celebration');
  }, [commitPhase, showMessage]);

  // ── Free-text send ───────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const q = inputValue.trim();
    if (!q || isLoading) return;
    setInputValue('');
    if (!isLive) {
      showMessage(stepRef.current.explanation ?? stepRef.current.action, committedPhaseRef.current);
      return;
    }
    setShowChips(false);
    setActiveMessage('');
    await sendMessage(q);
    commitPhase(committedPhaseRef.current);
  }, [inputValue, isLoading, sendMessage, commitPhase, showMessage, isLive]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleSend(); }
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const showLoadingDots = isLive && isLoading && !streamingContent && !activeMessage;
  const isLastStep = currentStep >= totalSteps;
  const chips = getChips(committedPhase, isLastStep, explainCount, contextTellMoreCount);
  // Chips gate: show only when typewriter done AND phase has chips
  const chipsVisible = showChips && chips.length > 0;

  return (
    <div className="h-full flex flex-col" style={{ background: '#0d1117', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Blink keyframe injected inline */}
      <style>{`
        @keyframes tw-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .tw-cursor { display:inline-block; width:2px; height:1em; background:#818cf8; margin-left:2px; vertical-align:middle; animation:tw-blink 1.06s step-end infinite; }
      `}</style>

      {/* Progress bar */}
      <div className="p-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">Step {currentStep} of {totalSteps}</span>
          <span className="text-xs text-indigo-400 font-medium">{Math.round((currentStep / totalSteps) * 100)}%</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full bg-indigo-500 rounded-full transition-all duration-700 ease-out" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
        </div>
      </div>

      {/* Message bubble */}
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
                {displayed}
                {typewriterRunning && <span className="tw-cursor" />}
              </p>
              {!typewriterRunning && displayed && committedPhase !== 'context' && (
                <p className="text-[10px] text-slate-600 mt-3 uppercase tracking-wider">{step.title}</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action hint */}
      {committedPhase === 'action' && !typewriterRunning && (
        <div className="px-4 pb-2 shrink-0">
          <p className="text-[11px] text-slate-500 text-center animate-pulse">↑ Add the component to the canvas</p>
        </div>
      )}

      {/* Escape hatch */}
      {showEscapeHatch && committedPhase === 'action' && (
        <div className="px-4 pb-2 shrink-0">
          <button onClick={handleEscapeHatch} className="w-full text-center text-[11px] text-slate-500 hover:text-indigo-400 transition-colors py-1">
            Added it already? →
          </button>
        </div>
      )}

      {/* Chips — only after typewriter completes */}
      {chipsVisible && (
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
                onMouseEnter={e => { e.currentTarget.style.background = isNext ? 'rgba(99,102,241,0.22)' : 'rgba(255,255,255,0.07)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isNext ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)'; }}
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
          <button onClick={() => setShowInput(true)} className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors pt-3 block w-full text-center">
            ask something else ↓
          </button>
        ) : (
          <div className="flex items-center gap-2 pt-3">
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              disabled={isLoading}
              autoFocus
              className="flex-1 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none transition-colors disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
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
