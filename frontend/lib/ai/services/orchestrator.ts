import type { UserIntent, GenerationResult, GenerationProgress, ReactFlowNode, ReactFlowEdge } from '../types';
import { runMermaidPipeline } from '../pipeline/mermaid-pipeline';
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

    const result = await runMermaidPipeline(userIntent, (step, progress) => {
      onProgress?.({
        phase: progress >= 100 ? 'complete' : phaseForStep(step),
        iteration: 0,
        currentAgent: step,
        score: 0,
        message: step,
        progress,
      });
    });

    if (!result.success) {
      throw new GenerationFailedError(result.state.errors.at(-1)?.message || 'generation_failed');
    }

    logger.log('[Orchestrator] Generation complete. Score:', result.score);

    const qualityWarnings = [
      ...(result.diagnostics?.semanticIssues.map((i: any) => i.message) ?? []),
      ...(result.diagnostics?.mechanicalRepairs.map((i: any) => i.message) ?? []),
    ];

    return {
      type: 'architecture',
      nodes: result.nodes as ReactFlowNode[],
      edges: result.edges as unknown as ReactFlowEdge[],
      metadata: {
        totalNodes: result.nodes.length,
        totalEdges: result.edges.length,
        systemType: 'architecture',
        generatedAt: new Date().toISOString(),
        score: result.score,
        grade: (result.diagramScore?.grade === 'F' ? 'D' : result.diagramScore?.grade || 'D') as 'A' | 'B' | 'C' | 'D',
        qualityWarnings: qualityWarnings.length > 0 ? qualityWarnings : undefined,
        pipelineDiagnostics: result.diagnostics,
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

export class GenerationFailedError extends Error {
  code = 'generation_failed' as const;

  constructor(details: string) {
    super(details);
    this.name = 'GenerationFailedError';
  }
}

function phaseForStep(step: string): GenerationProgress['phase'] {
  const lower = step.toLowerCase();
  if (lower.includes('reason')) return 'reasoning';
  if (lower.includes('layout')) return 'layout';
  if (lower.includes('edge') || lower.includes('connect')) return 'edges';
  if (lower.includes('validat') || lower.includes('repair')) return 'validating';
  if (lower.includes('scor')) return 'scoring';
  if (lower.includes('generat') || lower.includes('enrich')) return 'generating';
  return 'planning';
}
