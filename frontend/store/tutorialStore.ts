import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { serializedStorage } from './storage';
import type { Node, Edge } from 'reactflow';
import type { TutorialDefinition, TutorialSession, PhaseName } from '@/lib/tutorial/schema';
import type { AnyTutorial } from '@/data/tutorials';
import * as engine from '@/lib/tutorial/engine';
import { isSupabaseConfigured } from '@/lib/supabase';

function migrateEdgesToSmoothstep(edges: Edge[]): SanitizedEdge[] {
  return edges.map((edge) => {
    if (edge.data?.pathType === 'smooth') {
      return { ...edge, data: { ...edge.data, pathType: 'Smoothstep' } } as SanitizedEdge;
    }
    return edge as unknown as SanitizedEdge;
  });
}

export interface TutorialMessage {
  type: 'guide' | 'user' | 'success' | 'error';
  content: string;
  timestamp: number;
}

export type SanitizedNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { label: string; componentId: string; category?: string; color?: string; icon?: string };
};

export type SanitizedEdge = {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated: boolean;
  style?: object;
  label?: string;
  data?: { pathType?: string };
};

export interface TutorialProgressEntry {
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

export type TutorialProgressRow = {
  user_id: string;
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
    type: edge.type || 'smooth',
    animated: edge.animated || false,
    style: edge.style as object | undefined,
    label: edge.label as string | undefined,
  };
}

const STORAGE_KEY = 'archdraw_tutorial_v2';

interface TutorialStoreState {
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  activeTutorial: TutorialDefinition | null;
  session: TutorialSession | null;
  nodes: Node[];
  edges: Edge[];
  messages: TutorialMessage[];
  isTyping: boolean;
  isLoading: boolean;
  error: string | null;
  
  richProgress: Record<string, TutorialProgressEntry>;
  isSyncing: boolean;

  // Legacy props
  currentStep: number;
  totalSteps: number;
  currentLevel: number;
  completedLevels: number[];
  validationStatus: 'idle' | 'success' | 'error';
  validationError: string;
  isComplete: boolean;
  isLevelComplete: boolean;
  activeTutorialId: string | null;
  tutorialProgress: Record<string, number>;
  tutorialPhase: Record<string, string>;
  tutorialNodes: Node[];
  tutorialEdges: Edge[];
  isSwitchingTutorial: boolean;
  completedTutorials: string[];

  // Actions
  startTutorial: (id: string, totalSteps: number) => void;
  startTutorialByDef: (tutorial: AnyTutorial) => void;
  advancePhase: () => void;
  advanceManually: () => void;
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
  startTutorialFresh: (tutorial: AnyTutorial) => Promise<{ success: boolean; error?: string }>;
  exitTutorial: () => void;
  savePhase: (tutorialId: string, step: number, phase: string) => void;
  getPersistedPhase: (tutorialId: string, step: number) => string | null;
  advanceLevel: (nextLevelStepCount: number) => void;
  dismissLevelComplete: () => void;
  saveProgress: (tutorialId: string, progress: Partial<TutorialProgressEntry>) => void;
  getProgress: (tutorialId: string) => TutorialProgressEntry | null;
  getLevelCanvasState: (level: number) => { nodes: Node[]; edges: Edge[] } | null;
  clearProgress: (tutorialId: string) => void;
  clearAllProgress: () => void;
  syncToSupabase: (tutorialId: string) => Promise<void>;
  loadFromSupabase: (tutorialId: string) => Promise<TutorialProgressEntry | null>;
  setSwitchingTutorial: (v: boolean) => void;
}

export const useTutorialStore = create<TutorialStoreState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

      activeTutorial: null,
      session: null,
      nodes: [],
      edges: [],
      messages: [],
      isTyping: false,
      isLoading: false,
      error: null,

      richProgress: {},
      isSyncing: false,

      currentStep: 1,
      totalSteps: 0,
      currentLevel: 1,
      completedLevels: [],
      validationStatus: 'idle',
      validationError: '',
      isComplete: false,
      isLevelComplete: false,
      activeTutorialId: null,
      tutorialProgress: {},
      tutorialPhase: {},
      tutorialNodes: [],
      tutorialEdges: [],
      isSwitchingTutorial: false,
      completedTutorials: [],

      startTutorialByDef: (tutorialInput) => {
        // All tutorials in the TUTORIALS array are TutorialDefinition instances
        const tutorial = tutorialInput as unknown as TutorialDefinition;
        const saved = get().richProgress[tutorial.id];
        let session: TutorialSession;
        let restoredNodes: Node[] = [];
        let restoredEdges: Edge[] = [];
        
        const totalSteps = tutorial.levels.reduce((acc, l) => acc + l.steps.length, 0);
        
        if (saved) {
          restoredNodes = saved.canvasNodes as unknown as Node[];
          restoredEdges = migrateEdgesToSmoothstep(saved.canvasEdges as unknown as Edge[]);
          
          session = engine.restoreSession(tutorial, {
            levelIndex: saved.currentLevel,
            stepIndex: saved.currentStep,
            phase: saved.currentPhase as PhaseName,
            completedLevelIds: saved.completedLevels.map(String),
            canvasSnapshot: {
              nodes: restoredNodes,
              edges: restoredEdges,
            },
          });
        } else {
          session = engine.initSession(tutorial);
        }

        set({
          activeTutorial: tutorial,
          session,
          nodes: restoredNodes,
          edges: restoredEdges,
          messages: [],
          isLoading: false,
          error: null,
          currentStep: saved?.currentStep ?? 1,
          totalSteps,
          currentLevel: saved?.currentLevel ?? 1,
          completedLevels: saved?.completedLevels ?? [],
          activeTutorialId: tutorial.id,
          isComplete: false,
          isLevelComplete: false,
        });
      },

      startTutorial: (id, totalSteps) => {
        set({ 
          currentStep: 1, 
          totalSteps,
          activeTutorialId: id,
          currentLevel: 1,
        });
      },

      advancePhase: () => {
        const { session, activeTutorial, totalSteps } = get();
        if (session && activeTutorial) {
          const newSession = engine.advancePhase(session, activeTutorial);
          set({ 
            session: newSession,
            currentStep: newSession.stepIndex + 1,
          });
        }
      },

      advanceManually: () => {
        const { session, activeTutorial } = get();
        if (session && activeTutorial) {
          const newSession = engine.forceAdvance(session, activeTutorial);
          set({ 
            session: newSession,
            currentStep: newSession.stepIndex + 1,
          });
        }
      },

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      setTutorialNodes: (nodes) =>
        set({ tutorialNodes: nodes.map(sanitizeNode) as unknown as Node[] }),

      setTutorialEdges: (edges) =>
        set({ tutorialEdges: edges.map(sanitizeEdge) as unknown as Edge[] }),

      clearTutorialCanvas: () => set({ nodes: [], edges: [] }),

      setValidationStatus: (status, error) => set({ 
        validationStatus: status,
        validationError: error ?? '',
      }),

      setIsTyping: (v) => set({ isTyping: v }),

      addMessage: (type, content) =>
        set((s) => ({
          messages: [...s.messages, { type, content, timestamp: Date.now() }],
        })),

      clearMessages: () => set({ messages: [] }),

      advanceStep: () => {
        const { currentStep, totalSteps, session, activeTutorial } = get();
        if (session && activeTutorial) {
          const newSession = engine.advancePhase(session, activeTutorial);
          set({ 
            session: newSession,
            currentStep: newSession.stepIndex + 1,
            isLevelComplete: newSession.stepIndex >= totalSteps - 1,
          });
        } else {
          set({ currentStep: Math.min(currentStep + 1, totalSteps) });
        }
      },

      skipStep: () => {
        const { currentStep, totalSteps } = get();
        set({ currentStep: Math.min(currentStep + 1, totalSteps) });
      },

      completeTutorial: () => set({ isComplete: true }),

      resetTutorial: () => { 
        const { activeTutorial } = get();
        if (activeTutorial) {
          const { clearProgress } = get();
          clearProgress(activeTutorial.id);
          
          const session = engine.initSession(activeTutorial);
          set({ 
            currentStep: 1, 
            currentLevel: 1,
            completedLevels: [],
            nodes: [], 
            edges: [],
            messages: [],
            session,
            isComplete: false,
            isLevelComplete: false,
          });
          
          // Delete from Supabase
          if (isSupabaseConfigured) {
            import('@/lib/supabase').then(({ getSupabaseClient }) => {
              import('@/store/authStore').then(({ useAuthStore }) => {
                const { user } = useAuthStore.getState();
                if (user) {
                  getSupabaseClient()
                    .from('tutorial_progress')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('tutorial_id', activeTutorial.id);
                }
              });
            });
          }
        }
      },

      // FIX: Start tutorial fresh - with timeout handling
      startTutorialFresh: async (tutorialInput): Promise<{ success: boolean; error?: string }> => {
        // All tutorials in the TUTORIALS array are TutorialDefinition instances
        const tutorial = tutorialInput as unknown as TutorialDefinition;
        const totalSteps = tutorial.levels.reduce((acc, l) => acc + l.steps.length, 0);
        
        // Step 1: Clear local state
        const { clearProgress } = get();
        clearProgress(tutorial.id);
        
        // Step 2: Clear tutorial-specific state
        set({
          currentStep: 1,
          currentLevel: 1,
          completedLevels: [],
          nodes: [],
          edges: [],
          messages: [],
          isComplete: false,
          isLevelComplete: false,
        });

        // Step 3: Try to upsert DB with fresh state (with timeout)
        if (isSupabaseConfigured) {
          try {
            // Create a timeout promise that rejects after 5 seconds
            const timeoutPromise = new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Auth timeout')), 5000)
            );
            
            // Race between auth check and timeout
            const authPromise = (async () => {
              const { useAuthStore } = await import('@/store/authStore');
              return useAuthStore.getState();
            })();
            
            const { user } = await Promise.race([authPromise, timeoutPromise]) as { user: unknown };
            
            if (user && typeof user === 'object' && 'id' in user) {
              const { getSupabaseClient } = await import('@/lib/supabase');
              const supabase = getSupabaseClient();
              
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { error } = await (supabase.from('tutorial_progress') as any)
                .upsert({
                  user_id: (user as { id: string }).id,
                  tutorial_id: tutorial.id,
                  current_level: 1,
                  current_step: 1,
                  current_phase: 'context',
                  completed_levels: [],
                  canvas_nodes: [],
                  canvas_edges: [],
                  explain_count: 0,
                }, { onConflict: 'user_id,tutorial_id' })
                .select()
                .single();

              if (error) {
                console.warn('[tutorialStore] Supabase upsert failed, continuing locally:', error.message);
              }
            }
          } catch (e) {
            // Timeout or auth error - continue with local-only mode
            console.warn('[tutorialStore] Auth check timed out or failed, starting locally:', e instanceof Error ? e.message : String(e));
          }
        }

        // Start fresh locally (either Supabase not configured, auth timed out, or no user)
        const session = engine.initSession(tutorial);
        set({
          activeTutorial: tutorial,
          session,
          currentStep: 1,
          currentLevel: 1,
          completedLevels: [],
          totalSteps,
          activeTutorialId: tutorial.id,
          isComplete: false,
          isLevelComplete: false,
        });

        return { success: true };
      },

      savePhase: (tutorialId, step, phase) => {
        set((s) => ({
          tutorialPhase: { ...s.tutorialPhase, [`${tutorialId}-${step}`]: phase },
        }));
      },

      getPersistedPhase: (tutorialId, step) => {
        return get().tutorialPhase[`${tutorialId}-${step}`] ?? null;
      },

      advanceLevel: (nextLevelStepCount) => {
        const { currentLevel, completedLevels } = get();
        set({
          currentLevel: currentLevel + 1,
          currentStep: 1,
          completedLevels: [...completedLevels, currentLevel],
          isLevelComplete: false,
          totalSteps: nextLevelStepCount,
        });
      },

      dismissLevelComplete: () => set({ isLevelComplete: false }),

      saveProgress: (tutorialId, progress) => {
        set((state) => ({
          richProgress: {
            ...state.richProgress,
            [tutorialId]: {
              tutorialId,
              currentLevel: progress.currentLevel ?? state.currentLevel,
              currentStep: progress.currentStep ?? state.currentStep,
              currentPhase: progress.currentPhase ?? 'context',
              completedLevels: progress.completedLevels ?? state.completedLevels,
              canvasNodes: progress.canvasNodes ?? state.tutorialNodes as unknown as SanitizedNode[],
              canvasEdges: progress.canvasEdges ?? state.tutorialEdges as unknown as SanitizedEdge[],
              explainCount: progress.explainCount ?? 0,
              updatedAt: progress.updatedAt ?? new Date().toISOString(),
            },
          },
        }));
      },

      getProgress: (tutorialId) => {
        return get().richProgress[tutorialId] ?? null;
      },

      getLevelCanvasState: (level) => {
        const progress = get().richProgress[get().activeTutorialId ?? ''];
        if (progress?.currentLevel === level) {
          return {
            nodes: progress.canvasNodes as unknown as Node[],
            edges: progress.canvasEdges as unknown as Edge[],
          };
        }
        return null;
      },

      clearProgress: (tutorialId) => {
        set((state) => {
          const newRichProgress = { ...state.richProgress };
          delete newRichProgress[tutorialId];
          return { richProgress: newRichProgress };
        });
      },

      clearAllProgress: () => set({ richProgress: {} }),

      syncToSupabase: async (tutorialId) => {
        const progress = get().richProgress[tutorialId];
        if (!progress) return;
        
        try {
          if (!isSupabaseConfigured) return;

          set({ isSyncing: true });
          const { user } = (await import('@/store/authStore')).useAuthStore.getState();
          if (!user) return;

          const { getSupabaseClient } = await import('@/lib/supabase');
          const supabase = getSupabaseClient();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('tutorial_progress') as any).upsert({
            user_id: user.id,
            tutorial_id: tutorialId,
            current_level: progress.currentLevel,
            current_step: progress.currentStep,
            current_phase: progress.currentPhase,
            completed_levels: progress.completedLevels,
            canvas_nodes: progress.canvasNodes,
            canvas_edges: progress.canvasEdges,
            explain_count: progress.explainCount,
            updated_at: progress.updatedAt,
          }, { onConflict: 'user_id,tutorial_id' });
        } catch (e) {
          console.error('[tutorialStore] Sync to Supabase failed:', e);
          return;
        }
      },

      loadFromSupabase: async (tutorialId) => {
        try {
          if (!isSupabaseConfigured) return null;

          const { user } = (await import('@/store/authStore')).useAuthStore.getState();
          if (!user) return null;

          const { getSupabaseClient } = await import('@/lib/supabase');
          const supabase = getSupabaseClient();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error } = await (supabase.from('tutorial_progress') as any)
            .select('*')
            .eq('user_id', user.id)
            .eq('tutorial_id', tutorialId)
            .maybeSingle();

          if (error) {
            console.error('[tutorialStore] Supabase error:', error.message);
            return null;
          }

          if (!data || Array.isArray(data)) return null;

          const progress: TutorialProgressEntry = {
            tutorialId: data.tutorial_id,
            currentLevel: data.current_level,
            currentStep: data.current_step,
            currentPhase: data.current_phase,
            completedLevels: data.completed_levels,
            canvasNodes: data.canvas_nodes,
            canvasEdges: migrateEdgesToSmoothstep(data.canvas_edges),
            explainCount: data.explain_count,
            updatedAt: data.updated_at,
          };

          get().saveProgress(tutorialId, progress);
          return progress;
        } catch (e) {
          console.error('[tutorialStore] Load from Supabase failed:', e);
          return null;
        }
      },

      setSwitchingTutorial: (v) => set({ isSwitchingTutorial: v }),

      exitTutorial: () => {
        const { activeTutorial, session, nodes, edges } = get();
        if (activeTutorial && session) {
          get().saveProgress(activeTutorial.id, {
            currentLevel: session.levelIndex,
            currentStep: session.stepIndex,
            currentPhase: session.phase,
            completedLevels: session.completedLevelIds.map(Number),
            canvasNodes: nodes.map(sanitizeNode),
            canvasEdges: edges.map(sanitizeEdge),
            explainCount: 0,
            updatedAt: new Date().toISOString(),
          });
        }
        set({
          activeTutorial: null,
          session: null,
          nodes: [],
          edges: [],
          messages: [],
          isComplete: false,
          isLevelComplete: false,
          currentStep: 1,
          totalSteps: 0,
          currentLevel: 1,
          completedLevels: [],
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => serializedStorage),
      partialize: (state) => ({
        richProgress: state.richProgress,
        tutorialProgress: state.tutorialProgress,
        tutorialPhase: state.tutorialPhase,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export const useTutorialHelpers = () => {
  const activeTutorial = useTutorialStore((s) => s.activeTutorial);
  const session = useTutorialStore((s) => s.session);
  const nodes = useTutorialStore((s) => s.nodes);
  const edges = useTutorialStore((s) => s.edges);

  if (!activeTutorial || !session) {
    return {
      currentStep: null,
      currentPhase: null,
      progress: { percent: 0, stepLabel: '', levelLabel: '' },
      isComplete: false,
    };
  }

  const currentStep = engine.getCurrentStep(session, activeTutorial);
  const currentPhase = engine.getCurrentPhase(session, activeTutorial);
  const progress = engine.getProgress(session, activeTutorial);
  const isComplete = engine.isTutorialComplete(session, activeTutorial);

  return { currentStep, currentPhase, progress, isComplete };
};