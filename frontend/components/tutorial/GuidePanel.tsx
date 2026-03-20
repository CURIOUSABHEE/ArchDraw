'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { TutorialStep as LegacyTutorialStep, TutorialData } from '@/data/tutorials';
import type { TutorialStep as CanonicalTutorialStep } from '@/lib/tutorial/types';
import type { TutorialMessage } from '@/store/tutorialStore';
import { useTutorialStore } from '@/store/tutorialStore';
import { useTutorialChat } from '@/hooks/useTutorialChat';
import type { Node, Edge } from 'reactflow';
import staticCacheData from '@/data/tutorialCache.json';

// ── Types ────────────────────────────────────────────────────────────────────
type Phase = 'context' | 'intro' | 'teaching' | 'action' | 'connecting' | 'celebration';

interface Chip {
  label: string;
  nextPhase: Phase | 'next_step' | 'reteach' | 'context_more' | 'check_connection' | 'explain_connection' | 'force_continue';
}

// ── Speed constants ──────────────────────────────────────────────────────────
const SPEED: Record<string, number> = {
  context: 14,
  normal: 18,
  celebration: 20,
  fallback: 12,
};

// ── useTypewriter ────────────────────────────────────────────────────────────
function useTypewriter(
  text: string,
  speed: number,
  onComplete?: () => void,
) {
  const [displayed, setDisplayed] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const bufferRef = useRef('');
  const posRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const startInterval = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      const buf = bufferRef.current;
      if (posRef.current >= buf.length) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        return;
      }
      posRef.current += 1;
      setDisplayed(buf.slice(0, posRef.current));
    }, speedRef.current);
  }, []);

  useEffect(() => {
    if (!text) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      bufferRef.current = '';
      posRef.current = 0;
      setDisplayed('');
      setIsTyping(false);
      return;
    }

    const isExtension = text.startsWith(bufferRef.current) && bufferRef.current.length > 0;

    if (!isExtension) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      bufferRef.current = text;
      posRef.current = 0;
      setDisplayed('');
      setIsTyping(true);
      startInterval();
    } else {
      bufferRef.current = text;
      if (!intervalRef.current && posRef.current < text.length) {
        setIsTyping(true);
        startInterval();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

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

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { displayed, isTyping };
}

// ── components.json import for ID-based matching ────────────────────────────
import components from '@/data/components.json';
type ComponentEntry = { id: string; label: string; category: string; color: string };

// ── Step field accessors — handle both legacy and new tutorial formats ────────
// Legacy format: step.validation.requiredNodes / step.validation.requiredEdges
// New format:    step.requiredNodes / step.requiredEdges (top-level)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRequiredNodes(step: any): string[] {
  return step.requiredNodes ?? step.validation?.requiredNodes ?? [];
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRequiredEdges(step: any): Array<{ from: string; to: string }> {
  return step.requiredEdges ?? step.validation?.requiredEdges ?? [];
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSuccessMessage(step: any): string {
  return step.validation?.successMessage ?? step.successMessage ?? `Great job adding ${step.title}!`;
}

// ── Robust node matching: checks componentId, label, and components.json lookup ──
function nodeMatchesRequirement(node: Node, requiredId: string): boolean {
  const nodeLabel = (node.data?.label as string ?? '').toLowerCase().trim();
  const nodeComponentId = (node.data?.componentId as string ?? '').toLowerCase().trim();
  const req = requiredId.toLowerCase().trim();

  // Check 1: direct componentId match
  if (nodeComponentId && (nodeComponentId === req || nodeComponentId.includes(req) || req.includes(nodeComponentId))) return true;

  // Check 2: look up required ID in components.json and compare labels
  const reqComponent = (components as ComponentEntry[]).find(c => c.id === req);
  if (reqComponent) {
    const reqLabel = reqComponent.label.toLowerCase();
    if (nodeLabel.includes(reqLabel) || reqLabel.includes(nodeLabel)) return true;
    // First word match
    const nodeFirst = nodeLabel.split(/[\s\/\(\)]+/)[0] ?? '';
    const reqFirst = reqLabel.split(/[\s\/\(\)]+/)[0] ?? '';
    if (nodeFirst.length >= 3 && nodeFirst === reqFirst) return true;
  }

  // Check 3: fuzzy label vs requiredId (handles "Web" vs "client_web")
  const reqStripped = req.replace(/[^a-z0-9]/g, '');
  const labelStripped = nodeLabel.replace(/[^a-z0-9]/g, '');
  if (labelStripped && reqStripped) {
    if (labelStripped.includes(reqStripped) || reqStripped.includes(labelStripped)) return true;
    const prefix = reqStripped.slice(0, 6);
    if (prefix.length >= 3 && labelStripped.includes(prefix)) return true;
  }

  // Check 4: client alias fallback
  const CLIENT_IDS = ['client_web', 'client_mobile', 'client_web_mobile'];
  const CLIENT_LABELS = ['web', 'mobile', 'client', 'app'];
  if (CLIENT_IDS.includes(req) && CLIENT_LABELS.some(alias => nodeLabel.includes(alias))) return true;

  return false;
}

// ── Legacy label-only fuzzy match (kept for reference) ───────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _nodeMatchesRequiredLegacy(nodeLabel: string, requiredRaw: string): boolean {
  const label = nodeLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
  const required = requiredRaw.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!required) return false;
  if (label.includes(required)) return true;
  if (required.includes(label) && label.length >= 3) return true;
  const prefix = required.slice(0, 6);
  if (prefix.length >= 3 && label.includes(prefix)) return true;
  return false;
}

// ── Multi-strategy edge matcher ──────────────────────────────────────────────
function edgeMatchesRequired(
  edge: Edge,
  nodes: Node[],
  required: { from: string; to: string },
): boolean {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  if (!sourceNode || !targetNode) return false;

  const sourceLabel = (sourceNode.data?.label as string ?? '').toLowerCase();
  const targetLabel = (targetNode.data?.label as string ?? '').toLowerCase();
  const sourceId = (sourceNode.data?.componentId as string ?? '').toLowerCase();
  const targetId = (targetNode.data?.componentId as string ?? '').toLowerCase();
  const fromReq = required.from.toLowerCase();
  const toReq = required.to.toLowerCase();

  // Strategy A: componentId match
  const idMatch =
    (sourceId === fromReq || sourceId.includes(fromReq) || fromReq.includes(sourceId)) &&
    (targetId === toReq || targetId.includes(toReq) || toReq.includes(targetId));
  if (idMatch && sourceId && targetId) return true;

  // Strategy B: label contains match
  const labelMatch =
    (sourceLabel.includes(fromReq) || fromReq.includes(sourceLabel)) &&
    (targetLabel.includes(toReq) || toReq.includes(targetLabel));
  if (labelMatch) return true;

  // Strategy C: first word match
  const sourceFirst = sourceLabel.split(/[\s\/\(\)]+/)[0] ?? '';
  const targetFirst = targetLabel.split(/[\s\/\(\)]+/)[0] ?? '';
  const fromFirst = fromReq.split(/[\s\/\(\)]+/)[0] ?? '';
  const toFirst = toReq.split(/[\s\/\(\)]+/)[0] ?? '';
  if (
    sourceFirst.length >= 3 && fromFirst.length >= 3 &&
    targetFirst.length >= 3 && toFirst.length >= 3 &&
    (sourceFirst === fromFirst || sourceLabel.includes(fromFirst)) &&
    (targetFirst === toFirst || targetLabel.includes(toFirst))
  ) return true;

  // Strategy D: any significant word overlap
  const fromWords = fromReq.split(/[\s\/\(\)]+/).filter(w => w.length > 2);
  const toWords = toReq.split(/[\s\/\(\)]+/).filter(w => w.length > 2);
  const srcHasFrom = fromWords.some(w => sourceLabel.includes(w));
  const tgtHasTo = toWords.some(w => targetLabel.includes(w));
  if (srcHasFrom && tgtHasTo) return true;

  return false;
}

// ── Check if edge exists in reverse direction ────────────────────────────────
function edgeMatchesReverse(
  edge: Edge,
  nodes: Node[],
  required: { from: string; to: string },
): boolean {
  return edgeMatchesRequired(edge, nodes, { from: required.to, to: required.from });
}

// ── Find best partial match for error reporting ──────────────────────────────
function findBestEdgeMatch(
  edges: Edge[],
  nodes: Node[],
  required: { from: string; to: string },
): { sourceLabel: string; targetLabel: string } | null {
  for (const edge of edges) {
    const src = nodes.find(n => n.id === edge.source);
    const tgt = nodes.find(n => n.id === edge.target);
    if (!src || !tgt) continue;
    const sl = (src.data?.label as string ?? '').toLowerCase();
    const tl = (tgt.data?.label as string ?? '').toLowerCase();
    const fromWords = required.from.toLowerCase().split(/[\s\/\(\)]+/).filter(w => w.length > 2);
    const toWords = required.to.toLowerCase().split(/[\s\/\(\)]+/).filter(w => w.length > 2);
    if (fromWords.some(w => sl.includes(w)) || toWords.some(w => tl.includes(w))) {
      return { sourceLabel: src.data?.label as string ?? sl, targetLabel: tgt.data?.label as string ?? tl };
    }
  }
  return null;
}

// ── Chip logic ───────────────────────────────────────────────────────────────
function getChips(
  phase: Phase,
  isLastStep: boolean,
  explainCount: number,
  contextTellMoreCount: number,
  connectionAttempts: number,
  hasNextLevel: boolean,
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
    case 'connecting': {
      const chips: Chip[] = [
        { label: 'I connected them', nextPhase: 'check_connection' },
        { label: 'How do I connect?', nextPhase: 'explain_connection' },
      ];
      if (connectionAttempts >= 2) {
        chips.push({ label: 'Continue anyway →', nextPhase: 'force_continue' });
      }
      return chips;
    }
    case 'celebration':
      if (isLastStep && hasNextLevel) return [{ label: 'Next Level →', nextPhase: 'next_step' }];
      if (isLastStep) return [];
      return [{ label: 'Next step →', nextPhase: 'next_step' }];
    default:
      return [];
  }
}

// ── Props ────────────────────────────────────────────────────────────────────
interface GuidePanelProps {
  step: LegacyTutorialStep | CanonicalTutorialStep;
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
  // Level progression (optional — only for leveled tutorials)
  currentLevel?: number;
  totalLevels?: number;
  completedLevels?: number[];
  onNextLevel?: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────
export function GuidePanel({
  step,
  currentStep,
  totalSteps,
  tutorial,
  isLive,
  currentLevel,
  totalLevels,
  completedLevels,
  onNextLevel,
}: GuidePanelProps) {
  const [committedPhase, setCommittedPhase] = useState<Phase>('context');
  const pendingPhaseRef = useRef<Phase>('context');
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [explainCount, setExplainCount] = useState(0);

  const [activeMessage, setActiveMessage] = useState('');
  const [typeSpeed, setTypeSpeed] = useState(SPEED.normal);
  const [showChips, setShowChips] = useState(false);

  const [hasShownContext, setHasShownContext] = useState(false);
  const [contextTellMoreCount, setContextTellMoreCount] = useState(0);

  const stepCompletedRef = useRef(false);
  const pendingCelebration = useRef(false);

  const [showEscapeHatch, setShowEscapeHatch] = useState(false);
  const escapeHatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showConnectionEscapeHatch, setShowConnectionEscapeHatch] = useState(false);
  const connectionEscapeHatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [detectionFlash, setDetectionFlash] = useState(false);

  // Track failed "I connected them" attempts for force_continue escape hatch
  const connectionAttempts = useRef(0);

  // ── Connecting phase: track which edge requirement we're on ───────────────
  const [connectingEdgeIndex, setConnectingEdgeIndex] = useState(0);
  const connectingEdgeIndexRef = useRef(0);
  connectingEdgeIndexRef.current = connectingEdgeIndex;

  // Track edges that existed BEFORE connecting phase began, so we only detect new ones
  const edgesAtConnectStart = useRef<Set<string>>(new Set());

  const {
    advanceStep, completeTutorial, nodes, edges,
    savePhase, getPersistedPhase, saveProgress,
  } = useTutorialStore();

  const activeTutorialId = useTutorialStore((s) => s.activeTutorialId);

  const { sendMessage, isLoading, streamingContent, clearHistory, abort } = useTutorialChat({
    tutorialId: tutorial.id,
    stepNumber: currentStep,
    stepTitle: step.title,
    stepExplanation: step.explanation,
  });

  // ── Save progress on every meaningful state change ───────────────────────
  useEffect(() => {
    if (!activeTutorialId) return;
    if (!currentStep) return;
    saveProgress(activeTutorialId, {
      currentLevel: currentLevel ?? 1,
      currentStep,
      currentPhase: committedPhase,
      completedLevels: completedLevels ?? [],
      explainCount,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committedPhase, currentStep, currentLevel, completedLevels, explainCount]);

  const stepRef = useRef(step); stepRef.current = step;
  const tutorialRef = useRef(tutorial); tutorialRef.current = tutorial;
  const currentStepRef = useRef(currentStep); currentStepRef.current = currentStep;
  const totalStepsRef = useRef(totalSteps); totalStepsRef.current = totalSteps;
  const committedPhaseRef = useRef(committedPhase); committedPhaseRef.current = committedPhase;
  const nodesRef = useRef(nodes); nodesRef.current = nodes;
  const edgesRef = useRef(edges); edgesRef.current = edges;
  const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Helper: Get the current required edge from the step ──────────────────
  const getCurrentRequiredEdge = useCallback(() => {
    const s = stepRef.current;
    const reqEdges = getRequiredEdges(s);
    if (reqEdges.length === 0) return null;
    return reqEdges[connectingEdgeIndexRef.current] ?? null;
  }, []);

  // ── Build connecting message ─────────────────────────────────────────────
  const buildConnectingMessage = useCallback((edgeIndex: number): string => {
    const s = stepRef.current;
    const t = tutorialRef.current;
    const cs = currentStepRef.current;
    const reqEdges = getRequiredEdges(s);
    const edge = reqEdges[edgeIndex];
    if (!edge) return getSuccessMessage(s);

    // Priority 1: step.connectingMessage (author-written, most specific)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stepConnectingMsg = (s as any).connectingMessage as string | undefined;
    if (stepConnectingMsg && edgeIndex === 0) return stepConnectingMsg;

    // Priority 2: cache
    const cacheKey = `${t.id}:${cs}:connecting:${edgeIndex}`;
    const cached = (staticCacheData as Record<string, string>)[cacheKey];
    if (cached) return cached;

    // Priority 3: build a clear fallback
    return `${s.title} is on the canvas. Now connect ${edge.from} → ${edge.to}. Hover over ${edge.from} until a circle appears on its edge, then drag to ${edge.to}. This connection means ${edge.from} sends requests to ${edge.to}.`;
  }, []);

  // ── Helper: set a new message with appropriate speed ────────────────────
  const showMessage = useCallback((text: string, phase: Phase) => {
    let speed = SPEED.normal;
    if (phase === 'context') speed = SPEED.context;
    else if (phase === 'celebration') speed = SPEED.celebration;
    setTypeSpeed(speed);
    setShowChips(false);
    setActiveMessage(text);
  }, []);

  const typewriterInput = (() => {
    if (!isLive || !streamingContent) return activeMessage;
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
      case 'connecting': {
        const edge = getCurrentRequiredEdge();
        return edge
          ? `${base} PHASE:CONNECTING FROM:"${edge.from}" TO:"${edge.to}"`
          : `${base} PHASE:CELEBRATION`;
      }
      case 'celebration': return `${base} PHASE:CELEBRATION`;
    }
  }, [getCurrentRequiredEdge]);

  // ── Commit phase ─────────────────────────────────────────────────────────
  const commitPhase = useCallback((p: Phase) => {
    setCommittedPhase(p);
    if (p !== 'context') savePhase(tutorialRef.current.id, currentStepRef.current, p);
  }, [savePhase]);

  // ── Static message resolver — exhaustive fallbacks, never returns empty ──
  const getStaticMessage = useCallback((p: Phase, extra?: string): string => {
    const s = stepRef.current;
    const t = tutorialRef.current;
    const cs = currentStepRef.current;
    const cache = staticCacheData as Record<string, string>;

    switch (p) {
      case 'context': {
        const cached = cache[`${t.id}:context`];
        if (cached) return cached;
        return `Let's build the ${t.title} architecture. Ready to start?`;
      }
      case 'intro': {
        const cached = cache[`${t.id}:${cs}:intro:0`];
        if (cached) return cached;
        return s.openingMessage ?? `Do you know what ${s.title} does in this system?`;
      }
      case 'teaching': {
        const ec = extra === 'reteach' ? (explainCount + 1) : explainCount;
        const cached = cache[`${t.id}:${cs}:teaching:${ec}`];
        if (cached) return cached;
        return s.explanation ?? `${s.title} is a key component in this architecture.`;
      }
      case 'action':
        return s.action ?? `Press ⌘K and search for "${s.title}" to add it.`;
      case 'connecting': {
        const reqEdges = getRequiredEdges(s);
        const edge = reqEdges[connectingEdgeIndexRef.current];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stepConnectingMsg = (s as any).connectingMessage as string | undefined;
        if (stepConnectingMsg && connectingEdgeIndexRef.current === 0) return stepConnectingMsg;
        const cached = cache[`${t.id}:${cs}:connecting:${connectingEdgeIndexRef.current}`];
        if (cached) return cached;
        if (edge) return `Now connect ${edge.from} → ${edge.to}. Hover over ${edge.from} until a circle appears on its edge, then drag to ${edge.to}.`;
        return getSuccessMessage(s);
      }
      case 'celebration': {
        const cached = cache[`${t.id}:${cs}:celebration:0`];
        if (cached) return cached;
        return getSuccessMessage(s);
      }
      default:
        return s.explanation ?? s.action ?? 'Continue to the next step.';
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explainCount]);

  // ── Trigger AI phase ─────────────────────────────────────────────────────
  const triggerPhase = useCallback(async (p: Phase, extra?: string) => {
    pendingPhaseRef.current = p;
    setShowChips(false);
    setActiveMessage('');
    setTypeSpeed(p === 'context' ? SPEED.context : p === 'celebration' ? SPEED.celebration : SPEED.normal);

    if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
    streamTimeoutRef.current = setTimeout(() => {
      abort();
      // Timeout fallback — use static message so panel is never blank
      const fallback = getStaticMessage(p, extra);
      showMessage(fallback, p);
      commitPhase(p);
    }, 10_000);

    try {
      await sendMessage(buildPrompt(p, extra));
    } catch {
      // Error fallback — use static message so panel is never blank
      const fallback = getStaticMessage(p, extra);
      setTypeSpeed(SPEED.fallback);
      setActiveMessage(fallback);
      commitPhase(p);
      return;
    } finally {
      if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
    }

    // If streaming returned empty, use static fallback
    if (!streamingContent && !activeMessage) {
      showMessage(getStaticMessage(p, extra), p);
    }

    commitPhase(p);
  }, [sendMessage, buildPrompt, commitPhase, abort, showMessage, getStaticMessage, streamingContent, activeMessage]);

  // ── Enter connecting phase ───────────────────────────────────────────────
  const enterConnectingPhase = useCallback((edgeIndex: number) => {
    const s = stepRef.current;
    const reqEdges = getRequiredEdges(s);

    if (reqEdges.length === 0 || edgeIndex >= reqEdges.length) {
      // No edges to connect — skip to celebration
      stepCompletedRef.current = true;
      pendingCelebration.current = true;
      commitPhase('celebration');
      return;
    }

    setConnectingEdgeIndex(edgeIndex);
    connectingEdgeIndexRef.current = edgeIndex;
    edgesAtConnectStart.current = new Set(edgesRef.current.map((e: Edge) => e.id));

    // Clear and start connection escape hatch timer (45s)
    setShowConnectionEscapeHatch(false);
    if (connectionEscapeHatchTimerRef.current) clearTimeout(connectionEscapeHatchTimerRef.current);
    connectionEscapeHatchTimerRef.current = setTimeout(() => setShowConnectionEscapeHatch(true), 45_000);

    const msg = buildConnectingMessage(edgeIndex);
    setDetectionFlash(false);
    commitPhase('connecting');
    setTypeSpeed(SPEED.normal);
    setShowChips(false);
    setActiveMessage(msg);
  }, [commitPhase, buildConnectingMessage]);

  // ── Initial load safety net — if nothing rendered after 3s, force fallback ─
  useEffect(() => {
    const t = setTimeout(() => {
      if (!activeMessage && !streamingContent && !isLoading) {
        console.warn('[GuidePanel] initial load fallback triggered');
        const fallback = getStaticMessage(committedPhaseRef.current);
        showMessage(fallback, committedPhaseRef.current);
        setShowChips(true);
      }
    }, 3_000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // runs once on mount

  // ── Step/tutorial change ─────────────────────────────────────────────────
  const lastFiredRef = useRef<string>('');

  useEffect(() => {
    if (currentStep > totalSteps) return;
    if (!tutorial.id || !step?.title || currentStep < 1) return;

    const key = `${tutorial.id}:${currentLevel}:${currentStep}`;
    if (lastFiredRef.current === key) return;
    lastFiredRef.current = key;

    // Reset on cleanup so React Strict Mode double-invoke doesn't skip the
    // second (real) mount — the ref persists across the unmount/remount cycle.
    const cleanup = () => { lastFiredRef.current = ''; };

    abort();        // H1: cancel any in-flight request before resetting state
    clearHistory();
    pendingPhaseRef.current = 'intro';
    setCommittedPhase('intro');
    setShowInput(false);
    setInputValue('');
    setExplainCount(0);
    setActiveMessage('');
    setShowChips(false);
    setShowEscapeHatch(false);
    setShowConnectionEscapeHatch(false);
    setDetectionFlash(false);
    setConnectingEdgeIndex(0);
    connectingEdgeIndexRef.current = 0;
    connectionAttempts.current = 0;
    stepCompletedRef.current = false;
    pendingCelebration.current = false;
    if (escapeHatchTimerRef.current) clearTimeout(escapeHatchTimerRef.current);
    if (connectionEscapeHatchTimerRef.current) clearTimeout(connectionEscapeHatchTimerRef.current);

    if (currentStep === 1 && !hasShownContext) {
      const contextKey = `${tutorial.id}:context`;
      const contextText = (staticCacheData as Record<string, string>)[contextKey];
      if (contextText) {
        pendingPhaseRef.current = 'context';
        const t = setTimeout(() => {
          commitPhase('context');
          showMessage(contextText, 'context');
        }, 0);
        return () => { clearTimeout(t); cleanup(); };
      }
      if (isLive) {
        const t = setTimeout(() => triggerPhase('context'), 50);
        return () => { clearTimeout(t); cleanup(); };
      }
    }

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
      const t = setTimeout(() => {
        commitPhase(startPhase);
        showMessage(resolveText(), startPhase);
      }, 0);
      return () => { clearTimeout(t); cleanup(); };
    }

    const t = setTimeout(() => triggerPhase(startPhase), 50);
    return () => { clearTimeout(t); cleanup(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, currentLevel, tutorial.id, step?.title]);

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

  // ── When streaming completes, sync activeMessage ─────────────────────────
  useEffect(() => {
    if (!isLoading && streamingContent && streamingContent !== activeMessage) {
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
        showMessage(getSuccessMessage(s), 'celebration');
      } else {
        triggerPhase('celebration');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committedPhase]);

  // ── Phase watchdog — auto-recovers blank panel within 2s ─────────────────
  const phaseWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (phaseWatchdogRef.current) clearTimeout(phaseWatchdogRef.current);
    phaseWatchdogRef.current = setTimeout(() => {
      if (!activeMessage && !streamingContent && !isLoading) {
        console.warn('[GuidePanel watchdog] blank state in phase:', committedPhase, '— recovering');
        const fallback = getStaticMessage(committedPhase);
        showMessage(fallback, committedPhase);
        setShowChips(true);
      }
    }, 2_000);
    return () => { if (phaseWatchdogRef.current) clearTimeout(phaseWatchdogRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committedPhase]);

  // ── Escape hatch timer (action phase) ────────────────────────────────────
  useEffect(() => {
    if (committedPhase !== 'action') {
      setShowEscapeHatch(false);
      if (escapeHatchTimerRef.current) clearTimeout(escapeHatchTimerRef.current);
      return;
    }
    escapeHatchTimerRef.current = setTimeout(() => setShowEscapeHatch(true), 30_000);
    return () => { if (escapeHatchTimerRef.current) clearTimeout(escapeHatchTimerRef.current); };
  }, [committedPhase]);

  // ── Connecting escape hatch cleanup when leaving connecting ──────────────
  useEffect(() => {
    if (committedPhase !== 'connecting') {
      setShowConnectionEscapeHatch(false);
      if (connectionEscapeHatchTimerRef.current) clearTimeout(connectionEscapeHatchTimerRef.current);
    }
  }, [committedPhase]);

  // ── Publish current required edge to window for TutorialCanvas highlight ─
  useEffect(() => {
    if (committedPhase === 'connecting') {
      const req = getRequiredEdges(step)[connectingEdgeIndex];
      (window as unknown as Record<string, unknown>).__tutorialRequiredEdge = req ?? null;
    } else {
      (window as unknown as Record<string, unknown>).__tutorialRequiredEdge = null;
    }
    return () => {
      (window as unknown as Record<string, unknown>).__tutorialRequiredEdge = null;
    };
  }, [committedPhase, connectingEdgeIndex, step]);

  // ── Canvas node watcher ──────────────────────────────────────────────────
  const prevNodeIdsRef = useRef<Set<string>>(new Set());
  const wrongNodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset stepCompletedRef and baseline snapshot on step/level change
  useEffect(() => {
    stepCompletedRef.current = false;
    prevNodeIdsRef.current = new Set(nodes.map((n: Node) => n.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, currentLevel]);

  // Snapshot baseline when entering 'action' phase
  const prevPhaseRef = useRef<Phase>('intro');
  useEffect(() => {
    if (committedPhase === 'action' && prevPhaseRef.current !== 'action') {
      prevNodeIdsRef.current = new Set(nodes.map((n: Node) => n.id));
    }
    prevPhaseRef.current = committedPhase;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committedPhase]);

  useEffect(() => {
    // ── DIAGNOSTIC LOGS ──────────────────────────────────────────────────
    console.log('=== NODE DETECTION FIRING ===');
    console.log('Current phase:', committedPhase);
    const _requiredForLog = getRequiredNodes(step);
    console.log('Required node IDs:', _requiredForLog);
    console.log('Canvas nodes:', nodes.map((n: Node) => ({
      id: n.id,
      label: n.data?.label,
      componentId: n.data?.componentId,
      type: n.type,
    })));
    const _matchResults = nodes.map((n: Node) => ({
      label: n.data?.label,
      matches: _requiredForLog?.some(req => nodeMatchesRequirement(n, req)) ?? false,
    }));
    console.log('Match results:', _matchResults);
    // ── END DIAGNOSTIC LOGS ──────────────────────────────────────────────

    if (committedPhase !== 'action') return;
    const requiredNodes = getRequiredNodes(step);
    if (currentStep > totalSteps || !requiredNodes?.length) return;
    if (stepCompletedRef.current) return;

    const newNodes = nodes.filter((n: Node) => !prevNodeIdsRef.current.has(n.id));
    if (newNodes.length === 0) return;

    prevNodeIdsRef.current = new Set(nodes.map((n: Node) => n.id));

    setShowEscapeHatch(false);
    if (escapeHatchTimerRef.current) clearTimeout(escapeHatchTimerRef.current);
    escapeHatchTimerRef.current = setTimeout(() => setShowEscapeHatch(true), 30_000);

    const correctNode = newNodes.find((n: Node) =>
      requiredNodes.some(req => nodeMatchesRequirement(n, req))
    );

    console.log('New nodes added:', newNodes.map((n: Node) => n.data?.label));
    console.log('Correct node found:', correctNode ? correctNode.data?.label : 'none');

    if (correctNode) {
      stepCompletedRef.current = true;
      if (wrongNodeTimerRef.current) clearTimeout(wrongNodeTimerRef.current);

      setDetectionFlash(true);
      setTypeSpeed(SPEED.fallback);
      setShowChips(false);
      setActiveMessage('Component detected — great work!');

      setTimeout(() => {
        setDetectionFlash(false);
        const reqEdges = getRequiredEdges(step);
        if (currentStep === 1 || reqEdges.length === 0) {
          pendingCelebration.current = true;
          commitPhase('celebration');
        } else {
          enterConnectingPhase(0);
        }
      }, 600);
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

  // ── Edge watcher (connecting phase) ──────────────────────────────────────
  const edgeCheckInProgressRef = useRef(false);

  const checkEdgeDetection = useCallback(() => {
    const reqEdge = getRequiredEdges(step)[connectingEdgeIndexRef.current];
    if (!reqEdge) return false;

    // Look for the required edge among ALL edges (including existing ones on canvas)
    const found = edgesRef.current.some((e: Edge) =>
      edgeMatchesRequired(e, nodesRef.current, reqEdge)
    );
    return found;
  }, [step]);

  useEffect(() => {
    if (committedPhase !== 'connecting') return;
    if (edgeCheckInProgressRef.current) return;

    const reqEdge = getRequiredEdges(step)[connectingEdgeIndex];
    if (!reqEdge) return;

    // Check all edges (auto-detect newly drawn edges)
    const found = edges.some((e: Edge) =>
      edgeMatchesRequired(e, nodes, reqEdge)
    );

    if (found) {
      edgeCheckInProgressRef.current = true;
      setDetectionFlash(true);
      setTypeSpeed(SPEED.fallback);
      setShowChips(false);
      setActiveMessage('Connection detected! Great work!');

      setTimeout(() => {
        setDetectionFlash(false);
        edgeCheckInProgressRef.current = false;
        const reqEdges = getRequiredEdges(step);
        const nextEdgeIndex = connectingEdgeIndex + 1;

        if (nextEdgeIndex < reqEdges.length) {
          // More edges to connect
          enterConnectingPhase(nextEdgeIndex);
        } else {
          // All edges done — celebrate
          pendingCelebration.current = true;
          commitPhase('celebration');
        }
      }, 700);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges, committedPhase, connectingEdgeIndex]);

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
      if (currentStepRef.current >= totalStepsRef.current) {
        // Last step of this level — trigger next level if available
        if (onNextLevel) { onNextLevel(); return; }
        completeTutorial();
        return;
      }
      advanceStep();
      return;
    }

    // Connecting phase chips
    if (chip.nextPhase === 'check_connection') {
      const found = checkEdgeDetection();
      if (found) {
        connectionAttempts.current = 0;
        setDetectionFlash(true);
        setTypeSpeed(SPEED.fallback);
        setShowChips(false);
        setActiveMessage('Connection detected! Great work!');

        setTimeout(() => {
          setDetectionFlash(false);
          const reqEdges = getRequiredEdges(stepRef.current);
          const nextEdgeIndex = connectingEdgeIndexRef.current + 1;
          if (nextEdgeIndex < reqEdges.length) {
            enterConnectingPhase(nextEdgeIndex);
          } else {
            pendingCelebration.current = true;
            commitPhase('celebration');
          }
        }, 700);
      } else {
        connectionAttempts.current += 1;
        const reqEdge = getRequiredEdges(stepRef.current)[connectingEdgeIndexRef.current];
        const fromLabel = reqEdge?.from ?? 'source';
        const toLabel = reqEdge?.to ?? 'target';

        // Check for reverse connection
        const isReversed = reqEdge
          ? edgesRef.current.some(e => edgeMatchesReverse(e, nodesRef.current, reqEdge))
          : false;

        if (isReversed) {
          setTypeSpeed(SPEED.fallback);
          setShowChips(false);
          setActiveMessage(
            `Almost! The connection is backwards. Delete it and drag FROM ${fromLabel} TO ${toLabel}. Hover over ${fromLabel} and drag from the handle on its right side.`
          );
        } else {
          // Try to find a partial match to give a better error
          const bestMatch = reqEdge ? findBestEdgeMatch(edgesRef.current, nodesRef.current, reqEdge) : null;
          if (bestMatch) {
            setTypeSpeed(SPEED.fallback);
            setShowChips(false);
            setActiveMessage(
              `I can see you connected ${bestMatch.sourceLabel} → ${bestMatch.targetLabel}. I'm looking for ${fromLabel} → ${toLabel}. Make sure the arrow goes in the right direction.`
            );
          } else {
            setTypeSpeed(SPEED.fallback);
            setShowChips(false);
            setActiveMessage(
              `Not quite — I'm looking for ${fromLabel} → ${toLabel}. Hover over ${fromLabel} until a circle appears on its border, then drag to ${toLabel}.`
            );
          }
        }
        setTimeout(() => setShowChips(true), 1_800);
      }
      return;
    }

    if (chip.nextPhase === 'force_continue') {
      connectionAttempts.current = 0;
      pendingCelebration.current = true;
      commitPhase('celebration');
      return;
    }

    if (chip.nextPhase === 'explain_connection') {
      const reqEdge = getRequiredEdges(stepRef.current)[connectingEdgeIndexRef.current];
      const fromLabel = reqEdge?.from ?? 'the source node';
      const toLabel = reqEdge?.to ?? 'the target node';
      setTypeSpeed(SPEED.fallback);
      setShowChips(false);
      setActiveMessage(
        `To connect nodes: hover over ${fromLabel} until a small circle appears on its border, then click and drag to ${toLabel}. Release when you see the connection snap.`
      );
      setTimeout(() => setShowChips(true), 2_500);
      return;
    }

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

    if (chip.nextPhase === 'context_more') {
      setContextTellMoreCount(c => c + 1);
      const moreText = (staticCacheData as Record<string, string>)[`${tutorialRef.current.id}:context:more`];
      if (moreText) {
        commitPhase('context');
        showMessage(moreText, 'context');
      } else if (isLive) {
        triggerPhase('context', 'more');
      } else {
        // Fallback: show tutorial description so panel is never blank
        const fallback = tutorialRef.current.description ?? `Let's build the ${tutorialRef.current.title} architecture.`;
        commitPhase('context');
        showMessage(fallback, 'context');
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
        text = getSuccessMessage(s);
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
  }, [advanceStep, completeTutorial, triggerPhase, commitPhase, showMessage, explainCount, isLive,
      contextTellMoreCount, checkEdgeDetection, enterConnectingPhase]);

  // ── Escape hatch click (action phase) ────────────────────────────────────
  const handleEscapeHatch = useCallback(() => {
    stepCompletedRef.current = true;
    setShowEscapeHatch(false);
    if (escapeHatchTimerRef.current) clearTimeout(escapeHatchTimerRef.current);

    // Check if we need to do connecting phase
    const reqEdges = getRequiredEdges(stepRef.current);
    if (currentStepRef.current === 1 || reqEdges.length === 0) {
      const s = stepRef.current;
      const celebText = getSuccessMessage(s);
      commitPhase('celebration');
      showMessage(celebText, 'celebration');
    } else {
      // Go from action → connecting
      enterConnectingPhase(0);
    }
  }, [commitPhase, showMessage, enterConnectingPhase]);

  // ── Connecting escape hatch click ─────────────────────────────────────────
  const handleConnectionEscapeHatch = useCallback(() => {
    setShowConnectionEscapeHatch(false);
    if (connectionEscapeHatchTimerRef.current) clearTimeout(connectionEscapeHatchTimerRef.current);
    pendingCelebration.current = true;
    commitPhase('celebration');
  }, [commitPhase]);

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
  const hasNextLevel = !!(currentLevel && totalLevels && currentLevel < totalLevels);
  const chips = getChips(committedPhase, isLastStep, explainCount, contextTellMoreCount, connectionAttempts.current, hasNextLevel);
  const chipsVisible = showChips && chips.length > 0;

  // For node highlights: get current required edge's from/to
  const currentRequiredEdge = committedPhase === 'connecting'
    ? (getRequiredEdges(step)[connectingEdgeIndex] ?? null)
    : null;

  return (
    <div className="h-full flex flex-col" style={{ background: '#0d1117', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

      <style>{`
        @keyframes tw-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .tw-cursor { display:inline-block; width:2px; height:1em; background:#818cf8; margin-left:2px; vertical-align:middle; animation:tw-blink 1.06s step-end infinite; }
        @keyframes pulse-indigo {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.5); }
          50% { box-shadow: 0 0 0 8px rgba(99,102,241,0); }
        }
        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          50% { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
        }
        .tutorial-source-highlight { animation: pulse-indigo 1.5s ease-in-out infinite !important; outline: 2px solid rgba(99,102,241,0.7) !important; }
        .tutorial-target-highlight { animation: pulse-green 1.5s ease-in-out infinite !important; outline: 2px solid rgba(34,197,94,0.7) !important; }
      `}</style>

      {/* Inject required edge info into DOM for TutorialCanvas to pick up */}
      {currentRequiredEdge && (
        <script
          dangerouslySetInnerHTML={{ __html: '' }}
          data-tutorial-required-from={currentRequiredEdge.from}
          data-tutorial-required-to={currentRequiredEdge.to}
        />
      )}

      {/* Progress bar */}
      <div className="p-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Level indicator (leveled tutorials only) */}
        {currentLevel !== undefined && totalLevels !== undefined && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400">Level {currentLevel} of {totalLevels}</span>
              <span className="text-xs text-slate-500">Step {currentStep} of {totalSteps}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-700 ease-out" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
            </div>
            {/* Level dots */}
            <div className="flex items-center gap-2 mt-2">
              {Array.from({ length: totalLevels }, (_, i) => {
                const lvl = i + 1;
                const isDone = completedLevels?.includes(lvl);
                const isCurrent = lvl === currentLevel;
                return (
                  <div key={lvl} className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full transition-all"
                      style={{
                        background: isDone ? '#6366f1' : isCurrent ? '#818cf8' : 'rgba(255,255,255,0.15)',
                        boxShadow: isCurrent ? '0 0 0 2px rgba(99,102,241,0.3)' : 'none',
                      }}
                    />
                    {isDone && <span className="text-[9px] text-indigo-400">✓</span>}
                    {!isDone && <span className="text-[10px]" style={{ color: isCurrent ? '#94a3b8' : '#475569' }}>Level {lvl}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Standard progress (non-leveled) */}
        {currentLevel === undefined && (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Step {currentStep} of {totalSteps}</span>
              <span className="text-xs text-indigo-400 font-medium">{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-700 ease-out" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
            </div>
          </>
        )}
        {/* Debug indicator — remove before production */}
        <span className="text-[9px] text-slate-700 mt-1 block">
          phase: {committedPhase} | text: {displayed.length}chars | loading: {isLoading.toString()}
        </span>
      </div>

      {/* Phase badge */}
      {committedPhase === 'connecting' && (
        <div className="px-4 pt-2 shrink-0">
          <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
            🔗 Connect the nodes
          </span>
        </div>
      )}

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
          ) : displayed ? (
            <>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {displayed}
                {typewriterRunning && <span className="tw-cursor" />}
              </p>
              {!typewriterRunning && displayed && committedPhase !== 'context' && (
                <p className="text-[10px] text-slate-600 mt-3 uppercase tracking-wider">{step.title}</p>
              )}
            </>
          ) : (
            /* Emergency fallback — panel must never be completely blank */
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-400 leading-relaxed">
                {step.openingMessage ?? step.explanation ?? `Let's add the ${step.title}.`}
              </p>
              <button
                onClick={() => {
                  const msg = getStaticMessage(committedPhase);
                  showMessage(msg, committedPhase);
                  setShowChips(true);
                }}
                className="self-start px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
              >
                Continue →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action hint */}
      {committedPhase === 'action' && !typewriterRunning && (
        <div className="px-4 pb-2 shrink-0">
          <p className="text-[11px] text-slate-500 text-center animate-pulse">↑ Add the component to the canvas</p>
        </div>
      )}

      {/* Connecting hint — prominent required connection indicator */}
      {committedPhase === 'connecting' && currentRequiredEdge && (
        <div className="px-4 pb-2 shrink-0">
          <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <p className="text-[10px] text-indigo-400 uppercase tracking-wider mb-1">Required connection</p>
            <p className="text-sm text-white font-medium">{currentRequiredEdge.from} → {currentRequiredEdge.to}</p>
          </div>
        </div>
      )}

      {/* Escape hatch (action phase) */}
      {showEscapeHatch && committedPhase === 'action' && (
        <div className="px-4 pb-2 shrink-0">
          <button onClick={handleEscapeHatch} className="w-full text-center text-[11px] text-slate-500 hover:text-indigo-400 transition-colors py-1">
            Added it already? →
          </button>
        </div>
      )}

      {/* Connecting escape hatch */}
      {showConnectionEscapeHatch && committedPhase === 'connecting' && (
        <div className="px-4 pb-2 shrink-0 space-y-1">
          {currentRequiredEdge && (
            <p className="text-[10px] text-slate-500 text-center">
              To connect: hover over {currentRequiredEdge.from} until a circle appears, then drag to {currentRequiredEdge.to}
            </p>
          )}
          <button
            onClick={handleConnectionEscapeHatch}
            className="w-full text-center text-[11px] text-slate-500 hover:text-indigo-400 transition-colors py-1"
          >
            Skip connection →
          </button>
        </div>
      )}

      {/* Chips */}
      {chipsVisible && (
        <div className="px-4 pb-3 flex flex-col gap-2 shrink-0">
          {chips.map((chip, i) => {
            const isNext = chip.nextPhase === 'next_step' || chip.nextPhase === 'intro' || chip.nextPhase === 'check_connection';
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
