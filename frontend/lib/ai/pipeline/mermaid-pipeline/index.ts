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
import type { PipelineResult, PipelineState } from './types';
import { runArchitecturePlanner } from './stage1-planner';
import { validatePlan } from './planValidator';
import { translatePlanToReactFlow } from '@/lib/mermaid/planTranslator';
import { scoreDiagram } from '../stage8-score';

function generateFallbackPlan(prompt: string) {
  const nodes = ['User', 'API Gateway', 'Service', 'Database'];
  const groups = ['Client', 'API', 'Service', 'Data'];
  const groupAssignments: Record<string, string> = {
    'User': 'Client',
    'API Gateway': 'API',
    'Service': 'Service',
    'Database': 'Data',
  };
  const edges = [
    { from: 'User', to: 'API Gateway', label: 'request', bidirectional: false },
    { from: 'API Gateway', to: 'Service', label: 'route', bidirectional: false },
    { from: 'Service', to: 'Database', label: 'query', bidirectional: false },
  ];

  return {
    formatConfig: {
      format: 'mermaid' as const,
      diagramType: 'graph TD' as const,
      optionalVariants: [],
    },
    styleConfig: {
      primaryColor: '#2563EB',
      secondaryColor: '#4F46E5',
      background: '#F9FAFB',
      backgroundColor: '#F9FAFB',
      fontFamily: 'Inter',
      theme: 'default',
      nodeTypeStyles: {
        client: '#2563EB',
        edge: '#4F46E5',
        gateway: '#4F46E5',
        application: '#4F46E5',
        data: '#1e293b',
        queue: '#1e293b',
        observability: '#475569',
        external: '#64748b',
      },
    },
    inventoryConfig: {
      nodes,
      groups,
      nodeCount: nodes.length,
    },
    edgeConfig: {
      edges,
      edgeCount: edges.length,
    },
    groupAssignments,
  };
}

export async function runMermaidPipeline(
  userIntent: UserIntent,
  onProgress?: (step: string, progress: number) => void
): Promise<PipelineResult> {
  const diagramSize = userIntent.diagramSize ?? 'medium';
  const prompt = userIntent.description;

  onProgress?.('Planning architecture', 10);

  // A1.5: Downstream guard check
  const promptLower = prompt.toLowerCase();
  const archKeywords = [
    'architecture', 'platform', 'microservice', 'container', 'service', 'layer', 'flow', 'cdn',
    'load balancer', 'infrastructure', 'deployment', 'system design', 'pipeline', 'cluster', 'api gateway'
  ];
  const erKeywords = [
    'entity relationship', 'er diagram', 'database schema', 'data model', 'table schema'
  ];

  const hasArch = archKeywords.some(k => promptLower.includes(k));
  const hasExplicitEr = erKeywords.some(k => promptLower.includes(k));

  // STAGE 1: Planner — single LLM call for complete architecture plan
  let plan = await runArchitecturePlanner(prompt, diagramSize, userIntent.model);
  let { formatConfig, styleConfig, inventoryConfig, edgeConfig, groupAssignments } = plan;

  // Retry once if planner returned no nodes
  if (inventoryConfig.nodeCount === 0) {
    logger.warn('[Pipeline] Planner returned 0 nodes. Retrying with stronger instructions...');
    const retryPrompt = `${prompt}\n\nIMPORTANT: Include at least 3-6 relevant components and their connections.`;
    plan = await runArchitecturePlanner(retryPrompt, diagramSize, userIntent.model);
    ({ formatConfig, styleConfig, inventoryConfig, edgeConfig, groupAssignments } = plan);
  }

  // Fallback to default plan if still empty
  if (inventoryConfig.nodeCount === 0) {
    logger.warn('[Pipeline] Planner returned 0 nodes after retry. Using fallback plan.');
    plan = generateFallbackPlan(prompt);
    ({ formatConfig, styleConfig, inventoryConfig, edgeConfig, groupAssignments } = plan);
  }

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
    logger.info('[DownstreamGuard] Using horizontal layout for architecture diagram. Forcing diagramType -> graph LR.');
    formatConfig.diagramType = 'graph LR';
  } else if (formatConfig.diagramType === 'erDiagram' && !hasExplicitEr) {
    logger.info('[DownstreamGuard] erDiagram forbidden without explicit database/ER trigger words. Forcing diagramType -> graph LR.');
    formatConfig.diagramType = 'graph LR';
  }

  onProgress?.('Architecture plan ready', 30);

  // STAGE 1.5: Programmatic validation + plan repair
  onProgress?.('Validating architecture plan', 40);
  const validationResult = validatePlan({ formatConfig, styleConfig, inventoryConfig, edgeConfig, groupAssignments });
  if (validationResult.fixed.length > 0) {
    logger.log(`[Pipeline] Plan validator fixed ${validationResult.fixed.length} issue(s):`);
    for (const msg of validationResult.fixed) logger.log(`  ✓ ${msg}`);
  }
  if (validationResult.warnings.length > 0) {
    logger.log(`[Pipeline] Plan validator produced ${validationResult.warnings.length} warning(s):`);
    for (const msg of validationResult.warnings) logger.log(`  ⚠ ${msg}`);
  }
  ({ formatConfig, styleConfig, inventoryConfig, edgeConfig, groupAssignments } = validationResult.plan);

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
