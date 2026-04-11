export interface Checkpoint {
  name: string;
  description?: string;
  savedAt: string;
  state: {
    nodes: any[];
    edges: any[];
  };
}

const checkpoints = new Map<string, Checkpoint>();

export function saveCheckpoint(
  name: string,
  description: string | undefined,
  state: { nodes: any[]; edges: any[] }
): { success: boolean; name: string; savedAt: string; nodeCount: number; edgeCount: number; overwritten?: boolean } {
  const savedAt = new Date().toISOString();
  const overwritten = checkpoints.has(name);
  
  checkpoints.set(name, {
    name,
    description,
    savedAt,
    state: {
      nodes: JSON.parse(JSON.stringify(state.nodes)),
      edges: JSON.parse(JSON.stringify(state.edges)),
    },
  });

  return {
    success: true,
    name,
    savedAt,
    nodeCount: state.nodes.length,
    edgeCount: state.edges.length,
    overwritten,
  };
}

export function loadCheckpoint(name: string): {
  success: boolean;
  name?: string;
  restoredAt?: string;
  nodeCount?: number;
  edgeCount?: number;
  message?: string;
  availableCheckpoints?: Array<{ name: string; description?: string; savedAt: string; nodeCount: number; edgeCount: number }>;
  error?: string;
} {
  const checkpoint = checkpoints.get(name);
  
  if (!checkpoint) {
    return {
      success: false,
      error: `Checkpoint '${name}' not found`,
      availableCheckpoints: listCheckpoints(),
    };
  }

  const restoredAt = new Date().toISOString();
  return {
    success: true,
    name: checkpoint.name,
    restoredAt,
    nodeCount: checkpoint.state.nodes.length,
    edgeCount: checkpoint.state.edges.length,
    message: 'Diagram restored. Call get_diagram_state to view it.',
  };
}

export function getCheckpointState(name: string): { nodes: any[]; edges: any[] } | null {
  const checkpoint = checkpoints.get(name);
  return checkpoint ? {
    nodes: JSON.parse(JSON.stringify(checkpoint.state.nodes)),
    edges: JSON.parse(JSON.stringify(checkpoint.state.edges)),
  } : null;
}

export function listCheckpoints(): Array<{ name: string; description?: string; savedAt: string; nodeCount: number; edgeCount: number }> {
  return Array.from(checkpoints.values()).map(cp => ({
    name: cp.name,
    description: cp.description,
    savedAt: cp.savedAt,
    nodeCount: cp.state.nodes.length,
    edgeCount: cp.state.edges.length,
  }));
}
