import type { TutorialSession, TutorialDefinition } from '@/lib/tutorial/schema';

export interface ProgressResult {
  percent: number;
  stepLabel: string;
  levelLabel: string;
  currentLevelIndex: number;
  currentStepIndex: number;
  totalSteps: number;
}

export function calculateProgress(
  session: TutorialSession,
  tutorial: TutorialDefinition
): ProgressResult {
  const totalSteps = tutorial.levels.reduce(
    (acc, level) => acc + level.steps.length, 
    0
  );
  const completedSteps = session.completedStepIds.length;
  const percent = totalSteps > 0 
    ? Math.round((completedSteps / totalSteps) * 100) 
    : 0;
  
  const currentLevel = tutorial.levels[session.levelIndex];
  const currentStep = currentLevel?.steps[session.stepIndex];
  
  return {
    percent,
    stepLabel: currentStep?.title ?? '',
    levelLabel: currentLevel?.title ?? '',
    currentLevelIndex: session.levelIndex,
    currentStepIndex: session.stepIndex,
    totalSteps,
  };
}

export function isAtLastStep(
  session: TutorialSession,
  tutorial: TutorialDefinition
): boolean {
  const level = tutorial.levels[session.levelIndex];
  if (!level) return true;
  return session.stepIndex === level.steps.length - 1;
}

export function isAtLastLevel(
  session: TutorialSession,
  tutorial: TutorialDefinition
): boolean {
  return session.levelIndex === tutorial.levels.length - 1;
}

export function isTutorialComplete(
  session: TutorialSession,
  tutorial: TutorialDefinition
): boolean {
  return isAtLastLevel(session, tutorial) && 
    isAtLastStep(session, tutorial) && 
    session.phase === 'celebration';
}

export function formatProgressLabel(
  levelIndex: number,
  stepIndex: number,
  totalSteps: number
): string {
  return `Level ${levelIndex + 1} · Step ${stepIndex + 1}/${totalSteps}`;
}