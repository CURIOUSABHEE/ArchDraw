import type { RawNode, RawFlow, ParsedDiagram, ReasoningResult, PipelineLayer as LayerType } from './types';
import { DIAGRAM_PROMPT, MODEL_CONFIG, DIAGRAM_SYSTEM_MESSAGE } from '../constants';
import { parseNDJSON } from './stage4-parse';

const GROQ_KEY_ENV_VARS = [
  'GROQ_API_KEY_FOR_DESC_1', 'GROQ_API_KEY_FOR_DESC_2', 'GROQ_API_KEY_FOR_DESC_3',
  'GROQ_API_KEY_FOR_DESC_4', 'GROQ_API_KEY_FOR_DESC_5', 'GROQ_API_KEY_FOR_DESC_6',
  'GROQ_API_KEY_FOR_DESC_7', 'GROQ_API_KEY_FOR_DESC_8', 'GROQ_API_KEY_FOR_DESC_9',
];

const MIN_NODES = 6;
const MAX_NODES = 15;
const MIN_EDGES = 5;
const REQUIRED_COMPONENTS = [
  { type: 'gateway', label: 'API Gateway', layer: 'gateway' },
  { type: 'service', label: 'Service', layer: 'application' },
  { type: 'database', label: 'Database', layer: 'data' },
];

class IncrementalParser {
  private buffer = '';
  private completed: Record<string, unknown>[] = [];

  push(chunk: string): void {
    this.buffer += chunk;
    this.tryExtract();
  }

  private tryExtract(): void {
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
            this.completed.push(JSON.parse(candidate));
          } catch { /* incomplete */ }
          start = -1;
        }
      }
    }

    if (this.completed.length > 0) {
      const lastBrace = this.buffer.lastIndexOf('}');
      if (lastBrace !== -1) {
        this.buffer = this.buffer.slice(lastBrace + 1);
      }
    }
  }

  drain(): Record<string, unknown>[] {
    const objs = [...this.completed];
    this.completed = [];
    return objs;
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms))
    ]);
  } catch {
    return null;
  }
}

/**
 * STAGE 3 — DIAGRAM GENERATION (LLM)
 * Generate a complete, layered architecture graph.
 * 
 * HARD CONSTRAINTS:
 * - minimum 10-15 nodes
 * - minimum 10-20 edges
 * - must include: entry layer, at least 2 services, async component, cache, database
 * - Nodes: id, label, type, parent group (layer)
 * - Edges: source, target, label (API call, async job, cache read, db write, etc.)
 */
function buildDiagramPrompt(reasoning: ReasoningResult): string {
  const layersInfo = reasoning.layers 
    ? `LAYERS:\n${Object.entries(reasoning.layers).map(([name, info]) => 
        `- ${name}: ${info.description}\n  Components: ${info.components.join(', ')}`
      ).join('\n')}`
    : '';

  const flowsInfo = reasoning.keyFlows && reasoning.keyFlows.length > 0
    ? `KEY FLOWS:\n${reasoning.keyFlows.map(f => 
        `- ${f.name}: ${f.description}\n  Path: ${f.path.join(' → ')}`
      ).join('\n')}`
    : '';

  const architecturalPlan = reasoning.architecturalPlan 
    ? `ARCHITECTURAL PLAN: ${reasoning.architecturalPlan}`
    : '';

  return `You are an expert systems architect. Generate a clean, flowing architecture diagram in NDJSON format.

${architecturalPlan}

${layersInfo}

${flowsInfo}

SYSTEM TYPE: ${reasoning.systemType}

REQUIREMENTS:
1. Generate ${MIN_NODES}-${MAX_NODES} nodes (aim for 8-12 for clarity)
2. Generate at least ${MIN_EDGES} edges (aim for 8-12)
3. Create a PRACTICAL, FLOWING architecture - NOT a textbook example
4. DO NOT create group nodes unless specifically needed for logical boundaries
5. Focus on the actual data flow and component interactions

CRITICAL RULES:
- NO GROUPS unless the architecture genuinely needs logical boundaries (like VPC, security zones)
- Each node should be a real component (service, database, cache, queue, etc.)
- Edges should show actual data flow with meaningful labels
- Keep it simple and practical - avoid over-engineering

OUTPUT FORMAT - NDJSON (one JSON object per line):

EXAMPLE (NO GROUPS - just flowing components):
{"id": "web-client", "label": "Web App", "layer": "presentation", "type": "client", "icon": "monitor", "subtitle": "React SPA"}
{"id": "mobile-app", "label": "Mobile App", "layer": "presentation", "type": "client", "icon": "smartphone", "subtitle": "iOS/Android"}
{"id": "load-balancer", "label": "Load Balancer", "layer": "gateway", "type": "loadbalancer", "icon": "webhook", "subtitle": "Traffic distribution"}
{"id": "api-gateway", "label": "API Gateway", "layer": "gateway", "type": "gateway", "icon": "webhook", "subtitle": "REST API"}
{"id": "auth-service", "label": "Auth Service", "layer": "application", "type": "service", "icon": "lock", "subtitle": "JWT/OAuth"}
{"id": "user-service", "label": "User Service", "layer": "application", "type": "service", "icon": "server", "subtitle": "User management"}
{"id": "message-queue", "label": "Message Queue", "layer": "async", "type": "queue", "icon": "message-square", "subtitle": "RabbitMQ"}
{"id": "cache", "label": "Redis Cache", "layer": "data", "type": "cache", "icon": "gauge", "subtitle": "Session cache"}
{"id": "database", "label": "PostgreSQL", "layer": "data", "type": "database", "icon": "database", "subtitle": "Primary DB"}

FLOWS (show actual data flow):
{"type": "flow", "path": ["web-client", "load-balancer"], "label": "HTTPS", "async": false}
{"type": "flow", "path": ["load-balancer", "api-gateway"], "label": "route request", "async": false}
{"type": "flow", "path": ["api-gateway", "auth-service"], "label": "verify token", "async": false}
{"type": "flow", "path": ["api-gateway", "user-service"], "label": "API call", "async": false}
{"type": "flow", "path": ["user-service", "cache"], "label": "check cache", "async": false}
{"type": "flow", "path": ["user-service", "database"], "label": "query", "async": false}
{"type": "flow", "path": ["user-service", "message-queue"], "label": "publish event", "async": true}

NODE TYPES: client, gateway, service, queue, cache, database, worker, cdn, loadbalancer
LAYER VALUES: presentation, gateway, application, async, data, observability, external

EDGE LABELS should be specific and describe the actual interaction:
- "HTTPS request", "REST API", "gRPC call"
- "verify token", "check permissions"
- "query users", "update record", "cache lookup"
- "publish event", "consume message"

Generate a PRACTICAL, FLOWING architecture. NO GROUPS unless genuinely needed. Output ONLY NDJSON:`;
}

async function tryGroq(prompt: string, onNode?: (n: RawNode) => void, onFlow?: (f: RawFlow) => void): Promise<ParsedDiagram | null> {
  const nodes: RawNode[] = [];
  const flows: RawFlow[] = [];

  for (const envVar of GROQ_KEY_ENV_VARS) {
    const apiKey = process.env[envVar];
    if (!apiKey || apiKey.startsWith('#')) continue;

    try {
      const Groq = (await import('groq-sdk')).default;
      const groq = new Groq({ apiKey });

      const stream = await withTimeout(
        groq.chat.completions.create({
          model: MODEL_CONFIG.diagram.primary,
          messages: [
            { role: 'system', content: DIAGRAM_SYSTEM_MESSAGE },
            { role: 'user', content: prompt }
          ],
          temperature: MODEL_CONFIG.diagram.temperature,
          max_tokens: MODEL_CONFIG.diagram.maxTokens,
          stream: true,
        }),
        MODEL_CONFIG.diagram.timeout
      ) as AsyncIterable<{ choices: { delta: { content?: string } }[] }>;

      if (!stream) continue;

      const parser = new IncrementalParser();
      let accumulated = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          accumulated += content;
          parser.push(content);

          for (const obj of parser.drain()) {
            if (obj.id && obj.label && (obj.isGroup || obj.parentId || !obj.isGroup)) {
              const node: RawNode = {
                id: String(obj.id),
                label: String(obj.label),
                subtitle: obj.subtitle ? String(obj.subtitle) : '',
                layer: (obj.layer as LayerType) || 'application',
                icon: obj.icon ? String(obj.icon) : 'box',
                serviceType: obj.serviceType ? String(obj.serviceType) : '',
                ...(obj.isGroup ? {
                  isGroup: true,
                  groupLabel: String(obj.groupLabel || obj.label),
                  groupColor: String(obj.groupColor || '#e2e8f0'),
                } : {}),
                ...(obj.parentId ? {
                  parentId: String(obj.parentId),
                } : {}),
              };
              nodes.push(node);
              onNode?.(node);
            } else if (obj.type === 'flow' || obj.path) {
              const flowObj = obj as { path: string[]; label?: string; async?: boolean };
              if (Array.isArray(flowObj.path) && flowObj.path.length >= 2) {
                const flow: RawFlow = {
                  path: flowObj.path,
                  label: flowObj.label,
                  async: flowObj.async === true,
                };
                flows.push(flow);
                onFlow?.(flow);
              }
            }
          }
        }
      }

      // If stream ended with no nodes, try parsing accumulated text
      if (nodes.length === 0 && flows.length === 0) {
        return parseLLMOutput(accumulated);
      }

      return { nodes, flows };
    } catch (error) {
      console.log(`[Diagram] Groq key ${envVar} failed:`, error instanceof Error ? error.message : 'unknown');
      continue;
    }
  }

  return null;
}

async function tryOpenRouter(prompt: string, onNode?: (n: RawNode) => void, onFlow?: (f: RawFlow) => void): Promise<ParsedDiagram | null> {
  const OR_KEY = process.env.OPENROUTER_API_KEY;
  if (!OR_KEY) {
    console.log('[Diagram] No OpenRouter key');
    return null;
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OR_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://archdraw.ai',
        'X-Title': 'ArchDraw',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct',
        messages: [
          { role: 'system', content: DIAGRAM_SYSTEM_MESSAGE },
          { role: 'user', content: prompt }
        ],
        temperature: MODEL_CONFIG.diagram.temperature,
        max_tokens: MODEL_CONFIG.diagram.maxTokens,
      }),
    });

    if (!res.ok) {
      console.log('[Diagram] OpenRouter error:', res.status);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    return parseLLMOutput(content);
  } catch (error) {
    console.log('[Diagram] OpenRouter exception:', error);
    return null;
  }
}

export function parseLLMOutput(rawText: string): ParsedDiagram {
  return parseNDJSON(rawText);
}

/**
 * Validates that the generated diagram meets minimum constraints.
 * If not, attempts to enrich the diagram by adding missing components.
 * DOES NOT force groups - only adds them if genuinely needed.
 */
function enforceMinimumConstraints(
  nodes: RawNode[], 
  flows: RawFlow[], 
  reasoning: ReasoningResult
): { nodes: RawNode[]; flows: RawFlow[] } {
  let enrichedNodes = [...nodes];
  let enrichedFlows = [...flows];

  // Count non-group nodes
  const nonGroupNodes = enrichedNodes.filter(n => !n.isGroup);
  
  // Check for required component types
  const hasGateway = nonGroupNodes.some(n => n.layer === 'gateway' || n.serviceType === 'gateway');
  const serviceCount = nonGroupNodes.filter(n => n.layer === 'application' || n.serviceType === 'service').length;
  const hasDatabase = nonGroupNodes.some(n => n.serviceType === 'database');

  // Add missing required components (WITHOUT forcing them into groups)
  if (!hasGateway) {
    enrichedNodes.push({
      id: 'api-gateway',
      label: 'API Gateway',
      layer: 'gateway',
      icon: 'webhook',
      serviceType: 'gateway',
      subtitle: 'REST API',
    });
  }

  if (serviceCount < 1) {
    enrichedNodes.push({
      id: 'main-service',
      label: 'Main Service',
      layer: 'application',
      icon: 'server',
      serviceType: 'service',
      subtitle: 'Business logic',
    });
  }

  if (!hasDatabase) {
    enrichedNodes.push({
      id: 'database',
      label: 'Database',
      layer: 'data',
      icon: 'database',
      serviceType: 'database',
      subtitle: 'PostgreSQL',
    });
  }

  // Ensure minimum node count (6-10 for practical diagrams)
  const currentNonGroup = enrichedNodes.filter(n => !n.isGroup);
  if (currentNonGroup.length < MIN_NODES) {
    const clients = currentNonGroup.filter(n => n.layer === 'presentation');
    if (clients.length === 0) {
      enrichedNodes.push({
        id: 'web-client',
        label: 'Web Client',
        layer: 'presentation',
        icon: 'monitor',
        serviceType: 'client',
        subtitle: 'Browser',
      });
    }
  }

  // Ensure minimum edge count
  if (enrichedFlows.length < MIN_EDGES) {
    const allNonGroup = enrichedNodes.filter(n => !n.isGroup);
    const flowExists = (src: string, tgt: string) => 
      enrichedFlows.some(f => f.path.includes(src) && f.path.includes(tgt));
    
    // Connect presentation to gateway
    const presNodes = allNonGroup.filter(n => n.layer === 'presentation');
    const gwNodes = allNonGroup.filter(n => n.layer === 'gateway');
    for (const p of presNodes) {
      for (const g of gwNodes) {
        if (!flowExists(p.id, g.id)) {
          enrichedFlows.push({ path: [p.id, g.id], label: 'HTTPS request', async: false });
        }
      }
    }

    // Connect gateway to services
    const svcNodes = allNonGroup.filter(n => n.layer === 'application');
    for (const g of gwNodes) {
      for (const s of svcNodes) {
        if (!flowExists(g.id, s.id)) {
          enrichedFlows.push({ path: [g.id, s.id], label: 'API call', async: false });
        }
      }
    }

    // Connect services to data layer
    const dataNodes = allNonGroup.filter(n => n.layer === 'data');
    for (const s of svcNodes) {
      for (const d of dataNodes) {
        if (!flowExists(s.id, d.id)) {
          const label = d.serviceType === 'cache' ? 'cache lookup' : 'query';
          enrichedFlows.push({ path: [s.id, d.id], label, async: false });
        }
      }
    }
  }

  return { nodes: enrichedNodes, flows: enrichedFlows };
}

export async function callDiagramLLM(
  reasoning: ReasoningResult,
  onNode?: (node: RawNode) => void,
  onFlow?: (flow: RawFlow) => void,
): Promise<ParsedDiagram> {
  const prompt = buildDiagramPrompt(reasoning);

  // Try Groq first
  let result = await tryGroq(prompt, onNode, onFlow);

  // Fall back to OpenRouter if Groq failed
  if (!result || result.nodes.length === 0) {
    console.log('[Diagram] Trying OpenRouter...');
    result = await tryOpenRouter(prompt, onNode, onFlow);
  }

  // Final fallback with batch parsing
  if (!result || result.nodes.length === 0) {
    console.log('[Diagram] All providers failed, using fallback prompt');
    const fallbackPrompt = buildDiagramPrompt({
      ...reasoning,
      systemType: reasoning.systemType || 'system-architecture',
    });
    result = await tryGroq(fallbackPrompt, onNode, onFlow) || await tryOpenRouter(fallbackPrompt, onNode, onFlow);
  }

  if (!result || result.nodes.length === 0) {
    console.log('[Diagram] WARNING: No nodes generated, returning empty diagram');
    return { nodes: [], flows: [] };
  }

  // ENFORCE minimum constraints (enrich, not delete)
  const enforced = enforceMinimumConstraints(result.nodes, result.flows, reasoning);
  
  console.log(`[Diagram] Generated: ${enforced.nodes.filter(n=>!n.isGroup).length} nodes, ${enforced.flows.length} flows`);
  
  return enforced;
}
