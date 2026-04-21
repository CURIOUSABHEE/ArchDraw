// Tutorial feature types - re-exported for convenience
// Core types are defined in store/tutorialStore.ts and lib/tutorial/schema.ts

export type { TutorialMessage } from '@/store/tutorialStore';
export type { SanitizedNode, SanitizedEdge, TutorialProgressEntry } from '@/store/tutorialStore';
export type { TutorialPhase } from './constants/tutorialConfig';

// Local utility types
export interface ProgressData {
  tutorialId: string;
  currentLevel: number;
  currentStep: number;
  currentPhase: string;
  completedLevels: number[];
  canvasNodes: SanitizedNode[];
  canvasEdges: SanitizedEdge[];
  explainCount: number;
  updatedAt: string;
}

export interface StartResult {
  success: boolean;
  error?: string;
}

export interface ProgressResult {
  percent: number;
  stepLabel: string;
  levelLabel: string;
  currentLevelIndex: number;
  currentStepIndex: number;
  totalSteps: number;
}