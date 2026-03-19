import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Node, Edge } from 'reactflow';

export interface TutorialMessage {
  type: 'guide' | 'user' | 'success' | 'error';
  content: string;
  timestamp: number;
}

// Strip non-serializable React Flow internals before persisting
function sanitizeNode(node: Node): Node {
  return {
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
  } as Node;
}

function sanitizeEdge(edge: Edge): Edge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    animated: edge.animated,
    style: edge.style,
    label: edge.label,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
  } as Edge;
}

interface TutorialState {
  // Hydration flag
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

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
  tutorialProgress: Record<string, number>;
  tutorialPhase: Record<string, string>; // tutorialId:step -> phase

  // Persisted canvas state
  activeTutorialId: string | null;
  tutorialNodes: Node[];
  tutorialEdges: Edge[];

  // Actions
  startTutorial: (id: string, totalSteps: number) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setTutorialNodes: (nodes: Node[]) => void;
  setTutorialEdges: (edges: Edge[]) => void;
  clearTutorialCanvas: () => void;
  setValidationStatus: (status: 'idle' | 'success' | 'error', error?: string) => void;
  setIsTyping: (v: boolean) => void;
  addMessage: (type: TutorialMessage['type'], content: string) => void;
  clearMessages: () => void;
  advanceStep: () => void;
  skipStep: () => void;
  completeTutorial: () => void;
  resetTutorial: (id: string) => void;
  savePhase: (tutorialId: string, step: number, phase: string) => void;
  getPersistedPhase: (tutorialId: string, step: number) => string | null;
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

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
      tutorialPhase: {},

      activeTutorialId: null,
      tutorialNodes: [],
      tutorialEdges: [],

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

      setTutorialNodes: (nodes) =>
        set({ tutorialNodes: nodes.map(sanitizeNode) }),

      setTutorialEdges: (edges) =>
        set({ tutorialEdges: edges.map(sanitizeEdge) }),

      clearTutorialCanvas: () =>
        set({ tutorialNodes: [], tutorialEdges: [] }),

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
        const { tutorialProgress, completedTutorials, tutorialPhase } = get();
        const newProgress = { ...tutorialProgress };
        delete newProgress[id];
        const newPhase = Object.fromEntries(
          Object.entries(tutorialPhase).filter(([k]) => !k.startsWith(`${id}:`))
        );
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
          tutorialPhase: newPhase,
          completedTutorials: completedTutorials.filter((t) => t !== id),
          tutorialNodes: [],
          tutorialEdges: [],
        });
      },

      savePhase: (tutorialId, step, phase) => {
        set((s) => ({
          tutorialPhase: { ...s.tutorialPhase, [`${tutorialId}:${step}`]: phase },
        }));
      },

      getPersistedPhase: (tutorialId, step) => {
        return get().tutorialPhase[`${tutorialId}:${step}`] ?? null;
      },
    }),
    {
      name: 'archflow-tutorials',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        completedTutorials: s.completedTutorials,
        tutorialProgress: s.tutorialProgress,
        tutorialPhase: s.tutorialPhase,
        activeTutorialId: s.activeTutorialId,
        tutorialNodes: s.tutorialNodes,
        tutorialEdges: s.tutorialEdges,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        } else {
          useTutorialStore.getState().setHasHydrated(true);
        }
      },
    }
  )
);
