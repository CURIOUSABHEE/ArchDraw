import logger from '@/lib/logger';
import type {
  UserIntent,
  ReactFlowNode,
  ArchitectureEdge,
  LayerType,
} from '../../types';
import type {
  DiagramScore,
  PipelineDiagnostics,
} from '../types';
import type {
  PipelineResult,
  PipelineState,
} from '../pipelineOrchestrator';
import { runStage1PreGeneration } from './stage1-pregen';
import { translatePlanToReactFlow } from '@/lib/mermaid/planTranslator';
import { scoreDiagram } from '../stage8-score';

export async function runMermaidPipeline(
  userIntent: UserIntent,
  onProgress?: (step: string, progress: number) => void
): Promise<PipelineResult> {
  const diagramSize = userIntent.diagramSize ?? 'medium';

  onProgress?.('Planning architecture', 10);

  // A1.5: Downstream guard check
  const promptLower = userIntent.description.toLowerCase();
  const archKeywords = [
    'architecture', 'platform', 'microservice', 'container', 'service', 'layer', 'flow', 'cdn',
    'load balancer', 'infrastructure', 'deployment', 'system design', 'pipeline', 'cluster', 'api gateway'
  ];
  const erKeywords = [
    'entity relationship', 'er diagram', 'database schema', 'data model', 'table schema'
  ];

  const hasArch = archKeywords.some(k => promptLower.includes(k));
  const hasExplicitEr = erKeywords.some(k => promptLower.includes(k));

  // STAGE 1: Multi-agent pre-generation — 4 focused agents for a quality architecture plan
  const stage1Result = await runStage1PreGeneration(userIntent.description, diagramSize, userIntent.model);
  const { formatConfig, styleConfig, inventoryConfig, edgeConfig, groupAssignments } = stage1Result;

  // Layout override
  const isHorizontalRequested = promptLower.includes('horizontal') || promptLower.includes('horizontally') || promptLower.includes('left-to-right') || promptLower.includes('left to right') || promptLower.includes('graph lr') || promptLower.includes('horizontal layout');
  const isVerticalRequested = promptLower.includes('vertical') || promptLower.includes('vertically') || promptLower.includes('top-to-bottom') || promptLower.includes('top to bottom') || promptLower.includes('graph td') || promptLower.includes('graph tb') || promptLower.includes('vertical layout');

  if (isHorizontalRequested) {
    logger.info('[DownstreamGuard] Override: horizontal layout requested. Forcing diagramType -> graph LR.');
    formatConfig.diagramType = 'graph LR';
  } else if (isVerticalRequested) {
    logger.info('[DownstreamGuard] Override: vertical layout requested. Forcing diagramType -> graph TD.');
    formatConfig.diagramType = 'graph TD';
  } else if (hasArch) {
    logger.warn('[DownstreamGuard] Override: prompt contains architecture keywords. Forcing diagramType -> graph TD.');
    formatConfig.diagramType = 'graph TD';
  } else if (formatConfig.diagramType === 'erDiagram' && !hasExplicitEr) {
    logger.warn('[DownstreamGuard] Override: erDiagram forbidden without explicit database/ER trigger words. Forcing diagramType -> graph TD.');
    formatConfig.diagramType = 'graph TD';
  }

  onProgress?.('Architecture plan ready', 30);

  // STAGE 2: Direct translation from plan to ReactFlow (no Mermaid)
  onProgress?.('Translating and laying out diagram', 50);
  let rfNodes: any[], rfEdges: any[];
  try {
    const translated = translatePlanToReactFlow(
      formatConfig,
      styleConfig,
      inventoryConfig,
      edgeConfig,
      groupAssignments,
    );
    rfNodes = translated.nodes;
    rfEdges = translated.edges;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`[Pipeline] Translation failed: ${msg}`);
    throw new Error(`translation_failed: ${msg}`);
  }

  const styledNodes = rfNodes;
  const styledEdges = rfEdges;

  // Score the final diagram
  const stylePlan = {
    style: styleConfig.theme as any,
    strictness: 'explicit' as const,
    productionDepth: 'conceptual' as const,
  };

  onProgress?.('Complete', 100);

  const diagramScore = scoreDiagram(styledNodes, styledEdges, {
    nodesRemoved: 0,
    edgesRemoved: 0,
    diagramSize,
    stylePlan,
    prompt: userIntent.description,
  });

  // PipelineState & Diagnostics for compatibility
  const pipelineDiagnostics: PipelineDiagnostics = {
    style: styleConfig.theme as any,
    productionDepth: 'conceptual',
    semanticIssues: [],
    mechanicalRepairs: [],
    removedInvalidEdgeIds: [],
    rejectedAutoInjection: true,
  };

  const state: PipelineState = {
    userIntent,
    rawNodes: rfNodes.map((n) => ({
      id: n.id,
      type: n.type || 'shapeNode',
      position: n.position || { x: 0, y: 0 },
      label: n.data?.label || '',
      layer: (n.data?.layer || 'compute') as LayerType,
      icon: n.data?.icon || 'box',
      subtitle: n.data?.subtitle,
      serviceType: n.data?.serviceType,
      width: n.width || 180,
      height: 70,
      metadata: {},
    })),
    enrichedNodes: rfNodes.map((n) => ({
      id: n.id,
      type: n.type || 'shapeNode',
      position: n.position || { x: 0, y: 0 },
      label: n.data?.label || '',
      layer: (n.data?.layer || 'compute') as LayerType,
      icon: n.data?.icon || 'box',
      subtitle: n.data?.subtitle,
      serviceType: n.data?.serviceType,
      width: n.width || 180,
      height: 70,
      metadata: {},
    })),
    edges: styledEdges as unknown as ArchitectureEdge[],
    reactFlowNodes: styledNodes as ReactFlowNode[],
    graph: null,
    score: diagramScore.score,
    iteration: 0,
    history: [],
    errors: [],
    useAWS: false,
    systemIntent: { primary: [], useAWS: false, useAzure: false, useGCP: false },
    pipelineDiagnostics,
  };

  return {
    success: true,
    nodes: styledNodes as ReactFlowNode[],
    edges: styledEdges as unknown as ArchitectureEdge[],
    state,
    score: diagramScore.score,
    diagramScore: diagramScore as DiagramScore,
    diagnostics: pipelineDiagnostics,
  };
}
