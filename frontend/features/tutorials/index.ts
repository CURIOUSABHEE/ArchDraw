// Tutorial Feature - Main Exports
// Use these imports instead of importing from individual files

// Services
export { 
  loadTutorialProgress, 
  saveTutorialProgress, 
  deleteTutorialProgress,
  startTutorialFresh 
} from './services/tutorialService';

// Storage Utils  
export { 
  TUTORIAL_STORAGE_KEY,
  getStoredProgress,
  getLocalProgress,
  clearLocalProgress,
  clearAllLocalProgress,
  sanitizeNode,
  sanitizeEdge
} from './utils/tutorialStorage';

// Progress Utils
export {
  calculateProgress,
  isAtLastStep,
  isAtLastLevel,
  isTutorialComplete,
  formatProgressLabel
} from './utils/tutorialProgress';

// Constants
export {
  DEFAULT_PHASE,
  PHASE_ORDER,
  PHASE_DISPLAY_NAMES,
  SPEED_CONFIG
} from './constants/tutorialConfig';

// Types
export type { ProgressData, StartResult, ProgressResult } from './types';