import type { ReasoningResult, IntentResult } from './types';
import { REASONING_PROMPT, MODEL_CONFIG } from '../constants';

const GROQ_KEY_ENV_VARS = [
  'GROQ_API_KEY_FOR_DESC_1', 'GROQ_API_KEY_FOR_DESC_2', 'GROQ_API_KEY_FOR_DESC_3',
  'GROQ_API_KEY_FOR_DESC_4', 'GROQ_API_KEY_FOR_DESC_5', 'GROQ_API_KEY_FOR_DESC_6',
  'GROQ_API_KEY_FOR_DESC_7', 'GROQ_API_KEY_FOR_DESC_8', 'GROQ_API_KEY_FOR_DESC_9',
];

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

export async function callReasoningLLM(
  prompt: string,
  intentType: string
): Promise<ReasoningResult> {
  const systemPrompt = REASONING_PROMPT
    .replace('{description}', prompt)
    .replace('{intent}', intentType);

  for (const envVar of GROQ_KEY_ENV_VARS) {
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

        return {
          systemType: parsed.systemType || intentType,
          nfrs: parsed.nfrs || {},
          capPosition: parsed.capPosition || 'AP',
          boundaries: parsed.boundaries || { entryPoints: [], exitPoints: [], trustZones: [] },
          layerAssignment: parsed.layerAssignment || {},
          patterns: parsed.patterns || [],
          stressTests: parsed.stressTests || [],
          keyDecisions: parsed.keyDecisions || [],
        };
      }
    } catch (error) {
      console.log(`[Reasoning] Groq key ${envVar} failed:`, error instanceof Error ? error.message : 'unknown error');
      continue;
    }
  }

  // Fallback if all keys fail
  return {
    systemType: intentType,
    nfrs: { scale: 'unknown', latency: 'unknown' },
    capPosition: 'AP',
    boundaries: { entryPoints: [], exitPoints: [], trustZones: [] },
    layerAssignment: {},
    patterns: [],
    stressTests: [],
    keyDecisions: [],
  };
}