import { create } from 'zustand';
import { db, Diagram } from '@/lib/database';
import { useAuthStore } from './authStore';

interface DiagramStoreState {
  diagrams: Diagram[];
  currentDiagram: Diagram | null;
  loading: boolean;
  loadingDiagrams: boolean;
  
  loadDiagrams: () => Promise<void>;
  loadDiagram: (id: string) => Promise<void>;
  createDiagram: (name?: string) => Promise<Diagram>;
  saveDiagram: (nodes: any[], edges: any[]) => Promise<void>;
  deleteDiagram: (id: string) => Promise<void>;
  setCurrentDiagram: (diagram: Diagram | null) => void;
}

export const useDiagramStore = create<DiagramStoreState>((set, get) => ({
  diagrams: [],
  currentDiagram: null,
  loading: false,
  loadingDiagrams: false,

  loadDiagrams: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    set({ loadingDiagrams: true });
    try {
      const diagrams = await db.getDiagrams(user.id);
      set({ diagrams, loadingDiagrams: false });
    } catch (error) {
      console.error('Failed to load diagrams:', error);
      set({ loadingDiagrams: false });
    }
  },

  loadDiagram: async (id: string) => {
    set({ loading: true });
    try {
      const diagram = await db.getDiagram(id);
      set({ currentDiagram: diagram, loading: false });
    } catch (error) {
      console.error('Failed to load diagram:', error);
      set({ loading: false });
    }
  },

  createDiagram: async (name: string = 'Untitled Diagram') => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('Must be logged in');
    
    try {
      const diagram = await db.createDiagram(user.id, name);
      set({ 
        diagrams: [diagram, ...get().diagrams],
        currentDiagram: diagram 
      });
      await db.logActivity('create', 'diagram', diagram.id, { name });
      return diagram;
    } catch (error) {
      console.error('Failed to create diagram:', error);
      throw error;
    }
  },

  saveDiagram: async (nodes: any[], edges: any[]) => {
    const { currentDiagram } = get();
    if (!currentDiagram) return;
    
    try {
      await db.saveDiagram(currentDiagram.id, nodes, edges);
      await db.logActivity('update', 'diagram', currentDiagram.id, { 
        nodeCount: nodes.length,
        edgeCount: edges.length 
      });
    } catch (error) {
      console.error('Failed to save diagram:', error);
      throw error;
    }
  },

  deleteDiagram: async (id: string) => {
    try {
      await db.deleteDiagram(id);
      const { currentDiagram, diagrams } = get();
      set({
        diagrams: diagrams.filter(d => d.id !== id),
        currentDiagram: currentDiagram?.id === id ? null : currentDiagram,
      });
      await db.logActivity('delete', 'diagram', id);
    } catch (error) {
      console.error('Failed to delete diagram:', error);
      throw error;
    }
  },

  setCurrentDiagram: (diagram: Diagram | null) => {
    set({ currentDiagram: diagram });
  },
}));
