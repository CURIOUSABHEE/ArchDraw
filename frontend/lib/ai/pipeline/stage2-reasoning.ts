import type { ReasoningResult } from './types';
import { MODEL_CONFIG } from '../constants';
import logger from '@/lib/logger';

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
  intentType: string,
  diagramSize: 'small' | 'medium' | 'large' = 'medium'
): Promise<ReasoningResult> {
  const systemPrompt = buildReasoningPrompt(prompt, intentType, diagramSize);

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
          sourcePrompt: prompt,
          nfrs: parsed.nfrs || {},
          capPosition: parsed.capPosition || 'AP',
          boundaries: parsed.boundaries || { entryPoints: [], exitPoints: [], trustZones: [] },
          layerAssignment: parsed.layerAssignment || {},
          patterns: parsed.patterns || [],
          stressTests: parsed.stressTests || [],
          keyDecisions: parsed.keyDecisions || [],
          // NEW: Structured architectural plan
          layers: sanitizeLayers(parsed.layers, prompt) || buildPromptDerivedLayers(prompt, intentType),
          keyFlows: parsed.keyFlows || [],
          architecturalPlan: parsed.architecturalPlan || '',
          extractedBehaviors: parsed.extractedBehaviors || [],
          preGenerationChecklist: parsed.preGenerationChecklist || {
            humanActors: [],
            dataStores: [],
            backgroundJobs: [],
            externalIntegrations: [],
            featureRequirements: []
          },
        };
      }
    } catch (error) {
      logger.log(`[Reasoning] Groq key ${envVar} failed:`, error instanceof Error ? error.message : 'unknown error');
      continue;
    }
  }

  // Fallback with prompt-derived structure, not a fixed web-app template.
  return buildFallbackReasoning(prompt, intentType);
}

import { ARCHITECTURE_RULES } from '../prompts/architectureRules';

function buildReasoningPrompt(prompt: string, intentType: string, diagramSize: 'small' | 'medium' | 'large' = 'medium'): string {
  let sizeConstraintPrompt = "";
  if (diagramSize === 'small') {
    sizeConstraintPrompt = "SIZE CONSTRAINT: Generate a focused diagram with 4–6 nodes maximum. Show only the core architectural components.";
  } else if (diagramSize === 'large') {
    sizeConstraintPrompt = "SIZE CONSTRAINT: Generate a comprehensive diagram with 13–20 nodes. Include all services, background workers, caching layers, observability stack, and external integrations.";
  } else {
    sizeConstraintPrompt = "SIZE CONSTRAINT: Generate a standard diagram with 8–12 nodes. Include primary services, databases, and one observability node.";
  }

  return `You are an expert systems architect. Analyze the following system description and produce a structured architectural plan.

${sizeConstraintPrompt}

${ARCHITECTURE_RULES}

SYSTEM DESCRIPTION: ${prompt}
DETECTED INTENT: ${intentType}

OUTPUT A JSON OBJECT with the following structure:
{
  "systemType": "specific system type (e.g., video streaming platform, e-commerce platform, real-time chat system)",
  "layers": {
    "client": { "description": "only if the request has users/apps", "components": ["specific client from prompt"] },
    "edge": { "description": "only if routing/CDN/WAF/load balancing is needed", "components": ["specific edge component"] },
    "compute": { "description": "domain services and workers actually needed", "components": ["specific service from prompt"] },
    "async": { "description": "only if events, queues, streams, jobs, or background work are needed", "components": ["specific async component"] },
    "data": { "description": "stores explicitly required by the workload", "components": ["specific database/storage/cache"] },
    "observe": { "description": "only if observability is requested or essential", "components": ["specific monitoring/logging component"] },
    "external": { "description": "only if third-party systems are involved", "components": ["specific external dependency"] }
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
  "architecturalPlan": "Brief 2-3 sentence summary of the architecture",
  "preGenerationChecklist": {
    "humanActors": ["actor1", "actor2"],
    "dataStores": ["store1", "store2"],
    "backgroundJobs": ["job1"],
    "externalIntegrations": ["integration1"],
    "featureRequirements": ["verb phrase 1"]
  }
}

REQUIREMENTS:
1. Do NOT follow a fixed web-app template. Include only layers and components justified by the user's prompt.
2. Never add "Web Client", "Mobile App", "Auth Service", "Load Balancer", "Message Queue", or "Database" unless requested or architecturally necessary for this specific system.
3. Prefer domain-specific services over generic names. For example, use "Feed Ranking Service" or "Transcoding Worker", not "Business Logic Service".
4. Define key flows using the exact component names you chose. Flows should be directional: client/producer → edge/gateway → compute → async/data/external.
5. Be specific about the system type (not just "web app").
6. Output ONLY valid JSON, no markdown blocks.
7. CRITICAL RULE FOR CDNs: A CDN (Content Delivery Network) must ONLY be used for serving static assets and media from an Object Storage origin to a Client. It must NEVER route API requests, and it must NEVER connect to an Application Service, API Gateway, or Database.
8. Before completing the plan, complete this pre-generation checklist based on the user prompt:
 - humanActors: List every distinct HUMAN ACTOR in the prompt. Each distinct actor will become a separate client node. A 'rider' and a 'driver' are two actors. Never merge multiple human actors into one UI node.
 - dataStores: List every distinct DATA STORE mentioned or implied.
 - backgroundJobs: List every BACKGROUND JOB or async process.
 - externalIntegrations: List every EXTERNAL INTEGRATION (payment, maps, email, SMS).
 - featureRequirements: List every explicit FEATURE REQUIREMENT as a verb phrase.
 Every item in this checklist must map to at least one node or edge in the final diagram. Output this structured checklist in the "preGenerationChecklist" field.

Analyze and output JSON now:`;
}

const TEMPLATE_COMPONENTS = new Set([
  'web client',
  'mobile app',
  'load balancer',
  'api gateway',
  'auth service',
  'main api',
  'business logic service',
  'message queue',
  'worker service',
  'database',
  'cache',
]);

function sanitizeLayers(
  layers: unknown,
  prompt: string
): Record<string, { description: string; components: string[] }> | null {
  if (!layers || typeof layers !== 'object') return null;
  const promptLower = prompt.toLowerCase();
  const sanitized: Record<string, { description: string; components: string[] }> = {};

  for (const [layer, value] of Object.entries(layers as Record<string, { description?: unknown; components?: unknown[] }>)) {
    const filtered = (Array.isArray(value?.components) ? value.components : [])
      .map(component => String(component).trim())
      .filter(Boolean)
      .filter(component => {
        const lower = component.toLowerCase();
        if (!TEMPLATE_COMPONENTS.has(lower)) return true;
        const stem = lower.replace(/\s+(service|app|client|gateway|queue)$/i, '');
        return promptLower.includes(lower) || promptLower.includes(stem);
      });

    if (filtered.length > 0) {
      const key = normalizeLayerName(layer);
      sanitized[key] = {
        description: String(value?.description || `${key} components`),
        components: filtered.slice(0, 6),
      };
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

function buildPromptDerivedLayers(prompt: string, intentType: string): Record<string, { description: string; components: string[] }> {
  const p = prompt.toLowerCase();
  const layers: Record<string, { description: string; components: string[] }> = {};
  const add = (layer: string, description: string, component: string) => {
    const key = normalizeLayerName(layer);
    layers[key] ||= { description, components: [] };
    if (!layers[key].components.includes(component)) layers[key].components.push(component);
  };

  if (/\b(web|browser|frontend|client|user)\b/.test(p)) add('client', 'User-facing entry points', 'Web App');
  if (/\b(mobile|ios|android)\b/.test(p)) add('client', 'User-facing entry points', 'Mobile App');
  if (/\bcdn|cloudfront|akamai|static|media delivery\b/.test(p)) add('edge', 'Edge delivery and routing', 'CDN');
  if (/\bapi gateway|gateway|graphql|rest|ingress|nginx\b/.test(p)) add('edge', 'API ingress', p.includes('graphql') ? 'GraphQL Gateway' : 'API Gateway');
  if (/\bqueue|kafka|sqs|rabbitmq|pub.?sub|event|stream\b/.test(p)) add('async', 'Asynchronous/event processing', p.includes('kafka') ? 'Kafka Event Stream' : 'Message Queue');
  if (/\bworker|job|background|transcod|process|pipeline\b/.test(p)) add('compute', 'Background and domain processing', /\btranscod/.test(p) ? 'Transcoding Worker' : 'Worker Service');
  if (/\bpostgres|mysql|mongodb|database|db\b/.test(p)) add('data', 'Operational persistence', p.includes('mongo') ? 'MongoDB Database' : p.includes('mysql') ? 'MySQL Database' : 'PostgreSQL Database');
  if (/\bredis|cache\b/.test(p)) add('data', 'Low-latency state', 'Redis Cache');
  if (/\bs3|storage|bucket|blob|file|media|upload\b/.test(p)) add('data', 'Object/file persistence', 'Object Storage');
  if (/\bmonitor|metric|log|trace|observability|grafana|prometheus|sentry\b/.test(p)) add('observe', 'System telemetry', 'Observability Stack');
  if (/\bstripe|payment|twilio|sendgrid|firebase|auth0\b/.test(p)) add('external', 'Third-party integrations', p.includes('stripe') || p.includes('payment') ? 'Payment Provider' : 'External Service');

  if (Object.keys(layers).length === 0) {
    add('compute', 'Core domain logic inferred from the request', titleCase(`${intentType.replace(/-/g, ' ')} service`));
    add('data', 'Persistence inferred from the request', 'Primary Data Store');
  }

  return layers;
}

function normalizeLayerName(layer: string): string {
  const lower = layer.toLowerCase();
  if (lower === 'clients' || lower === 'presentation') return 'client';
  if (lower === 'entry' || lower === 'gateway') return 'edge';
  if (lower === 'services' || lower === 'application') return 'compute';
  if (lower === 'queue') return 'async';
  if (lower === 'observability') return 'observe';
  return lower;
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, c => c.toUpperCase());
}

function buildFallbackReasoning(prompt: string, intentType: string): ReasoningResult {
  const layers = buildPromptDerivedLayers(prompt, intentType);
  const flowPath = Object.values(layers).flatMap(layer => layer.components.slice(0, 1)).slice(0, 5);

  return {
    systemType: intentType || 'system-architecture',
    sourcePrompt: prompt,
    nfrs: { scale: 'unknown', latency: 'unknown', availability: 'unknown' },
    capPosition: 'AP',
    boundaries: { entryPoints: [], exitPoints: [], trustZones: [] },
    layerAssignment: {},
    patterns: [],
    stressTests: [],
    keyDecisions: [],
    layers,
    keyFlows: [
      {
        name: 'Primary Flow',
        description: 'Main flow inferred from the user request',
        path: flowPath.length >= 2 ? flowPath : Object.values(layers).flatMap(layer => layer.components),
      },
    ],
    architecturalPlan: `A prompt-derived ${intentType || 'system'} architecture using only components indicated by the request or required by the inferred workload.`,
    extractedBehaviors: [],
    preGenerationChecklist: {
      humanActors: [],
      dataStores: [],
      backgroundJobs: [],
      externalIntegrations: [],
      featureRequirements: []
    }
  };
}
