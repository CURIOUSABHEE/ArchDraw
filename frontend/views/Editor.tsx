'use client';

import { useEffect, useState, useRef } from 'react';
import type { Node, Edge } from 'reactflow';
import { Toolbar } from '@/components/Toolbar';
import { ComponentSidebar } from '@/components/ComponentSidebar';
import { CanvasSidebar } from '@/components/CanvasSidebar';
import { Canvas, reactFlowRef } from '@/components/Canvas';
import { CommandPalette } from '@/components/CommandPalette';
import { PropertiesPanel } from '@/components/PropertiesPanel';
import { CreateComponentModal, COMPONENT_TYPES, type CreateComponentData } from '@/components/CreateComponentModal';
import type { ComponentToEdit } from '@/components/CreateComponentModal';
import { FloatingAIBar } from '@/components/FloatingAIBar';
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
import { SequenceDiagramViewer } from '@/components/SequenceDiagramViewer';

function generateCanvasName(prompt: string): string {
  const words = prompt.trim().split(/\s+/);
  const filtered = words.filter(w => 
    !['a', 'an', 'the', 'for', 'with', 'and', 'or', 'to', 'of', 'in', 'on', 'at', 'by', 'is', 'are', 'was', 'were', 'be', 'build', 'design', 'create', 'make', 'generate', 'architecture', 'diagram', 'system'].includes(w.toLowerCase())
  );
  
  const topic = filtered.slice(0, 3).join(' ');
  return topic ? `${topic.charAt(0).toUpperCase() + topic.slice(1)} diagram` : 'AI Diagram';
}

export default function EditorPage() {
  const { selectedNodeId, selectedEdgeId, nodes, sidebarOpen, setSidebarOpen, importDiagram, importSequenceDiagram, fitView, addCanvas, renameCanvas, activeCanvasId, sequenceDiagrams } = useDiagramStore();
  const { user } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editComponent, setEditComponent] = useState<ComponentToEdit | null>(null);
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

      // f key — fit view
      if (e.key === 'f') {
        e.preventDefault();
        if (reactFlowRef.instance?.fitView) {
          reactFlowRef.instance.fitView({ padding: 0.1, duration: 200 });
        }
        return;
      }

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

      // Cmd/Ctrl + K: Open command palette (not canvas sidebar)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        // Command palette handles its own Cmd+K, don't open canvas sidebar
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

  const handleGenerate = async (description: string, model?: string) => {
    setIsGenerating(true);
    setProgress(null);

    const isCurrentCanvasEmpty = nodes.length === 0;
    const canvasName = generateCanvasName(description);
    let targetCanvasId: string | null = null;

    if (!isCurrentCanvasEmpty) {
      targetCanvasId = addCanvas(canvasName);
    }

    try {
      // Use streaming endpoint for real-time feedback
      const response = await fetch('/api/generate-diagram/streaming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description, model, stream: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Generation failed');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              
              if (event.type === 'progress') {
                setProgress({
                  phase: event.phase || 'generating',
                  iteration: 0,
                  currentAgent: event.phase || 'generating',
                  score: 0,
                  message: event.message || 'Generating...',
                  progress: event.progress || 50,
                });
              } else if (event.type === 'complete') {
                handleGenerationComplete(event.data, canvasName);
                return;
              } else if (event.type === 'cached') {
                handleGenerationComplete(event.data, canvasName, true);
                return;
              } else if (event.type === 'error') {
                throw new Error(event.message);
              }
            } catch (parseError) {
              // Skip invalid JSON
            }
          }
        }
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setProgress({
        phase: 'error',
        iteration: 0,
        currentAgent: 'error',
        score: 0,
        message: message,
        progress: 0,
      });
      toast.error(message);
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(null);
      }, 2000);
    }
  };

  const handleGenerationComplete = (result: { type?: string; nodes?: unknown[]; edges?: unknown[]; metadata?: Record<string, unknown> }, canvasName: string, cached = false) => {
    if (result.type === 'sequence') {
      const mermaidSyntax = result.metadata?.mermaidSyntax as string;
      const title = (result.metadata?.title as string) || canvasName;
      
      importSequenceDiagram(mermaidSyntax, title);
      
      const { activeCanvasId } = useDiagramStore.getState();
      renameCanvas(activeCanvasId, title);
      
      setProgress({
        phase: 'complete',
        iteration: 0,
        currentAgent: 'complete',
        score: 0,
        message: `Created sequence diagram with ${(result.metadata?.actors as unknown[])?.length || 0} actors`,
        progress: 100,
      });

      toast.success(`Generated sequence diagram: ${title}`);
      return;
    }

    if (result.nodes && result.edges) {
      const processedNodes = (result.nodes as Record<string, unknown>[]).map((node) => ({
        ...node,
        type: 'systemNode',
      }));

      const processedEdges = (result.edges as Record<string, unknown>[]).map((edge) => ({
        ...edge,
        type: 'custom',
      }));

      importDiagram(processedNodes as unknown as Node[], processedEdges as unknown as Edge[]);
      
      const { activeCanvasId } = useDiagramStore.getState();
      renameCanvas(activeCanvasId, canvasName);
      
      setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 100);
      
      if (cached) {
        toast.success(`Loaded cached diagram: ${result.nodes.length} nodes`);
      } else {
        toast.success(`Generated ${result.nodes.length} nodes and ${result.edges.length} edges`);
      }
    }

    setProgress({
      phase: 'complete',
      iteration: (result.metadata?.iterations as number) || 0,
      currentAgent: 'complete',
      score: (result.metadata?.score as number) || 0,
      message: `Created ${(result.metadata?.totalNodes as number) || result.nodes?.length || 0} nodes`,
      progress: 100,
    });
  };

  return (
    <ErrorBoundary>
      <div className="fixed inset-0 overflow-hidden" style={{ background: '#FFFFFF' }}>
        {sequenceDiagrams[activeCanvasId] ? (
          <SequenceDiagramViewer />
        ) : (
          <Canvas />
        )}
        
        <Toolbar />
        
        {canvasSidebarOpen && (
          <CanvasSidebar onClose={() => setCanvasSidebarOpen(false)} />
        )}
        
        {sidebarOpen && (
          <ComponentSidebar
            onOpenCreateModal={() => setShowCreateModal(true)}
          />
        )}
        
        {(selectedNodeId || selectedEdgeId) && <PropertiesPanel />}
        
        <CommandPalette />
        <OnboardingOverlay />
        <FloatingAIBar onGenerate={handleGenerate} />
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
