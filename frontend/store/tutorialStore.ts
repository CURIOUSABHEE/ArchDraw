import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { serializedStorage } from './storage';
import type { Node, Edge } from 'reactflow';

export interface TutorialMessage {
  type: 'guide' | 'user' | 'success' | 'error';
  content: string;
  timestamp: number;
}

// ── Sanitized types for persistence ─────────────────────────────────────────
export type SanitizedNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    componentId: string;
    category?: string;
    color?: string;
    icon?: string;
  };
};

export type SanitizedEdge = {
  id: string;
  source: string;
  target: string;
  type: string;
  animated: boolean;
  style?: object;
  label?: string;
};

export type TutorialProgressEntry = {
  tutorialId: string;
  currentLevel: number;
  currentStep: number;
  currentPhase: string;
  completedLevels: number[];
  canvasNodes: SanitizedNode[];
  canvasEdges: SanitizedEdge[];
  explainCount: number;
  updatedAt: string;
};

type SupabaseProgressRow = {
  tutorial_id: string;
  current_level: number;
  current_step: number;
  current_phase: string;
  completed_levels: number[];
  canvas_nodes: SanitizedNode[];
  canvas_edges: SanitizedEdge[];
  explain_count: number;
  updated_at: string;
};

// ── Sanitizers ───────────────────────────────────────────────────────────────
export function sanitizeNode(node: Node): SanitizedNode {
  return {
    id: node.id,
    type: node.type || 'default',
    position: { x: node.position.x, y: node.position.y },
    data: {
      label: node.data?.label || '',
      componentId: node.data?.componentId || '',
      category: node.data?.category,
      color: node.data?.color,
      icon: node.data?.icon,
    },
  };
}

export function sanitizeEdge(edge: Edge): SanitizedEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type || 'smoothstep',
    animated: edge.animated || false,
    style: edge.style as object | undefined,
    label: edge.label as string | undefined,
  };
}

// ── Debounce map for Supabase syncs ──────────────────────────────────────────
const syncDebounceMap: Record<string, ReturnType<typeof setTimeout>> = {};

interface TutorialState {
  // Hydration flag
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  // Tutorial switch guard — prevents canvas save effect from firing during transition
  isSwitchingTutorial: boolean;
  setSwitchingTutorial: (v: boolean) => void;

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

  // Level progression (leveled tutorials only)
  currentLevel: number;
  completedLevels: number[];
  levelNodes: Record<number, Node[]>;
  levelEdges: Record<number, Edge[]>;
  isLevelComplete: boolean;

  // Legacy persisted progress (kept for backward compat)
  completedTutorials: string[];
  tutorialProgress: Record<string, number>;
  tutorialPhase: Record<string, string>;

  // Legacy persisted canvas state
  activeTutorialId: string | null;
  tutorialNodes: Node[];
  tutorialEdges: Edge[];

  // ── New: rich per-tutorial progress map ─────────────────────────────────
  richProgress: Record<string, TutorialProgressEntry>;
  isSyncing: boolean;

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
  // Level actions
  advanceLevel: (nextLevelStepCount: number) => void;
  dismissLevelComplete: () => void;

  // ── New persistence actions ──────────────────────────────────────────────
  saveProgress: (tutorialId: string, progress: Partial<TutorialProgressEntry>) => void;
  getProgress: (tutorialId: string) => TutorialProgressEntry | null;
  clearProgress: (tutorialId: string) => void;
  clearAllProgress: () => void;
  syncToSupabase: (tutorialId: string) => Promise<void>;
  loadFromSupabase: (tutorialId: string) => Promise<TutorialProgressEntry | null>;
}

export const useTutorialStore = create<TutorialState>()(
    persist(
    (set, get) => ({
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

      isSwitchingTutorial: false,
      setSwitchingTutorial: (v) => set({ isSwitchingTutorial: v }),

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

      currentLevel: 1,
      completedLevels: [],
      levelNodes: {},
      levelEdges: {},
      isLevelComplete: false,

      completedTutorials: [],
      tutorialProgress: {},
      tutorialPhase: {},

      activeTutorialId: null,
      tutorialNodes: [],
      tutorialEdges: [],

      richProgress: {},
      isSyncing: false,

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
          isLevelComplete: false,
        });
      },

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      setTutorialNodes: (nodes) =>
        set({ tutorialNodes: nodes.map(sanitizeNode) as unknown as Node[] }),

      setTutorialEdges: (edges) =>
        set({ tutorialEdges: edges.map(sanitizeEdge) as unknown as Edge[] }),

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
        // Also clear rich progress
        get().clearProgress(id);
        set({
          tutorialId: id,
          currentStep: 1,
          nodes: [],
          edges: [],
          messages: [],
          validationStatus: 'idle',
          validationError: '',
          isComplete: false,
          isLevelComplete: false,
          currentLevel: 1,
          completedLevels: [],
          levelNodes: {},
          levelEdges: {},
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

      advanceLevel: (nextLevelStepCount) => {
        const { currentLevel, tutorialNodes, tutorialEdges, completedLevels } = get();
        const newCompletedLevels = completedLevels.includes(currentLevel)
          ? completedLevels
          : [...completedLevels, currentLevel];
        set({
          currentLevel: currentLevel + 1,
          completedLevels: newCompletedLevels,
          levelNodes: { ...get().levelNodes, [currentLevel]: tutorialNodes.map(sanitizeNode) as unknown as Node[] },
          levelEdges: { ...get().levelEdges, [currentLevel]: tutorialEdges.map(sanitizeEdge) as unknown as Edge[] },
          currentStep: 1,
          totalSteps: nextLevelStepCount,
          validationStatus: 'idle',
          validationError: '',
          isLevelComplete: false,
        });
      },

      dismissLevelComplete: () => {
        set({ isLevelComplete: false });
      },

      // ── Rich persistence ─────────────────────────────────────────────────

      saveProgress: (tutorialId, progress) => {
        const existing = get().richProgress[tutorialId];
        const updated: TutorialProgressEntry = {
          ...existing,
          ...progress,
          tutorialId,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          richProgress: {
            ...state.richProgress,
            [tutorialId]: updated,
          },
        }));

        // Debounced Supabase sync — fire and forget, never await
        if (syncDebounceMap[tutorialId]) clearTimeout(syncDebounceMap[tutorialId]);
        syncDebounceMap[tutorialId] = setTimeout(() => {
          get().syncToSupabase(tutorialId).catch(() => {});
        }, 3000);
      },

      getProgress: (tutorialId) => {
        return get().richProgress[tutorialId] ?? null;
      },

      clearProgress: (tutorialId) => {
        set((state) => {
          const next = { ...state.richProgress };
          delete next[tutorialId];
          return { richProgress: next };
        });
      },

      clearAllProgress: () => {
        set({
          tutorialProgress: {},
          tutorialPhase: {},
          completedTutorials: [],
          richProgress: {},
          activeTutorialId: null,
          tutorialNodes: [],
          tutorialEdges: [],
          currentLevel: 1,
          completedLevels: [],
          levelNodes: {},
          levelEdges: {},
          currentStep: 1,
          nodes: [],
          edges: [],
          messages: [],
          isComplete: false,
          isLevelComplete: false,
          tutorialId: null,
        });
      },

      syncToSupabase: async (tutorialId) => {
        // Lazy import to avoid circular deps and SSR issues
        const { useAuthStore } = await import('./authStore');
        const { isSupabaseConfigured, getSupabaseClient } = await import('@/lib/supabase');
        if (!isSupabaseConfigured) return;

        const { user } = useAuthStore.getState();
        if (!user) return; // guests: localStorage only

        const progress = get().richProgress[tutorialId];
        if (!progress) return;

        set({ isSyncing: true });
        try {
          const supabase = getSupabaseClient();
          await supabase.from('tutorial_progress').upsert(
            {
              user_id: user.id,
              tutorial_id: tutorialId,
              current_level: progress.currentLevel,
              current_step: progress.currentStep,
              current_phase: progress.currentPhase,
              completed_levels: progress.completedLevels,
              canvas_nodes: progress.canvasNodes,
              canvas_edges: progress.canvasEdges,
              explain_count: progress.explainCount,
            } as unknown as never,
            { onConflict: 'user_id,tutorial_id' }
          );
        } catch (error) {
          // Never throw — Supabase failure must not break the tutorial
          console.error('[tutorialStore] Supabase sync failed:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      loadFromSupabase: async (tutorialId) => {
        const { useAuthStore } = await import('./authStore');
        const { isSupabaseConfigured, getSupabaseClient } = await import('@/lib/supabase');
        if (!isSupabaseConfigured) return null;

        const { user } = useAuthStore.getState();
        if (!user) return null;

        try {
          const supabase = getSupabaseClient();
          const { data, error } = await supabase
            .from('tutorial_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('tutorial_id', tutorialId)
            .single();

          if (error || !data) return null;

          const row = data as SupabaseProgressRow;
          const progress: TutorialProgressEntry = {
            tutorialId: row.tutorial_id,
            currentLevel: row.current_level,
            currentStep: row.current_step,
            currentPhase: row.current_phase,
            completedLevels: row.completed_levels,
            canvasNodes: row.canvas_nodes,
            canvasEdges: row.canvas_edges,
            explainCount: row.explain_count,
            updatedAt: row.updated_at,
          };

          // Merge: take whichever is more recent
          const localProgress = get().richProgress[tutorialId];
          const useSupabase =
            !localProgress ||
            new Date(row.updated_at) > new Date(localProgress.updatedAt);

          if (useSupabase) {
            set((state) => ({
              richProgress: {
                ...state.richProgress,
                [tutorialId]: progress,
              },
            }));
          }

          return useSupabase ? progress : localProgress;
        } catch (error) {
          console.error('[tutorialStore] Supabase load failed:', error);
          return null;
        }
      },
    }),
    {
      name: 'archflow-tutorials',
      storage: createJSONStorage(() => serializedStorage),
      partialize: (s) => ({
        completedTutorials: s.completedTutorials,
        tutorialProgress: s.tutorialProgress,
        tutorialPhase: s.tutorialPhase,
        activeTutorialId: s.activeTutorialId,
        tutorialNodes: s.tutorialNodes,
        tutorialEdges: s.tutorialEdges,
        currentLevel: s.currentLevel,
        completedLevels: s.completedLevels,
        levelNodes: s.levelNodes,
        levelEdges: s.levelEdges,
        richProgress: s.richProgress,
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
