import type { UserIntent, GenerationResult, GenerationProgress, ReactFlowNode, ReactFlowEdge } from '../types';
import { generateDiagramPipeline } from '../pipeline';
import logger from '@/lib/logger';

export type ProgressCallback = (progress: GenerationProgress) => void;

export interface StreamingEvent {
  type: 'node' | 'flow' | 'thinking' | 'complete' | 'error';
  data?: unknown;
}

export type StreamingCallback = (event: StreamingEvent) => void;

export async function generateDiagram(
  userIntent: UserIntent,
  onProgress?: ProgressCallback,
  onStreaming?: StreamingCallback
): Promise<GenerationResult> {
  try {
    onProgress?.({ 
      phase: 'planning', 
      iteration: 0, 
      currentAgent: 'pipeline', 
      score: 0, 
      message: 'Starting pipeline...', 
      progress: 5 
    });
    
    const result = await generateDiagramPipeline(
      userIntent.description,
      onStreaming
    );
    
    onProgress?.({ 
      phase: 'complete', 
      iteration: 0, 
      currentAgent: 'pipeline', 
      score: result.score.score, 
      message: 'Complete', 
      progress: 100 
    });
    
    // Map F grade to D for compatibility
    const gradeMap: Record<string, 'A' | 'B' | 'C' | 'D'> = {
      A: 'A',
      B: 'B', 
      C: 'C',
      F: 'D',
    };
    
    return {
      type: 'architecture',
      nodes: result.nodes as ReactFlowNode[],
      edges: result.edges as ReactFlowEdge[],
      metadata: {
        score: result.score.score,
        grade: gradeMap[result.score.grade] || 'D',
        iterations: 1,
        totalNodes: result.score.nodeCount,
        totalEdges: result.score.edgeCount,
        systemType: userIntent.systemType || 'unknown',
        generatedAt: new Date().toISOString(),
        qualityWarnings: [],
      },
    };
  } catch (error) {
    logger.error('[Pipeline] Error:', error);
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