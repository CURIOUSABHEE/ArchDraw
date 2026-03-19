import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Node, Edge } from 'reactflow';

export interface TutorialMessage {
  type: 'guide' | 'user' | 'success' | 'error';
  content: string;
  timestamp: number;
}

interface TutorialState {
  // Current session (not persisted)
  tutorialId: string | null;
  currentStep: number;
  totalSteps: number;
  nodes: Node[];
  edges: Edge[];
  messages: TutorialMessage[];
  validationStatus: 'idle' | 'success' | 'error';
  validationError: string;
  isTyping: boolean;
  isComplete: boolean;

  // Persisted progress
  completedTutorials: string[];
  tutorialProgress: Record<string, number>; // tutorialId -> highest step reached

  // Actions
  startTutorial: (id: string, totalSteps: number) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setValidationStatus: (status: 'idle' | 'success' | 'error', error?: string) => void;
  setIsTyping: (v: boolean) => void;
  addMessage: (type: TutorialMessage['type'], content: string) => void;
  clearMessages: () => void;
  advanceStep: () => void;
  skipStep: () => void;
  completeTutorial: () => void;
  resetTutorial: (id: string) => void;
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      tutorialId: null,
      currentStep: 1,
      totalSteps: 0,
      nodes: [],
      edges: [],
      messages: [],
      validationStatus: 'idle',
      validationError: '',
      isTyping: false,
      isComplete: false,

      completedTutorials: [],
      tutorialProgress: {},

      startTutorial: (id, totalSteps) => {
        const { tutorialProgress } = get();
        const savedStep = tutorialProgress[id] ?? 1;
        set({
          tutorialId: id,
          currentStep: savedStep,
          totalSteps,
          nodes: [],
          edges: [],
          messages: [],
          validationStatus: 'idle',
          validationError: '',
          isTyping: false,
          isComplete: false,
        });
      },

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      setValidationStatus: (status, error = '') =>
        set({ validationStatus: status, validationError: error }),

      setIsTyping: (v) => set({ isTyping: v }),

      addMessage: (type, content) =>
        set((s) => ({
          messages: [...s.messages, { type, content, timestamp: Date.now() }],
        })),

      clearMessages: () => set({ messages: [] }),

      advanceStep: () => {
        const { currentStep, totalSteps, tutorialId, tutorialProgress } = get();
        const next = currentStep + 1;
        if (next > totalSteps) {
          get().completeTutorial();
          return;
        }
        const newProgress = { ...tutorialProgress };
        if (tutorialId) newProgress[tutorialId] = Math.max(newProgress[tutorialId] ?? 1, next);
        set({
          currentStep: next,
          validationStatus: 'idle',
          validationError: '',
          tutorialProgress: newProgress,
        });
      },

      skipStep: () => {
        get().advanceStep();
      },

      completeTutorial: () => {
        const { tutorialId, completedTutorials, tutorialProgress, totalSteps } = get();
        if (!tutorialId) return;
        const newCompleted = completedTutorials.includes(tutorialId)
          ? completedTutorials
          : [...completedTutorials, tutorialId];
        const newProgress = { ...tutorialProgress, [tutorialId]: totalSteps };
        set({
          isComplete: true,
          completedTutorials: newCompleted,
          tutorialProgress: newProgress,
        });
      },

      resetTutorial: (id) => {
        const { tutorialProgress, completedTutorials } = get();
        const newProgress = { ...tutorialProgress };
        delete newProgress[id];
        set({
          tutorialId: id,
          currentStep: 1,
          nodes: [],
          edges: [],
          messages: [],
          validationStatus: 'idle',
          validationError: '',
          isComplete: false,
          tutorialProgress: newProgress,
          completedTutorials: completedTutorials.filter((t) => t !== id),
        });
      },
    }),
    {
      name: 'archflow-tutorials',
      partialize: (s) => ({
        completedTutorials: s.completedTutorials,
        tutorialProgress: s.tutorialProgress,
      }),
    }
  )
);
