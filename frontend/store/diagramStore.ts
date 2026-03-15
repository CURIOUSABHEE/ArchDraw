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
  // Section 5 — accent color override
  accentColor?: string;
  // Section 6 — technology id for brand icon lookup
  technology?: string;
}

interface HistoryEntry {
  nodes: Node[];
  edges: Edge[];
}

interface DiagramState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  guideLines: GuideLine[];
  edgeAnimations: boolean;
  showGrid: boolean;
  darkMode: boolean;
  // history
  past: HistoryEntry[];
  future: HistoryEntry[];

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: string, label: string, category: string, color?: string, icon?: string, technology?: string) => void;
  removeNode: (id: string) => void;
  updateNodeData: (id: string, data: Partial<NodeData>) => void;
  importDiagram: (nodes: Node[], edges: Edge[]) => void;
  clearDiagram: () => void;
  setSelectedNodeId: (id: string | null) => void;
  setGuideLines: (lines: GuideLine[]) => void;
  toggleEdgeAnimations: () => void;
  toggleGrid: () => void;
  toggleDarkMode: () => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  deleteSelected: () => void;
  selectAll: () => void;
  // Section 2 — group nodes
  selectedNodeIds: string[];
  setSelectedNodeIds: (ids: string[]) => void;
  createGroup: () => void;
  // Section 4 — edge enhancements
  selectedEdgeId: string | null;
  setSelectedEdgeId: (id: string | null) => void;
  updateEdgeData: (id: string, data: Record<string, unknown>) => void;
  // Fit view — callback registered by Canvas, called by Toolbar
  fitViewFn: (() => void) | null;
  registerFitView: (fn: () => void) => void;
  fitView: () => void;
  // Inline edge label editing
  editingEdgeId: string | null;
  setEditingEdgeId: (id: string | null) => void;
}

export const useDiagramStore = create<DiagramState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      guideLines: [],

      setGuideLines: (lines) => set({ guideLines: lines }),
      edgeAnimations: true,
      showGrid: true,
      darkMode: false,
      past: [],
      future: [],

      pushHistory: () => {
        const { nodes, edges, past } = get();
        set({ past: [...past.slice(-30), { nodes, edges }], future: [] });
      },

      undo: () => {
        const { past, nodes, edges, future } = get();
        if (!past.length) return;
        const prev = past[past.length - 1];
        set({
          past: past.slice(0, -1),
          future: [{ nodes, edges }, ...future],
          nodes: prev.nodes,
          edges: prev.edges,
        });
      },

      redo: () => {
        const { future, nodes, edges, past } = get();
        if (!future.length) return;
        const next = future[0];
        set({
          future: future.slice(1),
          past: [...past, { nodes, edges }],
          nodes: next.nodes,
          edges: next.edges,
        });
      },

      onNodesChange: (changes) => {
        // Push history when nodes are added or removed (not on every drag/select)
        const structural = changes.filter((c) => c.type === 'add' || c.type === 'remove');
        if (structural.length) get().pushHistory();
        set({ nodes: applyNodeChanges(changes, get().nodes) });
      },

      onEdgesChange: (changes) => {
        // Push history when edges are removed
        const structural = changes.filter((c) => c.type === 'remove');
        if (structural.length) get().pushHistory();
        set({ edges: applyEdgeChanges(changes, get().edges) });
      },

      onConnect: (connection) => {
        get().pushHistory();
        set({
          edges: addEdge(
            {
              ...connection,
              animated: get().edgeAnimations,
              type: 'smoothstep',
              style: { stroke: '#94a3b8', strokeWidth: 2 },
              markerEnd: { type: 'arrowclosed' as any, color: '#94a3b8' },
            },
            get().edges
          ),
        });
      },

      addNode: (type, label, category, color, icon, technology) => {
        get().pushHistory();
        const id = `${type}-${Date.now()}`;
        const offsetX = Math.random() * 200 - 100;
        const offsetY = Math.random() * 200 - 100;
        const newNode: Node<NodeData> = {
          id,
          type: 'systemNode',
          position: { x: 400 + offsetX, y: 300 + offsetY },
          data: { label, category, color, icon, technology },
        };
        set({ nodes: [...get().nodes, newNode] });
      },

      removeNode: (id) => {
        get().pushHistory();
        set({
          nodes: get().nodes.filter((n) => n.id !== id),
          edges: get().edges.filter((e) => e.source !== id && e.target !== id),
          selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
        });
      },

      updateNodeData: (id, data) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, ...data } } : n
          ),
        });
      },

      deleteSelected: () => {
        const { selectedNodeId, removeNode } = get();
        if (selectedNodeId) removeNode(selectedNodeId);
      },

      selectAll: () => {
        // React Flow handles multi-select; we just clear our single selection
        set({ selectedNodeId: null });
      },

      importDiagram: (nodes, edges) => {
        get().pushHistory();
        set({ nodes, edges });
      },

      clearDiagram: () => {
        get().pushHistory();
        set({ nodes: [], edges: [], selectedNodeId: null });
      },

      setSelectedNodeId: (id) => set({ selectedNodeId: id }),

      // Section 2 — group nodes
      selectedNodeIds: [],
      setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),
      createGroup: () => {
        const { nodes, selectedNodeIds, pushHistory } = get();
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
          id: groupId,
          type: 'groupNode',
          position: { x: minX, y: minY },
          style: { width: maxX - minX, height: maxY - minY },
          data: { label: 'Group' },
          zIndex: -1,
        };
        const updatedChildren = nodes.map((n) =>
          selectedNodeIds.includes(n.id)
            ? {
              ...n,
              parentId: groupId,
              extent: 'parent' as const,
              position: { x: n.position.x - minX, y: n.position.y - minY },
            }
            : n
        );
        set({ nodes: [groupNode, ...updatedChildren], selectedNodeIds: [] });
      },

      // Section 4 — edge enhancements
      selectedEdgeId: null,
      setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),
      updateEdgeData: (id, data) => {
        set({
          edges: get().edges.map((e) =>
            e.id === id ? { ...e, data: { ...e.data, ...data } } : e
          ),
        });
      },

      // Fit view
      fitViewFn: null,
      registerFitView: (fn) => set({ fitViewFn: fn }),
      fitView: () => get().fitViewFn?.(),

      // Inline edge label editing
      editingEdgeId: null,
      setEditingEdgeId: (id) => set({ editingEdgeId: id }),

      toggleEdgeAnimations: () => {
        const next = !get().edgeAnimations;
        set({
          edgeAnimations: next,
          edges: get().edges.map((e) => ({ ...e, animated: next })),
        });
      },
      toggleGrid: () => set({ showGrid: !get().showGrid }),
      toggleDarkMode: () => {
        const next = !get().darkMode;
        set({ darkMode: next });
        document.documentElement.classList.toggle('dark', next);
      },
    }),
    {
      name: 'archdraw-storage',
      partialize: (s) => ({
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
      },
    }
  )
);
