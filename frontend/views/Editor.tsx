'use client';

import { useEffect } from 'react';
import { Toolbar } from '@/components/Toolbar';
import { ComponentSidebar } from '@/components/ComponentSidebar';
import { Canvas } from '@/components/Canvas';
import { CommandPalette } from '@/components/CommandPalette';
import { PropertiesPanel } from '@/components/PropertiesPanel';
import { CanvasTabBar } from '@/components/CanvasTabBar';
import { useDiagramStore } from '@/store/diagramStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuthStore } from '@/store/authStore';

export default function EditorPage() {
  const { darkMode, selectedNodeId, selectedEdgeId } = useDiagramStore();
  const { initialize, user } = useAuthStore();
  const restoredRef = useRef(false);

  // Sync dark mode class on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Initialize auth (non-blocking — canvas loads regardless)
  useEffect(() => {
    initialize();
  }, [initialize]);

  // After auth, restore guest canvas work if any
  useEffect(() => {
    if (user && !restoredRef.current) {
      restoredRef.current = true;
      const saved = localStorage.getItem('guestCanvases');
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
    </ErrorBoundary>
  );  }
    }
  }, [user]);

  // Keyboard shortcuts: undo/redo, delete
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const { undo, redo, deleteSelected } = useDiagramStore.getState();
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        deleteSelected();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
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
  );
}
