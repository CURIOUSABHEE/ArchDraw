import type { UserIntent, GenerationResult, GenerationProgress, ReactFlowNode, ReactFlowEdge, ArchitectureEdge, ArchitectureNode, PathType, ArchitectureBoundaries, ArchitectureLayer, LayerType } from '../types';
import { apiKeyManager } from '../utils/apiKeyManager';
import { enrichNodes } from '../agents/component';
import { robustDetectIntent } from '../graph/ArchitectureGraph';
import { computeELKLayout } from './elkLayoutService';
import { computeEdgeLayout } from './edgeLayout';
import { detectEdgeCollisions } from './edgeCollisionDetector';
import { resolveCollisions as fixCollisions } from './edgeCollisionDetector';
import { optimizeEdgePaths } from './edgePathOptimizer';
import { computeOptimalLabelPositions } from './edgeLabelPositioner';
import { filterBidirectionalEdges } from './edgeLayout';
import { COMPONENT_AGENT_PROMPT, getComposedPrompt, REASONING_PROMPT, DIAGRAM_PROMPT, MODEL_CONFIG } from '../constants';
import logger from '@/lib/logger';

export type ProgressCallback = (progress: GenerationProgress) => void;

const GROQ_TIMEOUT_MS = 2500;
const OPENROUTER_TIMEOUT_MS = 8000;
const MAX_NODES = 20;
const MAX_EDGES_PER_NODE = 3;

const LAYER_ORDER = ['client', 'edge', 'compute', 'async', 'data', 'observe', 'external'];
const LAYER_X: Record<string, number> = { client: 50, edge: 320, compute: 650, async: 1000, data: 1350, observe: 1700, external: 2050 };

const COMM_STYLES: Record<string, { color: string; dash: string; animated: boolean; marker: string }> = {
  sync: { color: '#6366f1', dash: '', animated: false, marker: 'arrowclosed' },
  async: { color: '#f59e0b', dash: '8,4', animated: true, marker: 'arrowclosed' },
  stream: { color: '#10b981', dash: '4,2', animated: true, marker: 'arrowclosed' },
  event: { color: '#ec4899', dash: '2,3', animated: true, marker: 'arrowclosed' },
  dep: { color: '#6b7280', dash: '6,3', animated: false, marker: 'none' },
};

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry { nodes: ArchitectureNode[]; flows: string[][]; ts: number }

class SemanticCache {
  private memory = new Map<string, CacheEntry>();
  private inFlight = new Map<string, Promise<CacheEntry>>();

  buildCacheKey(intentType: string, description: string): string {
    // Filter out common stop words that don't help distinguish prompts
    const stopWords = new Set(['a', 'an', 'and', 'or', 'the', 'is', 'it', 'to', 'of', 'for', 'in', 'on', 'with', 'that', 'this', 'as', 'at', 'by', 'from', 'be', 'are', 'was', 'were', 'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'i', 'you', 'we', 'they', 'he', 'she', 'my', 'your', 'our', 'their', 'what', 'which', 'who', 'when', 'where', 'how', 'why']);
    
    const words = description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .sort();
    
    // Take first 40 unique words - enough context to distinguish prompts
    const uniqueWords = [...new Set(words)].slice(0, 40);
    const key = uniqueWords.join(' ');
    
    // Create hash to keep key short but unique
    const hash = Array.from(key).reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    
    return `${intentType}:${Math.abs(hash).toString(36)}:${key.slice(0, 80)}`;
  }

  get(key: string): LLMResponse | null {
    const entry = this.memory.get(key);
    if (entry && Date.now() - entry.ts < CACHE_TTL_MS) {
      logger.log('[SemanticCache] HIT:', key.slice(0, 100));
      return { nodes: entry.nodes, flows: entry.flows };
    }
    if (entry) {
      logger.log('[SemanticCache] STALE:', key.slice(0, 100));
    } else {
      logger.log('[SemanticCache] MISS:', key.slice(0, 100));
    }
    return null;
  }

  set(key: string, data: LLMResponse): void {
    this.memory.set(key, { nodes: data.nodes, flows: data.flows, ts: Date.now() });
    if (this.memory.size > 100) {
      this.prune();
    }
  }

  isInFlight(key: string): boolean {
    return this.inFlight.has(key);
  }

  startRequest(key: string, promise: Promise<CacheEntry>): void {
    this.inFlight.set(key, promise);
    promise.finally(() => this.inFlight.delete(key));
  }

  waitForRequest(key: string): Promise<CacheEntry> | undefined {
    return this.inFlight.get(key);
  }

  private prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.memory.entries()) {
      if (now - entry.ts > CACHE_TTL_MS) {
        this.memory.delete(key);
      }
    }
  }

  clear(): void {
    this.memory.clear();
    this.inFlight.clear();
  }
}

const semanticCache = new SemanticCache();

// DISABLED: Caching was causing repeated diagrams for different prompts
// TODO: Fix cache key generation to properly distinguish prompts
const CACHE_ENABLED = false;

// ============================================================================
// STREAMING TYPES & PARSER
// ============================================================================

export type StreamingCallback = (event: StreamingEvent) => void;

export interface StreamingEvent {
  type: 'token' | 'node' | 'flow' | 'thinking' | 'complete' | 'error';
  data?: string | ArchitectureNode | { path: string[]; label?: string };
  reasoning?: Partial<ArchitectureAnalysis>;
}

class IncrementalJSONParser {
  private buffer = '';
  private completedObjects: Record<string, unknown>[] = [];

  push(chunk: string): void {
    this.buffer += chunk;
    this.tryExtractObjects();
  }

  private tryExtractObjects(): void {
    let depth = 0;
    let start = -1;

    for (let i = 0; i < this.buffer.length; i++) {
      if (this.buffer[i] === '{') {
        if (depth === 0) start = i;
        depth++;
      } else if (this.buffer[i] === '}') {
        depth--;
        if (depth === 0 && start !== -1) {
          const candidate = this.buffer.slice(start, i + 1);
          try {
            const obj = JSON.parse(candidate);
            this.completedObjects.push(obj);
          } catch { /* incomplete JSON, continue */ }
          start = -1;
        }
      }
    }

    if (this.completedObjects.length > 0) {
      const lastBrace = this.buffer.lastIndexOf('}');
      if (lastBrace !== -1) {
        this.buffer = this.buffer.slice(lastBrace + 1);
      }
    }
  }

  drain(): Record<string, unknown>[] {
    const objs = [...this.completedObjects];
    this.completedObjects = [];
    return objs;
  }

  getBuffer(): string {
    return this.buffer;
  }
}

async function* streamLLMResponse(
  prompt: string,
  intentType: string,
  onToken: (token: string) => void
): AsyncGenerator<string> {
  const { systemPrompt, userPrompt } = getComposedPrompt(prompt, intentType);

  const groqKeyEnvVars = [
    'GROQ_API_KEY_FOR_DESC_1', 'GROQ_API_KEY_FOR_DESC_2', 'GROQ_API_KEY_FOR_DESC_3',
    'GROQ_API_KEY_FOR_DESC_4', 'GROQ_API_KEY_FOR_DESC_5', 'GROQ_API_KEY_FOR_DESC_6',
    'GROQ_API_KEY_FOR_DESC_7', 'GROQ_API_KEY_FOR_DESC_8', 'GROQ_API_KEY_FOR_DESC_9',
  ];

  for (const envVar of groqKeyEnvVars) {
    const apiKey = process.env[envVar];
    if (!apiKey || apiKey.startsWith('#')) continue;

    try {
      const Groq = (await import('groq-sdk')).default;
      const groq = new Groq({ apiKey });

      const stream = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Design the architecture for this system:\n\n${userPrompt}` }
        ],
        temperature: 0.2,
        max_tokens: 1024,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          onToken(content);
          yield content;
        }
      }
      return;
    } catch (error) {
      logger.log(`[Streaming] Groq key ${envVar} failed, trying next...`);
      continue;
    }
  }

  throw new Error('All Groq keys exhausted for streaming');
}

async function parseStreamingResponse(
  prompt: string,
  useAWS: boolean,
  intentType: string,
  onEvent: StreamingCallback
): Promise<LLMResponse> {
  const parser = new IncrementalJSONParser();
  const reasoning: Partial<ArchitectureAnalysis> = {};
  const nodes: ArchitectureNode[] = [];
  const flows: string[][] = [];
  let accumulatedTokens = '';

  try {
    for await (const token of streamLLMResponse(prompt, intentType, (t: string) => {
      accumulatedTokens += t;
      parser.push(t);
    })) {
      const objs = parser.drain();
      
      for (const obj of objs) {
        const objWithId = obj as Record<string, unknown>;
        if (obj.type === 'node' || objWithId.id) {
          const node = objWithId as unknown as ArchitectureNode;
          if (node.id && node.label) {
            nodes.push({
              id: node.id,
              type: 'architectureNode',
              label: node.label,
              layer: (node.layer as LayerType) || 'compute',
              width: 180,
              height: 70,
              icon: node.icon || 'server',
              metadata: node.metadata || {},
              subtitle: node.subtitle || node.label,
            });
            onEvent({ type: 'node', data: nodes[nodes.length - 1] });
          }
        } else if (obj.type === 'flow' || objWithId.path) {
          const flow = obj as { path: string[]; label?: string };
          if (Array.isArray(flow.path) && flow.path.length >= 2) {
            flows.push(flow.path);
            onEvent({ type: 'flow', data: flow });
          }
        } else if (obj.systemType || obj.nfrs || obj.boundaries || obj.patterns) {
          const thinkingObj = obj as { systemType?: string; boundaries?: ArchitectureAnalysis['boundaries']; patterns?: ArchitectureAnalysis['patternSelections']; stressTests?: ArchitectureAnalysis['stressTestResults'] };
          reasoning.problemFraming = thinkingObj.systemType;
          reasoning.boundaries = thinkingObj.boundaries;
          reasoning.patternSelections = thinkingObj.patterns;
          reasoning.stressTestResults = thinkingObj.stressTests;
          onEvent({ type: 'thinking', reasoning });
        }
      }
    }

    if (nodes.length === 0 && flows.length === 0) {
      const cleaned = accumulatedTokens.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      const parsed = JSON.parse(cleaned);
      
      if (parsed.layerAssignment && Object.keys(parsed.layerAssignment).length > 0) {
        Object.assign(reasoning, {
          problemFraming: parsed.systemType,
          boundaries: parsed.boundaries,
          patternSelections: parsed.patterns,
          stressTestResults: parsed.stressTests,
        });

        for (const [label, layer] of Object.entries(parsed.layerAssignment)) {
          nodes.push({
            id: label.toLowerCase().replace(/\s+/g, '-'),
            type: 'architectureNode',
            label,
            layer: (layer as LayerType) || 'compute',
            width: 180,
            height: 70,
            icon: 'server',
            metadata: {},
          });
        }
      }

      if (parsed.flows) {
        flows.push(...parsed.flows);
      }
    }

    onEvent({ type: 'complete' });

    return {
      nodes,
      flows,
      reasoning: reasoning as ArchitectureAnalysis,
      analysis: null,
    };
  } catch (error) {
    onEvent({ type: 'error', data: error instanceof Error ? error.message : 'Streaming failed' });
    throw error;
  }
}

interface StressTestResult {
  scenario: string;
  outcome: string;
  safe: boolean;
}

interface ArchitectureAnalysis {
  problemFraming?: string;
  boundaries?: { 
    entryPoints?: string[]; 
    exitPoints?: string[]; 
    trustBoundaries?: string[] 
  };
  layerAssignment?: Record<string, string>;
  patternSelections?: { pattern: string; justification: string }[];
  stressTestResults?: StressTestResult[];
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface QualityBreakdown {
  structuralCompleteness: number;
  flowCoverage: number;
  edgeQuality: number;
  reasoningDepth: number;
}

interface QualityScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  breakdown: QualityBreakdown;
  warnings: string[];
}

interface ComplexityProfile {
  tier: 'simple' | 'moderate' | 'complex';
  maxEdges: number;
  maxNodesPerColumn: number;
  splitDiagrams: boolean;
}

interface LLMResponse { 
  nodes: ArchitectureNode[]; 
  flows: string[][];
  reasoning?: ArchitectureAnalysis;
  analysis?: ArchitectureAnalysis | null;
}

// ============================================================================
// DETERMINISTIC QUALITY SCORER
// ============================================================================

function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  return 'D';
}

function getReachableNodes(nodes: ReactFlowNode[], edges: ReactFlowEdge[]): Set<string> {
  const entryNodes = nodes.filter(n => n.data?.layer === 'client' || n.data?.layer === 'edge');
  const reachable = new Set<string>(entryNodes.map(n => n.id));
  const adj = new Map<string, string[]>();
  
  for (const edge of edges) {
    if (!adj.has(edge.source)) adj.set(edge.source, []);
    adj.get(edge.source)!.push(edge.target);
  }

  const queue = [...entryNodes.map(n => n.id)];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of adj.get(current) || []) {
      if (!reachable.has(neighbor)) {
        reachable.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return reachable;
}

function computeDiagramQualityScore(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[],
  reasoning: ArchitectureAnalysis | null | undefined
): QualityScore {
  const breakdown: QualityBreakdown = {
    structuralCompleteness: 0,
    flowCoverage: 0,
    edgeQuality: 0,
    reasoningDepth: 0,
  };

  const hasEntryPoint = nodes.some(n => n.data?.layer === 'client' || n.data?.layer === 'edge');
  const hasDataLayer = nodes.some(n => n.data?.layer === 'data');
  const hasCompute = nodes.some(n => n.data?.layer === 'compute');

  breakdown.structuralCompleteness =
    (hasEntryPoint ? 15 : 0) +
    (hasDataLayer ? 15 : 0) +
    (hasCompute ? 10 : 0);

  const reachable = getReachableNodes(nodes, edges);
  const orphanRatio = nodes.length > 0 ? 1 - (reachable.size / nodes.length) : 0;
  breakdown.flowCoverage = Math.round(30 * (1 - orphanRatio));

  const hasAsyncEdges = edges.some(e => e.data?.communicationType === 'async');
  const edgeCount = edges.length;
  breakdown.edgeQuality = Math.round(15 * (edgeCount > 0 ? Math.min(edgeCount / 10, 1) : 0)) +
    (hasAsyncEdges ? 5 : 0);

  const hasStressTest = (reasoning?.stressTestResults?.length ?? 0) >= 3;
  const hasPatterns = (reasoning?.patternSelections?.length ?? 0) >= 2;
  breakdown.reasoningDepth =
    (hasStressTest ? 5 : 0) +
    (hasPatterns ? 5 : 0);

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);

  const warnings: string[] = [];
  if (breakdown.structuralCompleteness < 30) warnings.push('Missing key architectural layers.');
  if (breakdown.flowCoverage < 20) warnings.push('Orphaned nodes detected — some components are unreachable.');
  if (breakdown.edgeQuality < 10) warnings.push('Edges lack labels — data flows are ambiguous.');

  return { score, grade: scoreToGrade(score), breakdown, warnings };
}

// ============================================================================
// ADAPTIVE LIMITS
// ============================================================================

function deriveComplexityProfile(
  nodeCount: number,
  patternSelections: { pattern: string; justification: string }[] | undefined,
  intentType: string
): ComplexityProfile {
  const patterns = patternSelections?.map(p => p.pattern.toLowerCase()) || [];
  const isEventDriven = patterns.some(p => p.includes('event') || p.includes('async'));
  const isMicroservices = patterns.some(p => p.includes('micro') || p.includes('service'));
  const isDataPipeline = intentType.includes('pipeline') || intentType.includes('data');

  if (nodeCount <= 6 && !isEventDriven && !isMicroservices) {
    return { tier: 'simple', maxEdges: 20, maxNodesPerColumn: 4, splitDiagrams: false };
  }

  if (nodeCount <= 12 || isEventDriven) {
    return { tier: 'moderate', maxEdges: 40, maxNodesPerColumn: 6, splitDiagrams: false };
  }

  return { tier: 'complex', maxEdges: 60, maxNodesPerColumn: 8, splitDiagrams: true };
}

function applyEdgeLimits(
  edges: ArchitectureEdge[],
  profile: ComplexityProfile
): { edges: ArchitectureEdge[]; truncated: boolean; droppedCount: number } {
  if (edges.length <= profile.maxEdges) {
    return { edges, truncated: false, droppedCount: 0 };
  }

  const priority = (e: ArchitectureEdge): number => {
    if (e.communicationType === 'sync') return 3;
    if (e.communicationType === 'async') return 2;
    if (e.animated) return 1;
    return 0;
  };

  const sorted = [...edges].sort((a, b) => priority(b) - priority(a));
  const kept = sorted.slice(0, profile.maxEdges);
  const droppedCount = edges.length - kept.length;

  return { edges: kept, truncated: true, droppedCount };
}

interface StressTest {
  scenario: string;
  outcome: string;
  safe: boolean;
  mitigation?: string;
}

function autoAddCompensatingComponents(
  nodes: ArchitectureNode[],
  stressTests: StressTest[] | undefined
): ArchitectureNode[] {
  if (!stressTests || stressTests.length === 0) return nodes;

  const existingLabels = new Set(nodes.map(n => n.label.toLowerCase()));
  const newNodes: ArchitectureNode[] = [];

  for (const test of stressTests) {
    if (test.safe) continue;

    const scenario = test.scenario.toLowerCase();

    if (scenario.includes('db') || scenario.includes('database') || scenario.includes('storage')) {
      if (!existingLabels.has('cache') && !existingLabels.has('redis') && !existingLabels.has('memcached')) {
        newNodes.push({
          id: `auto-cache-${Date.now()}`,
          type: 'architectureNode',
          label: 'Cache Layer',
          subtitle: 'Read-through cache for DB resilience',
          layer: 'data',
          tier: 'data',
          tierColor: '#3b82f6',
          width: 160,
          height: 70,
          icon: 'gauge',
          serviceType: 'cache',
          metadata: { autoAdded: true, reason: `Stress test: ${test.scenario}` },
        });
        existingLabels.add('cache');
      }
    }

    if (scenario.includes('traffic') || scenario.includes('spike') || scenario.includes('load')) {
      if (!existingLabels.has('load balancer') && !existingLabels.has('lb')) {
        newNodes.push({
          id: `auto-lb-${Date.now()}`,
          type: 'architectureNode',
          label: 'Load Balancer',
          subtitle: 'Traffic distribution and auto-scaling',
          layer: 'edge',
          tier: 'edge',
          tierColor: '#8b5cf6',
          width: 170,
          height: 70,
          icon: 'scale',
          serviceType: 'loadbalancer',
          metadata: { autoAdded: true, reason: `Stress test: ${test.scenario}` },
        });
        existingLabels.add('load balancer');
      }
    }

    if (scenario.includes('api') || scenario.includes('third-party') || scenario.includes('external')) {
      if (!existingLabels.has('circuit breaker') && !existingLabels.has('cb')) {
        newNodes.push({
          id: `auto-cb-${Date.now()}`,
          type: 'architectureNode',
          label: 'Circuit Breaker',
          subtitle: 'Fallback for external API failures',
          layer: 'compute',
          tier: 'compute',
          tierColor: '#14b8a6',
          width: 180,
          height: 70,
          icon: 'shield',
          serviceType: 'generic',
          metadata: { autoAdded: true, reason: `Stress test: ${test.scenario}` },
        });
        existingLabels.add('circuit breaker');
      }
    }

    if (scenario.includes('job') || scenario.includes('background') || scenario.includes('worker')) {
      if (!existingLabels.has('dead letter queue') && !existingLabels.has('dlq')) {
        newNodes.push({
          id: `auto-dlq-${Date.now()}`,
          type: 'architectureNode',
          label: 'Dead Letter Queue',
          subtitle: 'Failed job retry and compensation',
          layer: 'async',
          tier: 'async',
          tierColor: '#f59e0b',
          width: 170,
          height: 70,
          icon: 'alert-circle',
          serviceType: 'queue',
          metadata: { autoAdded: true, reason: `Stress test: ${test.scenario}` },
        });
        existingLabels.add('dead letter queue');
      }
    }
  }

  if (newNodes.length > 0) {
    logger.log(`[StressTest] Auto-added ${newNodes.length} compensating components:`,
      newNodes.map(n => n.label).join(', '));
  }

  return [...nodes, ...newNodes];
}

function validateReasoningOutput(reasoning: ArchitectureAnalysis | null | undefined): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!reasoning) {
    return { valid: false, errors: ['MISSING_REASONING: No reasoning output from LLM'], warnings: [] };
  }

  if (!reasoning.boundaries?.entryPoints?.length) {
    errors.push('MISSING_ENTRY_POINT: No entry point identified. Cannot generate flows.');
  }

  const hasDataLayer = Object.values(reasoning.layerAssignment || {})
    .some(layer => layer?.toLowerCase() === 'data');
  if (!hasDataLayer) {
    errors.push('MISSING_DATA_LAYER: No data layer component. All systems persist state.');
  }

  if (!reasoning.patternSelections?.length) {
    errors.push('MISSING_PATTERNS: No architectural patterns selected.');
  }

  if ((reasoning.stressTestResults?.length ?? 0) < 3) {
    errors.push('INCOMPLETE_STRESS_TEST: Fewer than 3 failure scenarios evaluated.');
  }

  const unsafeScenarios = reasoning.stressTestResults?.filter(r => !r.safe) ?? [];
  if (unsafeScenarios.length > 0) {
    errors.push(
      `UNSAFE_SCENARIOS: ${unsafeScenarios.length} failure scenario(s) have no recovery path: ` +
      unsafeScenarios.map(s => s.scenario).join(', ')
    );
  }

  if (!reasoning.boundaries?.trustBoundaries?.length) {
    warnings.push('No trust boundaries defined. Consider adding auth/public boundary.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms))
    ]);
  } catch { return null; }
}

async function callLLM(
  prompt: string,
  intentType: string = 'generic-web-app'
): Promise<LLMResponse> {
  const { systemPrompt, userPrompt } = getComposedPrompt(prompt, intentType);

  const groqResponse = await withTimeout(
    apiKeyManager.executeWithRetry(async (groq) => {
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Design the architecture for this system:\n\n${userPrompt}` }
        ],
        temperature: 0.2,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      });
      return res.choices[0]?.message?.content ?? '';
    }),
    GROQ_TIMEOUT_MS
  );

  if (groqResponse) {
    try {
      const cleaned = groqResponse.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      const parsed = JSON.parse(cleaned);
      
      if (parsed.systemType) {
        logger.log('[LLM] SystemType:', parsed.systemType);
      }
      
      let nodes = parsed.nodes || [];
      const flows = parsed.flows || [];
      
      if (parsed.layerAssignment && Object.keys(parsed.layerAssignment).length > 0 && nodes.length === 0) {
        nodes = Object.entries(parsed.layerAssignment).map(([label, layer]) => ({
          id: label.toLowerCase().replace(/\s+/g, '-'),
          label,
          layer,
          type: 'architectureNode',
          width: 180,
          height: 70,
          icon: 'server',
          metadata: {},
        }));
      }
      
      return {
        nodes: nodes || [],
        flows: flows || [],
        reasoning: {
          problemFraming: parsed.systemType,
          boundaries: {
            entryPoints: parsed.boundaries?.entryPoints || [],
            exitPoints: parsed.boundaries?.exitPoints || [],
            trustBoundaries: parsed.boundaries?.trustZones || [],
          },
          layerAssignment: parsed.layerAssignment || {},
          patternSelections: parsed.patterns || [],
          stressTestResults: parsed.stressTests || [],
        },
        analysis: null,
      };
    } catch (e) {
      logger.error('[LLM] Parse error:', e);
    }
  }

  logger.log('[LLM] Groq failed, trying OpenRouter...');
  const orResponse = await withTimeout(callOpenRouter(prompt), OPENROUTER_TIMEOUT_MS);
  if (orResponse) return orResponse;

  logger.warn('[LLM] All providers failed, using fallback');
  return getFallbackResponse();
}

async function callOpenRouter(prompt: string): Promise<LLMResponse> {
  const OR_KEY = process.env.OPENROUTER_API_KEY;
  if (!OR_KEY) throw new Error('No OpenRouter key');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OR_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct',
      messages: [
        { role: 'system', content: 'JSON only: {"nodes":[...],"flows":[[...]]}' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  return JSON.parse(cleaned);
}

// ============================================================================
// SPLIT LLM CALL STRATEGY
// ============================================================================

async function callReasoningLLM(
  description: string,
  intentType: string
): Promise<ArchitectureAnalysis> {
  const systemPrompt = REASONING_PROMPT
    .replace('{description}', description)
    .replace('{intent}', intentType);

  const groqKeyEnvVars = [
    'GROQ_API_KEY_FOR_DESC_1', 'GROQ_API_KEY_FOR_DESC_2', 'GROQ_API_KEY_FOR_DESC_3',
    'GROQ_API_KEY_FOR_DESC_4', 'GROQ_API_KEY_FOR_DESC_5', 'GROQ_API_KEY_FOR_DESC_6',
    'GROQ_API_KEY_FOR_DESC_7', 'GROQ_API_KEY_FOR_DESC_8', 'GROQ_API_KEY_FOR_DESC_9',
  ];

  for (const envVar of groqKeyEnvVars) {
    const apiKey = process.env[envVar];
    if (!apiKey || apiKey.startsWith('#')) continue;

    try {
      const Groq = (await import('groq-sdk')).default;
      const groq = new Groq({ apiKey });

      const res = await withTimeout(
        groq.chat.completions.create({
          model: MODEL_CONFIG.reasoning.primary,
          messages: [{ role: 'user', content: systemPrompt }],
          temperature: MODEL_CONFIG.reasoning.temperature,
          max_tokens: MODEL_CONFIG.reasoning.maxTokens,
          response_format: { type: 'json_object' },
        }),
        MODEL_CONFIG.reasoning.timeout
      );

      if (res) {
        const content = res.choices[0]?.message?.content ?? '';
        const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        const parsed = JSON.parse(cleaned);
        
        logger.log('[Reasoning] SystemType:', parsed.systemType);
        
        return {
          problemFraming: parsed.systemType,
          boundaries: {
            entryPoints: parsed.boundaries?.entryPoints || [],
            exitPoints: parsed.boundaries?.exitPoints || [],
            trustBoundaries: parsed.boundaries?.trustZones || [],
          },
          layerAssignment: parsed.layerAssignment || {},
          patternSelections: parsed.patterns || [],
          stressTestResults: parsed.stressTests || [],
        };
      }
    } catch (error) {
      logger.log(`[Reasoning] Groq key ${envVar} failed, trying next...`);
      continue;
    }
  }

  throw new Error('All Groq keys exhausted for reasoning');
}

async function callDiagramLLM(
  reasoning: ArchitectureAnalysis,
  onStreaming?: StreamingCallback
): Promise<{ nodes: ArchitectureNode[]; flows: string[][] }> {
  const reasoningJson = JSON.stringify(reasoning);
  const systemPrompt = DIAGRAM_PROMPT.replace('{reasoning}', reasoningJson);

  const groqKeyEnvVars = [
    'GROQ_API_KEY_FOR_DESC_1', 'GROQ_API_KEY_FOR_DESC_2', 'GROQ_API_KEY_FOR_DESC_3',
    'GROQ_API_KEY_FOR_DESC_4', 'GROQ_API_KEY_FOR_DESC_5', 'GROQ_API_KEY_FOR_DESC_6',
    'GROQ_API_KEY_FOR_DESC_7', 'GROQ_API_KEY_FOR_DESC_8', 'GROQ_API_KEY_FOR_DESC_9',
  ];

  const nodes: ArchitectureNode[] = [];
  const flows: string[][] = [];

  for (const envVar of groqKeyEnvVars) {
    const apiKey = process.env[envVar];
    if (!apiKey || apiKey.startsWith('#')) continue;

    try {
      const Groq = (await import('groq-sdk')).default;
      const groq = new Groq({ apiKey });

      if (onStreaming) {
        const stream = await withTimeout(
          groq.chat.completions.create({
            model: MODEL_CONFIG.diagram.primary,
            messages: [{ role: 'user', content: systemPrompt }],
            temperature: MODEL_CONFIG.diagram.temperature,
            max_tokens: MODEL_CONFIG.diagram.maxTokens,
            stream: true,
          }),
          MODEL_CONFIG.diagram.timeout
        ) as AsyncIterable<{ choices: { delta: { content?: string } }[] }>;

        if (stream) {
          const parser = new IncrementalJSONParser();
          let accumulated = '';

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              accumulated += content;
              parser.push(content);
              
              const objs = parser.drain();
              for (const obj of objs) {
                const objWithId = obj as Record<string, unknown>;
                if (objWithId.id && objWithId.label) {
                  const node: ArchitectureNode = {
                    id: String(objWithId.id),
                    type: 'architectureNode',
                    label: String(objWithId.label),
                    layer: (objWithId.layer as LayerType) || 'compute',
                    width: 180,
                    height: 70,
                    icon: (objWithId.icon as string) || 'server',
                    metadata: {},
                    subtitle: objWithId.subtitle ? String(objWithId.subtitle) : String(objWithId.label),
                  };
                  nodes.push(node);
                  onStreaming({ type: 'node', data: node });
                } else if (obj.type === 'flow' || (obj as Record<string, unknown>).path) {
                  const flow = obj as { path: string[]; label?: string };
                  if (Array.isArray(flow.path) && flow.path.length >= 2) {
                    flows.push(flow.path);
                    onStreaming({ type: 'flow', data: flow });
                  }
                }
              }
            }
          }
          
          if (nodes.length === 0 && flows.length === 0) {
            return parseDiagramResponse(accumulated);
          }
        }
      } else {
        const res = await withTimeout(
          groq.chat.completions.create({
            model: MODEL_CONFIG.diagram.primary,
            messages: [{ role: 'user', content: systemPrompt }],
            temperature: MODEL_CONFIG.diagram.temperature,
            max_tokens: MODEL_CONFIG.diagram.maxTokens,
            response_format: { type: 'json_object' },
          }),
          MODEL_CONFIG.diagram.timeout
        );

        if (res) {
          const content = res.choices[0]?.message?.content ?? '';
          return parseDiagramResponse(content);
        }
      }
    } catch (error) {
      logger.log(`[Diagram] Groq key ${envVar} failed, trying next...`);
      continue;
    }
  }

  throw new Error('All Groq keys exhausted for diagram');
}

function parseDiagramResponse(content: string): { nodes: ArchitectureNode[]; flows: string[][] } {
  const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  
  const nodes: ArchitectureNode[] = [];
  const flows: string[][] = [];
  
  const lines = cleaned.split('\n').filter(l => l.trim());
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj.id && obj.label) {
        nodes.push({
          id: obj.id,
          type: 'architectureNode',
          label: obj.label,
          layer: (obj.layer as LayerType) || 'compute',
          width: 180,
          height: 70,
          icon: obj.icon || 'server',
          metadata: {},
          subtitle: obj.subtitle || obj.label,
        });
      } else if (obj.type === 'flow' || obj.path) {
        if (Array.isArray(obj.path) && obj.path.length >= 2) {
          flows.push(obj.path);
        }
      }
    } catch { continue; }
  }
  
  if (nodes.length === 0) {
    const parsed = JSON.parse(cleaned);
    if (parsed.layerAssignment) {
      for (const [label, layer] of Object.entries(parsed.layerAssignment)) {
        nodes.push({
          id: label.toLowerCase().replace(/\s+/g, '-'),
          type: 'architectureNode',
          label,
          layer: (layer as LayerType) || 'compute',
          width: 180,
          height: 70,
          icon: 'server',
          metadata: {},
        });
      }
    }
    if (parsed.flows) {
      flows.push(...parsed.flows);
    }
  }
  
  return { nodes, flows };
}

function getFallbackResponse(): LLMResponse {
  return {
    nodes: [
      { id: 'client', type: 'architectureNode', label: 'Client App', layer: 'client', tier: 'client', tierColor: '#a855f7', width: 180, height: 70, icon: 'monitor', serviceType: 'client', metadata: {} },
      { id: 'cdn', type: 'architectureNode', label: 'CDN', subtitle: 'content delivery', layer: 'edge', tier: 'edge', tierColor: '#8b5cf6', width: 180, height: 70, icon: 'globe', serviceType: 'cdn', metadata: { technology: 'generic-cdn' } },
      { id: 'gateway', type: 'architectureNode', label: 'API Gateway', subtitle: 'REST entry', layer: 'edge', tier: 'edge', tierColor: '#8b5cf6', width: 180, height: 70, icon: 'webhook', serviceType: 'gateway', metadata: { technology: 'generic-api-gateway' } },
      { id: 'auth', type: 'architectureNode', label: 'Auth Service', subtitle: 'authentication', layer: 'compute', tier: 'compute', tierColor: '#14b8a6', width: 180, height: 70, icon: 'lock', serviceType: 'auth', metadata: { technology: 'generic-auth' } },
      { id: 'api', type: 'architectureNode', label: 'API Server', subtitle: 'business logic', layer: 'compute', tier: 'compute', tierColor: '#14b8a6', width: 180, height: 70, icon: 'server', serviceType: 'api', metadata: { technology: 'generic-api-server' } },
      { id: 'queue', type: 'architectureNode', label: 'Message Queue', subtitle: 'async messaging', layer: 'async', tier: 'async', tierColor: '#f59e0b', width: 180, height: 70, icon: 'message-square', serviceType: 'queue', metadata: { technology: 'generic-queue' } },
      { id: 'db', type: 'architectureNode', label: 'Database', subtitle: 'main store', layer: 'data', tier: 'data', tierColor: '#3b82f6', width: 180, height: 70, icon: 'database', serviceType: 'database', metadata: { technology: 'generic-sql' } },
      { id: 'cache', type: 'architectureNode', label: 'Cache', subtitle: 'Redis cache', layer: 'data', tier: 'data', tierColor: '#3b82f6', width: 160, height: 70, icon: 'gauge', serviceType: 'cache', metadata: { technology: 'generic-cache' } },
    ],
    flows: [
      ['Client App', 'CDN', 'API Gateway', 'API Server', 'Database'],
      ['Client App', 'API Gateway', 'Auth Service'],
      ['API Server', 'Message Queue'],
      ['API Server', 'Cache'],
    ],
  };
}

function flowsToEdges(nodes: ArchitectureNode[], flows: string[][]): ArchitectureEdge[] {
  const edges: ArchitectureEdge[] = [];
  const nodeMap = new Map(nodes.map(n => [n.label.toLowerCase(), n.id]));
  const nodeTierMap = new Map(nodes.map(n => [n.id, n.tier || n.layer || 'compute']));
  
  const TIER_ORDER = ['client', 'edge', 'compute', 'async', 'data', 'observe', 'external'];
  const addedEdges = new Set<string>();

  function isForwardFlow(srcTier: string, tgtTier: string): boolean {
    const srcIdx = TIER_ORDER.indexOf(srcTier);
    const tgtIdx = TIER_ORDER.indexOf(tgtTier);
    return tgtIdx > srcIdx;
  }

  for (const flow of flows) {
    for (let i = 0; i < flow.length - 1; i++) {
      const srcKey = flow[i].toLowerCase();
      const tgtKey = flow[i + 1].toLowerCase();
      const srcId = nodeMap.get(srcKey);
      const tgtId = nodeMap.get(tgtKey);

      if (!srcId || !tgtId) continue;
      if (srcId === tgtId) continue;

      const srcTier = nodeTierMap.get(srcId) || 'compute';
      const tgtTier = nodeTierMap.get(tgtId) || 'compute';

      if (!isForwardFlow(srcTier, tgtTier)) {
        logger.log(`[Flows] Skipping backward edge: ${flow[i]} (${srcTier}) → ${flow[i + 1]} (${tgtTier})`);
        continue;
      }

      const edgeKey = `${srcId}→${tgtId}`;
      if (addedEdges.has(edgeKey)) continue;
      if (addedEdges.has(`${tgtId}→${srcId}`)) {
        logger.log(`[Flows] Skipping bidirectional: ${tgtId} already connects to ${srcId}`);
        continue;
      }

      addedEdges.add(edgeKey);

      const commType = (tgtTier === 'async' || srcTier === 'async') ? 'async' : 'sync';
      const style = COMM_STYLES[commType];

      edges.push({
        id: `e-${srcId}-${tgtId}`,
        source: srcId,
        target: tgtId,
        sourceHandle: 'right',
        targetHandle: 'left',
        communicationType: commType as ArchitectureEdge['communicationType'],
        pathType: 'smooth' as PathType,
        label: '',
        labelPosition: 'center',
        animated: style.animated,
        style: { stroke: style.color, strokeDasharray: style.dash, strokeWidth: 2 },
        markerEnd: style.marker as 'arrowclosed' | 'none',
        markerStart: 'none',
      });
    }
  }

  return edges;
}

function buildMinimalFlows(nodes: ArchitectureNode[]): string[][] {
  const flows: string[][] = [];
  const nodesByTier: Record<string, ArchitectureNode[]> = {};
  
  for (const node of nodes) {
    if (node.isGroup) continue;
    const tier = node.tier || node.layer || 'compute';
    if (!nodesByTier[tier]) nodesByTier[tier] = [];
    nodesByTier[tier].push(node);
  }

  const tierOrder = ['client', 'edge', 'compute', 'async', 'data'];
  
  for (let i = 0; i < tierOrder.length - 1; i++) {
    const srcTier = tierOrder[i];
    const tgtTier = tierOrder[i + 1];
    const srcNodes = nodesByTier[srcTier] || [];
    const tgtNodes = nodesByTier[tgtTier] || [];
    
    if (srcNodes.length === 0 || tgtNodes.length === 0) continue;

    const primarySrc = srcNodes[0];
    const primaryTgt = tgtNodes[0];

    if (primarySrc && primaryTgt) {
      flows.push([primarySrc.label, primaryTgt.label]);
    }

    for (const src of srcNodes.slice(0, 2)) {
      for (const tgt of tgtNodes.slice(0, 2)) {
        if (src.id !== primarySrc?.id || tgt.id !== primaryTgt?.id) {
          if (flows.length < 8) {
            flows.push([src.label, tgt.label]);
          }
        }
      }
    }
  }

  return flows;
}

function ensureConnectivity(nodes: ArchitectureNode[], edges: ArchitectureEdge[]): ArchitectureEdge[] {
  const connected = new Set<string>();
  const existingConnections = new Set<string>();
  edges.forEach(e => { 
    connected.add(e.source); 
    connected.add(e.target);
    existingConnections.add(`${e.source}→${e.target}`);
  });

  const orphans = nodes.filter(n => !connected.has(n.id) && !n.isGroup);
  if (orphans.length === 0) return edges;

  const tierOrder = ['client', 'edge', 'compute', 'async', 'data', 'observe'];
  const byTier = new Map<string, ArchitectureNode[]>();
  nodes.forEach(n => {
    const tier = n.tier || n.layer || 'compute';
    if (!byTier.has(tier)) byTier.set(tier, []);
    byTier.get(tier)!.push(n);
  });

  const newEdges = [...edges];
  for (const orphan of orphans) {
    const orphanTier = orphan.tier || orphan.layer || 'compute';
    const tierIdx = tierOrder.indexOf(orphanTier);
    
    const addedForOrphan = new Set<string>();

    for (let offset = 1; offset <= 3; offset++) {
      const fwdIdx = tierIdx + offset;
      if (fwdIdx >= tierOrder.length) break;
      
      const fwdCandidates = byTier.get(tierOrder[fwdIdx])?.filter(n => {
        const edgeKey = `${orphan.id}→${n.id}`;
        const revKey = `${n.id}→${orphan.id}`;
        return !addedForOrphan.has(n.id) && !existingConnections.has(edgeKey) && !existingConnections.has(revKey);
      }) || [];
      
      const fwd = fwdCandidates.find(n => n.id !== orphan.id);
      if (fwd && newEdges.length < 30) {
        newEdges.push({
          id: `e-connect-${orphan.id}-${fwd.id}`,
          source: orphan.id,
          target: fwd.id,
          sourceHandle: 'right',
          targetHandle: 'left',
          communicationType: tierOrder[fwdIdx] === 'async' ? 'async' : 'sync',
          pathType: 'smooth',
          label: '',
          labelPosition: 'center',
          animated: false,
          style: { stroke: '#6366f1', strokeDasharray: '', strokeWidth: 2 },
          markerEnd: 'arrowclosed',
          markerStart: 'none',
        });
        connected.add(orphan.id);
        addedForOrphan.add(fwd.id);
        break;
      }
    }

    if (!connected.has(orphan.id)) {
      for (let bwdIdx = tierIdx - 1; bwdIdx >= 0; bwdIdx--) {
        const bwdCandidates = byTier.get(tierOrder[bwdIdx])?.filter(n => {
          const edgeKey = `${orphan.id}→${n.id}`;
          return !addedForOrphan.has(n.id) && !existingConnections.has(edgeKey);
        }) || [];
        
        const bwd = bwdCandidates.find(n => n.id !== orphan.id);
        if (bwd && newEdges.length < 30) {
          newEdges.push({
            id: `e-connect-${orphan.id}-${bwd.id}`,
            source: orphan.id,
            target: bwd.id,
            sourceHandle: 'right',
            targetHandle: 'left',
            communicationType: 'sync',
            pathType: 'smooth',
            label: '',
            labelPosition: 'center',
            animated: false,
            style: { stroke: '#6366f1', strokeDasharray: '', strokeWidth: 2 },
            markerEnd: 'arrowclosed',
            markerStart: 'none',
          });
          connected.add(orphan.id);
          addedForOrphan.add(bwd.id);
          break;
        }
      }
    }
  }

  return newEdges;
}

function computeLayout(nodes: ArchitectureNode[], edges: ArchitectureEdge[]): ReactFlowNode[] {
  const byLayer: Record<string, ArchitectureNode[]> = {};
  nodes.forEach(n => {
    const layer = n.layer || 'compute';
    if (!byLayer[layer]) byLayer[layer] = [];
    byLayer[layer].push(n);
  });

  let maxInLayer = 0;
  LAYER_ORDER.forEach(l => maxInLayer = Math.max(maxInLayer, (byLayer[l] || []).length));
  const totalH = maxInLayer * 70 + (maxInLayer - 1) * 80;
  const centerY = Math.max(50, (800 - totalH) / 2);

  return nodes.map(node => ({
    id: node.id,
    type: node.isGroup ? 'group' : 'systemNode',
    position: {
      x: LAYER_X[node.layer || 'compute'] ?? 500,
      y: centerY + (byLayer[node.layer || 'compute']?.indexOf(node) || 0) * 150,
    },
    data: {
      label: node.label,
      icon: node.icon || 'server',
      layer: node.layer,
      isGroup: node.isGroup,
      parentId: node.parentId,
      groupLabel: node.groupLabel,
      groupColor: node.groupColor,
      serviceType: node.serviceType,
    },
    width: node.width || 180,
    height: node.height || 70,
  }));
}

function toReactFlowEdges(edges: ArchitectureEdge[], nodeIds: Set<string>): ReactFlowEdge[] {
  return edges
    .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
    .map((e, i) => {
      const s = COMM_STYLES[e.communicationType || 'sync'];
      return {
        id: `rf-${e.source}-${e.target}-${i}`,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || 'right',
        targetHandle: e.targetHandle || 'left',
        type: 'custom',
        animated: s.animated,
        label: '',
        labelShowBg: true,
        labelBgPadding: [8, 4] as [number, number],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: '#1e1e2e', fillOpacity: 0.9, stroke: '#334155', strokeWidth: 1 },
        labelStyle: { fontSize: 10, fontWeight: 600, fill: '#e2e8f0' },
        style: { stroke: s.color, strokeWidth: 1.5, strokeDasharray: s.dash },
        markerEnd: { type: 'arrowclosed' as const, color: s.color },
        data: { communicationType: e.communicationType, pathType: 'smooth' as PathType, label: '', color: s.color },
      };
    });
}

const MAX_COLLISION_LOOPS = 3;

function resolveCollisionsOptimized(nodes: ReactFlowNode[], edges: ReactFlowEdge[]): ReactFlowEdge[] {
  let paths = computeEdgeLayout(nodes, edges);
  let report = detectEdgeCollisions(nodes, edges, paths);
  let loops = 0;

  while (report.hasCollisions && loops < MAX_COLLISION_LOOPS) {
    const result = fixCollisions(nodes, edges, paths, report.collisions);
    paths = result.resolvedPaths;
    if (loops < MAX_COLLISION_LOOPS - 1) {
      const opt = optimizeEdgePaths(nodes, edges, paths);
      paths = opt.optimizedPaths;
    }
    report = detectEdgeCollisions(nodes, edges, paths);
    loops++;
  }

  const labels = computeOptimalLabelPositions(nodes, edges, paths);
  return edges.map(e => ({
    ...e,
    data: {
      ...e.data,
      labelX: labels.positions.get(e.id)?.x ?? 0,
      labelY: labels.positions.get(e.id)?.y ?? 0,
      waypoints: paths.find(p => p.id === e.id)?.waypoints,
    },
  }));
}

export async function generateDiagram(
  userIntent: UserIntent,
  onProgress?: ProgressCallback,
  onStreaming?: StreamingCallback
): Promise<GenerationResult> {
  const start = Date.now();
  const emit = (phase: GenerationProgress['phase'], msg: string, p = 50) =>
    onProgress?.({ phase, iteration: 0, currentAgent: phase, score: 0, message: msg, progress: p });

  try {
    emit('planning', 'Preprocessing...', 5);

    const intentSignals = await robustDetectIntent(userIntent.description);

    if (intentSignals.ambiguous && intentSignals.confidence < 0.5) {
      return {
        type: 'architecture',
        nodes: [],
        edges: [],
        metadata: {
          totalNodes: 0,
          totalEdges: 0,
          systemType: intentSignals.systemType[0] || 'unknown',
          generatedAt: new Date().toISOString(),
        },
      } as GenerationResult;
    }

    const intentType = intentSignals.systemType[0] || 'generic-web-app';
    const cacheKey = semanticCache.buildCacheKey(intentType, userIntent.description);
    logger.log('[Pipeline] Processing prompt:', userIntent.description.slice(0, 100));
    logger.log('[Pipeline] Intent type:', intentType);
    
    const cachedResult = CACHE_ENABLED ? semanticCache.get(cacheKey) : null;

    interface FullGenerationResult {
      reasoning: ArchitectureAnalysis | null;
      diagram: { nodes: ArchitectureNode[]; flows: string[][] };
    }

    const generationResult: FullGenerationResult = { reasoning: null, diagram: { nodes: [], flows: [] } };

    if (cachedResult) {
      emit('components', 'Using cached result...', 15);
      generationResult.diagram = { nodes: cachedResult.nodes, flows: cachedResult.flows };
    } else if (CACHE_ENABLED && semanticCache.isInFlight(cacheKey)) {
      emit('components', 'Waiting for duplicate request...', 15);
      const inFlightResult = await semanticCache.waitForRequest(cacheKey);
      if (inFlightResult) {
        generationResult.diagram = { nodes: inFlightResult.nodes, flows: inFlightResult.flows };
        semanticCache.set(cacheKey, generationResult.diagram);
      }
    } else {
      const requestPromise = (async (): Promise<{ nodes: ArchitectureNode[]; flows: string[][] }> => {
        emit('components', 'Generating reasoning...', 10);
        
        const reasoningResult = await callReasoningLLM(
          userIntent.description,
          intentType
        );
        
        onStreaming?.({ type: 'thinking', reasoning: reasoningResult });

        emit('planning', 'Validating reasoning...', 20);
        const validation = validateReasoningOutput(reasoningResult);

        if (!validation.valid) {
          logger.warn('[Pipeline] Reasoning validation failed:', validation.errors);
          const fallback = getFallbackResponse();
          return { nodes: fallback.nodes, flows: fallback.flows };
        }

        if (validation.warnings.length > 0) {
          logger.log('[Pipeline] Reasoning warnings:', validation.warnings);
        }

        emit('components', 'Generating diagram...', 35);
        
        const result = await callDiagramLLM(reasoningResult, onStreaming);
        onStreaming?.({ type: 'complete' });
        
        return result;
      })();

      semanticCache.startRequest(cacheKey, requestPromise as Promise<CacheEntry>);
      const diagramResult = await requestPromise;
      if (CACHE_ENABLED) {
        semanticCache.set(cacheKey, diagramResult);
      }
      generationResult.diagram = diagramResult;
    }

    emit('components', 'Processing components...', 50);
    let nodes = enrichNodes(generationResult.diagram.nodes);
    nodes = nodes.filter(n => n.id && n.label);
    nodes = nodes.slice(0, MAX_NODES);

    const stressTests = generationResult.reasoning?.stressTestResults;
    if (stressTests?.length) {
      nodes = autoAddCompensatingComponents(nodes, stressTests);
      nodes = nodes.slice(0, MAX_NODES);
    }

    if (nodes.length < 5) {
      const fallback = getFallbackResponse();
      nodes = [...nodes, ...fallback.nodes.filter(f => !nodes.find(n => n.label === f.label))].slice(0, 10);
    }

    emit('edges', 'Building connections...', 60);
    let edges = flowsToEdges(nodes, generationResult.diagram.flows);
    edges = ensureConnectivity(nodes, edges);

    const complexityProfile = deriveComplexityProfile(
      nodes.length,
      generationResult.reasoning?.patternSelections,
      intentType
    );
    const edgeResult = applyEdgeLimits(edges, complexityProfile);
    edges = edgeResult.edges;

    emit('layout', 'Computing layout...', 70);
    const elkResult = await computeELKLayout(nodes, edges, { complexityTier: complexityProfile.tier });
    const rfNodes = elkResult?.nodes?.length ? elkResult.nodes : computeLayout(nodes, edges);

    emit('edges', 'Optimizing edges...', 85);
    const nodeIds = new Set(rfNodes.map(n => n.id));
    let rfEdges = toReactFlowEdges(edges, nodeIds);
    rfEdges = filterBidirectionalEdges(rfEdges, 'keep-sync');
    rfEdges = resolveCollisionsOptimized(rfNodes, rfEdges);

    emit('scoring', 'Computing quality score...', 95);
    const qualityScore = computeDiagramQualityScore(rfNodes, rfEdges, generationResult.reasoning);

    const totalMs = Date.now() - start;

    emit('complete', `Done in ${totalMs}ms`, 100);
    logger.log(`[Pipeline] Total: ${totalMs}ms | nodes=${rfNodes.length} | edges=${rfEdges.length} | grade=${qualityScore.grade}`);

    const extendedReasoning = generationResult.reasoning as (ArchitectureAnalysis & {
      nfrs?: { scale: string; latency: string; consistency: 'strong' | 'eventual'; availability: string; faultTolerance: string };
      capPosition?: 'CP' | 'AP';
      actors?: string[];
      keyDecisions?: string[];
    }) | null;

    const reasoning = generationResult.reasoning;

    const thinking = reasoning ? {
      systemType: intentType,
      nfrs: extendedReasoning?.nfrs || { scale: 'unknown', latency: 'unknown', consistency: 'eventual' as const, availability: 'unknown', faultTolerance: 'unknown' },
      capPosition: extendedReasoning?.capPosition || 'AP',
      actors: extendedReasoning?.actors || [],
      boundaries: reasoning.boundaries ? {
        entryPoints: reasoning.boundaries.entryPoints || [],
        exitPoints: reasoning.boundaries.exitPoints || [],
        trustZones: (reasoning.boundaries as ArchitectureBoundaries & { trustBoundaries?: string[] }).trustBoundaries || [],
      } : { entryPoints: [], exitPoints: [], trustZones: [] },
      layerAssignment: (reasoning.layerAssignment || {}) as Record<string, ArchitectureLayer>,
      patterns: reasoning.patternSelections || [],
      stressTests: reasoning.stressTestResults || [],
      keyDecisions: extendedReasoning?.keyDecisions || [],
    } : null;

    return {
      type: 'architecture',
      nodes: rfNodes,
      edges: rfEdges,
      metadata: {
        score: qualityScore.score,
        grade: qualityScore.grade,
        iterations: 1,
        totalNodes: rfNodes.length,
        totalEdges: rfEdges.length,
        systemType: intentType,
        generatedAt: new Date().toISOString(),
        analysis: reasoning || null,
        thinking: thinking,
        complexityTier: complexityProfile.tier,
        truncated: edgeResult.truncated,
        droppedEdgeCount: edgeResult.droppedCount,
        qualityWarnings: qualityScore.warnings,
      },
    };
  } catch (error) {
    logger.error('[Pipeline] Error:', error);
    emit('error', `Error: ${error instanceof Error ? error.message : 'Unknown'}`, 100);
    throw error;
  }
}
