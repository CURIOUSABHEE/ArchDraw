// Tutorial feature constants
export const TUTORIAL_STORAGE_KEY = 'archdraw_tutorial_v2';

export const DEFAULT_PHASE = 'context';

export const PHASE_ORDER = [
  'context',
  'intro',
  'teaching',
  'action',
  'connecting',
  'celebration',
] as const;

export type TutorialPhase = typeof PHASE_ORDER[number];

export const PHASE_DISPLAY_NAMES: Record<TutorialPhase, string> = {
  context: 'Context',
  intro: 'Introduction',
  teaching: 'Teaching',
  action: 'Action',
  connecting: 'Connect',
  celebration: 'Complete',
};

export const SPEED_CONFIG: Record<string, number> = {
  context: 14,
  normal: 18,
  celebration: 20,
  fallback: 12,
};