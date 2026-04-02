'use client';

import { useEffect, useState, useRef } from 'react';
import { Toolbar } from '@/components/Toolbar';
import { ComponentSidebar } from '@/components/ComponentSidebar';
import { CanvasSidebar } from '@/components/CanvasSidebar';
import { Canvas } from '@/components/Canvas';
import { CommandPalette } from '@/components/CommandPalette';
import { PropertiesPanel } from '@/components/PropertiesPanel';
import { CreateComponentModal, COMPONENT_TYPES, type CreateComponentData } from '@/components/CreateComponentModal';
import type { ComponentToEdit } from '@/components/CreateComponentModal';
import { AIGenerateModal } from '@/components/AIGenerateModal';
import { GenerationProgressDisplay } from '@/components/GenerationProgress';
import { useDiagramStore } from '@/store/diagramStore';
import { useAuthStore } from '@/store/authStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { OnboardingOverlay } from '@/components/onboarding/OnboardingOverlay';
import { useOnboarding } from '@/components/onboarding/useOnboarding';
import { componentRegistry } from '@/lib/componentRegistry';
import { toast } from 'sonner';
import type { GenerationProgress } from '@/lib/ai/types';

function generateCanvasName(prompt: string): string {
  const words = prompt.trim().split(/\s+/);
  const filtered = words.filter(w => 
    !['a', 'an', 'the', 'for', 'with', 'and', 'or', 'to', 'of', 'in', 'on', 'at', 'by', 'is', 'are', 'was', 'were', 'be', 'build', 'design', 'create', 'make', 'generate', 'architecture', 'diagram', 'system'].includes(w.toLowerCase())
  );
  
  const topic = filtered.slice(0, 3).join(' ');
  return topic ? `${topic.charAt(0).toUpperCase() + topic.slice(1)} diagram` : 'AI Diagram';
}

export default function EditorPage() {
  const { selectedNodeId, selectedEdgeId, nodes, sidebarOpen, setSidebarOpen, importDiagram, fitView, addCanvas, renameCanvas } = useDiagramStore();
  const { user } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editComponent, setEditComponent] = useState<ComponentToEdit | null>(null);
  const [showAIGenerateModal, setShowAIGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [canvasSidebarOpen, setCanvasSidebarOpen] = useState(false);
  
  // Refs for useEffect to avoid dependency issues
  const sidebarOpenRef = useRef(sidebarOpen);
  const canvasSidebarOpenRef = useRef(canvasSidebarOpen);
  sidebarOpenRef.current = sidebarOpen;
  canvasSidebarOpenRef.current = canvasSidebarOpen;

  // Initialize onboarding (auto-open + drag detection)
  useOnboarding();

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

      // Cmd/Ctrl + Shift + N: Create new component
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setEditComponent(null);
        setShowCreateModal(true);
      }

      // Cmd/Ctrl + K: Open canvas switcher
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCanvasSidebarOpen(true);
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

  // AI Generate button event listener
  useEffect(() => {
    const handler = () => {
      setShowAIGenerateModal(true);
    };
    window.addEventListener('open-ai-generate', handler);
    return () => window.removeEventListener('open-ai-generate', handler);
  }, []);

  // Canvas sidebar event listeners - also close component sidebar when canvas sidebar opens
  useEffect(() => {
    const openHandler = () => {
      if (sidebarOpenRef.current) setSidebarOpen(false);
      setCanvasSidebarOpen(true);
    };
    const closeHandler = () => {
      setCanvasSidebarOpen(false);
    };
    const toggleHandler = () => {
      if (!canvasSidebarOpenRef.current && sidebarOpenRef.current) {
        setSidebarOpen(false);
      }
      setCanvasSidebarOpen(prev => !prev);
    };
    window.addEventListener('open-canvas-sidebar', openHandler);
    window.addEventListener('close-canvas-sidebar', closeHandler);
    window.addEventListener('toggle-canvas-sidebar', toggleHandler);
    return () => {
      window.removeEventListener('open-canvas-sidebar', openHandler);
      window.removeEventListener('close-canvas-sidebar', closeHandler);
      window.removeEventListener('toggle-canvas-sidebar', toggleHandler);
    };
  }, []);

  const handleGenerate = async (description: string) => {
    setIsGenerating(true);
    setProgress(null);

    const isCurrentCanvasEmpty = nodes.length === 0;
    const canvasName = generateCanvasName(description);
    let targetCanvasId: string | null = null;

    if (!isCurrentCanvasEmpty) {
      targetCanvasId = addCanvas(canvasName);
    }

    try {
      const response = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Generation failed');
      }

      const { data: result } = data;

      if (result.nodes && result.edges) {
        const processedNodes = result.nodes.map((node: Record<string, unknown>) => ({
          ...node,
          type: 'systemNode',
        }));

        const processedEdges = result.edges.map((edge: Record<string, unknown>) => ({
          ...edge,
          type: 'custom',
        }));

        importDiagram(processedNodes, processedEdges);
        
        const { activeCanvasId } = useDiagramStore.getState();
        renameCanvas(activeCanvasId, canvasName);
        
        setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 100);
        toast.success(`Generated ${result.nodes.length} nodes and ${result.edges.length} edges`);
      }

      setProgress({
        phase: 'complete',
        iteration: result.metadata.iterations,
        currentAgent: 'complete',
        score: result.metadata.score,
        message: `Created ${result.metadata.totalNodes} nodes and ${result.metadata.totalEdges} edges`,
        progress: 100,
      });

      setTimeout(() => {
        setIsGenerating(false);
        setProgress(null);
      }, 2000);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      setProgress({
        phase: 'error',
        iteration: 0,
        currentAgent: 'error',
        score: 0,
        message,
        progress: 0,
      });
      setIsGenerating(false);
      throw error;
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen w-screen overflow-hidden">
        <Toolbar />
        <div className="flex flex-1 overflow-hidden">
          {canvasSidebarOpen && (
            <CanvasSidebar onClose={() => setCanvasSidebarOpen(false)} />
          )}
          {sidebarOpen && (
            <ComponentSidebar
              onOpenCreateModal={() => setShowCreateModal(true)}
            />
          )}
          <div className="flex flex-col flex-1 overflow-hidden">
            <Canvas />
          </div>
          {(selectedNodeId || selectedEdgeId) && <PropertiesPanel />}
        </div>
        <CommandPalette />
        <OnboardingOverlay />
        <AIGenerateModal
          isOpen={showAIGenerateModal}
          onClose={() => setShowAIGenerateModal(false)}
          onGenerate={handleGenerate}
        />
        <GenerationProgressDisplay 
          progress={progress} 
          onCancel={() => {
            setIsGenerating(false);
            setProgress(null);
          }}
        />
        <CreateComponentModal
          isOpen={showCreateModal}
          onClose={() => { setShowCreateModal(false); setEditComponent(null); }}
          onCreate={(data: CreateComponentData) => {
            const typeInfo = COMPONENT_TYPES.find(t => t.id === data.type);
            const id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            componentRegistry.addCustomComponent({
              id,
              label: data.name,
              category: typeInfo?.label || 'Other',
              color: typeInfo?.color || '#6366f1',
              description: data.description,
              technology: 'custom',
            });
            setShowCreateModal(false);
            setEditComponent(null);
            window.dispatchEvent(new CustomEvent('custom-component-added'));
          }}
          onUpdate={(id: string, data: CreateComponentData) => {
            const typeInfo = COMPONENT_TYPES.find(t => t.id === data.type);
            componentRegistry.updateCustomComponent(id, {
              label: data.name,
              category: typeInfo?.label || 'Other',
              color: typeInfo?.color || '#6366f1',
              description: data.description,
            });
            setShowCreateModal(false);
            setEditComponent(null);
            window.dispatchEvent(new CustomEvent('custom-component-added'));
          }}
          existingNames={componentRegistry.getAll().map(c => c.label.toLowerCase())}
          editComponent={editComponent}
        />
      </div>
    </ErrorBoundary>
  );
}
