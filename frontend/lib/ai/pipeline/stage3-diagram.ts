import type { RawNode, RawFlow, ParsedDiagram, ReasoningResult, PipelineLayer } from './types';
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
  { type: 'gateway', label: 'API Gateway', layer: 'application' },
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
 * Generate a flexible, well-structured architecture based on user's request.
 * 
 * KEY PRINCIPLES:
 * - NO TEMPLATES - generate based on actual requirements
 * - Flexible complexity - simple or complex based on user's needs
 * - Proper spacing - minimum 20px horizontal, 10px vertical
 * - Layer-based organization - left-to-right flow
 * - NO ORPHAN NODES - all nodes must be connected
 * - Beautiful, structured layouts
 * 
 * CONSTRAINTS:
 * - Minimum 6 nodes for simple architectures
 * - Maximum 15 nodes for complex architectures
 * - Minimum 5 edges to ensure connectivity
 * - Nodes organized in layers: presentation → gateway → application → async → data
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

  return `You are an expert systems architect. Generate a clean, well-structured architecture diagram in NDJSON format.

${architecturalPlan}

${layersInfo}

${flowsInfo}

SYSTEM TYPE: ${reasoning.systemType}

CRITICAL REQUIREMENTS:
1. Generate ${MIN_NODES}-${MAX_NODES} nodes based on complexity needed
2. Generate at least ${MIN_EDGES} edges - EVERY node must be connected (NO ORPHANS)
3. Create a FLEXIBLE architecture that matches the user's request
4. NO TEMPLATES - design based on actual requirements
5. Organize nodes in 3 columns (left-to-right flow)
6. Maintain proper spacing (20px horizontal, 5px vertical minimum, 12px when labels present)

3-COLUMN LAYOUT (left to right):
- presentation: User-facing clients (web, mobile, desktop, browser) → LEFT COLUMN
- application: Services, APIs, gateways, workers, queues, auth → MIDDLE COLUMN
- data: Databases, caches, storage → RIGHT COLUMN

NO GROUPS - Flat structure with proper column assignment:
- Each node is a real component
- Edges show actual data flow
- Simple and practical

OUTPUT FORMAT - NDJSON (one JSON object per line):

EXAMPLE (Simple E-commerce):
{"id": "web-app", "label": "Web App", "layer": "presentation", "type": "client", "icon": "monitor", "subtitle": "React"}
{"id": "api-gateway", "label": "API Gateway", "layer": "application", "type": "gateway", "icon": "webhook", "subtitle": "REST"}
{"id": "product-service", "label": "Product Service", "layer": "application", "type": "service", "icon": "server", "subtitle": "Catalog"}
{"id": "order-service", "label": "Order Service", "layer": "application", "type": "service", "icon": "server", "subtitle": "Orders"}
{"id": "cache", "label": "Redis", "layer": "data", "type": "cache", "icon": "gauge", "subtitle": "Cache"}
{"id": "database", "label": "PostgreSQL", "layer": "data", "type": "database", "icon": "database", "subtitle": "Main DB"}

FLOWS (ensure ALL nodes are connected):
{"type": "flow", "path": ["web-app", "api-gateway"], "label": "HTTPS", "async": false}
{"type": "flow", "path": ["api-gateway", "product-service"], "label": "get products", "async": false}
{"type": "flow", "path": ["api-gateway", "order-service"], "label": "create order", "async": false}
{"type": "flow", "path": ["product-service", "cache"], "label": "cache lookup", "async": false}
{"type": "flow", "path": ["product-service", "database"], "label": "query", "async": false}
{"type": "flow", "path": ["order-service", "database"], "label": "insert", "async": false}

NODE TYPES: client, gateway, service, queue, cache, database, worker, auth, api, cdn, loadbalancer
LAYER VALUES: presentation, application, data

EDGE LABELS - Be specific:
- "HTTPS request", "REST API", "gRPC call"
- "verify token", "check permissions"
- "query users", "update record", "cache lookup"
- "publish event", "consume message"

CRITICAL: Ensure EVERY node has at least one connection. NO ORPHAN NODES.

Generate a clean 3-column architecture. Output ONLY NDJSON:`;
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
              if (obj.id && obj.label && !obj.isGroup && !obj.parentId) {
                const node: RawNode = {
                  id: String(obj.id),
                  label: String(obj.label),
                  subtitle: obj.subtitle ? String(obj.subtitle) : '',
                  layer: (obj.layer as PipelineLayer) || 'application',
                  icon: obj.icon ? String(obj.icon) : 'box',
                  serviceType: obj.serviceType ? String(obj.serviceType) : '',
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
 * Ensures NO ORPHAN NODES - all nodes must be connected.
 * Adds missing components and connections as needed.
 */
function enforceMinimumConstraints(
  nodes: RawNode[], 
  flows: RawFlow[], 
  reasoning: ReasoningResult
): { nodes: RawNode[]; flows: RawFlow[] } {
  const enrichedNodes = [...nodes];
  const enrichedFlows = [...flows];

  // Check for required component types
  const hasGateway = enrichedNodes.some(n => n.layer === 'application' && (n.serviceType === 'gateway' || n.label.toLowerCase().includes('gateway')));
  const serviceCount = enrichedNodes.filter(n => n.layer === 'application' || n.serviceType === 'service').length;
  const hasDatabase = enrichedNodes.some(n => n.serviceType === 'database');

  // Add missing required components
  if (!hasGateway) {
    enrichedNodes.push({
      id: 'api-gateway',
      label: 'API Gateway',
      layer: 'application',
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

  // Ensure minimum node count
  if (enrichedNodes.length < MIN_NODES) {
    const clients = enrichedNodes.filter(n => n.layer === 'presentation');
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

  // Build connectivity map
  const connectedNodes = new Set<string>();
  for (const flow of enrichedFlows) {
    for (const nodeId of flow.path) {
      connectedNodes.add(nodeId);
    }
  }

  // Identify orphan nodes (nodes with no connections)
  const orphanNodes = enrichedNodes.filter(n => !connectedNodes.has(n.id));
  
  if (orphanNodes.length > 0) {
    console.log(`[Diagram] Found ${orphanNodes.length} orphan nodes - connecting them`);
    
    // Connect orphans to appropriate nodes based on column
    for (const orphan of orphanNodes) {
      const orphanLayer = orphan.layer as PipelineLayer;
      const layerIdx = LAYER_ORDER.indexOf(orphanLayer);
      
      // Find a node in the previous column to connect to
      if (layerIdx > 0) {
        const prevLayer = LAYER_ORDER[layerIdx - 1];
        const prevLayerNodes = enrichedNodes.filter(n => 
          n.layer === prevLayer && connectedNodes.has(n.id)
        );
        
        if (prevLayerNodes.length > 0) {
          const targetNode = prevLayerNodes[0];
          enrichedFlows.push({
            path: [targetNode.id, orphan.id],
            label: 'connects to',
            async: false,
          });
          connectedNodes.add(orphan.id);
          console.log(`[Diagram] Connected orphan ${orphan.id} to ${targetNode.id}`);
        }
      }
      
      // If still orphaned, connect to next column
      if (!connectedNodes.has(orphan.id) && layerIdx < LAYER_ORDER.length - 1) {
        const nextLayer = LAYER_ORDER[layerIdx + 1];
        const nextLayerNodes = enrichedNodes.filter(n => 
          n.layer === nextLayer && connectedNodes.has(n.id)
        );
        
        if (nextLayerNodes.length > 0) {
          const targetNode = nextLayerNodes[0];
          enrichedFlows.push({
            path: [orphan.id, targetNode.id],
            label: 'connects to',
            async: false,
          });
          connectedNodes.add(orphan.id);
          console.log(`[Diagram] Connected orphan ${orphan.id} to ${targetNode.id}`);
        }
      }
    }
  }

  // Ensure minimum edge count
  if (enrichedFlows.length < MIN_EDGES) {
    const flowExists = (src: string, tgt: string) => 
      enrichedFlows.some(f => f.path.includes(src) && f.path.includes(tgt));
    
    // Connect presentation to application column (gateways, services, etc.)
    const presNodes = enrichedNodes.filter(n => n.layer === 'presentation');
    const appNodes = enrichedNodes.filter(n => n.layer === 'application');
    for (const p of presNodes) {
      for (const a of appNodes) {
        if (!flowExists(p.id, a.id)) {
          enrichedFlows.push({ path: [p.id, a.id], label: 'HTTPS request', async: false });
        }
      }
    }

    // Connect application to data layer
    const dataNodes = enrichedNodes.filter(n => n.layer === 'data');
    for (const a of appNodes) {
      for (const d of dataNodes) {
        if (!flowExists(a.id, d.id)) {
          const label = d.serviceType === 'cache' ? 'cache lookup' : 'query';
          enrichedFlows.push({ path: [a.id, d.id], label, async: false });
        }
      }
    }
  }

  // Final check for orphans
  const finalConnectedNodes = new Set<string>();
  for (const flow of enrichedFlows) {
    for (const nodeId of flow.path) {
      finalConnectedNodes.add(nodeId);
    }
  }
  
  const finalOrphans = enrichedNodes.filter(n => !finalConnectedNodes.has(n.id));
  if (finalOrphans.length > 0) {
    console.log(`[Diagram] WARNING: ${finalOrphans.length} nodes still orphaned after enrichment`);
  }

  return { nodes: enrichedNodes, flows: enrichedFlows };
}

const LAYER_ORDER: PipelineLayer[] = ['presentation', 'application', 'data'];

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
