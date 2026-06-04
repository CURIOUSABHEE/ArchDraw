import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';

interface Canvas {
  id: string;
  nodes: any[];
}

interface DiagramState {
  canvases: Canvas[];
  activeCanvasId: string;
  nodes: any[];
  onNodesChange: (changes: any[]) => void;
}

function deriveNodesAndEdges(state: any) {
  if (!state) return state;
  return new Proxy(state, {
    get(target, prop, receiver) {
      if (prop === 'nodes') {
        const active = target.canvases?.find((c: any) => c.id === target.activeCanvasId);
        return active?.nodes || [];
      }
      return Reflect.get(target, prop, receiver);
    }
  });
}

// Typing the wrapper function correctly for Zustand with persist middleware
function wrapCreator(
  creator: StateCreator<DiagramState, [["zustand/persist", unknown]]>
): StateCreator<DiagramState, [["zustand/persist", unknown]]> {
  return (set, getRaw, api) => {
    const get = () => {
      return deriveNodesAndEdges(getRaw());
    };
    return creator(set, get, api);
  };
}

const useDiagramStoreRaw = create<DiagramState>()(
  persist(
    wrapCreator((set, get) => ({
      canvases: [
        { id: 'canvas-1', nodes: ['node-1-1', 'node-1-2'] },
      ],
      activeCanvasId: 'canvas-1',
      nodes: [],
      
      onNodesChange: (changes) => {
        // Verify type inference works and doesn't implicitly fallback to any
        console.log("onNodesChange called, nodes:", get().nodes);
      }
    })),
    {
      name: 'test-storage',
    }
  )
);

console.log("Compilation and execution succeeded!");
