import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { serializedStorage } from './storage';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { DEFAULT_EDGE_TYPE, type EdgeType } from '@/data/edgeTypes';
import { getNodeShape } from '@/lib/nodeShapes';
import { validateStrictConnection, getStrictPortConfig } from '@/lib/componentPorts';

// Module-level fitView callback — set by Canvas on mount, avoids circular imports
type FitViewOptions = { padding?: number; duration?: number; maxZoom?: number };
let fitViewCallback: ((opts?: FitViewOptions) => void) | null = null;
export function registerFitViewCallback(fn: (opts?: FitViewOptions) => void) {
  fitViewCallback = fn;
}

// Debounce helper
function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export interface GuideLine {
  orientation: 'h' | 'v';
  position: number;
  spacingArrows?: { from: number; to: number };
}

export interface NodeData {
  label: string;
  category: string;
  componentType?: string;
  color?: string;
  icon?: string;
  description?: string;
  tech?: string;
  sublabel?: string;
  hasError?: boolean;
  accentColor?: string;
  technology?: string;
  nodeWidth?: number;
  shape?: string;
}

export interface CanvasTab {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  updatedAt?: number;
  isOpen?: boolean;
  isPinned?: boolean;
  lastAccessedAt?: number;
  thumbnail?: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
}

interface HistoryEntry {
  nodes: Node[];
  edges: Edge[];
}

interface DiagramState {
  // ── Multi-canvas ──────────────────────────────────────────────────────────
  canvases: CanvasTab[];
  activeCanvasId: string;
  openCanvasIds: string[];
  nodes: Node[];
  edges: Edge[];

  getRandomAnimalName: () => string;
  addCanvas: (customName?: string) => string;
  removeCanvas: (id: string) => void;
  switchCanvas: (id: string) => void;
  renameCanvas: (id: string, name: string) => void;
  openCanvas: (id: string) => void;
  closeCanvas: (id: string) => void;
  togglePinCanvas: (id: string) => void;
  getOpenCanvases: () => CanvasTab[];
  getVisibleCanvases: () => CanvasTab[];
  getOverflowCanvases: () => CanvasTab[];

  // ── User / Auth ───────────────────────────────────────────────────────────
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  loadCanvasesFromDB: () => Promise<void>;
  saveCanvasToDB: (canvasId: string) => void; // debounced
  savingState: 'idle' | 'saving' | 'saved';
  setSavingState: (s: 'idle' | 'saving' | 'saved') => void;

  // ── Selection ─────────────────────────────────────────────────────────────
  selectedNodeId: string | null;
  selectedNodeIds: string[];
  selectedEdgeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  setSelectedEdgeId: (id: string | null) => void;

  // ── UI state ──────────────────────────────────────────────────────────────
  guideLines: GuideLine[];
  edgeAnimations: boolean;
  showGrid: boolean;
  darkMode: boolean;
  sidebarOpen: boolean;
  canvasMode: 'empty' | 'editing' | 'template';
  setGuideLines: (lines: GuideLine[]) => void;
  toggleEdgeAnimations: () => void;
  toggleGrid: () => void;
  toggleDarkMode: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCanvasMode: (mode: 'empty' | 'editing' | 'template') => void;

  // ── History ───────────────────────────────────────────────────────────────
  past: HistoryEntry[];
  future: HistoryEntry[];
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // ── Node/edge operations ──────────────────────────────────────────────────
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node<NodeData> | string, label?: string, category?: string, color?: string, icon?: string, technology?: string, position?: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  updateNodeData: (id: string, data: Partial<NodeData>) => void;
  updateEdgeData: (id: string, data: Record<string, unknown>) => void;
  deleteEdge: (edgeId: string) => void;
  importDiagram: (nodes: Node[], edges: Edge[]) => void;
  clearDiagram: () => void;
  deleteSelected: () => void;
  selectAll: () => void;
  createGroup: () => void;
  loadTemplate: (nodes: Node[], edges: Edge[]) => void;

  // ── Fit view ──────────────────────────────────────────────────────────────
  fitView: (options?: FitViewOptions) => void;

  // ── Edge editing ──────────────────────────────────────────────────────────
  editingEdgeId: string | null;
  setEditingEdgeId: (id: string | null) => void;
  pendingEditEdgeId: string | null;
  setPendingEditEdgeId: (id: string | null) => void;
  pendingLabelEdgeId: string | null;
  setPendingLabelEdgeId: (id: string | null) => void;
  
  updateEdgeLabel: (edgeId: string, label: string) => void;

  // ── AI Streaming (real-time canvas building) ──────────────────────────────
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  appendNode: (node: Node) => void;
  appendEdge: (edge: Edge) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCanvas(name: string): CanvasTab {
  return { id: `canvas-${Date.now()}-${Math.random().toString(36).slice(2)}`, name, nodes: [], edges: [], updatedAt: Date.now() };
}

const INITIAL_CANVAS = makeCanvas('Elephant');

function syncActiveCanvas(
  canvases: CanvasTab[],
  activeCanvasId: string,
  nodes: Node[],
  edges: Edge[]
): CanvasTab[] {
  return canvases.map((c) =>
    c.id === activeCanvasId ? { ...c, nodes, edges, updatedAt: Date.now() } : c
  );
}

// ── Debounced DB save (module-level so it's shared across calls) ──────────────
const _debouncedSave = debounce(async (canvasId: string, get: () => DiagramState) => {
  if (!isSupabaseConfigured) return;
  const state = get();
  if (!state.userProfile) return;
  const canvas = state.canvases.find((c) => c.id === canvasId);
  if (!canvas) return;
  state.setSavingState('saving');
  try {
    const supabase = getSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('user_canvases').upsert({
      id: canvasId,
      user_id: state.userProfile.id,
      name: canvas.name,
      nodes: canvas.nodes,
      edges: canvas.edges,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    state.setSavingState('saved');
    // Reset to idle after 2s
    setTimeout(() => {
      if (get().savingState === 'saved') get().setSavingState('idle');
    }, 2000);
  } catch {
    state.setSavingState('idle');
  }
}, 1500);

// ── Store ─────────────────────────────────────────────────────────────────────

export const useDiagramStore = create<DiagramState>()(
  persist(
    (set, get) => ({
      // ── Multi-canvas ───────────────────────────────────────────────────────
      canvases: [{ ...INITIAL_CANVAS, isOpen: true, lastAccessedAt: Date.now() }],
      activeCanvasId: INITIAL_CANVAS.id,
      openCanvasIds: [INITIAL_CANVAS.id],
      nodes: [],
      edges: [],

      getRandomAnimalName: () => {
        const animals = ['Elephant', 'Lion', 'Panda', 'Tiger', 'Falcon', 'Shark', 'Wolf', 'Fox', 'Bear', 'Eagle', 'Owl', 'Hawk', 'Dolphin', 'Penguin', 'Zebra', 'Giraffe', 'Leopard', 'Jaguar', 'Panther', 'Cheetah'];
        const usedNames = get().canvases.map(c => c.name);
        const available = animals.filter(a => !usedNames.includes(a));
        if (available.length > 0) {
          return available[Math.floor(Math.random() * available.length)];
        }
        const baseAnimal = animals[Math.floor(Math.random() * animals.length)];
        let counter = 1;
        while (usedNames.includes(`${baseAnimal} ${counter}`)) {
          counter++;
        }
        return `${baseAnimal} ${counter}`;
      },

      addCanvas: (customName?: string) => {
        const { canvases, openCanvasIds, getRandomAnimalName } = get();
        
        let baseName = customName || getRandomAnimalName();
        let newName = baseName;
        const existingNames = new Set(canvases.map(c => c.name));
        
        let counter = 1;
        while (existingNames.has(newName)) {
          counter++;
          newName = `${baseName} ${counter}`;
        }
        
        const newCanvas = makeCanvas(newName);
        const canvasWithMeta = { ...newCanvas, isOpen: true, lastAccessedAt: Date.now() };
        const newOpenIds = [...openCanvasIds, newCanvas.id];
        set({ 
          canvases: [...canvases, canvasWithMeta], 
          openCanvasIds: newOpenIds,
          activeCanvasId: newCanvas.id, 
          nodes: [], 
          edges: [], 
          past: [], 
          future: [] 
        });
        return newCanvas.id;
      },

      removeCanvas: (id) => {
        const { canvases, activeCanvasId, openCanvasIds } = get();
        if (canvases.length <= 1) return;
        const idx = canvases.findIndex((c) => c.id === id);
        const next = canvases.filter((c) => c.id !== id);
        const newOpenIds = openCanvasIds.filter((cid) => cid !== id);
        
        let nextActiveId = activeCanvasId;
        if (activeCanvasId === id) {
          const newIdx = Math.max(0, idx - 1);
          nextActiveId = next[newIdx]?.id || next[0]?.id;
        }
        const active = next.find((c) => c.id === nextActiveId);
        set({ 
          canvases: next, 
          openCanvasIds: newOpenIds,
          activeCanvasId: nextActiveId, 
          nodes: active?.nodes || [], 
          edges: active?.edges || [], 
          past: [], 
          future: [] 
        });
      },

      switchCanvas: (id) => {
        const { canvases, activeCanvasId, nodes, edges, openCanvasIds } = get();
        if (id === activeCanvasId) return;
        
        const saved = syncActiveCanvas(canvases, activeCanvasId, nodes, edges);
        const target = saved.find((c) => c.id === id);
        
        if (!target) return;
        
        let newOpenIds = openCanvasIds;
        if (!openCanvasIds.includes(id)) {
          newOpenIds = [...openCanvasIds, id];
        }
        
        const updatedCanvases = saved.map((c) => {
          if (c.id === id) {
            return { ...c, lastAccessedAt: Date.now() };
          }
          return c;
        });
        
        set({ 
          canvases: updatedCanvases, 
          openCanvasIds: newOpenIds,
          activeCanvasId: id, 
          nodes: target.nodes, 
          edges: target.edges, 
          past: [], 
          future: [], 
          selectedNodeId: null, 
          selectedEdgeId: null 
        });
        setTimeout(() => get().fitView(), 80);
      },

      renameCanvas: (id, name) => {
        const canvases = get().canvases.map((c) => c.id === id ? { ...c, name, updatedAt: Date.now() } : c);
        set({ canvases });
        get().saveCanvasToDB(id);
      },

      openCanvas: (id) => {
        const { canvases, activeCanvasId, openCanvasIds, nodes, edges } = get();
        const isAlreadyOpen = openCanvasIds.includes(id);
        
        const saved = syncActiveCanvas(canvases, activeCanvasId, nodes, edges);
        const target = saved.find((c) => c.id === id);
        
        if (!target) return;
        
        let newOpenIds: string[];
        if (isAlreadyOpen) {
          newOpenIds = openCanvasIds;
        } else {
          newOpenIds = [...openCanvasIds, id];
        }
        
        const updatedCanvases = saved.map((c) => {
          if (c.id === id) {
            return { ...c, isOpen: true, lastAccessedAt: Date.now() };
          }
          return c;
        });
        
        set({ 
          canvases: updatedCanvases, 
          openCanvasIds: newOpenIds,
          activeCanvasId: id,
          nodes: target.nodes,
          edges: target.edges,
          past: [],
          future: [],
          selectedNodeId: null,
          selectedEdgeId: null,
        });
        setTimeout(() => get().fitView(), 80);
      },

      closeCanvas: (id) => {
        const { canvases, activeCanvasId, openCanvasIds, nodes, edges } = get();
        
        if (openCanvasIds.length <= 1) return;
        
        const idx = openCanvasIds.indexOf(id);
        const newOpenIds = openCanvasIds.filter((cid) => cid !== id);
        
        let nextActiveId = activeCanvasId;
        if (activeCanvasId === id) {
          const newIdx = Math.max(0, idx - 1);
          nextActiveId = newOpenIds[newIdx] || newOpenIds[0];
        }
        
        const saved = syncActiveCanvas(canvases, activeCanvasId, nodes, edges);
        const nextActive = saved.find((c) => c.id === nextActiveId);
        
        const updatedCanvases = saved.map((c) => {
          if (c.id === id) {
            return { ...c, isOpen: false };
          }
          return c;
        });
        
        set({ 
          canvases: updatedCanvases,
          openCanvasIds: newOpenIds,
          activeCanvasId: nextActiveId,
          nodes: nextActive?.nodes || [],
          edges: nextActive?.edges || [],
          past: [],
          future: [],
        });
      },

      togglePinCanvas: (id) => {
        const canvases = get().canvases.map((c) => 
          c.id === id ? { ...c, isPinned: !c.isPinned } : c
        );
        set({ canvases });
      },

      getOpenCanvases: () => {
        const { canvases, openCanvasIds } = get();
        return openCanvasIds
          .map((id) => canvases.find((c) => c.id === id))
          .filter((c): c is CanvasTab => c !== undefined);
      },

      getVisibleCanvases: () => {
        const { canvases, activeCanvasId, openCanvasIds } = get();
        const MAX_VISIBLE = 3;
        
        // Get open canvases in order of openCanvasIds
        const openCanvases = openCanvasIds
          .map((id) => canvases.find((c) => c.id === id))
          .filter((c): c is CanvasTab => c !== undefined);
        
        if (openCanvases.length <= MAX_VISIBLE) {
          return openCanvases;
        }
        
        // Separate active, pinned, and other canvases
        const activeCanvas = openCanvases.find((c) => c.id === activeCanvasId);
        const pinned = openCanvases.filter((c) => c.isPinned && c.id !== activeCanvasId);
        const other = openCanvases.filter((c) => !c.isPinned && c.id !== activeCanvasId);
        
        // Build visible list: active first, then pinned, then others
        const visible: CanvasTab[] = [];
        
        // 1. Always include active canvas first
        if (activeCanvas) {
          visible.push(activeCanvas);
        }
        
        // 2. Add pinned canvases (up to remaining slots)
        const remainingSlots = MAX_VISIBLE - visible.length;
        for (const c of pinned) {
          if (visible.length >= MAX_VISIBLE) break;
          visible.push(c);
        }
        
        // 3. Add other canvases by last accessed time
        const sortedOther = [...other].sort((a, b) => (b.lastAccessedAt || 0) - (a.lastAccessedAt || 0));
        for (const c of sortedOther) {
          if (visible.length >= MAX_VISIBLE) break;
          visible.push(c);
        }
        
        return visible;
      },

      getOverflowCanvases: () => {
        const { canvases, activeCanvasId, openCanvasIds } = get();
        const MAX_VISIBLE = 3;
        
        // Get open canvases in order of openCanvasIds
        const openCanvases = openCanvasIds
          .map((id) => canvases.find((c) => c.id === id))
          .filter((c): c is CanvasTab => c !== undefined);
        
        if (openCanvases.length <= MAX_VISIBLE) {
          return [];
        }
        
        const visible = get().getVisibleCanvases();
        const visibleIds = new Set(visible.map((c) => c.id));
        
        // Return overflow: open canvases not in visible
        return openCanvases.filter((c) => !visibleIds.has(c.id));
      },

      // ── User / Auth ────────────────────────────────────────────────────────
      userProfile: null,
      setUserProfile: (profile) => set({ userProfile: profile }),
      savingState: 'idle',
      setSavingState: (s) => set({ savingState: s }),

      loadCanvasesFromDB: async () => {
        if (!isSupabaseConfigured) return;
        const { activeCanvasId } = get();
        try {
          const supabase = getSupabaseClient();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data } = await (supabase as any)
            .from('user_canvases')
            .select('*')
            .order('updated_at', { ascending: false });
          if (data && data.length > 0) {
            const canvases: CanvasTab[] = data.map((d: { id: string; name: string; nodes: Node[]; edges: Edge[]; updated_at: string }) => ({
              id: d.id,
              name: d.name,
              nodes: d.nodes ?? [],
              edges: d.edges ?? [],
              updatedAt: new Date(d.updated_at).getTime(),
              isOpen: true,
              lastAccessedAt: new Date(d.updated_at).getTime(),
            }));
            const openIds = canvases.map((c) => c.id);
            const targetCanvas = canvases.find((c) => c.id === activeCanvasId) || canvases[0];
            set({ canvases, openCanvasIds: openIds, activeCanvasId: targetCanvas.id, nodes: targetCanvas.nodes, edges: targetCanvas.edges });
          }
        } catch {
          // silently fail — guest fallback
        }
      },

      saveCanvasToDB: (canvasId) => {
        _debouncedSave(canvasId, get);
      },

      // ── Selection ──────────────────────────────────────────────────────────
      selectedNodeId: null,
      selectedNodeIds: [],
      selectedEdgeId: null,
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),
      setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),
      setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),

      // ── UI state ───────────────────────────────────────────────────────────
      guideLines: [],
      edgeAnimations: true,
      showGrid: true,
      darkMode: true,
      sidebarOpen: true,
      canvasMode: 'empty',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setGuideLines: (lines) => set({ guideLines: lines }),
      setCanvasMode: (mode) => set({ canvasMode: mode }),
      toggleGrid: () => set({ showGrid: !get().showGrid }),
      toggleDarkMode: () => {
        const next = !get().darkMode;
        set({ darkMode: next });
      },
      toggleEdgeAnimations: () => {
        const next = !get().edgeAnimations;
        const edges = get().edges.map((e) => ({ ...e, animated: next }));
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, get().nodes, edges);
        set({ edgeAnimations: next, edges, canvases });
      },

      // ── History ────────────────────────────────────────────────────────────
      past: [],
      future: [],
      pushHistory: () => {
        const { nodes, edges, past } = get();
        set({ past: [...past.slice(-30), { nodes, edges }], future: [] });
      },
      undo: () => {
        const { past, nodes, edges, future, activeCanvasId, canvases } = get();
        if (!past.length) return;
        const prev = past[past.length - 1];
        const newCanvases = syncActiveCanvas(canvases, activeCanvasId, prev.nodes, prev.edges);
        set({ past: past.slice(0, -1), future: [{ nodes, edges }, ...future], nodes: prev.nodes, edges: prev.edges, canvases: newCanvases });
      },
      redo: () => {
        const { future, nodes, edges, past, activeCanvasId, canvases } = get();
        if (!future.length) return;
        const next = future[0];
        const newCanvases = syncActiveCanvas(canvases, activeCanvasId, next.nodes, next.edges);
        set({ future: future.slice(1), past: [...past, { nodes, edges }], nodes: next.nodes, edges: next.edges, canvases: newCanvases });
      },

      // ── Node/edge operations ───────────────────────────────────────────────
      onNodesChange: (changes) => {
        const structural = changes.filter((c) => c.type === 'add' || c.type === 'remove');
        if (structural.length) get().pushHistory();
        const nodes = applyNodeChanges(changes, get().nodes);
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, nodes, get().edges);
        set({ nodes, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      onEdgesChange: (changes) => {
        const structural = changes.filter((c) => c.type === 'remove');
        if (structural.length) get().pushHistory();
        const edges = applyEdgeChanges(changes, get().edges);
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, get().nodes, edges);
        set({ edges, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      onConnect: (connection) => {
        const sourceNode = get().nodes.find(n => n.id === connection.source);
        const targetNode = get().nodes.find(n => n.id === connection.target);
        let connectionValidation = null;
        
        if (sourceNode && targetNode) {
          const sourceType = sourceNode.data.componentType;
          const targetType = targetNode.data.componentType;
          
          if (sourceType && targetType) {
            connectionValidation = validateStrictConnection(sourceType, targetType);
            
            if (!connectionValidation.allowed) {
              console.warn(`Connection blocked: ${connectionValidation.reason}`);
              return;
            }
          }
        }
        
        get().pushHistory();
        const edgeId = `edge-${Date.now()}`;
        const edges = addEdge(
          { 
            ...connection, 
            id: edgeId, 
            type: 'custom',
            data: { 
              edgeType: DEFAULT_EDGE_TYPE as EdgeType,
              validation: connectionValidation ?? null,
            },
          },
          get().edges
        );
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, get().nodes, edges);
        set({ edges, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      addNode: (type, label, category, color, icon, technology, position) => {
        get().pushHistory();
        
        let newNode: Node<NodeData>;
        
        // Check if first arg is a pre-built node (from factory)
        if (typeof type === 'object' && 'id' in type && 'data' in type) {
          newNode = type as Node<NodeData>;
        } else {
          // Legacy path - construct node manually (should be deprecated)
          const id = `${type}-${Date.now()}`;
          const pos = position ?? { x: 400 + Math.random() * 200 - 100, y: 300 + Math.random() * 200 - 100 };
          const shape = getNodeShape(category || 'Compute');
          
          let componentType = type;
          try {
            getStrictPortConfig(type);
          } catch {
            componentType = (category || 'compute').toLowerCase().replace(/[^a-z0-9]/g, '_');
          }
          
          newNode = { 
            id, 
            type: 'baseNode', 
            position: pos, 
            data: { 
              label: label || type, 
              category: category || 'Compute', 
              color, 
              icon, 
              technology, 
              shape, 
              componentType 
            } 
          };
        }
        
        const nodes = [...get().nodes, newNode];
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, nodes, get().edges);
        set({ nodes, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      removeNode: (id) => {
        get().pushHistory();
        const nodes = get().nodes.filter((n) => n.id !== id);
        const edges = get().edges.filter((e) => e.source !== id && e.target !== id);
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, nodes, edges);
        set({ nodes, edges, canvases, selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      updateNodeData: (id, data) => {
        const nodes = get().nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, ...data } } : n);
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, nodes, get().edges);
        set({ nodes, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      updateEdgeData: (id, data) => {
        const edges = get().edges.map((e) => e.id === id ? { ...e, data: { ...e.data, ...data } } : e);
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, get().nodes, edges);
        set({ edges, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      deleteEdge: (edgeId) => {
        get().pushHistory();
        const edges = get().edges.filter((e) => e.id !== edgeId);
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, get().nodes, edges);
        set({ edges, canvases, selectedEdgeId: null });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      importDiagram: (nodes, edges) => {
        get().pushHistory();
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, nodes, edges);
        set({ nodes, edges, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      clearDiagram: () => {
        get().pushHistory();
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, [], []);
        set({ nodes: [], edges: [], canvases, selectedNodeId: null });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      deleteSelected: () => {
        const { selectedNodeId, removeNode } = get();
        if (selectedNodeId) removeNode(selectedNodeId);
      },

      selectAll: () => set({ selectedNodeId: null }),

      createGroup: () => {
        const { nodes, selectedNodeIds, pushHistory, activeCanvasId, canvases, edges } = get();
        if (selectedNodeIds.length < 2) return;
        pushHistory();
        const PAD = 24;
        const selected = nodes.filter((n) => selectedNodeIds.includes(n.id));
        const minX = Math.min(...selected.map((n) => n.position.x)) - PAD;
        const minY = Math.min(...selected.map((n) => n.position.y)) - PAD;
        const maxX = Math.max(...selected.map((n) => n.position.x + (n.width ?? 160))) + PAD;
        const maxY = Math.max(...selected.map((n) => n.position.y + (n.height ?? 80))) + PAD;
        const groupId = `group-${Date.now()}`;
        const groupNode: Node = {
          id: groupId, type: 'groupNode',
          position: { x: minX, y: minY },
          style: { width: maxX - minX, height: maxY - minY },
          data: { label: 'Group' }, zIndex: -1,
        };
        const newNodes = [groupNode, ...nodes.map((n) =>
          selectedNodeIds.includes(n.id)
            ? { ...n, parentId: groupId, extent: 'parent' as const, position: { x: n.position.x - minX, y: n.position.y - minY } }
            : n
        )];
        const newCanvases = syncActiveCanvas(canvases, activeCanvasId, newNodes, edges);
        set({ nodes: newNodes, canvases: newCanvases, selectedNodeIds: [] });
        get().saveCanvasToDB(activeCanvasId);
      },

      loadTemplate: (nodes, edges) => {
        get().pushHistory();
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, nodes, edges);
        set({ nodes, edges, canvases, selectedNodeId: null, selectedEdgeId: null });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      // ── Fit view ───────────────────────────────────────────────────────────
      fitView: (opts) => {
        fitViewCallback?.(opts ?? { padding: 0.1, duration: 400 });
      },

      // ── Edge editing ───────────────────────────────────────────────────────
      editingEdgeId: null,
      setEditingEdgeId: (id) => set({ editingEdgeId: id }),
      pendingEditEdgeId: null,
      setPendingEditEdgeId: (id) => set({ pendingEditEdgeId: id }),
      pendingLabelEdgeId: null,
      setPendingLabelEdgeId: (id) => set({ pendingLabelEdgeId: id }),
      
      updateEdgeLabel: (edgeId, label) => {
        const edges = get().edges.map((e) =>
          e.id === edgeId ? { ...e, data: { ...e.data, label: label.trim() } } : e
        );
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, get().nodes, edges);
        set({ edges, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },

      // ── AI Streaming ──────────────────────────────────────────────────────
      setNodes: (nodes) => {
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, nodes, get().edges);
        set({ nodes, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },
      setEdges: (edges) => {
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, get().nodes, edges);
        set({ edges, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },
      appendNode: (node) => {
        const nodes = [...get().nodes, node];
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, nodes, get().edges);
        set({ nodes, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },
      appendEdge: (edge) => {
        const edges = [...get().edges, edge];
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, get().nodes, edges);
        set({ edges, canvases });
        get().saveCanvasToDB(get().activeCanvasId);
      },
    }),
    {
      name: 'archdraw-storage',
      storage: createJSONStorage(() => serializedStorage),
      partialize: (s) => ({
        canvases: s.canvases,
        activeCanvasId: s.activeCanvasId,
        nodes: s.nodes,
        edges: s.edges,
        darkMode: s.darkMode,
        edgeAnimations: s.edgeAnimations,
        showGrid: s.showGrid,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.canvases && state.activeCanvasId) {
          const active = state.canvases.find((c: CanvasTab) => c.id === state.activeCanvasId);
          if (active) {
            state.nodes = active.nodes;
            state.edges = active.edges.map((e: Edge) => ({ ...e, type: 'custom' }));
            state.canvases = state.canvases.map(c => ({
              ...c,
              edges: c.edges.map((e: Edge) => ({ ...e, type: 'custom' }))
            }));
          }
        }
      },
    }
  )
);
