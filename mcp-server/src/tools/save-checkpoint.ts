import type { SaveCheckpointInput } from '../lib/schema.js';
import { getDiagramState, hasDiagramState } from '../lib/diagram-state.js';
import { saveCheckpoint as saveCheckpointToStore } from '../lib/checkpoints.js';

export async function saveCheckpoint(input: SaveCheckpointInput): Promise<{
  success: boolean;
  name: string;
  savedAt: string;
  nodeCount: number;
  edgeCount: number;
  overwritten?: boolean;
  error?: string;
}> {
  if (!hasDiagramState()) {
    return {
      success: false,
      name: input.name,
      savedAt: '',
      nodeCount: 0,
      edgeCount: 0,
      error: 'No diagram to save. Call generate_diagram or apply_template first.',
    };
  }

  const state = getDiagramState();
  return saveCheckpointToStore(input.name, input.description, state);
}
