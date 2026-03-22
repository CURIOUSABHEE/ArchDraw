'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTutorialStore } from '@/store/tutorialStore';
import { isSupabaseConfigured, getSupabaseClient } from '@/lib/supabase';

async function migrateGuestProgress(userId: string) {
  if (!isSupabaseConfigured) return;
  const { richProgress } = useTutorialStore.getState();
  const entries = Object.entries(richProgress);
  if (entries.length === 0) return;

  const supabase = getSupabaseClient();
  for (const [tutorialId, progress] of entries) {
    if (!progress.currentStep || progress.currentStep <= 1) continue;
    try {
      await supabase.from('tutorial_progress').upsert(
        {
          user_id: userId,
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
    } catch {
      // best-effort, never throw
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initialize, user } = useAuthStore();
  const prevUserIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!user) { prevUserIdRef.current = null; return; }
    if (user.id === prevUserIdRef.current) return;
    prevUserIdRef.current = user.id;
    migrateGuestProgress(user.id).catch(() => {});
  }, [user]);

  return <>{children}</>;
}
