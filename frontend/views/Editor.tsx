'use client';

import { useEffect, useRef } from 'react';
import { Toolbar } from '@/components/Toolbar';
import { ComponentSidebar } from '@/components/ComponentSidebar';
import { Canvas } from '@/components/Canvas';
import { CommandPalette } from '@/components/CommandPalette';
import { PropertiesPanel } from '@/components/PropertiesPanel';
import { CanvasTabBar } from '@/components/CanvasTabBar';
import { useDiagramStore } from '@/store/diagramStore';
import { useAuthStore } from '@/store/authStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { OnboardingOverlay } from '@/components/onboarding/OnboardingOverlay';
import { useOnboarding } from '@/components/onboarding/useOnboarding';
import { EdgeType } from '@/data/edgeTypes';

export default function EditorPage() {
  const { darkMode, selectedNodeId, selectedEdgeId, nodes } = useDiagramStore();
  const { user } = useAuthStore();

  // Initialize onboarding (auto-open + drag detection)
  useOnboarding();

  // Sync dark mode class on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Auth init + canvas restore
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseClient();
    const { setUserProfile, loadCanvasesFromDB } = useDiagramStore.getState();

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const u = session.user;
        setUserProfile({
          id: u.id,
          email: u.email ?? undefined,
          name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? undefined,
          avatar_url: u.user_metadata?.avatar_url ?? undefined,
        });
        await loadCanvasesFromDB();
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const u = session.user;
        setUserProfile({
          id: u.id,
          email: u.email ?? undefined,
          name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? undefined,
          avatar_url: u.user_metadata?.avatar_url ?? undefined,
        });
        await loadCanvasesFromDB();
        // Restore guest canvases
        const saved = localStorage.getItem('guestCanvases');
        if (saved) {
          try {
            const guestCanvases = JSON.parse(saved);
            const supabase2 = getSupabaseClient();
            for (const canvas of guestCanvases) {
              if (canvas.nodes?.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase2 as any).from('user_canvases').insert({
                  id: canvas.id,
                  user_id: u.id,
                  name: canvas.name,
                  nodes: canvas.nodes,
                  edges: canvas.edges,
                });
              }
            }
            localStorage.removeItem('guestCanvases');
            await loadCanvasesFromDB();
          } catch { /* ignore */ }
        }
      }
      if (event === 'SIGNED_OUT') {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Prevent all global shortcuts if user is typing in an input
      const activeTag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      const { undo, redo, deleteSelected } = useDiagramStore.getState();
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      }

      // Edge type cycling (e key)
      if (e.key === 'e' || e.key === 'E') {
        const store = useDiagramStore.getState();
        const selectedEdgeIds = store.edges
          .filter((edge) => edge.selected)
          .map((edge) => edge.id);

        if (selectedEdgeIds.length > 0) {
          e.preventDefault();
          const EDGE_TYPE_ORDER: EdgeType[] = ['sync', 'async', 'stream', 'event', 'dep'];
          selectedEdgeIds.forEach((edgeId) => {
            const edge = store.edges.find((e) => e.id === edgeId);
            const currentType: EdgeType = edge?.data?.edgeType ?? 'sync';
            const currentIndex = EDGE_TYPE_ORDER.indexOf(currentType);
            const nextType = EDGE_TYPE_ORDER[(currentIndex + 1) % EDGE_TYPE_ORDER.length];
            store.updateEdgeType(edgeId, nextType);
          });
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Unsaved changes warning for guests
  useEffect(() => {
    const isGuest = !user;
    const hasNodes = nodes.length > 0;
    const handler = (e: BeforeUnloadEvent) => {
      if (isGuest && hasNodes) {
        e.preventDefault();
        e.returnValue = 'You have unsaved work. Sign in to save your diagrams.';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [user, nodes.length]);

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen w-screen overflow-hidden">
        <Toolbar />
        <div className="flex flex-1 overflow-hidden">
          <ComponentSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <CanvasTabBar />
            <Canvas />
          </div>
          {(selectedNodeId || selectedEdgeId) && <PropertiesPanel />}
        </div>
        <CommandPalette />
      </div>
      <OnboardingOverlay />
    </ErrorBoundary>
  );
}
