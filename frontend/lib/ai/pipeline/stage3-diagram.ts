import type { RawNode, RawFlow, ParsedDiagram, ReasoningResult } from './types';
import { DIAGRAM_PROMPT, MODEL_CONFIG } from '../constants';

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
            { role: 'system', content: 'Output NDJSON only. One JSON object per line. No markdown.' },
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
                subtitle: obj.subtitle ? String(obj.subtitle) : undefined,
                layer: (String(obj.layer) || 'application') as RawNode['layer'],
                icon: obj.icon ? String(obj.icon) : undefined,
                serviceType: obj.serviceType ? String(obj.serviceType) : undefined,
                isGroup: obj.isGroup ? true : undefined,
                groupLabel: obj.groupLabel ? String(obj.groupLabel) : undefined,
                groupColor: obj.groupColor ? String(obj.groupColor) : undefined,
                parentId: obj.parentId ? String(obj.parentId) : undefined,
              };
              nodes.push(node);
              onNode?.(node);
            } else if (obj.type === 'flow' || obj.path) {
              const flowObj = obj as { path: string[]; label?: string; async?: boolean };
              if (Array.isArray(flowObj.path) && flowObj.path.length >= 2) {
                const flow: RawFlow = {
                  path: flowObj.path,
                  label: flowObj.label ? String(flowObj.label) : undefined,
                  async: flowObj.async ?? false,
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
          { role: 'system', content: 'Output NDJSON only. One JSON object per line. No markdown.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 3000,
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
  const nodes: RawNode[] = [];
  const flows: RawFlow[] = [];

  const lines = rawText.split('\n').filter(l => l.trim());

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('```') || trimmed.startsWith('//')) continue;

    try {
      const obj = JSON.parse(trimmed);

      if (obj.id && obj.label && (obj.layer || obj.isGroup || obj.parentId)) {
        const node: RawNode = {
          id: String(obj.id),
          label: String(obj.label),
          subtitle: obj.subtitle ? String(obj.subtitle) : undefined,
          layer: (String(obj.layer) || 'application') as RawNode['layer'],
          icon: obj.icon ? String(obj.icon) : undefined,
          serviceType: obj.serviceType ? String(obj.serviceType) : undefined,
          isGroup: obj.isGroup ? true : undefined,
          groupLabel: obj.groupLabel ? String(obj.groupLabel) : undefined,
          groupColor: obj.groupColor ? String(obj.groupColor) : undefined,
          parentId: obj.parentId ? String(obj.parentId) : undefined,
        };
        nodes.push(node);
      } else if (obj.type === 'flow' || obj.path) {
        const flowObj = obj as { path: string[]; label?: string; async?: boolean };
        if (Array.isArray(flowObj.path) && flowObj.path.length >= 2) {
          flows.push({
            path: flowObj.path,
            label: flowObj.label ? String(flowObj.label) : undefined,
            async: flowObj.async ?? false,
          });
        }
      }
    } catch (error) {
      console.log('[Parse] Invalid JSON line:', trimmed.slice(0, 50));
    }
  }

  return { nodes, flows };
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