import { Node, Edge } from 'reactflow';
import type { ArchitectureNode, ArchitectureEdge, UserIntent, ReactFlowNode, LayerType, ServiceType } from '../types';
import { detectSystemIntent } from '../graph/ArchitectureGraph';
import { detectAWSInPrompt, enrichNodes } from '../agents/component';
import { allocatePorts, assignHandlesToEdges } from '../edges/portAllocator';
import logger from '@/lib/logger';
import { validateDiagramQuality, type DiagramQualityReport } from '../validation/diagramQualityValidator';
import { EDGE_CONFIG } from '@/lib/config';
import { validateEdges } from '../edges/edgeValidator';
import { COMMUNICATION_STYLES } from '../constants';

import { detectIntent } from './stage1-intent';
import { callReasoningLLM, inferStylePlan } from './stage2-reasoning';
import { callDiagramLLM } from './stage3-diagram';
import {
  validateAndRepair,
  flowsToEdges,
  shouldRetryGeneration,
  mergeFeedbackForRetry,
} from './stage5-validate';
import { applyLayout } from './stage6-layout';
import { applySemanticLayerGroups } from './applySemanticLayerGroups';
import { convertToReactFlow } from './stage7-convert';
import { scoreDiagram } from './stage8-score';
import { buildFeedbackPrompt } from './buildFeedbackPrompt';
import type {
  DiagramScore,
  LayoutedNode,
  RawNode,
  RawFlow,
  ValidationFeedback,
  ValidatedDiagram,
  PipelineDiagnostics,
  DiagramEdge,
} from './types';
import { logGenerationResult } from './feedbackLogger';

export interface PipelineState {
  userIntent: UserIntent;
  rawNodes: ArchitectureNode[];
  enrichedNodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  reactFlowNodes: ReactFlowNode[];
  graph: null;
  score: number;
  iteration: number;
  history: PipelineHistoryEntry[];
  errors: PipelineError[];
  useAWS: boolean;
  systemIntent: ReturnType<typeof detectSystemIntent>;
  intentResult?: ReturnType<typeof detectIntent>;
  reasoningResult?: Awaited<ReturnType<typeof callReasoningLLM>>;
  pipelineDiagnostics?: PipelineDiagnostics;
}

export interface PipelineHistoryEntry {
  step: 'normalize' | 'intent' | 'reasoning' | 'diagram' | 'validate' | 'layout' | 'convert' | 'score' | 'enrich';
  timestamp: number;
  input?: unknown;
  output?: unknown;
  issues?: PipelineError[];
}

export interface PipelineError {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  details?: unknown;
}

export interface PipelineResult {
  success: boolean;
  nodes: ReactFlowNode[];
  edges: ArchitectureEdge[];
  state: PipelineState;
  score: number;
  error?: 'generation_failed';
  qualityReport?: DiagramQualityReport;
  diagramScore?: DiagramScore;
  diagnostics?: PipelineDiagnostics;
}

const MAX_RETRIES = 2;

const FORBIDDEN_MVC_TECH = [
  'lambda',
  'sqs',
  'kafka',
  'api gateway',
  'docker',
  'kubernetes',
  'ecs',
  'eks',
  'sns',
  'eventbridge',
  'step function',
  'cloudwatch',
  'sagemaker',
];

function getTypeOverride(userInput: string): string | null {
  const input = userInput.toLowerCase();
  if (/\bmvc\b/.test(input) || /model.?view.?controller/i.test(input)) return 'mvc';
  if (/\bcicd\b/.test(input) || /ci\/cd/.test(input)) return 'cicd_pipeline';
  if (/\berd\b/.test(input) || /schema/.test(input)) return 'database_schema';
  if (/\bmonolith\b/.test(input)) return 'monolith';
  return null;
}

function getExistingNodeIds(userIntent: UserIntent): string[] {
  const nodes = userIntent.existingContext?.nodes;
  if (!nodes?.length) return [];
  return nodes
    .map((n) => {
      const raw = n as { id?: string; data?: { id?: string } };
      return raw.id || raw.data?.id || '';
    })
    .filter(Boolean);
}

/**
 * MAIN PIPELINE ORCHESTRATOR (custom-first)
 * Diagram LLM nodes + flows are the source of truth; no second edge-generation pass.
 */
export async function runArchitecturePipeline(
  userIntent: UserIntent,
  onProgress?: (step: string, progress: number) => void
): Promise<PipelineResult> {
  const diagramSize = userIntent.diagramSize ?? 'medium';
  const existingNodeIds = getExistingNodeIds(userIntent);

  const state: PipelineState = {
    userIntent,
    rawNodes: [],
    enrichedNodes: [],
    edges: [],
    reactFlowNodes: [],
    graph: null,
    score: 0,
    iteration: 0,
    history: [],
    errors: [],
    useAWS: false,
    systemIntent: { primary: [], useAWS: false, useAzure: false, useGCP: false },
  };

  let pipelineDiagnostics: PipelineDiagnostics | undefined;

  try {
    onProgress?.('Normalizing input', 5);
    state.history.push({ step: 'normalize', timestamp: Date.now(), input: userIntent });

    let attempt = 0;
    let currentPrompt = userIntent.description;

    let validationResult!: ValidatedDiagram;
    let finalFeedback!: ValidationFeedback;
    let nodesForValidation: RawNode[] = [];
    let flowsForValidation: RawFlow[] = [];

    while (attempt <= MAX_RETRIES) {
      onProgress?.(`Detecting intent (Attempt ${attempt + 1})`, 10);
      state.systemIntent = detectSystemIntent(currentPrompt);
      state.useAWS = state.systemIntent.useAWS || detectAWSInPrompt(currentPrompt);

      const typeOverride = getTypeOverride(currentPrompt);
      if (typeOverride) {
        logger.log(`[Pipeline] Keyword override: "${typeOverride}" (matched from input)`);
        state.intentResult = { type: typeOverride, confidence: 1.0, ambiguous: false };
      } else {
        state.intentResult = detectIntent(currentPrompt);
      }

      const stylePlan = inferStylePlan(currentPrompt, state.intentResult.type);
      logger.log(
        `[Pipeline] Intent: ${state.intentResult.type}, style: ${stylePlan.style}, productionDepth: ${stylePlan.productionDepth}`
      );

      state.history.push({ step: 'intent', timestamp: Date.now(), output: { intent: state.intentResult, stylePlan } });

      onProgress?.('Reasoning about architecture', 20);
      state.reasoningResult = await callReasoningLLM(
        currentPrompt,
        state.intentResult.type,
        diagramSize,
        stylePlan
      );

      state.history.push({ step: 'reasoning', timestamp: Date.now(), output: state.reasoningResult });

      onProgress?.('Generating diagram', 35);
      const diagramResult = await callDiagramLLM(
        state.reasoningResult,
        (node) => logger.log(`[Pipeline] Generated node: ${node.label} (${node.id})`),
        (flow) => logger.log(`[Pipeline] Generated flow: ${flow.path.join(' → ')}`),
        userIntent.existingContext,
        diagramSize,
        state.intentResult.type,
        stylePlan
      );

      if (diagramResult.nodes.length === 0) {
        throw new Error('generation_failed: diagram model returned no nodes');
      }

      state.rawNodes = diagramResult.nodes.map((n) => rawNodeToArchitectureNode(n));
      flowsForValidation = diagramResult.flows;

      logger.log(
        `[Pipeline] Generated ${state.rawNodes.length} nodes and ${flowsForValidation.length} flows (custom-first, no edge LLM pass)`
      );

      if (state.intentResult.type === 'mvc') {
        const mvcViolations = state.rawNodes.filter((n) => {
          const label = (n.label || '').toLowerCase();
          return FORBIDDEN_MVC_TECH.some((t) => label.includes(t));
        });
        if (mvcViolations.length > 0 && attempt < MAX_RETRIES) {
          currentPrompt = `You MUST generate an MVC diagram. ONLY three layers allowed: View, Controller, Model. NO microservices, NO AWS services, NO message queues, NO API Gateway, NO Docker/Kubernetes.

ORIGINAL REQUEST: ${userIntent.description}

PREVIOUS ATTEMPT contained forbidden nodes: ${mvcViolations.map((n) => n.label).join(', ')}. Do NOT repeat these.`;
          attempt++;
          continue;
        }
      }

      state.history.push({
        step: 'diagram',
        timestamp: Date.now(),
        output: { nodeCount: state.rawNodes.length, flowCount: flowsForValidation.length },
      });

      onProgress?.('Enriching nodes', 45);
      state.enrichedNodes = enrichNodes(state.rawNodes);
      state.history.push({ step: 'enrich', timestamp: Date.now(), output: state.enrichedNodes.length });

      nodesForValidation = state.enrichedNodes.map((n) => architectureNodeToRawNode(n));

      onProgress?.('Validating diagram', 65);
      const valObj = validateAndRepair(
        { nodes: nodesForValidation, flows: flowsForValidation },
        currentPrompt,
        state.reasoningResult?.preGenerationChecklist,
        { prompt: currentPrompt, stylePlan, existingNodeIds }
      );

      validationResult = valObj.diagram;
      finalFeedback = valObj.feedback;
      pipelineDiagnostics = valObj.diagnostics;
      state.pipelineDiagnostics = pipelineDiagnostics;

      logger.log(
        `[Pipeline] Validation score: ${finalFeedback.score}/100. Semantic issues: ${pipelineDiagnostics.semanticIssues.length}, mechanical repairs: ${pipelineDiagnostics.mechanicalRepairs.length}`
      );

      if (shouldRetryGeneration(finalFeedback, pipelineDiagnostics) && attempt < MAX_RETRIES) {
        const retryFeedback = mergeFeedbackForRetry(finalFeedback, pipelineDiagnostics);
        logger.warn(
          `[Pipeline] Retrying generation (attempt ${attempt + 2}/${MAX_RETRIES + 1}): ${retryFeedback.issues.length} issue(s)`
        );
        currentPrompt = buildFeedbackPrompt(userIntent.description, retryFeedback, attempt + 1);
        attempt++;
        continue;
      }

      break;
    }

    logGenerationResult({
      originalPrompt: userIntent.description,
      finalScore: finalFeedback.score,
      totalAttempts: attempt,
      wasRepaired: pipelineDiagnostics!.mechanicalRepairs.length > 0,
      issues: finalFeedback.issues,
      injectedNodes: [],
      prunedNodes: [],
      orphansFixed: 0,
      tiersRepaired: finalFeedback.tiersRepaired,
      detectedDomain: null,
    });

    state.enrichedNodes = validationResult.nodes.map((n) => rawNodeToArchitectureNode(n));
    state.edges = diagramEdgesToArchitectureEdges(validationResult.edges);

    state.history.push({
      step: 'validate',
      timestamp: Date.now(),
      output: { nodeCount: state.enrichedNodes.length, edgeCount: state.edges.length, diagnostics: pipelineDiagnostics },
    });

    const validationResult2 = validateEdges(state.edges, state.enrichedNodes);
    if (!validationResult2.valid) {
      state.errors.push(
        ...validationResult2.errors.map((e) => ({
          type: e.type,
          severity: e.severity,
          message: e.message,
        }))
      );
    }

    // Custom-first contract: do NOT semantically repair/reroute edges after generation.
    // The legacy repairEdges() can prune and even invent reroutes (e.g. insert a gateway),
    // which violates validate-only semantics and can silently drop model flows.
    onProgress?.('Finalizing edges', 75);

    const portAssignments = allocatePorts(state.enrichedNodes, state.edges);
    state.edges = assignHandlesToEdges(state.edges, state.enrichedNodes, portAssignments);

    onProgress?.('Computing layout', 85);

    const nodesForLayout: LayoutedNode[] = state.enrichedNodes.map((n) => {
      const raw = architectureNodeToRawNode(n);
      return {
        ...raw,
        x: n.position?.x || 0,
        y: n.position?.y || 0,
        width: n.width || 180,
        height: n.height || 70,
      };
    });

    const { nodes: layoutResult, diagnostics: layoutDiagnostics } = await applyLayout(
      {
        nodes: nodesForLayout,
        edges: state.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label || '',
          async: e.communicationType === 'async',
        })),
      },
      diagramSize,
      state.intentResult?.type
    );
    logger.info(`[Pipeline] Layout stage diagnostics:`, layoutDiagnostics);

    const groupedLayout = applySemanticLayerGroups(layoutResult);
    logger.info(
      `[Pipeline] Semantic groups: ${groupedLayout.filter((n) => n.isGroup).length} groups, ${groupedLayout.length} total nodes`
    );

    state.history.push({ step: 'layout', timestamp: Date.now(), output: groupedLayout.length });

    onProgress?.('Converting to React Flow', 90);

    const { nodes: rfNodes, edges: rfEdges } = convertToReactFlow(groupedLayout, {
      nodes: groupedLayout.map((n) => ({
        id: n.id,
        label: n.label,
        subtitle: n.subtitle || '',
        layer: n.layer,
        icon: n.icon || 'box',
        serviceType: (n.serviceType || 'generic') as ServiceType,
      })),
      edges: state.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label || '',
        async: e.communicationType === 'async',
      })),
    });

    state.reactFlowNodes = rfNodes as ReactFlowNode[];
    state.edges = rfEdges as unknown as ArchitectureEdge[];

    state.history.push({
      step: 'convert',
      timestamp: Date.now(),
      output: { nodeCount: rfNodes.length, edgeCount: rfEdges.length },
    });

    onProgress?.('Scoring output', 95);

    const stylePlan = inferStylePlan(userIntent.description, state.intentResult?.type ?? 'generic');

    const diagramScore = scoreDiagram(rfNodes as Node[], rfEdges as Edge[], {
      nodesRemoved: Math.max(0, nodesForLayout.length - rfNodes.length),
      edgesRemoved: Math.max(0, state.edges.length - rfEdges.length),
      diagramSize,
      stylePlan,
      prompt: userIntent.description,
    });

    state.score = diagramScore.score;
    state.history.push({ step: 'score', timestamp: Date.now(), output: diagramScore });

    const qualityReport = validateDiagramQuality(state.enrichedNodes, state.edges);
    logger.log('[ArchDraw Quality Gate]', qualityReport);

    if (!qualityReport.blockingPassed) {
      const blockingDetail = [
        ...qualityReport.checks.connectivity.issues,
        ...qualityReport.checks.edgeQuality.issues,
      ].join('; ');
      logger.warn(`[Pipeline] Blocking quality gate failed: ${blockingDetail}`);
      state.errors.push({
        type: 'quality_gate',
        severity: 'critical',
        message: `generation_failed: ${blockingDetail}`,
      });
      return {
        success: false,
        nodes: state.reactFlowNodes,
        edges: state.edges,
        state,
        score: state.score,
        error: 'generation_failed',
        qualityReport,
        diagramScore,
        diagnostics: pipelineDiagnostics,
      };
    }

    onProgress?.('Complete', 100);

    return {
      success: true,
      nodes: state.reactFlowNodes,
      edges: state.edges,
      state,
      score: state.score,
      qualityReport,
      diagramScore,
      diagnostics: pipelineDiagnostics,
    };
  } catch (error) {
    const pipelineError: PipelineError = {
      type: 'pipeline',
      severity: 'critical',
      message: error instanceof Error ? error.message : 'Pipeline failed',
      details: error,
    };
    state.errors.push(pipelineError);

    return {
      success: false,
      nodes: state.reactFlowNodes,
      edges: state.edges,
      state,
      score: state.score,
      error: 'generation_failed',
      diagnostics: pipelineDiagnostics,
      qualityReport: {
        passed: false,
        blockingPassed: false,
        checks: {
          structural: { passed: false, issues: ['Pipeline failed'] },
          connectivity: { passed: false, issues: [] },
          edgeQuality: { passed: false, issues: [] },
          resilienceCoverage: { passed: false, issues: [] },
        },
      },
    };
  }
}

/** Convert validated diagram edges to ArchitectureEdge with communication styles. */
export function diagramEdgesToArchitectureEdges(edges: DiagramEdge[]): ArchitectureEdge[] {
  return edges.map((e) => {
    const commType = (e.communicationType || (e.async ? 'async' : 'sync')) as keyof typeof COMMUNICATION_STYLES;
    const styleConfig = COMMUNICATION_STYLES[commType] || COMMUNICATION_STYLES.sync;
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: 'right',
      targetHandle: 'left',
      communicationType: commType,
      pathType: 'smooth',
      label: e.label || '',
      labelPosition: 'center',
      animated: styleConfig.animated,
      edgeVariant: (e.edgeVariant ||
        (e.communicationType === 'dotted' ? 'dotted' : e.async ? 'dashed' : 'solid')) as ArchitectureEdge['edgeVariant'],
      style: {
        stroke: styleConfig.color || EDGE_CONFIG.strokeColor,
        strokeDasharray: styleConfig.strokeDasharray || '',
        strokeWidth: EDGE_CONFIG.strokeWidth,
      },
      markerEnd: styleConfig.markerEnd || 'arrowclosed',
      markerStart: 'none',
    } as ArchitectureEdge;
  });
}

/** Build edges directly from LLM flows (exported for tests). */
export function buildEdgesFromFlows(flows: RawFlow[]): DiagramEdge[] {
  return flowsToEdges(flows);
}

function rawNodeToArchitectureNode(raw: RawNode): ArchitectureNode {
  return {
    id: raw.id,
    type: 'architectureNode',
    position: { x: (raw as { x?: number }).x || 0, y: (raw as { y?: number }).y || 0 },
    label: raw.label,
    layer: raw.layer as LayerType,
    width: (raw as { width?: number }).width || 180,
    height: (raw as { height?: number }).height || 70,
    icon: raw.icon || 'box',
    metadata: {},
    subtitle: raw.subtitle || '',
    serviceType: raw.serviceType,
  };
}

function architectureNodeToRawNode(node: ArchitectureNode): RawNode {
  return {
    id: node.id,
    label: node.label,
    subtitle: node.subtitle,
    layer: node.layer as RawNode['layer'],
    icon: node.icon,
    serviceType: node.serviceType,
  };
}
