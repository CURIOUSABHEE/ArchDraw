import type { ReactFlowNode, ReactFlowEdge } from '../types/index.js';

export interface DiagramState {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
}

let currentDiagramState: DiagramState | null = null;

export function getDiagramState(): DiagramState {
  if (!currentDiagramState) {
    return { nodes: [], edges: [] };
  }
  return {
    nodes: currentDiagramState.nodes,
    edges: currentDiagramState.edges,
  };
}

export function setDiagramState(state: DiagramState): void {
  currentDiagramState = {
    nodes: [...state.nodes],
    edges: [...state.edges],
  };
}

export function hasDiagramState(): boolean {
  return currentDiagramState !== null;
}
