import { create } from 'zustand';
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

/** Diagram state managed by Zustand — single source of truth for canvas */
interface DiagramState {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: string, label: string, category: string) => void;
  removeNode: (id: string) => void;
  importDiagram: (nodes: Node[], edges: Edge[]) => void;
  clearDiagram: () => void;
}

export const useDiagramStore = create<DiagramState>((set, get) => ({
  nodes: [],
  edges: [],

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(
        {
          ...connection,
          animated: true,
          type: 'smoothstep',
          style: { stroke: '#94a3b8', strokeWidth: 2 },
          markerEnd: { type: 'arrowclosed' as any, color: '#94a3b8' },
        },
        get().edges
      ),
    });
  },

  /** Add a new node at a slightly randomized center position */
  addNode: (type, label, category) => {
    const id = `${type}-${Date.now()}`;
    const offsetX = Math.random() * 200 - 100;
    const offsetY = Math.random() * 200 - 100;
    const newNode: Node = {
      id,
      type: 'systemNode',
      position: { x: 400 + offsetX, y: 300 + offsetY },
      data: { label, category },
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  removeNode: (id) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
    });
  },

  /** Import a previously exported diagram */
  importDiagram: (nodes, edges) => set({ nodes, edges }),

  clearDiagram: () => set({ nodes: [], edges: [] }),
}));
