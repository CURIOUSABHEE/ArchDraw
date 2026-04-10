import {
  StructuredPrompt,
  EnhancementResult,
  EnhancementMetrics,
  EnhancementConfig,
  DEFAULT_ENHANCEMENT_CONFIG,
  PromptIntent,
  ConfidenceScore,
  ModelScore,
  PipelineError,
  EnhancementError,
  ParsingError,
  ModelFailureError,
  selectBestModel,
  sortModelsByScore,
  composeSystemPrompt,
  detectPromptIntent,
  normalizeInput,
  parseStructuredOutput,
  validateStructuredPrompt,
  calculateConfidence,
  enhancementObserver,
  shouldAbortEnhancement,
  recoverPartialOutput,
  PromptSectionKey,
  PromptIntentType,
  PROMPT_CONFIG,
  MODEL_SCORES,
} from './promptPipelineTypes';
import { extractUserPreferences, formatUserPreferencesForPrompt, UserPreferences } from './userInputExtractor';
import { apiKeyManager } from './apiKeyManager';
import logger from '@/lib/logger';

const DEFAULT_MODELS = [
  'llama-3.3-70b-versatile',
  'mixtral-8x7b-32768',
  'llama-3.1-8b-instant',
];

interface PipelineContext {
  originalPrompt: string;
  normalized: {
    cleaned: string;
    wordCount: number;
    isShort: boolean;
    isStructured: boolean;
  };
  intent: PromptIntent;
  config: EnhancementConfig;
  attempts: number;
  startTime: number;
  selectedModels: string[];
  currentModelIndex: number;
}

interface PipelineResult {
  success: boolean;
  structuredPrompt?: StructuredPrompt;
  rawOutput?: string;
  metrics?: EnhancementMetrics;
  error?: PipelineError;
  fallbackUsed: boolean;
}

async function executeModelCall(
  modelId: string,
  provider: 'groq' | 'openrouter',
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  return apiKeyManager.executeWithRetry(
    async (groq) => {
      const completion = await groq.chat.completions.create({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: PROMPT_CONFIG.DEFAULT_TEMPERATURE,
        max_tokens: PROMPT_CONFIG.DEFAULT_MAX_TOKENS,
      });

      return completion.choices[0]?.message?.content ?? '';
    },
    { provider }
  );
}

async function stage1_normalizeInput(input: string): Promise<PipelineContext> {
  const normalized = normalizeInput(input);
  const intent = detectPromptIntent(input);

  enhancementObserver.emit({
    type: 'start',
    data: {
      wordCount: normalized.wordCount,
      isShort: normalized.isShort,
      intent: intent.type,
    },
  });

  return {
    originalPrompt: input,
    normalized,
    intent,
    config: DEFAULT_ENHANCEMENT_CONFIG,
    attempts: 0,
    startTime: Date.now(),
    selectedModels: sortModelsByScore(DEFAULT_MODELS, 'totalScore'),
    currentModelIndex: 0,
  };
}

function stage2_classifyPrompt(context: PipelineContext): {
  needsEnhancement: boolean;
  reason: string;
} {
  if (context.normalized.isStructured) {
    return {
      needsEnhancement: false,
      reason: 'Prompt already has structured format',
    };
  }

  if (!context.normalized.isShort) {
    return {
      needsEnhancement: false,
      reason: `Prompt has ${context.normalized.wordCount} words (threshold: ${PROMPT_CONFIG.SHORT_PROMPT_THRESHOLD_WORDS})`,
    };
  }

  return {
    needsEnhancement: true,
    reason: `Short prompt (${context.normalized.wordCount} words) - enhancement beneficial`,
  };
}

async function stage3_enhanceWithLLM(context: PipelineContext): Promise<{
  rawOutput: string;
  modelUsed: string;
  provider: 'groq' | 'openrouter';
  latencyMs: number;
}> {
  const systemPrompt = composeSystemPrompt(context.intent);
  const userPrompt = `Enhance this prompt (${context.normalized.wordCount} words). The user said:

${context.originalPrompt}

Add domain-appropriate infrastructure as INFERRED, preserve their exact words as USER_STATED.`;

  let lastError: Error | null = null;

  while (context.currentModelIndex < context.selectedModels.length) {
    const modelId = context.selectedModels[context.currentModelIndex];
    const modelScore = MODEL_SCORES[modelId];
    const provider = modelScore?.provider || (modelId.includes('/') ? 'openrouter' : 'groq');

    context.attempts++;
    context.currentModelIndex++;

    enhancementObserver.emit({
      type: 'model_select',
      data: {
        modelUsed: modelId,
        provider,
        attempt: context.attempts,
      },
    });

    const startTime = Date.now();

    try {
      const rawOutput = await executeModelCall(modelId, provider, systemPrompt, userPrompt);
      const latencyMs = Date.now() - startTime;

      enhancementObserver.emit({
        type: 'attempt',
        data: { modelId, provider, latencyMs, success: true },
      });

      return { rawOutput, modelUsed: modelId, provider, latencyMs };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      lastError = error instanceof Error ? error : new Error(String(error));

      enhancementObserver.emit({
        type: 'attempt',
        data: { modelId, provider, latencyMs, success: false, error: lastError.message },
      });

      logger.log(`[PromptPipeline] Model ${modelId} failed: ${lastError.message}`);

      if (shouldAbortEnhancement(context.attempts, { maxRetries: context.config.maxRetries })) {
        break;
      }
    }
  }

  throw new ModelFailureError(
    `All models exhausted after ${context.attempts} attempts`,
    context.selectedModels[context.currentModelIndex - 1] || 'unknown',
    'unknown',
    undefined,
    false
  );
}

function stage4_parseStructuredOutput(
  rawOutput: string,
  fallbackPrompt: string
): {
  parsed: StructuredPrompt;
  validation: { valid: boolean; errors: string[] };
  recovered: boolean;
} {
  const parsed = parseStructuredOutput(rawOutput);
  const validation = validateStructuredPrompt(parsed);

  if (!validation.valid && parsed.userStated.length === 0) {
    const recovered = recoverPartialOutput(rawOutput, fallbackPrompt);
    return {
      parsed: recovered,
      validation: { valid: true, errors: ['Partial recovery applied'] },
      recovered: true,
    };
  }

  return { parsed, validation, recovered: false };
}

function stage5_enrichForDiagramModel(
  structuredPrompt: StructuredPrompt,
  intent: PromptIntent,
  userPreferences: UserPreferences
): string {
  const userPrefPrompt = formatUserPreferencesForPrompt(userPreferences);

  const userStatedSection = structuredPrompt.userStated.length > 0
    ? structuredPrompt.userStated.join('\n')
    : '<none specified>';

  const inferredSection = structuredPrompt.inferred.length > 0
    ? structuredPrompt.inferred.join('\n')
    : '<none specified>';

  const expandedSection = structuredPrompt.expanded || userStatedSection;

  return `
═══════════════════════════════════════════════════════════════════════════════════════════════════════
SYSTEM DESCRIPTION WITH COMPONENT AUTHORITY
═══════════════════════════════════════════════════════════════════════════════════════════════════════

USER_STATED:
${userStatedSection}

INFERRED:
${inferredSection}

EXPANDED:
${expandedSection}

═══════════════════════════════════════════════════════════════════════════════════════════════════════
COMPONENT GENERATION RULES
═══════════════════════════════════════════════════════════════════════════════════════════════════════

1. MANDATORY COMPONENTS (from USER_STATED):
   These are explicitly mentioned by the user. You MUST include ALL of them.
   
2. SUGGESTED COMPONENTS (from INFERRED):
   These are domain-appropriate additions. Include them UNLESS they conflict
   with the mandatory components or the user's stated requirements.
   
   Detected intent: ${intent.type} (confidence: ${intent.confidence.toFixed(2)})

3. AWS SERVICE SELECTION:
   When adding infrastructure, prefer AWS services:
   - CDN: aws-cloudfront
   - Load Balancer: aws-alb (Application) or aws-elb (Classic)
   - API Gateway: aws-api-gateway
   - Compute: aws-lambda, aws-ecs, aws-eks
   - Database: aws-rds, aws-dynamodb, aws-aurora
   - Cache: aws-elasticache
   - Storage: aws-s3
   - Queue: aws-sqs, aws-sns, aws-eventbridge
   - Auth: aws-cognito
   - Monitoring: aws-cloudwatch
   - VPC: Use a group container with color #FF9900

4. MINIMUM REQUIREMENTS:
   - 12+ nodes minimum
   - Include VPC group for backend services
   - Include monitoring (CloudWatch)
   - Include at least one database and one cache
   - Include load balancing and CDN if serving web/mobile clients

${userPrefPrompt}

═══════════════════════════════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════════════════════════════

Output a JSON array of nodes following this structure:

[
  {
    "id": "unique-snake-case-id",
    "label": "Component Name (use AWS service name if applicable)",
    "layer": "client|gateway|service|queue|database|cache|external|devops",
    "serviceType": "database|cache|queue|api|loadbalancer|storage|cdn|auth|compute|monitor|gateway|client|generic",
    "technology": "aws-service-id (if AWS) or technology name",
    "width": 180,
    "height": 70,
    "parentId": "group-id (if inside a group)"
  },
  ...
]

Group nodes must appear BEFORE their children. Use technology field for AWS services.
`.trim();
}

function enrichRawPromptForDiagram(
  userPrompt: string,
  userPreferences: UserPreferences
): string {
  const userPrefPrompt = formatUserPreferencesForPrompt(userPreferences);

  return `
═══════════════════════════════════════════════════════════════════════════════════════════════════════
USER'S SYSTEM DESCRIPTION (ALL COMPONENTS ARE MANDATORY)
═══════════════════════════════════════════════════════════════════════════════════════════════════════
"${userPrompt}"

${userPrefPrompt}

═══════════════════════════════════════════════════════════════════════════════════════════════════════
AWS SERVICE REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════════════════════════════

Every architecture must include these AWS services where appropriate:

COMPUTE: aws-lambda, aws-ecs, aws-eks, aws-ec2, aws-fargate
DATABASE: aws-rds, aws-dynamodb, aws-aurora, aws-documentdb
CACHE: aws-elasticache (Redis/Memcached)
STORAGE: aws-s3, aws-efs
QUEUE: aws-sqs, aws-sns, aws-eventbridge
CDN/GATEWAY: aws-cloudfront, aws-api-gateway, aws-alb
AUTH: aws-cognito, aws-iam, aws-secrets-manager
MONITORING: aws-cloudwatch, aws-xray, aws-cloudtrail

Use the technology field to specify AWS services:
{ "technology": "aws-rds", "label": "Amazon RDS", ... }

═══════════════════════════════════════════════════════════════════════════════════════════════════════
MINIMUM DIAGRAM REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════════════════════════════

- Minimum 12 nodes
- Include VPC group (groupColor: "#FF9900") wrapping backend services
- Include CloudWatch for monitoring
- Include at least one load balancer or CDN
- Include database + cache layer
- Include message queue if async processing needed

═══════════════════════════════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════════════════════════════

Output JSON array:

[
  {
    "id": "unique-id",
    "label": "Component Name",
    "layer": "client|gateway|service|queue|database|cache|external|devops",
    "serviceType": "matching-type",
    "technology": "aws-service-id",
    "width": 180,
    "height": 70,
    "parentId": "group-id (if inside group)"
  }
]

Groups must appear before their children in the array.
`.trim();
}

export class PromptPipeline {
  private config: EnhancementConfig;

  constructor(config: Partial<EnhancementConfig> = {}) {
    this.config = { ...DEFAULT_ENHANCEMENT_CONFIG, ...config };
  }

  async process(input: string): Promise<PipelineResult> {
    try {
      const context = await stage1_normalizeInput(input);
      const classification = stage2_classifyPrompt(context);

      if (!classification.needsEnhancement) {
        logger.log(`[PromptPipeline] ${classification.reason}`);

        const userPreferences = extractUserPreferences(input);
        const isStructured = context.normalized.isStructured;

        let enrichedPrompt: string;
        if (isStructured) {
          const parsed = parseStructuredOutput(input);
          const validation = validateStructuredPrompt(parsed);
          const modelScore = selectBestModel();

          const confidence = calculateConfidence(parsed, modelScore, validation);

          enrichedPrompt = stage5_enrichForDiagramModel(
            parsed,
            context.intent,
            userPreferences
          );

          const metrics: EnhancementMetrics = {
            modelUsed: modelScore.modelId,
            provider: modelScore.provider,
            attempts: 0,
            latencyMs: 0,
            success: true,
            confidence,
            intent: context.intent,
          };

          return {
            success: true,
            structuredPrompt: parsed,
            metrics,
            fallbackUsed: false,
          };
        }

        enrichedPrompt = enrichRawPromptForDiagram(input, userPreferences);

        return {
          success: true,
          structuredPrompt: {
            userStated: [input],
            inferred: [],
            expanded: input,
          },
          metrics: {
            modelUsed: 'none',
            provider: 'none',
            attempts: 0,
            latencyMs: 0,
            success: true,
            confidence: { overall: 1, completeness: 1, parsingSuccess: 1, modelReliability: 1 },
            intent: context.intent,
          },
          fallbackUsed: false,
        };
      }

      logger.log(`[PromptPipeline] ${classification.reason}, running enhancement...`);

      const { rawOutput, modelUsed, provider, latencyMs } = await stage3_enhanceWithLLM(context);

      const { parsed, validation, recovered } = stage4_parseStructuredOutput(
        rawOutput,
        context.originalPrompt
      );

      const modelScore = MODEL_SCORES[modelUsed] || selectBestModel();
      const confidence = calculateConfidence(parsed, modelScore, validation);

      if (confidence.overall < this.config.minConfidenceThreshold && !recovered) {
        logger.log(`[PromptPipeline] Confidence ${confidence.overall} below threshold ${this.config.minConfidenceThreshold}`);
        
        if (this.config.enableFallback) {
          enhancementObserver.emit({
            type: 'fallback',
            data: { confidence: confidence.overall, threshold: this.config.minConfidenceThreshold },
          });

          return {
            success: true,
            structuredPrompt: {
              userStated: [context.originalPrompt],
              inferred: [],
              expanded: context.originalPrompt,
            },
            rawOutput,
            metrics: {
              modelUsed,
              provider,
              attempts: context.attempts,
              latencyMs,
              success: true,
              confidence,
              intent: context.intent,
            },
            fallbackUsed: true,
          };
        }
      }

      const userPreferences = extractUserPreferences(context.originalPrompt);
      const enrichedPrompt = stage5_enrichForDiagramModel(parsed, context.intent, userPreferences);

      const metrics: EnhancementMetrics = {
        modelUsed,
        provider,
        attempts: context.attempts,
        latencyMs,
        success: true,
        confidence,
        intent: context.intent,
      };

      enhancementObserver.emit({
        type: 'success',
        data: { modelUsed, attempts: context.attempts, confidence: confidence.overall },
      });

      return {
        success: true,
        structuredPrompt: parsed,
        rawOutput,
        metrics,
        fallbackUsed: false,
      };
    } catch (error) {
      const pipelineError = this.wrapError(error);
      logger.error(`[PromptPipeline] Pipeline failed: ${pipelineError.message}`);

      const errorCode = 'code' in pipelineError ? (pipelineError as { code: string }).code : 'UNKNOWN';
      
      enhancementObserver.emit({
        type: 'failure',
        data: { error: pipelineError.message, code: errorCode },
      });

      return {
        success: false,
        error: pipelineError,
        fallbackUsed: false,
      };
    }
  }

  private wrapError(error: unknown): PipelineError {
    if (error instanceof ModelFailureError) {
      return new EnhancementError(
        error.message,
        'MODEL_FAILURE',
        error.retryable,
        error
      );
    }

    if (error instanceof ParsingError) {
      return new EnhancementError(
        error.message,
        'PARSING_FAILURE',
        true,
        error
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    return new EnhancementError(message, 'UNKNOWN', false, error instanceof Error ? error : undefined);
  }
}

export const defaultPipeline = new PromptPipeline();

export async function processPrompt(input: string): Promise<{
  enrichedPrompt: string;
  structuredPrompt: StructuredPrompt;
  metrics?: EnhancementMetrics;
}> {
  const result = await defaultPipeline.process(input);

  if (!result.success) {
    throw result.error || new EnhancementError('Pipeline failed', 'PIPELINE_ERROR', false);
  }

  if (result.fallbackUsed || !result.structuredPrompt) {
    const userPreferences = extractUserPreferences(input);
    const enrichedPrompt = enrichRawPromptForDiagram(input, userPreferences);

    return {
      enrichedPrompt,
      structuredPrompt: {
        userStated: [input],
        inferred: [],
        expanded: input,
      },
      metrics: result.metrics,
    };
  }

  const userPreferences = extractUserPreferences(input);
  const enrichedPrompt = stage5_enrichForDiagramModel(
    result.structuredPrompt,
    result.metrics?.intent || { type: PromptIntentType.GENERAL, confidence: 0.5, keywords: [] },
    userPreferences
  );

  return {
    enrichedPrompt,
    structuredPrompt: result.structuredPrompt,
    metrics: result.metrics,
  };
}

export async function enhanceShortPrompt(userPrompt: string): Promise<EnhancementResult> {
  const wordCount = userPrompt.trim().split(/\s+/).filter(w => w.length > 0).length;
  
  if (wordCount >= PROMPT_CONFIG.SHORT_PROMPT_THRESHOLD_WORDS) {
    return {
      prompt: userPrompt,
      wasEnhanced: false,
      enhancementFailed: false,
    };
  }

  try {
    const result = await defaultPipeline.process(userPrompt);

    if (result.success && result.rawOutput) {
      return {
        prompt: result.rawOutput,
        wasEnhanced: true,
        enhancementFailed: false,
      };
    }

    return {
      prompt: userPrompt,
      wasEnhanced: false,
      enhancementFailed: true,
      error: result.error?.message || 'Enhancement failed',
    };
  } catch (error) {
    return {
      prompt: userPrompt,
      wasEnhanced: false,
      enhancementFailed: true,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function enrichPrompt(userPrompt: string): string {
  const result = stage5_enrichForDiagramModel(
    {
      userStated: [userPrompt],
      inferred: [],
      expanded: userPrompt,
    },
    detectPromptIntent(userPrompt),
    extractUserPreferences(userPrompt)
  );

  const hasStructuredFormat = userPrompt.includes(PromptSectionKey.USER_STATED) && 
                            userPrompt.includes(PromptSectionKey.INFERRED) && 
                            userPrompt.includes(PromptSectionKey.EXPANDED);

  if (hasStructuredFormat) {
    const parsed = parseStructuredOutput(userPrompt);
    const userPreferences = extractUserPreferences(userPrompt);
    return stage5_enrichForDiagramModel(parsed, detectPromptIntent(userPrompt), userPreferences);
  }

  return result;
}

export function getEnhancementStats() {
  return enhancementObserver.getStats();
}

export type { StructuredPrompt, EnhancementMetrics, PromptIntent, ConfidenceScore };