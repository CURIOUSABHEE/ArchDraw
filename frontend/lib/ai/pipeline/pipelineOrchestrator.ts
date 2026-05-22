import { Node, Edge } from 'reactflow';
import type { ArchitectureNode, ArchitectureEdge, UserIntent, ReactFlowNode, LayerType, ServiceType } from '../types';
import { detectSystemIntent } from '../graph/ArchitectureGraph';
import { detectAWSInPrompt, enrichNodes } from '../agents/component';
import { ArchitectureGraph } from '../graph/ArchitectureGraph';
import { validateEdges } from '../edges/edgeValidator';
import { repairEdges, generateMissingEdges } from '../edges/edgeRepair';
import { allocatePorts, assignHandlesToEdges } from '../edges/portAllocator';
import { apiKeyManager } from '../utils/apiKeyManager';
import logger from '@/lib/logger';
import {
  buildEdgePrompt,
} from '../prompts/promptBuilder';
import { ensureConnectivity } from '../graph/connectivityEnforcer';
import { autoAddCompensatingComponents } from '../graph/compensatingComponents';
import { validateDiagramQuality, type DiagramQualityReport } from '../validation/diagramQualityValidator';
import * as diagramCache from '../services/diagramCache';
import { detectDomain } from '../graph/componentValidator';
import { enforceMinimumConnections } from '../graph/edgeValidator';
import { applyDomainEdgePatterns } from '../graph/domainEdgePatterns';
import { findConnectedComponents, bridgeComponents } from '../graph/graphConnectivity';

// NEW: Import redesigned 8-stage pipeline
import { detectIntent } from './stage1-intent';
import { callReasoningLLM, type ReasoningResult } from './stage2-reasoning';
import { callDiagramLLM } from './stage3-diagram';
import { validateAndRepair } from './stage5-validate';
import { applyLayout } from './stage6-layout';
import { convertToReactFlow } from './stage7-convert';
import { scoreDiagram } from './stage8-score';
import type { DiagramScore, LayoutedNode, RawNode, RawFlow } from './types';

export interface PipelineState {
  userIntent: UserIntent;
  rawNodes: ArchitectureNode[];
  enrichedNodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  reactFlowNodes: ReactFlowNode[];
  graph: ArchitectureGraph | null;
  score: number;
  iteration: number;
  history: PipelineHistoryEntry[];
  errors: PipelineError[];
  useAWS: boolean;
  systemIntent: ReturnType<typeof detectSystemIntent>;
  // NEW: Pipeline stage results
  intentResult?: ReturnType<typeof detectIntent>;
  reasoningResult?: ReasoningResult;
}

export interface PipelineHistoryEntry {
  step: 'normalize' | 'intent' | 'reasoning' | 'diagram' | 'validate' | 'layout' | 'convert' | 'score' | 'enrich' | 'edges' | 'repair';
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
  qualityReport?: DiagramQualityReport;
  diagramScore?: DiagramScore;
}

const MAX_ITERATIONS = 3;
const SCORE_THRESHOLD = 75;

/**
 * MAIN PIPELINE ORCHESTRATOR
 */
export async function runArchitecturePipeline(
  userIntent: UserIntent,
  onProgress?: (step: string, progress: number) => void
): Promise<PipelineResult> {
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

  try {
    // ── STAGE 0: Normalize Input ──
    onProgress?.('Normalizing input', 5);
    state.history.push({ step: 'normalize', timestamp: Date.now(), input: userIntent });

    // Check semantic cache before LLM call
    const cached = diagramCache.get(userIntent.description);
    if (cached) {
      logger.log('[Pipeline] Cache hit for prompt, returning cached diagram');
      onProgress?.('Complete', 100);
      return {
        success: true,
        nodes: [],
        edges: cached.edges,
        state,
        score: 0,
        qualityReport: cached.qualityReport,
      };
    }

    // ── STAGE 1: Intent Detection ──
    onProgress?.('Detecting intent', 10);
    state.systemIntent = detectSystemIntent(userIntent.description);
    state.useAWS = state.systemIntent.useAWS || detectAWSInPrompt(userIntent.description);
    
    // NEW: Improved intent detection with confidence
    state.intentResult = detectIntent(userIntent.description);
    logger.log(`[Pipeline] Intent: ${state.intentResult.type} (confidence: ${state.intentResult.confidence.toFixed(2)}, ambiguous: ${state.intentResult.ambiguous})`);
    
    state.history.push({
      step: 'intent',
      timestamp: Date.now(),
      output: state.intentResult,
    });

    // Detect domain early for validation rules
    const domain = detectDomain(userIntent.description);
    logger.log(`[Pipeline] Detected domain: ${domain}`);

    // ── STAGE 2: Reasoning ──
    onProgress?.('Reasoning about architecture', 20);
    state.reasoningResult = await callReasoningLLM(userIntent.description, state.intentResult.type);
    logger.log(`[Pipeline] Reasoning complete: ${state.reasoningResult.systemType}`);
    logger.log(`[Pipeline] Architectural plan: ${state.reasoningResult.architecturalPlan}`);
    
    if (state.reasoningResult.layers) {
      logger.log(`[Pipeline] Layers defined: ${Object.keys(state.reasoningResult.layers).join(', ')}`);
    }
    
    state.history.push({
      step: 'reasoning',
      timestamp: Date.now(),
      output: state.reasoningResult,
    });

    // ── STAGE 3: Diagram Generation (LLM) ──
    onProgress?.('Generating diagram', 35);
    
    const diagramResult = await callDiagramLLM(
      state.reasoningResult,
      (node) => {
        logger.log(`[Pipeline] Generated node: ${node.label} (${node.id})`);
      },
      (flow) => {
        logger.log(`[Pipeline] Generated flow: ${flow.path.join(' → ')}`);
      }
    );

    // Convert RawNode[] to ArchitectureNode[]
    state.rawNodes = diagramResult.nodes.map(n => 
      rawNodeToArchitectureNode(n)
    );
    
    logger.log(`[Pipeline] Generated ${state.rawNodes.length} nodes and ${diagramResult.flows.length} flows`);
    
    state.history.push({
      step: 'diagram',
      timestamp: Date.now(),
      output: { nodeCount: state.rawNodes.length, flowCount: diagramResult.flows.length },
    });

    // ── Enrich Nodes ──
    onProgress?.('Enriching nodes', 45);
    state.enrichedNodes = enrichNodes(state.rawNodes);
    state.history.push({
      step: 'enrich',
      timestamp: Date.now(),
      output: state.enrichedNodes.length,
    });

    // ── Generate Edges ──
    onProgress?.('Generating edges', 50);
    state.edges = await generateEdges(state);
    
    // Apply domain-specific edge patterns
    const domainResult = applyDomainEdgePatterns(state.enrichedNodes, domain, state.edges);
    if (domainResult.added > 0) {
      logger.log(`[Pipeline] Domain edge patterns added: ${domainResult.added}`);
      state.edges = [...state.edges, ...domainResult.edges];
    }
    
    state.history.push({
      step: 'edges',
      timestamp: Date.now(),
      output: state.edges.length,
    });

    // Ensure minimum edges
    const minRequiredEdges = Math.max(10, Math.floor(state.enrichedNodes.length * 0.5));
    if (state.edges.length < minRequiredEdges) {
      logger.warn(`[Pipeline] Low edge count (${state.edges.length} < ${minRequiredEdges}), adding missing edges`);
      const missingEdges = generateMissingEdges(state.enrichedNodes, state.edges);
      if (missingEdges.length > 0) {
        state.edges = [...state.edges, ...missingEdges];
      }
    }

    // Enforce minimum connections per node
    const connectionFix = enforceMinimumConnections(state.enrichedNodes, state.edges);
    if (connectionFix.fixes.length > 0) {
      logger.log('[Pipeline] Connection fixes applied:', connectionFix.fixes);
      state.edges = connectionFix.edges;
    }

    // Ensure connectivity for orphaned nodes
    const connectivityResult = ensureConnectivity(state.enrichedNodes, state.edges);
    state.edges = connectivityResult.edges;
    logger.log(`[Pipeline] Connectivity enforcement complete`);

    // Auto-add compensating resilience components
    const resilientResult = autoAddCompensatingComponents(state.enrichedNodes, state.edges);
    state.enrichedNodes = resilientResult.nodes;
    state.edges = resilientResult.edges;
    logger.log(`[Pipeline] Compensating components added`);

    // ── STAGE 4/5: NON-DESTRUCTIVE Validation ──
    onProgress?.('Validating and repairing', 65);
    
    // Convert ArchitectureNode[] to RawNode[] for validation
    const rawNodesForValidation: RawNode[] = state.enrichedNodes.map(n => 
      architectureNodeToRawNode(n)
    );

    // Convert ArchitectureEdge[] to RawFlow[]
    const rawFlows: RawFlow[] = state.edges.map(e => ({
      path: [e.source, e.target],
      label: e.label || '',
      async: e.communicationType === 'async',
    }));

    // RUN NON-DESTRUCTIVE VALIDATION
    const validationResult = validateAndRepair({ nodes: rawNodesForValidation, flows: rawFlows });
    
    // Convert back to ArchitectureNode[] and ArchitectureEdge[]
    const nodesRemoved = rawNodesForValidation.length - validationResult.nodes.length;
    const edgesRemoved = rawFlows.length - validationResult.edges.length;
    
    if (nodesRemoved > 0) {
      logger.warn(`[Pipeline] WARNING: ${nodesRemoved} nodes removed during validation`);
    }
    if (edgesRemoved > 0) {
      logger.warn(`[Pipeline] WARNING: ${edgesRemoved} edges removed during validation`);
    }

    // Update state with validated nodes/edges
    state.enrichedNodes = validationResult.nodes.map(n => rawNodeToArchitectureNode(n));
    state.edges = validationResult.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: 'right',
      targetHandle: 'left',
      communicationType: e.async ? 'async' : 'sync',
      pathType: 'smooth',
      label: e.label || '',
      labelPosition: 'center',
      animated: e.async,
      style: {
        stroke: '#94a3b8',
        strokeDasharray: e.async ? '5,5' : '',
        strokeWidth: 2,
      },
      markerEnd: 'arrowclosed',
      markerStart: 'none',
    } as ArchitectureEdge));
    
    state.history.push({
      step: 'validate',
      timestamp: Date.now(),
      output: { nodeCount: state.enrichedNodes.length, edgeCount: state.edges.length },
    });

    // Additional validation
    const validationResult2 = validateEdges(state.edges, state.enrichedNodes);
    if (!validationResult2.valid) {
      state.errors.push(...validationResult2.errors.map(e => ({
        type: e.type,
        severity: e.severity,
        message: e.message,
      })));
    }

    // Repair edges
    onProgress?.('Repairing edges', 75);
    const repairResult = repairEdges(state.enrichedNodes, state.edges);
    state.edges = repairResult.edges;
    if (repairResult.repaired.length > 0) {
      state.history.push({
        step: 'repair',
        timestamp: Date.now(),
        output: repairResult.repaired.length,
        issues: repairResult.repaired.map(r => ({
          type: 'repair',
          severity: r.severity,
          message: r.message,
        })),
      });
    }

    // Bridge disconnected components
    const componentsAfterRepair = findConnectedComponents(state.enrichedNodes, state.edges);
    if (componentsAfterRepair.length > 1) {
      logger.warn(
        `[Pipeline] ${componentsAfterRepair.length} disconnected components detected after repair, adding bridge edges`
      );
      const bridges = bridgeComponents(componentsAfterRepair, state.enrichedNodes, state.edges);
      if (bridges.length > 0) {
        state.edges = [...state.edges, ...bridges];
        logger.log(`[Pipeline] Added ${bridges.length} bridge edge(s)`);
      }
    }

    // Generate any remaining missing edges
    const missingEdges = generateMissingEdges(state.enrichedNodes, state.edges);
    if (missingEdges.length > 0) {
      state.edges = [...state.edges, ...missingEdges];
      logger.log(`[Pipeline] Added ${missingEdges.length} missing edges`);
    }

    // Allocate ports
    const portAssignments = allocatePorts(state.enrichedNodes, state.edges);
    state.edges = assignHandlesToEdges(state.edges, state.enrichedNodes, portAssignments);

    // ── STAGE 6: Layout ──
    onProgress?.('Computing layout', 85);
    
    // Convert to LayoutedNode[] for layout
    const nodesForLayout: LayoutedNode[] = state.enrichedNodes.map(n => {
      const raw = architectureNodeToRawNode(n);
      return {
        ...raw,
        x: n.position?.x || 0,
        y: n.position?.y || 0,
        width: n.width || 180,
        height: n.height || 70,
      };
    });

    const layoutResult = await applyLayout({ 
      nodes: nodesForLayout, 
      edges: state.edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label || '',
        async: e.communicationType === 'async',
      }))
    });
    
    // Convert layout result back to ArchitectureNode[]
    state.reactFlowNodes = layoutResult.map(n => rawNodeToArchitectureNode(n as RawNode) as unknown as ReactFlowNode);
    state.graph = null; 
    
    state.history.push({
      step: 'layout',
      timestamp: Date.now(),
      output: layoutResult.length,
    });

    // ── STAGE 7: React Flow Conversion ──
    onProgress?.('Converting to React Flow', 90);
    
    const { nodes: rfNodes, edges: rfEdges } = convertToReactFlow(
      layoutResult,
      { 
        nodes: layoutResult.map(n => ({
          id: n.id,
          label: n.label,
          subtitle: n.subtitle || '',
          layer: n.layer,
          icon: n.icon || 'box',
          serviceType: (n.serviceType || 'generic') as ServiceType,
        })),
        edges: state.edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label || '',
          async: e.communicationType === 'async',
        }))
      }
    );

    // Use the converted nodes/edges
    state.reactFlowNodes = rfNodes as ReactFlowNode[];
    state.edges = rfEdges as unknown as ArchitectureEdge[];

    state.history.push({
      step: 'convert',
      timestamp: Date.now(),
      output: { nodeCount: rfNodes.length, edgeCount: rfEdges.length },
    });

    // ── STAGE 8: Quality Scoring ──
    onProgress?.('Scoring output', 95);
    
    const diagramScore = scoreDiagram(
      rfNodes as Node[],
      rfEdges as Edge[],
      {
        nodesRemoved: Math.max(0, nodesForLayout.length - rfNodes.length),
        edgesRemoved: Math.max(0, state.edges.length - rfEdges.length),
      }
    );
    
    state.score = diagramScore.score;
    
    state.history.push({
      step: 'score',
      timestamp: Date.now(),
      output: diagramScore,
    });

    // Log quality report
    const qualityReport = validateDiagramQuality(
      state.enrichedNodes,
      state.edges
    );
    logger.log('[ArchDraw Quality Gate]', qualityReport);

    // Iteration check
    if (state.score < SCORE_THRESHOLD && state.iteration < MAX_ITERATIONS) {
      logger.log(`[Pipeline] Score ${state.score} < ${SCORE_THRESHOLD}, iteration ${state.iteration + 1}/${MAX_ITERATIONS}`);
      state.iteration++;
    }

    // Store in semantic cache
    diagramCache.set(userIntent.description, {
      nodes: state.enrichedNodes,
      edges: state.edges,
      qualityReport,
    });

    onProgress?.('Complete', 100);

    return {
      success: true,
      nodes: state.reactFlowNodes,
      edges: state.edges,
      state,
      score: state.score,
      qualityReport,
      diagramScore,
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
      qualityReport: {
        passed: false,
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

// ── Helper Functions ──

/**
 * Convert RawNode to ArchitectureNode
 */
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

/**
 * Convert ArchitectureNode to RawNode
 */
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

async function generateEdges(state: PipelineState): Promise<ArchitectureEdge[]> {
  const { userIntent, enrichedNodes } = state;

  const nodeSummaries = enrichedNodes
    .filter(n => !n.isGroup)
    .map(n => ({
      id: n.id,
      label: n.label,
      tier: n.layer,
    }));

  const prompt = buildEdgePrompt(userIntent.description, nodeSummaries);

  try {
    const result = await apiKeyManager.executeWithRetry(async (groq) => {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a JSON-only output system. Always respond with valid JSON object with an "edges" array. Do NOT wrap in markdown code blocks.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      });
      return completion.choices[0]?.message?.content ?? '';
    });

    const cleaned = result
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    
    return (parsed.edges || []).map((edge: Partial<ArchitectureEdge>) => ({
      id: edge.id || `edge-${Date.now()}`,
      source: edge.source || '',
      target: edge.target || '',
      sourceHandle: 'right',
      targetHandle: 'left',
      communicationType: edge.communicationType || 'sync',
      pathType: 'smooth',
      label: '',
      labelPosition: 'center',
      animated: false,
      style: {
        stroke: '#94a3b8',
        strokeDasharray: '',
        strokeWidth: 2,
      },
      markerEnd: 'arrowclosed',
      markerStart: 'none',
    } as ArchitectureEdge));
  } catch (error) {
    logger.error('[Pipeline] Edge generation failed:', error);
    return generateDeterministicEdges(enrichedNodes);
  }
}

function generateDeterministicEdges(nodes: ArchitectureNode[]): ArchitectureEdge[] {
  const edges: ArchitectureEdge[] = [];
  const columnOrder: string[] = ['presentation', 'application', 'data'];
  
  const edgeExists = (source: string, target: string) =>
    edges.some((e) => e.source === source && e.target === target);

  const pushEdge = (source: ArchitectureNode, target: ArchitectureNode, communicationType: 'sync' | 'async') => {
    if (edgeExists(source.id, target.id)) return;
    edges.push({
      id: `auto-${source.id}-${target.id}`,
      source: source.id,
      target: target.id,
      sourceHandle: 'right',
      targetHandle: 'left',
      communicationType,
      pathType: 'smooth',
      label: '',
      labelPosition: 'center',
      animated: communicationType === 'async',
      style: {
        stroke: '#94a3b8',
        strokeDasharray: communicationType === 'async' ? '5,5' : '',
        strokeWidth: 2,
      },
      markerEnd: 'arrowclosed',
      markerStart: 'none',
    } as ArchitectureEdge);
  };

  for (let i = 0; i < columnOrder.length - 1; i++) {
    const sourceLayer = columnOrder[i];
    const targetLayer = columnOrder[i + 1];

    const sources = nodes.filter(n => n.layer === sourceLayer);
    const targets = nodes.filter(n => n.layer === targetLayer);

    if (sources.length > 0 && targets.length > 0) {
      const commType: 'sync' | 'async' = 'sync';

      for (let s = 0; s < sources.length; s++) {
        const source = sources[s];
        const primaryTarget = targets[s % targets.length];
        pushEdge(source, primaryTarget, commType);
      }

      for (let t = 0; t < targets.length; t++) {
        const target = targets[t];
        const incomingExists = edges.some((e) => e.target === target.id);
        if (!incomingExists) {
          const source = sources[t % sources.length];
          pushEdge(source, target, commType);
        }
      }
    }
  }

  return edges;
}
