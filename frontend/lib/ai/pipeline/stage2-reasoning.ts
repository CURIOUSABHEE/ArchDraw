import type { ReasoningResult } from './types';
import { REASONING_PROMPT, MODEL_CONFIG } from '../constants';

// Re-export ReasoningResult for other modules
export type { ReasoningResult };

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

/**
 * STAGE 2 — REASONING
 * Produces a structured architectural plan before diagram generation.
 * 
 * Output includes:
 * - system type (e.g., video streaming platform)
 * - layers: clients, entry, services, async systems, data layer
 * - key flows: request flow, async/background processing
 * 
 * This stage defines STRUCTURE, not nodes.
 */
export async function callReasoningLLM(
  prompt: string,
  intentType: string
): Promise<ReasoningResult> {
  const systemPrompt = buildReasoningPrompt(prompt, intentType);

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
          systemType: parsed.systemType || intentType || 'system-architecture',
          nfrs: parsed.nfrs || {},
          capPosition: parsed.capPosition || 'AP',
          boundaries: parsed.boundaries || { entryPoints: [], exitPoints: [], trustZones: [] },
          layerAssignment: parsed.layerAssignment || {},
          patterns: parsed.patterns || [],
          stressTests: parsed.stressTests || [],
          keyDecisions: parsed.keyDecisions || [],
          // NEW: Structured architectural plan
          layers: parsed.layers || buildDefaultLayers(parsed.systemType || intentType),
          keyFlows: parsed.keyFlows || [],
          architecturalPlan: parsed.architecturalPlan || '',
        };
      }
    } catch (error) {
      console.log(`[Reasoning] Groq key ${envVar} failed:`, error instanceof Error ? error.message : 'unknown error');
      continue;
    }
  }

  // Fallback with default structure
  return buildFallbackReasoning(intentType);
}

function buildReasoningPrompt(prompt: string, intentType: string): string {
  return `You are an expert systems architect. Analyze the following system description and produce a structured architectural plan.

SYSTEM DESCRIPTION: ${prompt}
DETECTED INTENT: ${intentType}

OUTPUT A JSON OBJECT with the following structure:
{
  "systemType": "specific system type (e.g., video streaming platform, e-commerce platform, real-time chat system)",
  "layers": {
    "clients": {
      "description": "Client-facing components",
      "components": ["web client", "mobile app"]
    },
    "entry": {
      "description": "Entry point / edge layer",
      "components": ["load balancer", "API gateway"]
    },
    "services": {
      "description": "Core business services",
      "components": ["auth service", "main API", "user service"]
    },
    "async": {
      "description": "Asynchronous processing layer",
      "components": ["message queue", "worker service"]
    },
    "data": {
      "description": "Data persistence layer",
      "components": ["database", "cache"]
    }
  },
  "keyFlows": [
    {
      "name": "Request Flow",
      "description": "Primary user request flow through the system",
      "path": ["client", "gateway", "service", "data"]
    },
    {
      "name": "Async Processing",
      "description": "Background job processing",
      "path": ["service", "queue", "worker"]
    }
  ],
  "nfrs": {
    "scale": "expected scale (e.g., 10K users, 1M requests/day)",
    "latency": "latency requirements",
    "availability": "availability requirements"
  },
  "patterns": [
    { "pattern": "pattern name", "justification": "why it's needed" }
  ],
  "layerAssignment": {
    "component-id": "layer-name"
  },
  "architecturalPlan": "Brief 2-3 sentence summary of the architecture"
}

REQUIREMENTS:
1. Define ALL 5 layers: clients, entry, services, async, data
2. Each layer must have at least 1-3 component types listed
3. Define at least 2 key flows showing how requests move through layers
4. Be specific about the system type (not just "web app")
5. Output ONLY valid JSON, no markdown blocks

Analyze and output JSON now:`;
}

function buildDefaultLayers(systemType: string): Record<string, { description: string; components: string[] }> {
  return {
    clients: {
      description: 'Client-facing components',
      components: ['web client', 'mobile app'],
    },
    entry: {
      description: 'Entry point / edge layer',
      components: ['load balancer', 'API gateway'],
    },
    services: {
      description: 'Core business services',
      components: ['auth service', 'main API', 'business logic service'],
    },
    async: {
      description: 'Asynchronous processing layer',
      components: ['message queue', 'worker service'],
    },
    data: {
      description: 'Data persistence layer',
      components: ['database', 'cache'],
    },
  };
}

function buildFallbackReasoning(intentType: string): ReasoningResult {
  return {
    systemType: intentType || 'system-architecture',
    nfrs: { scale: 'unknown', latency: 'unknown', availability: 'unknown' },
    capPosition: 'AP',
    boundaries: { entryPoints: [], exitPoints: [], trustZones: [] },
    layerAssignment: {},
    patterns: [],
    stressTests: [],
    keyDecisions: [],
    layers: buildDefaultLayers(intentType),
    keyFlows: [
      {
        name: 'Request Flow',
        description: 'Primary user request flow',
        path: ['client', 'gateway', 'service', 'data'],
      },
      {
        name: 'Async Processing',
        description: 'Background processing',
        path: ['service', 'queue', 'worker'],
      },
    ],
    architecturalPlan: `A ${intentType || 'system'} architecture with standard layered structure.`,
  };
}

// Extend ReasoningResult type (this is for documentation, the actual type update is in types.ts)
export interface ExtendedReasoningResult extends ReasoningResult {
  layers?: Record<string, { description: string; components: string[] }>;
  keyFlows?: Array<{ name: string; description: string; path: string[] }>;
  architecturalPlan?: string;
}
