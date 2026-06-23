import type { RawNode, RawFlow, ParsedDiagram, ReasoningResult, PipelineLayer, ArchitectureStylePlan } from './types';
import { MODEL_CONFIG, DIAGRAM_SYSTEM_MESSAGE } from '../constants';
import { parseNDJSON } from './stage4-parse';
import logger from '@/lib/logger';

const MIN_NODES = 6;
const MAX_NODES = 15;
const MIN_EDGES = 5;

class IncrementalParser {
  private buffer = '';
  private completed: Record<string, unknown>[] = [];

  feed(chunk: string): Record<string, unknown>[] {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';
    
    const newItems: Record<string, unknown>[] = [];
    for (const line of lines) {
      const item = this.parseLine(line);
      if (item) {
        newItems.push(item);
        this.completed.push(item);
      }
    }
    return newItems;
  }

  finish(): Record<string, unknown>[] {
    const item = this.parseLine(this.buffer);
    this.buffer = '';
    if (!item) return [];
    this.completed.push(item);
    return [item];
  }

  getResults(): Record<string, unknown>[] {
    return this.completed;
  }

  private parseLine(line: string): Record<string, unknown> | null {
    const trimmed = line.trim();
    if (!trimmed) return null;
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
      throw new Error(`Malformed NDJSON line: ${trimmed.slice(0, 120)}`);
    }

    try {
      return JSON.parse(trimmed) as Record<string, unknown>;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid JSON';
      throw new Error(`Malformed NDJSON line: ${message}: ${trimmed.slice(0, 120)}`);
    }
  }
}

/**
 * STAGE 3 — DIAGRAM GENERATION
 * Calls LLM to generate NDJSON stream of nodes and flows.
 */
export async function callDiagramLLM(
  reasoning: ReasoningResult,
  onNode?: (node: RawNode) => void,
  onFlow?: (flow: RawFlow) => void,
  existingContext?: { nodes: any[]; edges: any[] },
  diagramSize: 'small' | 'medium' | 'large' = 'medium',
  intentType?: string,
  stylePlan?: ArchitectureStylePlan
): Promise<ParsedDiagram> {
  const prompt = buildDiagramPrompt(reasoning, existingContext, diagramSize, intentType, stylePlan);
  const parser = new IncrementalParser();

  const GROQ_KEY_ENV_VARS = [
    'GROQ_API_KEY_FOR_DESC_1', 'GROQ_API_KEY_FOR_DESC_2', 'GROQ_API_KEY_FOR_DESC_3',
    'GROQ_API_KEY_FOR_DESC_4', 'GROQ_API_KEY_FOR_DESC_5', 'GROQ_API_KEY_FOR_DESC_6',
    'GROQ_API_KEY_FOR_DESC_7', 'GROQ_API_KEY_FOR_DESC_8', 'GROQ_API_KEY_FOR_DESC_9',
  ];

  for (const envVar of GROQ_KEY_ENV_VARS) {
    const apiKey = process.env[envVar];
    if (!apiKey || apiKey.startsWith('#')) continue;

    try {
      const Groq = (await import('groq-sdk')).default;
      const groq = new Groq({ apiKey });

      const stream = await groq.chat.completions.create({
        model: MODEL_CONFIG.diagram.primary,
        messages: [
          { role: 'system', content: DIAGRAM_SYSTEM_MESSAGE },
          { role: 'user', content: prompt }
        ],
        temperature: MODEL_CONFIG.diagram.temperature,
        max_tokens: MODEL_CONFIG.diagram.maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content ?? '';
        const items = parser.feed(content);
        
        for (const item of items) {
          if (item.path && Array.isArray(item.path)) {
            onFlow?.(item as unknown as RawFlow);
          } else if (item.id && item.label) {
            onNode?.(item as unknown as RawNode);
          }
        }
      }

      for (const item of parser.finish()) {
        if (item.path && Array.isArray(item.path)) {
          onFlow?.(item as unknown as RawFlow);
        } else if (item.id && item.label) {
          onNode?.(item as unknown as RawNode);
        }
      }

      const results = parser.getResults();
      const nodes = results.filter(i => i.id && i.label) as unknown as RawNode[];
      const flows = results.filter(i => i.path && Array.isArray(i.path)) as unknown as RawFlow[];
      
      const result = { nodes, flows };
      const enforced = enforceMinimumConstraints(result.nodes, result.flows, reasoning);
      
      logger.log(`[Diagram] Generated: ${enforced.nodes.filter(n=>!n.isGroup).length} nodes, ${enforced.flows.length} flows`);
      
      return enforced;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Malformed NDJSON line:')) {
        throw error;
      }
      logger.log(`[Diagram] Groq key ${envVar} failed:`, error instanceof Error ? error.message : 'unknown');
      continue;
    }
  }

  throw new Error('generation_failed: all diagram providers failed');
}

const DIAGRAM_RULES = `Rules:
- Default to Monolith unless "microservices" in prompt. Style-specific rules:
  MVC: 3 groups (View/Controller/Model). No microservices, queues, gateways, cloud infra.
  Monolith: layered (Presentation→Services→Data). Shared DB. Queue only if async in prompt.
  Microservices: API Gateway + BFF. Saga for distributed tx. CQRS for read-heavy. No shared DBs.
  Event-Driven: topics, consumers, outbox pattern, CDC. Schema registry if production.
  Serverless: trigger→function→destination. No sync chains >2. Step Functions for workflows.
  Data Platform: Medallion (Bronze→Silver→Gold). Ingestion→Storage→Compute→Serving.
  ML: Training pipeline→Feature Store→Serving. Drift detection if production.
  SaaS: tenant isolation (Silo/Pool/Bridge), tenant routing, metering, billing.
  Enterprise: ESB, Anti-Corruption Layer for legacy, ETL pipelines.
  Mobile Backend: BFF per client, push notifications, offline sync.
  Edge/IoT: Device→Edge Gateway→Fog→Cloud hierarchy. MQTT/AMQP.
  Real-Time Collab: WebSocket/SSE, CRDT/OT, Pub/Sub fan-out.
- Labels: EVERY edge must have a 2-5 word label describing what data moves. BANNED: "connects to", "calls", "uses", "requests", "integrates with".
- Flows are strictly ONE-DIRECTIONAL: always left-to-right (client → gateway → service → data). NEVER emit reverse or return edges (e.g. do NOT add service → client, data → service, or any backwards path). HTTP request/response cycles are implicit — only model the request direction.
- No orphan nodes — every node must appear in ≥1 flow. If disconnected, omit it.
- No generic web-app template. Domain-specific nodes only.`;

function buildDiagramPrompt(
  reasoning: ReasoningResult,
  existingContext?: { nodes: any[]; edges: any[] },
  diagramSize: 'small' | 'medium' | 'large' = 'medium',
  intentType?: string,
  stylePlan?: ArchitectureStylePlan
): string {
  const sizeInstructions = diagramSize === 'small'
    ? 'SIZE: 3-7 nodes. Core components only.'
    : diagramSize === 'large'
    ? 'SIZE: 10-20 nodes. Include services, workers, caches, observability (if appropriate), external integrations.'
    : 'SIZE: 6-12 nodes. Primary services + key data stores. No padding.';

  const depthInstruction = stylePlan?.productionDepth === 'production'
    ? 'DEPTH: Production/scale signaled. May include CDN, LB, Observability, DLQ, Circuit Breaker, Secrets Manager, CI/CD.'
    : stylePlan?.productionDepth === 'application'
    ? 'DEPTH: Application-level only. No production-hardening infra unless explicitly requested.'
    : 'DEPTH: Conceptual only. Domain nodes only. No production-hardening components.';

  let intentInject = '';
  if (intentType === 'mvc') {
    intentInject = 'MVC: structure into View/Controller/Model groups. No microservices, queues, gateways, or cloud infra.';
  }

  const layersText = Object.entries(reasoning.layers || {})
    .filter(([_, l]) => l.components.length > 0)
    .map(([id, l]) => `- ${id}: ${l.components.join(', ')}`)
    .join('\n');

  const flowsText = (reasoning.keyFlows || [])
    .map(f => `- ${f.name}: ${f.path.join(' -> ')}`)
    .join('\n');

  let prompt = `${DIAGRAM_RULES}
${intentInject}

${sizeInstructions}
${depthInstruction}

System: ${reasoning.systemType}
Prompt: ${reasoning.sourcePrompt || reasoning.systemType}
Plan: ${reasoning.architecturalPlan}
Layers:
${layersText || '(none)'}
Flows:
${flowsText || '(none)'}
`;

  if (existingContext && existingContext.nodes.length > 0) {
    prompt += `
Existing diagram (preserve these node IDs exactly for custom styling):
${existingContext.nodes.map(n => `- {"id":"${n.id}","label":"${n.data?.label || n.label}","layer":"${n.data?.layer || n.layer}"}`).join('\n')}
Modify: keep relevant nodes with exact IDs, add new nodes with new IDs, omit outdated ones. Include edges between all kept and new nodes.
`;
  }

  prompt += `
Output NDJSON only. One object per line.
Node: {"id":"str","label":"Service Name","layer":"client|edge|gateway|application|queue|data|observability|external","subtitle":"Tech (≤3 words)"}
Flow: {"path":["src","dst"],"label":"action (2-5 words)","async":false}`;
  return prompt.trim();
}

/**
 * Enforce minimum constraints — mechanical only.
 * Orphaned nodes are LOGGED but NOT auto-connected here.
 * Auto-connecting invents architecture the LLM didn't produce.
 * Stage5 will report orphans as diagnostic warnings.
 */
function enforceMinimumConstraints(
  nodes: RawNode[],
  flows: RawFlow[],
  _reasoning: ReasoningResult
): ParsedDiagram {
  const result: ParsedDiagram = { nodes: [...nodes], flows: [...flows] };

  if (result.nodes.length === 0) {
    logger.log('[Diagram] WARNING: No nodes generated, returning empty diagram');
    return result;
  }

  // Report orphans diagnostically — stage5 will handle them
  const connectedNodeIds = new Set<string>();
  result.flows.forEach(f => f.path.forEach(id => connectedNodeIds.add(id)));
  const orphanNodes = result.nodes.filter(n => !n.isGroup && !connectedNodeIds.has(n.id));
  if (orphanNodes.length > 0) {
    logger.log(`[Diagram] ${orphanNodes.length} orphan node(s) detected: ${orphanNodes.map(n => n.label).join(', ')} — will be reported in diagnostics`);
  }

  return result;
}

function getLayerRank(layer?: string): number {
  const normalized = normalizeLayer(layer);
  const order = ['client', 'edge', 'gateway', 'application', 'queue', 'data', 'infrastructure', 'observability', 'external'];
  const idx = order.indexOf(normalized);
  return idx >= 0 ? idx : 3;
}

function normalizeLayer(layer?: string): string {
  if (!layer) return 'application';
  if (layer === 'presentation') return 'client';
  if (layer === 'compute') return 'application';
  if (layer === 'async') return 'queue';
  if (layer === 'observe') return 'observability';
  return layer;
}

export function parseLLMOutput(text: string): ParsedDiagram {
  return parseNDJSON(text);
}
