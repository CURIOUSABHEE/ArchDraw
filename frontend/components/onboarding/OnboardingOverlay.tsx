'use client';

import { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useOnboardingStore } from '@/store/onboardingStore';
import { ONBOARDING_STEPS } from './useOnboarding';
import { StepCard } from './StepCard';
import { VirtualHand } from './VirtualHand';
import { SpotlightHighlight } from './SpotlightHighlight';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

const CARD_WIDTH = 320;
const CARD_HEIGHT = 230;

function computeCardPosition(
  rect: Rect | null,
  cardPosition: string,
): { top: number; left: number } {
  const pad = 16;
  switch (cardPosition) {
    case 'center':
      return {
        top: window.innerHeight / 2 - CARD_HEIGHT / 2,
        left: window.innerWidth / 2 - CARD_WIDTH / 2,
      };
    case 'right':
      if (!rect) return { top: 100, left: 100 };
      return {
        top: Math.min(Math.max(rect.top, 20), window.innerHeight - CARD_HEIGHT - 20),
        left: Math.min(rect.right + pad, window.innerWidth - CARD_WIDTH - 20),
      };
    case 'below':
      if (!rect) return { top: 100, left: 100 };
      return {
        top: Math.min(rect.bottom + pad, window.innerHeight - CARD_HEIGHT - 20),
        left: Math.max(Math.min(rect.left, window.innerWidth - CARD_WIDTH - 20), 20),
      };
    case 'below-left':
      if (!rect) return { top: 100, left: 100 };
      return {
        top: Math.min(rect.bottom + pad, window.innerHeight - CARD_HEIGHT - 20),
        left: Math.max(rect.right - CARD_WIDTH, 20),
      };
    default:
      return { top: 100, left: 100 };
  }
}

function computeHandPosition(rect: Rect | null, animation: string): { x: number; y: number } | null {
  if (!rect || animation === 'none') return null;
  if (animation === 'drag') {
    return { x: rect.right - 8, y: rect.top + rect.height / 2 - 16 };
  }
  // tap: point from below-right of the element
  return { x: rect.right - 8, y: rect.bottom - 8 };
}

function useTargetRect(selector: string | null) {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!selector) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRect(null);
      return;
    }

    const update = () => {
      const el = document.querySelector(selector);
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height, right: r.right, bottom: r.bottom });
    };

    update();
    const observer = new ResizeObserver(update);
    const el = document.querySelector(selector);
    if (el) observer.observe(el);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [selector]);

  return rect;
}

function OnboardingOverlayInner() {
  const { isOpen, currentStep, stepCompleted, nextStep, skip } = useOnboardingStore();
  const step = ONBOARDING_STEPS[currentStep];
  const rect = useTargetRect(isOpen ? step.targetSelector : null);
  const cardPos = computeCardPosition(rect, step.cardPosition);
  const handPos = computeHandPosition(rect, step.handAnimation);
  const isInteractiveStep = step.isInteractive;
  const nextDisabled = isInteractiveStep && !stepCompleted;

  // Keyboard shortcuts
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') { skip(); return; }
      if ((e.key === 'ArrowRight' || e.key === 'Enter') && !nextDisabled) {
        nextStep(ONBOARDING_STEPS.length);
      }
    },
    [isOpen, nextDisabled, nextStep, skip]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  if (!isOpen) return null;

  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  // All steps allow click-through so users can interact with the real UI
  // The step card itself still captures its own clicks

  return (
    <>
      {/* Invisible full-screen layer — just for keyboard capture, always non-blocking */}
      <div
        role="dialog"
        aria-label="Onboarding guide"
        aria-modal="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          pointerEvents: 'none',
        }}
      />

      {/* Spotlight — provides the dark overlay via box-shadow */}
      {step.targetSelector && (
        <SpotlightHighlight
          targetSelector={step.targetSelector}
          padding={10}
        />
      )}

      {/* Dark full-screen background for welcome step (no spotlight) */}
      {!step.targetSelector && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Virtual hand */}
      {handPos && step.handAnimation !== 'none' && (
        <VirtualHand
          x={handPos.x}
          y={handPos.y}
          animation={step.handAnimation}
          stopped={stepCompleted}
        />
      )}

      {/* Step card — keyed by step so it re-animates on change */}
      <StepCard
        key={currentStep}
        step={currentStep + 1}
        totalSteps={ONBOARDING_STEPS.length}
        title={step.title}
        description={step.description}
        isLastStep={isLastStep}
        nextDisabled={nextDisabled}
        stepCompleted={stepCompleted}
        onNext={() => nextStep(ONBOARDING_STEPS.length)}
        onSkip={skip}
        position={cardPos}
      />
    </>
  );
}

export function OnboardingOverlay() {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  if (!mounted || typeof document === 'undefined') return null;
  return ReactDOM.createPortal(<OnboardingOverlayInner />, document.body);
}
