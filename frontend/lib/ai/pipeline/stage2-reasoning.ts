import type { ReasoningResult, ArchitectureStylePlan, ArchitectureStyle, ProductionDepth } from './types';
import { MODEL_CONFIG } from '../constants';
import logger from '@/lib/logger';

// Re-export for other modules
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

// ── Style Plan Inference ─────────────────────────────────────────────────────

const PRODUCTION_SIGNALS = [
  'production', ' ha ', 'high availability', 'cloud', 'aws', 'gcp', 'azure',
  'kubernetes', 'k8s', 'observability', 'resilient', 'reliability',
  'deployment pipeline', 'fault tolerant', 'scalab', 'at scale',
];

const STYLE_SIGNAL_MAP: Array<{ patterns: RegExp; style: ArchitectureStyle }> = [
  { patterns: /\bmvc\b|model.?view.?controller|layered architecture/i, style: 'mvc' },
  { patterns: /\bmicroservice|\bservice mesh\b|independent deploy|team autonomy/i, style: 'microservices' },
  { patterns: /\bserverless\b|\bfaas\b|\blambda\b|pay per use|aws lambda/i, style: 'serverless' },
  { patterns: /\bevent.driven\b|real.time stream|event stream|streaming architecture/i, style: 'event_driven' },
  { patterns: /\bdata pipeline\b|\bdata platform\b|\bdbt\b|etl|elt|lakehouse|medallion/i, style: 'data_pipeline' },
  { patterns: /\bml pipeline\b|model training|model inference|feature store|mlops/i, style: 'ml' },
  { patterns: /\bsaas\b|multi.tenant|per.tenant/i, style: 'saas' },
  { patterns: /\benterprise\b|\bsoa\b|\berp\b|legacy integration/i, style: 'enterprise' },
  { patterns: /\bmobile backend\b|offline.first|push notification.*backend/i, style: 'mobile_backend' },
  { patterns: /\biot\b|\bedge device\b|embedded|firmware|sensor/i, style: 'iot' },
  { patterns: /\breal.time collab\b|collaborative edit|multiplayer|crdt|operational transform/i, style: 'realtime_collab' },
  { patterns: /\bmonolith\b|modular monolith/i, style: 'monolith' },
];

/**
 * Infer architecture style and production depth from prompt + intentType.
 * This is the canonical source of truth used by stages 2, 3, 5, and 8.
 */
export function inferStylePlan(prompt: string, intentType: string): ArchitectureStylePlan {
  const p = prompt.toLowerCase();

  // Production depth
  const isProduction = PRODUCTION_SIGNALS.some(s => p.includes(s));
  const isApplication =
    !isProduction &&
    /\b(backend|api server|application layer|web application)\b/.test(p);
  const productionDepth: ProductionDepth = isProduction ? 'production' : isApplication ? 'application' : 'conceptual';

  // Style — check prompt signals first, then fall back to intentType
  let style: ArchitectureStyle = 'generic';
  let strictness: 'explicit' | 'inferred' = 'inferred';

  for (const entry of STYLE_SIGNAL_MAP) {
    if (entry.patterns.test(prompt)) {
      style = entry.style;
      strictness = 'explicit';
      break;
    }
  }

  // Fall back to intentType mapping
  if (style === 'generic' && intentType) {
    const intentStyleMap: Record<string, ArchitectureStyle> = {
      mvc: 'mvc',
      microservices: 'microservices',
      serverless: 'serverless',
      event_driven: 'event_driven',
      data_pipeline: 'data_pipeline',
      ml: 'ml',
      saas: 'saas',
      enterprise: 'enterprise',
      mobile_backend: 'mobile_backend',
      iot: 'iot',
      realtime_collab: 'realtime_collab',
      monolith: 'monolith',
      modular_monolith: 'modular_monolith',
    };
    const mapped = intentStyleMap[intentType];
    if (mapped) {
      style = mapped;
      strictness = 'explicit';
    }
  }

  return { style, strictness, productionDepth };
}

// ── Reasoning LLM ────────────────────────────────────────────────────────────

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
  diagramSize: 'small' | 'medium' | 'large' = 'medium',
  stylePlan?: ArchitectureStylePlan
): Promise<ReasoningResult> {
  const plan = stylePlan ?? inferStylePlan(prompt, intentType);
  const systemPrompt = buildReasoningPrompt(prompt, intentType, diagramSize, plan);

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
        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(cleaned) as Record<string, unknown>;
        } catch {
          logger.log(`[Reasoning] Invalid JSON from ${envVar}`);
          continue;
        }

        const systemType = String(parsed.systemType || '').trim();
        const architecturalPlan = String(parsed.architecturalPlan || '').trim();
        const layers = sanitizeLayers(parsed.layers, prompt);

        if (!systemType) {
          logger.log(`[Reasoning] Missing required field: systemType`);
          continue;
        }
        if (!layers && !architecturalPlan) {
          logger.log(`[Reasoning] Missing required fields: layers and architecturalPlan`);
          continue;
        }

        return {
          systemType,
          sourcePrompt: prompt,
          nfrs: (parsed.nfrs as Record<string, string>) || {},
          capPosition: String(parsed.capPosition || 'AP'),
          boundaries: (parsed.boundaries as ReasoningResult['boundaries']) || {
            entryPoints: [],
            exitPoints: [],
            trustZones: [],
          },
          layerAssignment: (parsed.layerAssignment as Record<string, string>) || {},
          patterns: (parsed.patterns as ReasoningResult['patterns']) || [],
          stressTests: (parsed.stressTests as ReasoningResult['stressTests']) || [],
          keyDecisions: (parsed.keyDecisions as string[]) || [],
          layers: layers || {},
          keyFlows: (parsed.keyFlows as ReasoningResult['keyFlows']) || [],
          architecturalPlan,
          extractedBehaviors: (parsed.extractedBehaviors as string[]) || [],
          preGenerationChecklist: (parsed.preGenerationChecklist as ReasoningResult['preGenerationChecklist']) || {
            humanActors: [],
            dataStores: [],
            backgroundJobs: [],
            externalIntegrations: [],
            featureRequirements: [],
          },
        };
      }
    } catch (error) {
      logger.log(`[Reasoning] Groq key ${envVar} failed:`, error instanceof Error ? error.message : 'unknown error');
      continue;
    }
  }

  // All providers failed — throw generation_failed instead of silently producing a generic diagram.
  throw new Error('generation_failed: all reasoning providers failed');
}

const REASONING_RULES = `Architecture rules:
- Default to Monolith/Modular Monolith unless user explicitly says "microservices".
- Map user signals to style: "MVC/layered/Django/Rails"→MVC; "microservices/service mesh"→Microservices;
  "event-driven/streaming/IoT"→Event-Driven; "serverless/Lambda/FaaS"→Serverless;
  "ML/training/inference/feature store"→ML; "data/analytics/warehouse/ETL"→Data Platform;
  "enterprise/SOA/ERP/legacy"→Enterprise; "SaaS/multi-tenant"→SaaS;
  "mobile/push notifications/offline"→Mobile Backend; "embedded/edge/IoT"→Edge/IoT;
  "collaborative/CRDT/multiplayer"→Real-Time Collab.
- Production depth: ONLY add CDN, LB, Observability, DLQ, CI/CD, Secrets Manager if prompt says:
  production, scale, HA, cloud, AWS, GCP, Azure, Kubernetes, observability, resilient, fault tolerant.
  Without these signals, generate only components directly implied by the prompt.
- No web-app template — only include layers/components justified by this specific prompt.
- Use domain-specific service names ("Feed Ranking Service", not "Business Logic Service").
- Flows must be directional: client/producer → edge/gateway → compute → async/data/external.`;

function buildReasoningPrompt(
  prompt: string,
  intentType: string,
  diagramSize: 'small' | 'medium' | 'large' = 'medium',
  stylePlan?: ArchitectureStylePlan
): string {
  const sizeConstraintPrompt = diagramSize === 'small'
    ? 'SIZE: 3-7 nodes. Core components only.'
    : diagramSize === 'large'
    ? 'SIZE: 10-20 nodes. Include services, workers, caches, observability (if appropriate), external integrations.'
    : 'SIZE: 6-12 nodes. Primary services + key data stores. No padding.';

  const depthInstruction = stylePlan?.productionDepth === 'production'
    ? 'DEPTH: Production/scale signaled. May include CDN, LB, Observability, DLQ, Circuit Breaker, Secrets Manager, CI/CD where appropriate.'
    : stylePlan?.productionDepth === 'application'
    ? 'DEPTH: Application-level only. Do NOT add production-hardening infra (CDN, LB, Service Mesh, Observability, DLQ, Circuit Breaker, Secrets Manager, CI/CD) unless explicitly requested.'
    : 'DEPTH: Conceptual only. Domain-specific nodes only. No production-hardening components.';

  return `You are an expert systems architect. Produce a structured architectural plan.

${sizeConstraintPrompt}

${depthInstruction}

${REASONING_RULES}

SYSTEM: ${prompt}
INTENT: ${intentType}

JSON output:
{
  "systemType": "specific type (e.g. video streaming platform)",
  "layers": {
    "client": {"components":["Client1"]},
    "edge": {"components":[]},
    "compute": {"components":["Service1"]},
    "async": {"components":[]},
    "data": {"components":["Store1"]},
    "observe": {"components":[]},
    "external": {"components":[]}
  },
  "keyFlows": [{"name":"Request Flow","path":["client","gateway","service","data"]}],
  "nfrs": {"scale":"","latency":"","availability":""},
  "patterns": [{"pattern":"name","justification":"why"}],
  "architecturalPlan": "2-3 sentence summary",
  "preGenerationChecklist": {
    "humanActors":[],"dataStores":[],"backgroundJobs":[],"externalIntegrations":[],"featureRequirements":[]
  }
}
Requirements: (1) Only include layers justified by prompt. (2) No generic names — use domain-specific ones. (3) Flows are directional: producer→gateway→service→data. (4) Complete the preGenerationChecklist based on the prompt. (5) Output valid JSON only.`;  
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

function normalizeLayerName(layer: string): string {
  const lower = layer.toLowerCase();
  if (lower === 'clients' || lower === 'presentation') return 'client';
  if (lower === 'entry' || lower === 'gateway') return 'edge';
  if (lower === 'services' || lower === 'application') return 'compute';
  if (lower === 'queue') return 'async';
  if (lower === 'observability') return 'observe';
  return lower;
}

