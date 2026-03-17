import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

export interface GuideLine {
  orientation: 'h' | 'v';
  position: number;
  spacingArrows?: { from: number; to: number };
}

export interface NodeData {
  label: string;
  category: string;
  color?: string;
  icon?: string;
  description?: string;
  tech?: string;
  hasError?: boolean;
  accentColor?: string;
  technology?: string;
}

export interface CanvasTab {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
}

interface HistoryEntry {
  nodes: Node[];
  edges: Edge[];
}

interface DiagramState {
  // ── Multi-canvas ──────────────────────────────────────────────────────────
  canvases: CanvasTab[];
  activeCanvasId: string;
  // Active canvas nodes/edges (derived, kept in sync for ReactFlow)
  nodes: Node[];
  edges: Edge[];

  addCanvas: () => void;
  removeCanvas: (id: string) => void;
  switchCanvas: (id: string) => void;
  renameCanvas: (id: string, name: string) => void;

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
  setGuideLines: (lines: GuideLine[]) => void;
  toggleEdgeAnimations: () => void;
  toggleGrid: () => void;
  toggleDarkMode: () => void;

  // ── History ───────────────────────────────────────────────────────────────
  past: HistoryEntry[];
  future: HistoryEntry[];
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // ── Node/edge operations (all target active canvas) ───────────────────────
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: string, label: string, category: string, color?: string, icon?: string, technology?: string, position?: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  updateNodeData: (id: string, data: Partial<NodeData>) => void;
  updateEdgeData: (id: string, data: Record<string, unknown>) => void;
  importDiagram: (nodes: Node[], edges: Edge[]) => void;
  clearDiagram: () => void;
  deleteSelected: () => void;
  selectAll: () => void;
  createGroup: () => void;
  loadTemplate: (nodes: Node[], edges: Edge[]) => void;

  // ── Fit view ──────────────────────────────────────────────────────────────
  fitViewFn: (() => void) | null;
  registerFitView: (fn: () => void) => void;
  fitView: () => void;

  // ── Edge editing ──────────────────────────────────────────────────────────
  editingEdgeId: string | null;
  setEditingEdgeId: (id: string | null) => void;
  pendingEditEdgeId: string | null;
  setPendingEditEdgeId: (id: string | null) => void;
  pendingLabelEdgeId: string | null;
  setPendingLabelEdgeId: (id: string | null) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCanvas(name: string): CanvasTab {
  return { id: `canvas-${Date.now()}-${Math.random().toString(36).slice(2)}`, name, nodes: [], edges: [] };
}

const INITIAL_CANVAS = makeCanvas('Canvas 1');

/** Write nodes+edges back into the canvases array for the active canvas */
function syncActiveCanvas(
  canvases: CanvasTab[],
  activeCanvasId: string,
  nodes: Node[],
  edges: Edge[]
): CanvasTab[] {
  return canvases.map((c) => c.id === activeCanvasId ? { ...c, nodes, edges } : c);
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useDiagramStore = create<DiagramState>()(
  persist(
    (set, get) => ({
      // ── Multi-canvas initial state ─────────────────────────────────────────
      canvases: [INITIAL_CANVAS],
      activeCanvasId: INITIAL_CANVAS.id,
      nodes: [],
      edges: [],

      addCanvas: () => {
        const { canvases } = get();
        const newCanvas = makeCanvas(`Canvas ${canvases.length + 1}`);
        set({ canvases: [...canvases, newCanvas], activeCanvasId: newCanvas.id, nodes: [], edges: [], past: [], future: [] });
      },

      removeCanvas: (id) => {
        const { canvases, activeCanvasId } = get();
        if (canvases.length <= 1) return; // never close last tab
        const idx = canvases.findIndex((c) => c.id === id);
        const next = canvases.filter((c) => c.id !== id);
        let nextActiveId = activeCanvasId;
        if (activeCanvasId === id) {
          // switch to previous tab, or first if removing index 0
          const newIdx = Math.max(0, idx - 1);
          nextActiveId = next[newIdx].id;
        }
        const active = next.find((c) => c.id === nextActiveId)!;
        set({ canvases: next, activeCanvasId: nextActiveId, nodes: active.nodes, edges: active.edges, past: [], future: [] });
      },

      switchCanvas: (id) => {
        const { canvases, activeCanvasId, nodes, edges } = get();
        if (id === activeCanvasId) return;
        // Save current canvas state before switching
        const saved = syncActiveCanvas(canvases, activeCanvasId, nodes, edges);
        const target = saved.find((c) => c.id === id)!;
        set({ canvases: saved, activeCanvasId: id, nodes: target.nodes, edges: target.edges, past: [], future: [], selectedNodeId: null, selectedEdgeId: null });
        // fitView after switch
        setTimeout(() => get().fitViewFn?.(), 80);
      },

      renameCanvas: (id, name) => {
        set({ canvases: get().canvases.map((c) => c.id === id ? { ...c, name } : c) });
      },

      // ── Selection ───────────────────────────────────────────────────────────
      selectedNodeId: null,
      selectedNodeIds: [],
      selectedEdgeId: null,
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),
      setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),
      setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),

      // ── UI state ────────────────────────────────────────────────────────────
      guideLines: [],
      edgeAnimations: true,
      showGrid: true,
      darkMode: false,
      setGuideLines: (lines) => set({ guideLines: lines }),
      toggleGrid: () => set({ showGrid: !get().showGrid }),
      toggleDarkMode: () => {
        const next = !get().darkMode;
        set({ darkMode: next });
        document.documentElement.classList.toggle('dark', next);
      },
      toggleEdgeAnimations: () => {
        const next = !get().edgeAnimations;
        const edges = get().edges.map((e) => ({ ...e, animated: next }));
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, get().nodes, edges);
        set({ edgeAnimations: next, edges, canvases });
      },

      // ── History ─────────────────────────────────────────────────────────────
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

      // ── Node/edge operations ─────────────────────────────────────────────────
      onNodesChange: (changes) => {
        const structural = changes.filter((c) => c.type === 'add' || c.type === 'remove');
        if (structural.length) get().pushHistory();
        const nodes = applyNodeChanges(changes, get().nodes);
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, nodes, get().edges);
        set({ nodes, canvases });
      },

      onEdgesChange: (changes) => {
        const structural = changes.filter((c) => c.type === 'remove');
        if (structural.length) get().pushHistory();
        const edges = applyEdgeChanges(changes, get().edges);
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, get().nodes, edges);
        set({ edges, canvases });
      },

      onConnect: (connection) => {
        get().pushHistory();
        const edgeId = `edge-${Date.now()}`;
        const edges = addEdge(
          {
            ...connection,
            id: edgeId,
            type: 'default',
            animated: get().edgeAnimations,
            style: { stroke: '#94a3b8', strokeWidth: 1.5 },
          },
          get().edges
        );
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, get().nodes, edges);
        set({ edges, canvases, pendingLabelEdgeId: edgeId });
      },

      addNode: (type, label, category, color, icon, technology, position) => {
        get().pushHistory();
        const id = `${type}-${Date.now()}`;
        const pos = position ?? { x: 400 + Math.random() * 200 - 100, y: 300 + Math.random() * 200 - 100 };
        const newNode: Node<NodeData> = {
          id,
          type: 'systemNode',
          position: pos,
          data: { label, category, color, icon, technology },
        };
        const nodes = [...get().nodes, newNode];
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, nodes, get().edges);
        set({ nodes, canvases });
      },

      removeNode: (id) => {
        get().pushHistory();
        const nodes = get().nodes.filter((n) => n.id !== id);
        const edges = get().edges.filter((e) => e.source !== id && e.target !== id);
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, nodes, edges);
        set({ nodes, edges, canvases, selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId });
      },

      updateNodeData: (id, data) => {
        const nodes = get().nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, ...data } } : n);
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, nodes, get().edges);
        set({ nodes, canvases });
      },

      updateEdgeData: (id, data) => {
        const edges = get().edges.map((e) => e.id === id ? { ...e, data: { ...e.data, ...data } } : e);
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, get().nodes, edges);
        set({ edges, canvases });
      },

      importDiagram: (nodes, edges) => {
        get().pushHistory();
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, nodes, edges);
        set({ nodes, edges, canvases });
      },

      clearDiagram: () => {
        get().pushHistory();
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, [], []);
        set({ nodes: [], edges: [], canvases, selectedNodeId: null });
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
      },

      loadTemplate: (nodes, edges) => {
        get().pushHistory();
        const canvases = syncActiveCanvas(get().canvases, get().activeCanvasId, nodes, edges);
        set({ nodes, edges, canvases, selectedNodeId: null, selectedEdgeId: null });
      },

      // ── Fit view ─────────────────────────────────────────────────────────────
      fitViewFn: null,
      registerFitView: (fn) => set({ fitViewFn: fn }),
      fitView: () => get().fitViewFn?.(),

      // ── Edge editing ─────────────────────────────────────────────────────────
      editingEdgeId: null,
      setEditingEdgeId: (id) => set({ editingEdgeId: id }),
      pendingEditEdgeId: null,
      setPendingEditEdgeId: (id) => set({ pendingEditEdgeId: id }),
      pendingLabelEdgeId: null,
      setPendingLabelEdgeId: (id) => set({ pendingLabelEdgeId: id }),
    }),
    {
      name: 'archdraw-storage',
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
        if (state?.darkMode) {
          document.documentElement.classList.add('dark');
        }
        // Ensure nodes/edges are in sync with active canvas after rehydration
        if (state && state.canvases && state.activeCanvasId) {
          const active = state.canvases.find((c: CanvasTab) => c.id === state.activeCanvasId);
          if (active) {
            state.nodes = active.nodes;
            state.edges = active.edges;
          }
        }
      },
    }
  )
);
