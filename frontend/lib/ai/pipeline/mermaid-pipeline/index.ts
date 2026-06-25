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
import { runMermaidGenerator } from './stage2-mermaid';
import { validateMermaid } from './stage3-validate';
import { parseMermaid } from './mermaidParser';
import { translateMermaidToReactFlowJSON } from '@/lib/mermaid/aiAdapter';
import { scoreDiagram } from '../stage8-score';

function buildLockedNodeIdMap(mermaidText: string): string {
  const parsed = parseMermaid(mermaidText);
  if (parsed.nodes.length === 0) return '';

  const lockedIds = parsed.nodes.map(n =>
    `  - "${n.label}" (id: ${n.id})`
  ).join('\n');

  return `LOCKED NODE IDs (you MUST reuse these exact IDs — do not rename or regenerate them):
${lockedIds}

IMPORTANT: Only add missing nodes if they are not already present. Never rename existing node IDs.`;
}

export async function runMermaidPipeline(
  userIntent: UserIntent,
  onProgress?: (step: string, progress: number) => void
): Promise<PipelineResult> {
  const diagramSize = userIntent.diagramSize ?? 'medium';

  onProgress?.('Extracting metadata', 10);
  
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

  // STAGE 1: Parallel pre-generation agents
  const stage1Result = await runStage1PreGeneration(userIntent.description, diagramSize, userIntent.model);
  const { formatConfig, styleConfig, inventoryConfig, edgeConfig, groupAssignments } = stage1Result;

  if (hasArch) {
    logger.warn('[DownstreamGuard] Override: prompt contains architecture keywords. Forcing diagramType -> graph TD.');
    formatConfig.diagramType = 'graph TD';
  } else if (formatConfig.diagramType === 'erDiagram' && !hasExplicitEr) {
    logger.warn('[DownstreamGuard] Override: erDiagram forbidden without explicit database/ER trigger words. Forcing diagramType -> graph TD.');
    formatConfig.diagramType = 'graph TD';
  }

  onProgress?.('Pre-generation complete', 25);

  let iteration = 0;
  let repairInstructions: string | undefined = undefined;
  let validationResult: ReturnType<typeof validateMermaid> | null = null;
  const categoryAttempts: Record<string, number> = {
    nodes: 0,
    groups: 0,
    edges: 0,
  };
  let mermaidText = '';

  // STAGE 2 & 3: Generation & Validation Loop
  // Max iterations set to 16 to allow up to 4 attempts for each of the 4 categories
  while (iteration < 16) {
    onProgress?.(`Generating Mermaid (Iteration ${iteration + 1})`, Math.min(75, 40 + iteration * 3));

    // Stage 2: Mermaid Generation
    mermaidText = await runMermaidGenerator(
      formatConfig,
      inventoryConfig,
      edgeConfig,
      groupAssignments,
      diagramSize,
      repairInstructions,
      userIntent.model
    );

    // Stage 3: Programmatic Validation
    validationResult = validateMermaid(mermaidText, inventoryConfig, edgeConfig);

    if (validationResult.isValid) {
      logger.log(`[MermaidPipeline] Diagram successfully validated on iteration ${iteration + 1}`);
      break;
    }

    logger.warn(`[MermaidPipeline] Validation failed on iteration ${iteration + 1}:\n${validationResult.repairInstructions}`);

    // Track attempts per category (E8, E9)
    let failingCategory = '';
    if (validationResult.nodeIssues.length > 0) failingCategory = 'nodes';
    else if (validationResult.groupIssues.length > 0) failingCategory = 'groups';
    else if (validationResult.edgeIssues.length > 0) failingCategory = 'edges';

    if (failingCategory) {
      categoryAttempts[failingCategory] = (categoryAttempts[failingCategory] || 0) + 1;
      if (categoryAttempts[failingCategory] >= 4) {
        logger.error(`[MermaidPipeline] Category "${failingCategory}" failed validation 4 times. Halting.`);
        throw new Error(
          `validation_failed: Category "${failingCategory}" exceeded maximum repair attempts (4). Failed validation checks:\n${validationResult.repairInstructions}`
        );
      }
    }

    // Lock node IDs and pass validation errors as repair instructions for next iteration
    const lockedIdSection = buildLockedNodeIdMap(mermaidText);
    let repair = validationResult.repairInstructions || '';
    if (lockedIdSection) {
      repair = `${repair}\n\n${lockedIdSection}`;
    }

    repairInstructions = repair;
    iteration++;
  }

  if (!validationResult) {
    throw new Error('generation_failed: No validation result generated');
  }

  // Hard Gate Constraint: If validation fails after all iterations, halt and throw descriptive error
  if (!validationResult.isValid) {
    logger.error('[MermaidPipeline] Maximum validation repair iterations reached. Halting pipeline.');
    throw new Error(
      `validation_failed: Maximum validation repair iterations reached. Failed validation checks:\n${validationResult.repairInstructions}`
    );
  }

  // Deterministic Mermaid -> React Flow Translation, Layout, and Styling
  onProgress?.('Translating and styling diagram', 80);
  const { nodes: rfNodes, edges: rfEdges } = await translateMermaidToReactFlowJSON(
    mermaidText,
    styleConfig
  );

  const styledNodes = rfNodes;
  const styledEdges = rfEdges;

  // Score the final diagram
  const stylePlan = {
    style: styleConfig.theme as any,
    strictness: 'explicit' as const,
    productionDepth: 'conceptual' as const,
  };

  const diagramScore = scoreDiagram(styledNodes, styledEdges, {
    nodesRemoved: 0,
    edgesRemoved: 0,
    diagramSize,
    stylePlan,
    prompt: userIntent.description,
  });

  onProgress?.('Complete', 100);

  // Mock PipelineState & Diagnostics for compatibility
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
      type: n.type || 'architectureNode',
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
      type: n.type || 'architectureNode',
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
    iteration,
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
