import type { RawNode, RawFlow, ParsedDiagram, ReasoningResult, PipelineLayer as LayerType } from './types';
import { DIAGRAM_PROMPT, MODEL_CONFIG, DIAGRAM_SYSTEM_MESSAGE } from '../constants';
import { parseNDJSON } from './stage4-parse';

const GROQ_KEY_ENV_VARS = [
  'GROQ_API_KEY_FOR_DESC_1', 'GROQ_API_KEY_FOR_DESC_2', 'GROQ_API_KEY_FOR_DESC_3',
  'GROQ_API_KEY_FOR_DESC_4', 'GROQ_API_KEY_FOR_DESC_5', 'GROQ_API_KEY_FOR_DESC_6',
  'GROQ_API_KEY_FOR_DESC_7', 'GROQ_API_KEY_FOR_DESC_8', 'GROQ_API_KEY_FOR_DESC_9',
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

function buildDiagramPrompt(reasoning: ReasoningResult): string {
  const reasoningJson = JSON.stringify({
    systemType: reasoning.systemType,
    nfrs: reasoning.nfrs,
    boundaries: reasoning.boundaries,
    layerAssignment: reasoning.layerAssignment,
    patterns: reasoning.patterns,
    stressTests: reasoning.stressTests,
  });
  return DIAGRAM_PROMPT.replace('{reasoning}', reasoningJson);
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
      systemType: reasoning.systemType,
      nfrs: reasoning.nfrs,
      capPosition: reasoning.capPosition,
      boundaries: reasoning.boundaries,
      layerAssignment: reasoning.layerAssignment,
      patterns: reasoning.patterns,
      stressTests: reasoning.stressTests,
      keyDecisions: reasoning.keyDecisions,
    });
    result = await tryGroq(fallbackPrompt, onNode, onFlow) || await tryOpenRouter(fallbackPrompt, onNode, onFlow);
  }

  if (!result || result.nodes.length === 0) {
    console.log('[Diagram] WARNING: No nodes generated, returning empty diagram');
    return { nodes: [], flows: [] };
  }

  return result;
}
