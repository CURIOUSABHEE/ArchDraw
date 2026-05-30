'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useDiagramStore } from '@/store/diagramStore';
import { useTutorialStore } from '@/store/tutorialStore';
import { isSupabaseConfigured, getSupabaseClient, isReachable, type TutorialProgressTable, type UserCanvasesTable } from '@/lib/supabase';
import { STORAGE_KEYS } from '@/lib/config';

async function migrateGuestProgress(userId: string) {
  if (!isSupabaseConfigured || !isReachable) return;
  const { richProgress } = useTutorialStore.getState();
  const entries = Object.entries(richProgress);
  if (entries.length === 0) return;

  const supabase = getSupabaseClient();
  for (const [tutorialId, progress] of entries) {
    if (!progress.currentStep || progress.currentStep <= 1) continue;
    try {
      await (supabase.from('tutorial_progress') as unknown as TutorialProgressTable).upsert(
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
          updated_at: progress.updatedAt || new Date().toISOString(),
        },
        { onConflict: 'user_id,tutorial_id' }
      );
    } catch {
      // best-effort, never throw
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initialize, user, initialized } = useAuthStore();
  const prevUserIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!user) { 
      prevUserIdRef.current = null;
      useDiagramStore.getState().setUserProfile(null);
      return;
    }
    
    if (user.id === prevUserIdRef.current) return;
    prevUserIdRef.current = user.id;

    // Set user profile and load canvases when user is found
    const { setUserProfile, loadCanvasesFromDB } = useDiagramStore.getState();
    
    if (user.id !== 'guest') {
      setUserProfile({
        id: user.id,
        email: user.email ?? undefined,
        name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? undefined,
        avatar_url: user.user_metadata?.avatar_url ?? undefined,
      });
      loadCanvasesFromDB().catch(() => {});
      migrateGuestProgress(user.id).catch(() => {});
    } else {
      setUserProfile({
        id: 'guest',
        email: 'guest@local',
        name: 'Guest User',
      });
    }
  }, [user]);

  useEffect(() => {
    if (!initialized || !isSupabaseConfigured) return;
    
    const isOffline = typeof window !== 'undefined' && !window.navigator.onLine;
    if (!isReachable || isOffline) return;
    
    const supabase = getSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const { setUserProfile, loadCanvasesFromDB } = useDiagramStore.getState();
      
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        const u = session.user;
        setUserProfile({
          id: u.id,
          email: u.email ?? undefined,
          name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? undefined,
          avatar_url: u.user_metadata?.avatar_url ?? undefined,
        });
        await loadCanvasesFromDB();
        
        // Restore guest canvases if they exist
        const saved = localStorage.getItem(STORAGE_KEYS.guestCanvases);
        if (saved) {
          try {
            const guestCanvases = JSON.parse(saved);
            const supabaseClient = getSupabaseClient();
            for (const canvas of guestCanvases) {
              if (canvas.nodes?.length > 0) {
                await (supabaseClient.from('user_canvases') as unknown as UserCanvasesTable).upsert({
                  id: canvas.id,
                  user_id: u.id,
                  name: canvas.name,
                  nodes: canvas.nodes,
                  edges: canvas.edges,
                  updated_at: new Date().toISOString(),
                });
              }
            }
            localStorage.removeItem(STORAGE_KEYS.guestCanvases);
            await loadCanvasesFromDB();
          } catch { /* ignore */ }
        }
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
