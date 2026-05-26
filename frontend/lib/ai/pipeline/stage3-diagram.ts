import type { RawNode, RawFlow, ParsedDiagram, ReasoningResult, PipelineLayer } from './types';
import { DIAGRAM_PROMPT, MODEL_CONFIG, DIAGRAM_SYSTEM_MESSAGE } from '../constants';
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
      try {
        const trimmed = line.trim();
        if (trimmed && trimmed.startsWith('{') && trimmed.endsWith('}')) {
          const item = JSON.parse(trimmed);
          newItems.push(item);
          this.completed.push(item);
        }
      } catch {
        // Skip malformed lines
      }
    }
    return newItems;
  }

  getResults(): Record<string, unknown>[] {
    return this.completed;
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
  intentType?: string
): Promise<ParsedDiagram> {
  const prompt = buildDiagramPrompt(reasoning, existingContext, diagramSize, intentType);
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

      const results = parser.getResults();
      const nodes = results.filter(i => i.id && i.label) as unknown as RawNode[];
      const flows = results.filter(i => i.path && Array.isArray(i.path)) as unknown as RawFlow[];
      
      const result = { nodes, flows };
      const enforced = enforceMinimumConstraints(result.nodes, result.flows, reasoning);
      
      logger.log(`[Diagram] Generated: ${enforced.nodes.filter(n=>!n.isGroup).length} nodes, ${enforced.flows.length} flows`);
      
      return enforced;
    } catch (error) {
      logger.log(`[Diagram] Groq key ${envVar} failed:`, error instanceof Error ? error.message : 'unknown');
      continue;
    }
  }

  // Fallback if all keys fail
  logger.log('[Diagram] All providers failed, using fallback prompt');
  return { nodes: [], flows: [] };
}

import { ARCHITECTURE_RULES } from '../prompts/architectureRules';

function buildDiagramPrompt(
  reasoning: ReasoningResult,
  existingContext?: { nodes: any[]; edges: any[] },
  diagramSize: 'small' | 'medium' | 'large' = 'medium',
  intentType?: string
): string {
  let sizeInstructions = "";
  if (diagramSize === 'small') {
    sizeInstructions = "CRITICAL LIMIT: Generate a focused diagram with exactly 4 to 6 nodes total. Omit all optional or secondary components.";
  } else if (diagramSize === 'large') {
    sizeInstructions = "CRITICAL LIMIT: Generate a comprehensive diagram with 13 to 20 nodes total. Include primary, secondary, worker, cache, observability, and external services to show the complete production setup.";
  } else {
    sizeInstructions = "CRITICAL LIMIT: Generate a standard diagram with exactly 8 to 12 nodes total. Include primary components, primary databases, and basic observability.";
  }

  let intentInject = "";
  if (intentType === 'mvc') {
    intentInject = `
STRICT RULE: This is an MVC diagram. You MUST structure nodes into exactly three groups:
- View layer: UI screens, templates, components, API responses
- Controller layer: route handlers, business logic, request processing
- Model layer: database tables, ORM models, data classes, validation

DO NOT generate: microservices, AWS services, message queues, API gateways, separate backend services, or any cloud infrastructure.
Every node must belong to one of the three MVC layers.
`;
  }

  let prompt = `${ARCHITECTURE_RULES}
${intentInject}

${sizeInstructions}

Create a custom diagram for: ${reasoning.systemType}.
USER PROMPT: ${reasoning.sourcePrompt || reasoning.systemType}
PLAN: ${reasoning.architecturalPlan}

LAYERS:
${Object.entries(reasoning.layers || {}).map(([id, l]) => `- ${id}: ${l.description} (${l.components.join(', ')})`).join('\n')}

FLOWS:
${(reasoning.keyFlows || []).map(f => `- ${f.name}: ${f.description} (${f.path.join(' -> ')})`).join('\n')}
`;

  if (existingContext && existingContext.nodes.length > 0) {
    prompt += `
EXISTING DIAGRAM (IMPORTANT: Preserve existing nodes if they are still relevant. Use their exact IDs so custom styling is retained!):
Nodes:
${existingContext.nodes.map(n => `- {"id": "${n.id}", "label": "${n.data?.label || n.label}", "layer": "${n.data?.layer || n.layer}", "subtitle": "${n.data?.subtitle || n.subtitle || ''}"}`).join('\n')}
Edges:
${existingContext.edges.map(e => `- {"path": ["${e.source}", "${e.target}"], "label": "${e.data?.label || e.label || ''}"}`).join('\n')}

INSTRUCTIONS:
You are modifying an existing diagram. 
1. If an existing node should remain, OUTPUT IT AGAIN EXACTLY with its current "id". This is critical!
2. If you are adding a new node, create a NEW "id" for it.
3. If an existing node is no longer needed, omit it.
4. Output edges between the nodes (both old and new).
`;
  }

  prompt += `
OUTPUT NDJSON ONLY. ONE OBJECT PER LINE.
- {"id": "id", "label": "Service (Concise)", "layer": "client|edge|gateway|application|queue|data|observability|external", "subtitle": "Tech Stack (Max 3 words)"}
- {"path": ["src", "dst"], "label": "action/explanation (e.g. 'fetches data', 'authenticates')", "async": false}

CUSTOMIZATION RULES:
- Do not copy a generic web-app template. Use the layers, components, and flows that match the user prompt.
- Do not add Web Client, Mobile App, Auth Service, Load Balancer, Message Queue, Database, or Cache unless the prompt or plan makes them necessary.
- Never use a client node as the central target for backend services. Client nodes initiate flows; backend/data/queue nodes should not point back to clients.
- Prefer specific nodes named after the domain workflow over generic placeholders.
- NEVER use these edge labels: 'integrates with', 'connects to', 'calls', 'uses', 'requests'. These are banned. Every label must describe the specific data being transmitted.
  WRONG: GPS Service --INTEGRATES WITH--> Mapping Service
  RIGHT: GPS Service --sends lat/lng coordinates--> Mapping Service
  WRONG: Appointment Service --INTEGRATES WITH--> Payment Service
  RIGHT: Appointment Service --submits payment request--> Payment Service
- For every service that delivers a result to a user (recommendations, notifications, payments, search results, video streams), you MUST draw a return edge from that service back toward the client or API gateway. A flow that only shows the request path without the response path is architecturally incomplete.
- For every flow that starts at a client node, you must trace the complete cycle back to that client. Ask yourself: 'What does the user actually receive at the end of this flow?' That answer must be an edge. Examples:
  - User requests recommendations → ... → Recommendation Engine returns ranked list → API Gateway → User
  - User uploads video → ... → CDN delivers stream → Video Player
  - User books appointment → ... → Confirmation Service sends confirmation → Patient App
`;
  return prompt.trim();
}

function enforceMinimumConstraints(
  nodes: RawNode[],
  flows: RawFlow[],
  reasoning: ReasoningResult
): ParsedDiagram {
  const result: ParsedDiagram = { nodes: [...nodes], flows: [...flows] };
  
  if (result.nodes.length === 0) {
    logger.log('[Diagram] WARNING: No nodes generated, returning empty diagram');
    return result;
  }

  // Identify orphaned nodes
  const connectedNodeIds = new Set<string>();
  result.flows.forEach(f => {
    f.path.forEach(id => connectedNodeIds.add(id));
  });

  const orphanNodes = result.nodes.filter(n => !n.isGroup && !connectedNodeIds.has(n.id));
  
  if (orphanNodes.length > 0) {
    logger.log(`[Diagram] Found ${orphanNodes.length} orphan nodes - connecting them`);
    
    orphanNodes.forEach(orphan => {
      const targetNode = findBestConnectionPartner(orphan, result.nodes);

      if (targetNode) {
        const orphanRank = getLayerRank(orphan.layer);
        const targetRank = getLayerRank(targetNode.layer);
        const orphanShouldSource = orphanRank <= targetRank;
        const source = orphanShouldSource ? orphan.id : targetNode.id;
        const target = orphanShouldSource ? targetNode.id : orphan.id;

        result.flows.push({
          path: [source, target],
          label: getConnectionLabel(source === orphan.id ? orphan : targetNode, target === orphan.id ? orphan : targetNode),
          async: orphan.layer === 'queue' || orphan.layer === 'async' || targetNode.layer === 'queue' || targetNode.layer === 'async',
        });
        logger.log(`[Diagram] Connected orphan ${source} to ${target}`);
      }
    });
  }

  return result;
}

function findBestConnectionPartner(orphan: RawNode, nodes: RawNode[]): RawNode | undefined {
  const leafNodes = nodes.filter(n => !n.isGroup && n.id !== orphan.id);
  const rank = getLayerRank(orphan.layer);
  const downstream = leafNodes
    .filter(n => getLayerRank(n.layer) >= rank)
    .sort((a, b) => getLayerRank(a.layer) - getLayerRank(b.layer));
  const upstream = leafNodes
    .filter(n => getLayerRank(n.layer) < rank)
    .sort((a, b) => getLayerRank(b.layer) - getLayerRank(a.layer));

  if (rank === 0) return downstream.find(n => getLayerRank(n.layer) > rank) || downstream[0] || upstream[0];
  if (rank >= 4) return upstream[0] || downstream[0];
  return downstream.find(n => getLayerRank(n.layer) > rank) || upstream[0] || downstream[0];
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

function getConnectionLabel(source: RawNode, target: RawNode): string {
  const targetLayer = normalizeLayer(target.layer);
  if (targetLayer === 'data') return 'reads/writes';
  if (targetLayer === 'queue') return 'publishes';
  if (targetLayer === 'observability') return 'emits telemetry';
  if (targetLayer === 'external') return 'calls';
  if (normalizeLayer(source.layer) === 'client') return 'requests';
  return 'routes to';
}

export function parseLLMOutput(text: string): ParsedDiagram {
  return parseNDJSON(text);
}
