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
  onFlow?: (flow: RawFlow) => void
): Promise<ParsedDiagram> {
  const prompt = buildDiagramPrompt(reasoning);
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

function buildDiagramPrompt(reasoning: ReasoningResult): string {
  return `Create a diagram for: ${reasoning.systemType}.
PLAN: ${reasoning.architecturalPlan}

LAYERS:
${Object.entries(reasoning.layers || {}).map(([id, l]) => `- ${id}: ${l.description} (${l.components.join(', ')})`).join('\n')}

FLOWS:
${(reasoning.keyFlows || []).map(f => `- ${f.name}: ${f.description} (${f.path.join(' -> ')})`).join('\n')}

OUTPUT NDJSON ONLY. ONE OBJECT PER LINE.
- {"id": "id", "label": "Service", "layer": "client|edge|gateway|application|queue|data", "subtitle": "Tech"}
- {"path": ["src", "dst"], "label": "protocol", "async": false}
`.trim();
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
      // Connect to first application layer node if exists, otherwise any node
      const targetNode = result.nodes.find(n => !n.isGroup && n.layer === 'application' && n.id !== orphan.id) 
                      || result.nodes.find(n => !n.isGroup && n.id !== orphan.id);
      
      if (targetNode) {
        result.flows.push({
          path: [orphan.id, targetNode.id],
          label: 'connects to',
          async: false,
        });
        logger.log(`[Diagram] Connected orphan ${orphan.id} to ${targetNode.id}`);
      }
    });
  }

  return result;
}

export function parseLLMOutput(text: string): ParsedDiagram {
  return parseNDJSON(text);
}
