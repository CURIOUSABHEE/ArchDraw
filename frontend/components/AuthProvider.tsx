'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [initialized, setInitialized] = useState(false);
  const { initialize, user, loading } = useAuthStore();
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    initialize().then(() => setInitialized(true));
  }, [initialize]);

  // Migrate guest progress when user signs in
  useEffect(() => {
    if (!user) { prevUserIdRef.current = null; return; }
    if (user.id === prevUserIdRef.current) return;
    prevUserIdRef.current = user.id;
    migrateGuestProgress(user.id).catch(() => {});
  }, [user]);

  if (!initialized || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a12',
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>⬡</div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
