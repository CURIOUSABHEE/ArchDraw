import type { ArchitectureNode, ArchitectureEdge, UserIntent, ReactFlowNode } from '../types';
import type { TierType } from '../domain/tiers';
import { detectSystemIntent } from '../graph/ArchitectureGraph';
import { detectAWSInPrompt, enrichNodes } from '../agents/component';
import { ArchitectureGraph } from '../graph/ArchitectureGraph';
import { validateEdges, validateConnectivity, validateTierHierarchy } from '../edges/edgeValidator';
import { repairEdges, generateMissingEdges } from '../edges/edgeRepair';
import { allocatePorts, assignHandlesToEdges } from '../edges/portAllocator';
import { runDeterministicLayout, type DeterministicLayoutResult } from '../layout/deterministicLayout';
import { computeLayoutMetrics } from '../layout/layoutConfig';
import { apiKeyManager } from '../utils/apiKeyManager';
import logger from '@/lib/logger';
import {
  buildComponentPrompt,
  buildEdgePrompt,
} from '../prompts/promptBuilder';
import { ensureConnectivity } from '../graph/connectivityEnforcer';
import { autoAddCompensatingComponents } from '../graph/compensatingComponents';
import { validateDiagramQuality, type DiagramQualityReport } from '../validation/diagramQualityValidator';
import * as diagramCache from '../services/diagramCache';
import { detectDomain, validateAndFixComponents } from '../graph/componentValidator';
import { enforceMinimumConnections, detectOrphans, ensureGroupConnectivity } from '../graph/edgeValidator';
import { applyDomainEdgePatterns } from '../graph/domainEdgePatterns';

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
}

export interface PipelineHistoryEntry {
  step: 'normalize' | 'components' | 'enrich' | 'edges' | 'repair' | 'validate' | 'layout' | 'score';
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
}

const MAX_ITERATIONS = 3;
const SCORE_THRESHOLD = 75;

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
    onProgress?.('Normalizing input', 5);
    state.history.push({ step: 'normalize', timestamp: Date.now(), input: userIntent });

    // Step A: Check semantic cache before LLM call
    const cached = diagramCache.get(userIntent.description);
    if (cached) {
      logger.log('[Pipeline] Cache hit for prompt, returning cached diagram');
      onProgress?.('Complete', 100);
      return {
        success: true,
        nodes: [], // Will be computed from cached nodes after layout
        edges: cached.edges,
        state,
        score: 0,
        qualityReport: cached.qualityReport,
      };
    }

    state.systemIntent = detectSystemIntent(userIntent.description);
    state.useAWS = state.systemIntent.useAWS || detectAWSInPrompt(userIntent.description);
    logger.log(`[Pipeline] System intent: ${JSON.stringify(state.systemIntent)}, useAWS: ${state.useAWS}`);

    // Detect domain early for validation rules
    const domain = detectDomain(userIntent.description);
    logger.log(`[Pipeline] Detected domain: ${domain}`);

    onProgress?.('Generating components', 15);
    state.rawNodes = await generateComponents(state);
    
    // FIX 1: Validate and fix components post-generation
    const componentFix = validateAndFixComponents(state.rawNodes, domain);
    if (componentFix.fixApplied.length > 0) {
      console.log('[Pipeline] Component fixes applied:', componentFix.fixApplied);
    }
    state.rawNodes = componentFix.nodes;
    
    state.history.push({
      step: 'components',
      timestamp: Date.now(),
      output: state.rawNodes.length,
    });

    onProgress?.('Enriching nodes', 30);
    state.enrichedNodes = enrichNodes(state.rawNodes);
    state.history.push({
      step: 'enrich',
      timestamp: Date.now(),
      output: state.enrichedNodes.length,
    });

    onProgress?.('Generating edges', 50);
    state.edges = await generateEdges(state);
    
    // FIX 2: Apply domain-specific edge patterns
    const domainResult = applyDomainEdgePatterns(state.enrichedNodes, domain, state.edges);
    if (domainResult.added > 0) {
      console.log(`[Pipeline] Domain edge patterns added: ${domainResult.added}`);
      state.edges = [...state.edges, ...domainResult.edges];
    }
    
    state.history.push({
      step: 'edges',
      timestamp: Date.now(),
      output: state.edges.length,
    });

    // CRITICAL: If no edges generated, force retry or use fallback
    if (state.edges.length === 0) {
      console.error('[Pipeline] CRITICAL: Zero edges generated, forcing fallback');
      state.edges = generateDeterministicEdges(state.enrichedNodes);
    }

    // CRITICAL: Require minimum edges relative to node count
    const minRequiredEdges = Math.floor(state.enrichedNodes.length * 0.5);
    if (state.edges.length < minRequiredEdges) {
      console.warn(`[Pipeline] Low edge count (${state.edges.length} < ${minRequiredEdges}), adding missing edges`);
      const missingEdges = generateMissingEdges(state.enrichedNodes, state.edges);
      if (missingEdges.length > 0) {
        state.edges = [...state.edges, ...missingEdges];
      }
      // Final fallback if still insufficient
      if (state.edges.length < minRequiredEdges) {
        const fallbackEdges = generateDeterministicEdges(state.enrichedNodes);
        state.edges = [...state.edges, ...fallbackEdges];
      }
    }

    // FIX 3: Enforce minimum connections per node
    const connectionFix = enforceMinimumConnections(state.enrichedNodes, state.edges);
    if (connectionFix.fixes.length > 0) {
      console.log('[Pipeline] Connection fixes applied:', connectionFix.fixes);
      state.edges = connectionFix.edges;
    }
    
    // FIX 4: Ensure group connectivity
    const groupConnectivity = ensureGroupConnectivity(state.enrichedNodes, state.edges);
    if (groupConnectivity.fixes.length > 0) {
      console.log('[Pipeline] Group connectivity fixes:', groupConnectivity.fixes);
      state.edges = groupConnectivity.edges;
    }

    // Step B: Ensure connectivity for orphaned nodes
    const connectivityResult = ensureConnectivity(state.enrichedNodes, state.edges);
    state.edges = connectivityResult.edges;
    logger.log(`[Pipeline] Connectivity enforcement complete`);

    // Step C: Auto-add compensating resilience components
    const resilientResult = autoAddCompensatingComponents(state.enrichedNodes, state.edges);
    state.enrichedNodes = resilientResult.nodes;
    state.edges = resilientResult.edges;
    logger.log(`[Pipeline] Compensating components added`);

    // Step D: Validate diagram quality
    const qualityReport = validateDiagramQuality(state.enrichedNodes, state.edges);
    console.log('[ArchDraw Quality Gate]', qualityReport);

    onProgress?.('Validating graph', 65);
    const validationResult = validateEdges(state.edges, state.enrichedNodes);
    if (!validationResult.valid) {
      state.errors.push(...validationResult.errors.map(e => ({
        type: e.type,
        severity: e.severity,
        message: e.message,
      })));
    }

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

    const missingEdges = generateMissingEdges(state.enrichedNodes, state.edges);
    if (missingEdges.length > 0) {
      state.edges = [...state.edges, ...missingEdges];
      logger.log(`[Pipeline] Added ${missingEdges.length} missing edges`);
    }

    const portAssignments = allocatePorts(state.enrichedNodes, state.edges);
    state.edges = assignHandlesToEdges(state.edges, state.enrichedNodes, portAssignments);

    onProgress?.('Computing layout', 85);
    const layoutResult = runDeterministicLayout(
      state.enrichedNodes,
      state.edges,
      { direction: 'RIGHT' }
    );
    
    console.log('[Pipeline] Layout output - first 5 nodes:', 
      layoutResult.nodes.slice(0, 5).map(n => ({
        label: n.data.label,
        position: n.position,
        width: n.width,
        height: n.height,
        measured: n.measured,
      }))
    );
    
    state.graph = layoutResult.graph;
    state.reactFlowNodes = layoutResult.nodes;

    state.history.push({
      step: 'layout',
      timestamp: Date.now(),
      output: layoutResult.nodes.length,
    });

    onProgress?.('Scoring output', 95);
    state.score = computeScore(layoutResult.nodes.length, state.edges.length, state.errors);
    state.history.push({
      step: 'score',
      timestamp: Date.now(),
      output: state.score,
    });

    if (state.score < SCORE_THRESHOLD && state.iteration < MAX_ITERATIONS) {
      logger.log(`[Pipeline] Score ${state.score} < ${SCORE_THRESHOLD}, iteration ${state.iteration + 1}/${MAX_ITERATIONS}`);
      state.iteration++;
    }

    // Step E: Store in semantic cache
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

async function generateComponents(state: PipelineState): Promise<ArchitectureNode[]> {
  const { userIntent, useAWS } = state;
  
  const prompt = buildComponentPrompt(userIntent.description, {
    useAWS,
    minNodes: 12,
    maxNodes: 20,
  });

  try {
    const result = await apiKeyManager.executeWithRetry(async (groq) => {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a JSON-only output system. Always respond with valid JSON object with a "nodes" array. Do NOT wrap in markdown code blocks. Output ONLY raw JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      });
      return completion.choices[0]?.message?.content ?? '';
    });

    const cleaned = result
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    return parsed.nodes || [];
  } catch (error) {
    logger.error('[Pipeline] Component generation failed:', error);
    return generateFallbackFromIntent(userIntent, state.systemIntent);
  }
}

async function generateEdges(state: PipelineState): Promise<ArchitectureEdge[]> {
  const { userIntent, enrichedNodes } = state;

  const nodeSummaries = enrichedNodes
    .filter(n => !n.isGroup)
    .map(n => ({
      id: n.id,
      label: n.label,
      tier: (n.tier || n.layer) as string,
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
        stroke: '#6366f1',
        strokeDasharray: '',
        strokeWidth: 2,
      },
      markerEnd: 'arrowclosed',
      markerStart: 'none',
    }));
  } catch (error) {
    logger.error('[Pipeline] Edge generation failed:', error);
    return generateDeterministicEdges(enrichedNodes);
  }
}

function generateFallbackFromIntent(
  userIntent: UserIntent,
  intent: ReturnType<typeof detectSystemIntent>
): ArchitectureNode[] {
  const nodes: ArchitectureNode[] = [];
  
  nodes.push({
    id: 'client',
    type: 'architectureNode',
    label: 'Client App',
    subtitle: 'web browser',
    layer: 'client',
    tier: 'client',
    tierColor: '#a855f7',
    width: 180,
    height: 70,
    icon: 'monitor',
    serviceType: 'client',
    metadata: {},
  });

  if (intent.primary.includes('auth')) {
    nodes.push({
      id: 'auth-service',
      type: 'architectureNode',
      label: 'Auth Service',
      subtitle: 'authentication & authz',
      layer: 'compute',
      tier: 'compute',
      tierColor: '#14b8a6',
      width: 180,
      height: 70,
      icon: 'lock',
      serviceType: 'auth',
      metadata: {},
    });
  }

  nodes.push({
    id: 'api-gateway',
    type: 'architectureNode',
    label: 'API Gateway',
    subtitle: 'REST API entry',
    layer: 'edge',
    tier: 'edge',
    tierColor: '#8b5cf6',
    width: 180,
    height: 70,
    icon: 'webhook',
    serviceType: 'gateway',
    metadata: {},
  });

  nodes.push({
    id: 'main-service',
    type: 'architectureNode',
    label: 'Main Service',
    subtitle: 'business logic',
    layer: 'compute',
    tier: 'compute',
    tierColor: '#14b8a6',
    width: 180,
    height: 70,
    icon: 'server',
    serviceType: 'api',
    metadata: {},
  });

  if (intent.primary.includes('storage')) {
    nodes.push({
      id: 'storage',
      type: 'architectureNode',
      label: 'Object Storage',
      subtitle: 'file storage',
      layer: 'data',
      tier: 'data',
      tierColor: '#3b82f6',
      width: 180,
      height: 70,
      icon: 'hard-drive',
      serviceType: 'storage',
      metadata: {},
    });
  }

  nodes.push({
    id: 'database',
    type: 'architectureNode',
    label: 'Database',
    subtitle: 'primary data store',
    layer: 'data',
    tier: 'data',
    tierColor: '#3b82f6',
    width: 180,
    height: 70,
    icon: 'database',
    serviceType: 'database',
    metadata: {},
  });

  nodes.push({
    id: 'cache',
    type: 'architectureNode',
    label: 'Cache',
    subtitle: 'Redis cache',
    layer: 'data',
    tier: 'data',
    tierColor: '#3b82f6',
    width: 160,
    height: 70,
    icon: 'gauge',
    serviceType: 'cache',
    metadata: {},
  });

  if (intent.primary.includes('queue')) {
    nodes.push({
      id: 'queue',
      type: 'architectureNode',
      label: 'Message Queue',
      subtitle: 'async messaging',
      layer: 'async',
      tier: 'async',
      tierColor: '#f59e0b',
      width: 180,
      height: 70,
      icon: 'message-square',
      serviceType: 'queue',
      metadata: {},
    });
  }

  return nodes;
}

function generateDeterministicEdges(nodes: ArchitectureNode[]): ArchitectureEdge[] {
  const edges: ArchitectureEdge[] = [];
  const tierOrder: TierType[] = ['client', 'edge', 'compute', 'async', 'data', 'observe'];

  for (let i = 0; i < tierOrder.length - 1; i++) {
    const sourceTier = tierOrder[i];
    const targetTier = tierOrder[i + 1];

    const sources = nodes.filter(n => (n.tier || n.layer) === sourceTier && !n.isGroup);
    const targets = nodes.filter(n => (n.tier || n.layer) === targetTier && !n.isGroup);

    if (sources.length > 0 && targets.length > 0) {
      // Connect EVERY source to EVERY target (was: limit to 2×2)
      for (const source of sources) {
        for (const target of targets) {
          edges.push({
            id: `auto-${source.id}-${target.id}`,
            source: source.id,
            target: target.id,
            sourceHandle: 'right',
            targetHandle: 'left',
            communicationType: targetTier === 'async' ? 'async' : 'sync',
            pathType: 'smooth',
            label: '',
            labelPosition: 'center',
            animated: targetTier === 'async',
            style: {
              stroke: '#6366f1',
              strokeDasharray: targetTier === 'async' ? '5,5' : '',
              strokeWidth: 2,
            },
            markerEnd: 'arrowclosed',
            markerStart: 'none',
          });
        }
      }
    }
  }

  // Also connect async to compute/observe for consumers
  const asyncNodes = nodes.filter(n => (n.tier || n.layer) === 'async' && !n.isGroup);
  const computeNodes = nodes.filter(n => (n.tier || n.layer) === 'compute' && !n.isGroup);
  const observeNodes = nodes.filter(n => (n.tier || n.layer) === 'observe' && !n.isGroup);
  
  for (const asyncNode of asyncNodes) {
    for (const computeNode of computeNodes) {
      edges.push({
        id: `auto-${asyncNode.id}-${computeNode.id}`,
        source: asyncNode.id,
        target: computeNode.id,
        sourceHandle: 'right',
        targetHandle: 'left',
        communicationType: 'async',
        pathType: 'smooth',
        label: '',
        labelPosition: 'center',
        animated: true,
        style: {
          stroke: '#6366f1',
          strokeDasharray: '5,5',
          strokeWidth: 2,
        },
        markerEnd: 'arrowclosed',
        markerStart: 'none',
      });
    }
  }

  return edges;
}

function computeScore(
  nodeCount: number,
  edgeCount: number,
  errors: PipelineError[]
): number {
  let score = 100;

  if (nodeCount < 8) score -= (8 - nodeCount) * 5;
  if (nodeCount > 25) score -= (nodeCount - 25) * 3;

  if (edgeCount === 0) score -= 40;
  else if (nodeCount > 0) {
    const expectedEdges = Math.floor(nodeCount * 0.8);
    const edgeRatio = edgeCount / expectedEdges;
    if (edgeRatio < 0.5) score -= 20;
    if (edgeRatio > 2) score -= 10;
  }

  const criticalErrors = errors.filter(e => e.severity === 'critical');
  score -= criticalErrors.length * 15;

  return Math.max(0, Math.min(100, score));
}
