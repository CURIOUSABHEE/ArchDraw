import type { Node, Edge } from 'reactflow';
import type { 
  CanvasEvent, 
  CanvasEventType,
  EventHandler,
  TutorialState,
} from './types';
import { createGraph, type ArchitectureGraph } from './graph';

export type CanvasEventListener = (
  event: CanvasEvent,
  graph: ArchitectureGraph
) => void;

export class EventBus {
  private listeners: Map<CanvasEventType, Set<CanvasEventListener>> = new Map();
  private globalListeners: Set<CanvasEventListener> = new Set();

  on(type: CanvasEventType, listener: CanvasEventListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);

    return () => this.off(type, listener);
  }

  off(type: CanvasEventType, listener: CanvasEventListener): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  onAny(listener: CanvasEventListener): () => void {
    this.globalListeners.add(listener);
    return () => this.globalListeners.delete(listener);
  }

  emit(event: CanvasEvent, graph: ArchitectureGraph): void {
    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      for (const listener of typeListeners) {
        try {
          listener(event, graph);
        } catch (error) {
          console.error(`[EventBus] Error in listener for ${event.type}:`, error);
        }
      }
    }

    for (const listener of this.globalListeners) {
      try {
        listener(event, graph);
      } catch (error) {
        console.error(`[EventBus] Error in global listener:`, error);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
    this.globalListeners.clear();
  }
}

export interface EventHandlers {
  onNodeAdded?: (nodeId: string, graph: ArchitectureGraph) => void;
  onNodeDeleted?: (nodeId: string, graph: ArchitectureGraph) => void;
  onNodeUpdated?: (nodeId: string, graph: ArchitectureGraph) => void;
  onEdgeCreated?: (sourceId: string, targetId: string, graph: ArchitectureGraph) => void;
  onEdgeDeleted?: (sourceId: string, targetId: string, graph: ArchitectureGraph) => void;
  onSelectionChanged?: (selectedIds: string[], graph: ArchitectureGraph) => void;
  onCanvasCleared?: (graph: ArchitectureGraph) => void;
}

export class CanvasEventEmitter {
  private eventBus: EventBus;
  private currentGraph: ArchitectureGraph;

  constructor() {
    this.eventBus = new EventBus();
    this.currentGraph = createGraph([], []);
  }

  updateGraph(nodes: Node[], edges: Edge[]): void {
    this.currentGraph = createGraph(nodes, edges);
  }

  getGraph(): ArchitectureGraph {
    return this.currentGraph;
  }

  emitNodeAdded(node: Node): void {
    this.updateGraph([node], []);
    const event: CanvasEvent = {
      type: 'node_added',
      timestamp: Date.now(),
      payload: { node },
    };
    this.eventBus.emit(event, this.currentGraph);
  }

  emitNodeDeleted(nodeId: string): void {
    const event: CanvasEvent = {
      type: 'node_deleted',
      timestamp: Date.now(),
      payload: { nodeId },
    };
    this.eventBus.emit(event, this.currentGraph);
  }

  emitNodeUpdated(nodeId: string): void {
    const event: CanvasEvent = {
      type: 'node_updated',
      timestamp: Date.now(),
      payload: { nodeId },
    };
    this.eventBus.emit(event, this.currentGraph);
  }

  emitEdgeCreated(edge: Edge): void {
    const event: CanvasEvent = {
      type: 'edge_created',
      timestamp: Date.now(),
      payload: { edge },
    };
    this.eventBus.emit(event, this.currentGraph);
  }

  emitEdgeDeleted(edgeId: string): void {
    const event: CanvasEvent = {
      type: 'edge_deleted',
      timestamp: Date.now(),
      payload: { edgeId },
    };
    this.eventBus.emit(event, this.currentGraph);
  }

  emitSelectionChanged(selectedIds: string[]): void {
    const event: CanvasEvent = {
      type: 'selection_changed',
      timestamp: Date.now(),
      payload: { selectedIds },
    };
    this.eventBus.emit(event, this.currentGraph);
  }

  emitCanvasCleared(): void {
    this.updateGraph([], []);
    const event: CanvasEvent = {
      type: 'canvas_cleared',
      timestamp: Date.now(),
      payload: {},
    };
    this.eventBus.emit(event, this.currentGraph);
  }

  on(type: CanvasEventType, listener: CanvasEventListener): () => void {
    return this.eventBus.on(type, listener);
  }

  onAny(listener: CanvasEventListener): () => void {
    return this.eventBus.onAny(listener);
  }

  clear(): void {
    this.eventBus.clear();
  }
}

export function createEventEmitter(): CanvasEventEmitter {
  return new CanvasEventEmitter();
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}
