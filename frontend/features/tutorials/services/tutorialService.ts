import { isSupabaseConfigured } from '@/lib/supabase';
import type { TutorialProgressEntry, SanitizedNode, SanitizedEdge } from '@/store/tutorialStore';
import type { TutorialLike } from '@/lib/tutorial/schema';

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

export async function loadTutorialProgress(
  tutorialId: string
): Promise<TutorialProgressEntry | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { user } = (await import('@/store/authStore')).useAuthStore.getState();
    if (!user) return null;

    const { getSupabaseClient } = await import('@/lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await (supabase.from('tutorial_progress') as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('tutorial_id', tutorialId)
      .maybeSingle();

    if (error || !data || Array.isArray(data)) {
      return null;
    }

    return migrateEdgesToProgress(data);
  } catch {
    return null;
  }
}

export async function saveTutorialProgress(
  tutorialId: string,
  progress: Partial<ProgressData>
): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const { user } = (await import('@/store/authStore')).useAuthStore.getState();
    if (!user) return;

    const { getSupabaseClient } = await import('@/lib/supabase');
    const supabase = getSupabaseClient();

    await (supabase.from('tutorial_progress') as any).upsert({
      user_id: user.id,
      tutorial_id: tutorialId,
      current_level: progress.currentLevel ?? 1,
      current_step: progress.currentStep ?? 1,
      current_phase: progress.currentPhase ?? 'context',
      completed_levels: progress.completedLevels ?? [],
      canvas_nodes: progress.canvasNodes ?? [],
      canvas_edges: progress.canvasEdges ?? [],
      explain_count: progress.explainCount ?? 0,
    }, { onConflict: 'user_id,tutorial_id' });
  } catch (e) {
    console.error('[tutorialService] Save failed:', e);
  }
}

export async function deleteTutorialProgress(
  tutorialId: string
): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const { user } = (await import('@/store/authStore')).useAuthStore.getState();
    if (!user) return;

    const { getSupabaseClient } = await import('@/lib/supabase');
    const supabase = getSupabaseClient();

    await (supabase.from('tutorial_progress') as any)
      .delete()
      .eq('user_id', user.id)
      .eq('tutorial_id', tutorialId);
  } catch (e) {
    console.error('[tutorialService] Delete failed:', e);
  }
}

export async function startTutorialFresh(
  tutorial: TutorialLike
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    const { user } = (await import('@/store/authStore')).useAuthStore.getState();
    if (!user) return { success: true };

    const { getSupabaseClient } = await import('@/lib/supabase');
    const supabase = getSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('tutorial_progress') as any)
      .upsert({
        user_id: user.id,
        tutorial_id: tutorial.id,
        current_level: 1,
        current_step: 1,
        current_phase: 'context',
        completed_levels: [],
        canvas_nodes: [],
        canvas_edges: [],
        explain_count: 0,
      }, { onConflict: 'user_id,tutorial_id' });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

function migrateEdgesToProgress(data: {
  tutorial_id: string;
  current_level: number;
  current_step: number;
  current_phase: string;
  completed_levels: number[];
  canvas_nodes: SanitizedNode[];
  canvas_edges: SanitizedEdge[];
  explain_count: number;
  updated_at: string;
}): TutorialProgressEntry {
  return {
    tutorialId: data.tutorial_id,
    currentLevel: data.current_level,
    currentStep: data.current_step,
    currentPhase: data.current_phase,
    completedLevels: data.completed_levels,
    canvasNodes: data.canvas_nodes,
    canvasEdges: data.canvas_edges,
    explainCount: data.explain_count,
    updatedAt: data.updated_at,
  };
}