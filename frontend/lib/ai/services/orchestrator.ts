import type { UserIntent, GenerationResult, GenerationProgress, ReactFlowNode, ReactFlowEdge } from '../types';
import { generateDiagramPipeline } from '../pipeline';
import logger from '@/lib/logger';

export type ProgressCallback = (progress: GenerationProgress) => void;

/**
 * High-level orchestration for AI diagram generation.
 * Handles retries, cache, and progress updates.
 */
export async function generateDiagram(
  userIntent: UserIntent,
  onProgress?: ProgressCallback
): Promise<GenerationResult> {
  try {
    logger.log('[Orchestrator] Starting diagram generation:', userIntent.description);

    const result = await generateDiagramPipeline(
      userIntent.description,
      (event) => {
        if (event.type === 'thinking') {
          onProgress?.({
            phase: 'reasoning',
            iteration: 0,
            currentAgent: 'reasoning',
            score: 0,
            message: 'Reasoning about architecture...',
            progress: 20,
          });
        } else if (event.type === 'node') {
          onProgress?.({
            phase: 'generating',
            iteration: 0,
            currentAgent: 'diagram',
            score: 0,
            message: `Adding component: ${event.data && typeof event.data === 'object' && 'label' in event.data ? event.data.label : '...'}`,
            progress: 40,
          });
        } else if (event.type === 'flow') {
          onProgress?.({
            phase: 'generating',
            iteration: 0,
            currentAgent: 'diagram',
            score: 0,
            message: `Connecting services...`,
            progress: 60,
          });
        }
      },
      userIntent.existingContext,
      userIntent.diagramSize || 'medium'
    );

    logger.log('[Orchestrator] Generation complete. Score:', result.score.score);

    return {
      type: 'architecture',
      nodes: result.nodes as ReactFlowNode[],
      edges: result.edges as ReactFlowEdge[],
      metadata: {
        totalNodes: result.nodes.length,
        totalEdges: result.edges.length,
        systemType: 'architecture',
        generatedAt: new Date().toISOString(),
        score: result.score.score,
        grade: (result.score.grade === 'F' ? 'D' : result.score.grade) as 'A' | 'B' | 'C' | 'D',
      },
    };
  } catch (error) {
    logger.error('[Orchestrator] Generation failed:', error);
    onProgress?.({ 
      phase: 'error', 
      iteration: 0, 
      currentAgent: 'pipeline', 
      score: 0, 
      message: error instanceof Error ? error.message : 'Unknown error', 
      progress: 100 
    });
    throw error;
  }
}
