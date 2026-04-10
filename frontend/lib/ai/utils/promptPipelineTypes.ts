// ============================================================
// PROMPT PIPELINE TYPES & SCHEMAS
// ============================================================

export enum PromptSectionKey {
  USER_STATED = 'USER_STATED',
  INFERRED = 'INFERRED',
  EXPANDED = 'EXPANDED',
}

export interface StructuredPrompt {
  userStated: string[];
  inferred: string[];
  expanded: string;
}

export interface PromptIntent {
  type: PromptIntentType;
  confidence: number;
  keywords: string[];
}

export enum PromptIntentType {
  CRUD_APP = 'crud_app',
  REAL_TIME_SYSTEM = 'real_time_system',
  DATA_PIPELINE = 'data_pipeline',
  ML_SYSTEM = 'ml_system',
  E_COMMERCE = 'e_commerce',
  IOT_SYSTEM = 'iot_system',
  MICROSERVICES = 'microservices',
  SERVERLESS = 'serverless',
  GENERAL = 'general',
}

export interface ConfidenceScore {
  overall: number;
  completeness: number;
  parsingSuccess: number;
  modelReliability: number;
}

export interface EnhancementMetrics {
  modelUsed: string;
  provider: string;
  attempts: number;
  latencyMs: number;
  success: boolean;
  confidence: ConfidenceScore;
  intent: PromptIntent;
}

export interface ModelScore {
  modelId: string;
  provider: 'groq' | 'openrouter';
  speed: number;
  reliability: number;
  cost: number;
  totalScore: number;
}

export interface EnhancementConfig {
  maxRetries: number;
  timeoutMs: number;
  minConfidenceThreshold: number;
  enableFallback: boolean;
  enablePartialRecovery: boolean;
}

// ============================================================
// RESULT TYPES (Backward Compatibility)
// ============================================================

export interface EnhancementResult {
  prompt: string;
  wasEnhanced: boolean;
  enhancementFailed: boolean;
  error?: string;
}

export class EnhancementError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'EnhancementError';
  }
}

export class ParsingError extends Error {
  constructor(
    message: string,
    public code: string,
    public rawOutput?: string,
    public partialResult?: Partial<StructuredPrompt>
  ) {
    super(message);
    this.name = 'ParsingError';
  }
}

export class ModelFailureError extends Error {
  constructor(
    message: string,
    public modelId: string,
    public provider: string,
    public statusCode?: number,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'ModelFailureError';
  }
}

export type PipelineError = EnhancementError | ParsingError | ModelFailureError;

// ============================================================
// CONSTANTS (Replacing Magic Strings)
// ============================================================

export const PROMPT_CONFIG = {
  SHORT_PROMPT_THRESHOLD_WORDS: 100,
  MIN_INFERENCE_ITEMS: 3,
  DEFAULT_TEMPERATURE: 0.3,
  DEFAULT_MAX_TOKENS: 2048,
  MIN_CONFIDENCE_THRESHOLD: 0.5,
} as const;

export const DEFAULT_ENHANCEMENT_CONFIG: EnhancementConfig = {
  maxRetries: 3,
  timeoutMs: 30000,
  minConfidenceThreshold: 0.5,
  enableFallback: true,
  enablePartialRecovery: true,
};

// ============================================================
// MODEL ORCHESTRATION
// ============================================================

export const MODEL_SCORES: Record<string, ModelScore> = {
  'llama-3.3-70b-versatile': {
    modelId: 'llama-3.3-70b-versatile',
    provider: 'groq',
    speed: 0.95,
    reliability: 0.8,
    cost: 0.2,
    totalScore: 0.82,
  },
  'mixtral-8x7b-32768': {
    modelId: 'mixtral-8x7b-32768',
    provider: 'groq',
    speed: 0.85,
    reliability: 0.75,
    cost: 0.25,
    totalScore: 0.75,
  },
  'llama-3.1-8b-instant': {
    modelId: 'llama-3.1-8b-instant',
    provider: 'groq',
    speed: 0.98,
    reliability: 0.85,
    cost: 0.1,
    totalScore: 0.88,
  },
};

export function selectBestModel(
  preferredProvider?: 'groq' | 'openrouter'
): ModelScore {
  const candidates = Object.values(MODEL_SCORES);
  
  let filtered = candidates;
  if (preferredProvider) {
    filtered = candidates.filter(m => m.provider === preferredProvider);
  }
  
  filtered.sort((a, b) => b.totalScore - a.totalScore);
  return filtered[0];
}

export function sortModelsByScore(
  models: string[],
  by: 'speed' | 'reliability' | 'cost' | 'totalScore' = 'totalScore'
): string[] {
  return models
    .map(id => ({ id, score: MODEL_SCORES[id] }))
    .filter(s => s.score)
    .sort((a, b) => b.score[by] - a.score[by])
    .map(s => s.id);
}

// ============================================================
// PROMPT MODULARIZATION - BUILDING BLOCKS
// ============================================================

export interface PromptComponents {
  baseInstructions: string;
  enhancementRules: string;
  outputFormatRules: string;
  domainInferenceRules: string;
}

export function getBaseInstructions(): string {
  return `You are a cloud architecture expert helping users describe their systems more completely.`;
}

export function getEnhancementRules(context?: PromptIntent): string {
  const rules = [
    'NEVER fabricate components the user didn\'t mention',
    'You may INFER domain-appropriate infrastructure based on what they described',
    'You must PRESERVE the user\'s exact words',
    'Only expand abbreviations or clarify ambiguous terms',
  ];
  
  if (context) {
    rules.push(`Detected intent: ${context.type}. Apply domain-specific inference rules.`);
  }
  
  return rules.join('\n');
}

export function getDomainInferenceRules(intent: PromptIntent): string {
  const domainRules: Record<PromptIntentType, string[]> = {
    [PromptIntentType.CRUD_APP]: [
      'User authentication and session management',
      'RESTful API layer',
      'Database with CRUD operations',
      'Input validation and sanitization',
    ],
    [PromptIntentType.REAL_TIME_SYSTEM]: [
      'WebSocket connections',
      'Message persistence',
      'User presence tracking',
      'Pub/sub messaging',
    ],
    [PromptIntentType.DATA_PIPELINE]: [
      'Data ingestion and ETL',
      'Message queues for buffering',
      'Batch processing workers',
      'Data storage and warehousing',
    ],
    [PromptIntentType.ML_SYSTEM]: [
      'Model training infrastructure',
      'Feature store',
      'Model serving endpoints',
      'MLOps pipeline',
    ],
    [PromptIntentType.E_COMMERCE]: [
      'Product catalog service',
      'Shopping cart',
      'Checkout and payments',
      'Order management',
      'Inventory system',
    ],
    [PromptIntentType.IOT_SYSTEM]: [
      'Device gateway',
      'Time-series database',
      'Edge computing nodes',
      'Analytics service',
    ],
    [PromptIntentType.MICROSERVICES]: [
      'API gateway',
      'Service discovery',
      'Inter-service communication',
      'Distributed tracing',
    ],
    [PromptIntentType.SERVERLESS]: [
      'Function compute services',
      'Event triggers',
      'Managed database',
      'CDN and edge',
    ],
    [PromptIntentType.GENERAL]: [
      'Users and authentication',
      'API layer',
      'Database and caching',
      'Monitoring and logging',
    ],
  };
  
  const rules = domainRules[intent.type] || domainRules[PromptIntentType.GENERAL];
  return `For ${intent.type} systems, infer: ${rules.join(', ')}`;
}

export function getOutputFormatRules(): string {
  return `You MUST output in this exact format:

USER_STATED:
<list every component/service the user explicitly mentioned - copy their exact words>

INFERRED:
<domain-appropriate infrastructure that would be expected for this type of system, clearly labeled as "inferred">

EXPANDED:
<full natural language description combining user words + inferences, written as if the user described it in detail>

Focus on:
- AWS services (S3, Lambda, RDS, DynamoDB, CloudFront, API Gateway, ECS, etc.)
- Common infrastructure (load balancers, caches, queues)
- Security (authentication, authorization)
- Observability (monitoring, logging, tracing)

Output ONLY the three sections above. Do not add explanations or comments.`;
}

export function composeSystemPrompt(intent?: PromptIntent): string {
  return [
    getBaseInstructions(),
    '',
    'IMPORTANT RULES:',
    getEnhancementRules(intent),
    '',
    getDomainInferenceRules(intent || { type: PromptIntentType.GENERAL, confidence: 0.5, keywords: [] }),
    '',
    getOutputFormatRules(),
  ].join('\n');
}

// ============================================================
// INTENT DETECTION
// ============================================================

const INTENT_KEYWORDS: Record<PromptIntentType, string[]> = {
  [PromptIntentType.CRUD_APP]: ['crud', 'create', 'read', 'update', 'delete', 'database', 'api', 'rest', 'graphql', 'cms', 'admin', 'dashboard'],
  [PromptIntentType.REAL_TIME_SYSTEM]: ['realtime', 'real-time', 'chat', 'websocket', 'live', 'streaming', 'notification', 'presence'],
  [PromptIntentType.DATA_PIPELINE]: ['pipeline', 'etl', 'batch', 'stream', 'analytics', 'warehouse', 'data lake', 'ingest'],
  [PromptIntentType.ML_SYSTEM]: ['ml', 'machine learning', 'ai', 'model', 'training', 'inference', 'prediction', 'feature', 'sagemaker'],
  [PromptIntentType.E_COMMERCE]: ['e-commerce', 'ecommerce', 'shop', 'store', 'cart', 'checkout', 'payment', 'product', 'order'],
  [PromptIntentType.IOT_SYSTEM]: ['iot', 'sensor', 'device', 'edge', 'gateway', 'telemetry', 'embedded'],
  [PromptIntentType.MICROSERVICES]: ['microservice', 'service mesh', 'kubernetes', 'container', 'docker', 'k8s', 'distributed'],
  [PromptIntentType.SERVERLESS]: ['serverless', 'lambda', 'function', 'faas', 'managed', 'event-driven'],
  [PromptIntentType.GENERAL]: [],
};

export function detectPromptIntent(prompt: string): PromptIntent {
  const lowerPrompt = prompt.toLowerCase();
  const words = new Set(lowerPrompt.split(/\s+/));
  
  let bestType = PromptIntentType.GENERAL;
  let bestConfidence = 0;
  const matchedKeywords: string[] = [];
  
  for (const [intentType, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (intentType === PromptIntentType.GENERAL) continue;
    
    let matches = 0;
    for (const keyword of keywords) {
      if (words.has(keyword) || lowerPrompt.includes(keyword)) {
        matches++;
        matchedKeywords.push(keyword);
      }
    }
    
    const confidence = keywords.length > 0 ? matches / keywords.length : 0;
    if (confidence > bestConfidence) {
      bestConfidence = confidence;
      bestType = intentType as PromptIntentType;
    }
  }
  
  return {
    type: bestType,
    confidence: Math.min(bestConfidence * 2, 1),
    keywords: [...new Set(matchedKeywords)].slice(0, 10),
  };
}

// ============================================================
// INPUT NORMALIZATION
// ============================================================

export interface NormalizedInput {
  original: string;
  cleaned: string;
  wordCount: number;
  isShort: boolean;
  isStructured: boolean;
}

export function normalizeInput(input: string): NormalizedInput {
  const cleaned = input.trim().replace(/\s+/g, ' ');
  const wordCount = cleaned.split(/\s+/).filter(w => w.length > 0).length;
  
  return {
    original: input,
    cleaned,
    wordCount,
    isShort: wordCount < PROMPT_CONFIG.SHORT_PROMPT_THRESHOLD_WORDS,
    isStructured: isStructuredPrompt(cleaned),
  };
}

export function isStructuredPrompt(text: string): boolean {
  const hasUserStated = text.includes(PromptSectionKey.USER_STATED);
  const hasInferred = text.includes(PromptSectionKey.INFERRED);
  const hasExpanded = text.includes(PromptSectionKey.EXPANDED);
  
  return hasUserStated && hasInferred && hasExpanded;
}

// ============================================================
// STRUCTURED OUTPUT PARSING
// ============================================================

export function parseStructuredOutput(output: string): StructuredPrompt {
  const result: StructuredPrompt = {
    userStated: [],
    inferred: [],
    expanded: '',
  };
  
  const lines = output.split('\n');
  let currentSection: keyof StructuredPrompt | null = null;
  let currentContent: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === PromptSectionKey.USER_STATED) {
      if (currentSection) {
        if (currentSection === 'expanded') {
          result[currentSection] = currentContent.join(' ');
        } else {
          result[currentSection] = currentContent;
        }
      }
      currentSection = 'userStated';
      currentContent = [];
    } else if (trimmed === PromptSectionKey.INFERRED) {
      if (currentSection) {
        if (currentSection === 'expanded') {
          result[currentSection] = currentContent.join(' ');
        } else {
          result[currentSection] = currentContent;
        }
      }
      currentSection = 'inferred';
      currentContent = [];
    } else if (trimmed === PromptSectionKey.EXPANDED) {
      if (currentSection) {
        if (currentSection === 'expanded') {
          result[currentSection] = currentContent.join(' ');
        } else {
          result[currentSection] = currentContent;
        }
      }
      currentSection = 'expanded';
      currentContent = [];
    } else if (trimmed && currentSection) {
      currentContent.push(trimmed);
    }
  }
  
  if (currentSection && currentContent.length > 0) {
    if (currentSection === 'expanded') {
      result[currentSection] = currentContent.join(' ');
    } else {
      result[currentSection] = currentContent;
    }
  }
  
  return result;
}

export function validateStructuredPrompt(prompt: StructuredPrompt): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!prompt.userStated || prompt.userStated.length === 0) {
    errors.push('Missing or empty USER_STATED section');
  }
  
  if (!prompt.inferred || !Array.isArray(prompt.inferred)) {
    errors.push('Invalid INFERRED section format');
  }
  
  if (!prompt.expanded || typeof prompt.expanded !== 'string' || prompt.expanded.length < 10) {
    errors.push('Missing or too short EXPANDED section');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================
// CONFIDENCE SCORING
// ============================================================

export function calculateConfidence(
  parsedOutput: StructuredPrompt | null,
  modelScore: ModelScore,
  validationResult: { valid: boolean; errors: string[] }
): ConfidenceScore {
  const completenessScore = calculateCompleteness(parsedOutput);
  const parsingSuccessScore = validationResult.valid ? 1 : 0.3;
  const reliabilityScore = modelScore.reliability;
  
  const overall = (
    completenessScore * 0.4 +
    parsingSuccessScore * 0.3 +
    reliabilityScore * 0.3
  );
  
  return {
    overall: Math.round(overall * 100) / 100,
    completeness: completenessScore,
    parsingSuccess: parsingSuccessScore,
    modelReliability: reliabilityScore,
  };
}

function calculateCompleteness(parsed: StructuredPrompt | null): number {
  if (!parsed) return 0;
  
  let score = 0;
  
  if (parsed.userStated && parsed.userStated.length > 0) score += 0.33;
  if (parsed.inferred && parsed.inferred.length > 0) score += 0.33;
  if (parsed.expanded && parsed.expanded.length > 20) score += 0.34;
  
  if (parsed.inferred.length >= PROMPT_CONFIG.MIN_INFERENCE_ITEMS) {
    score = Math.min(score + 0.1, 1);
  }
  
  return score;
}

// ============================================================
// OBSERVABILITY
// ============================================================

export type EnhancementEventHandler = (event: EnhancementEvent) => void;

export interface EnhancementEvent {
  type: 'start' | 'model_select' | 'attempt' | 'success' | 'failure' | 'fallback' | 'complete';
  timestamp: number;
  data: Record<string, unknown>;
}

class EnhancementObserver {
  private handlers: Set<EnhancementEventHandler> = new Set();
  private events: EnhancementEvent[] = [];
  private maxEvents = 100;
  
  subscribe(handler: EnhancementEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
  
  emit(event: Omit<EnhancementEvent, 'timestamp'>): void {
    const fullEvent: EnhancementEvent = {
      ...event,
      timestamp: Date.now(),
    };
    
    this.events.push(fullEvent);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
    
    this.handlers.forEach(h => h(fullEvent));
  }
  
  getEvents(): EnhancementEvent[] {
    return [...this.events];
  }
  
  getStats(): {
    totalEnhancements: number;
    successRate: number;
    avgRetries: number;
    modelUsage: Record<string, number>;
  } {
    const completed = this.events.filter(e => e.type === 'complete');
    const successes = this.events.filter(e => e.type === 'success');
    const attempts = this.events.filter(e => e.type === 'attempt');
    const modelSelects = this.events.filter(e => e.type === 'model_select');
    
    const modelUsage: Record<string, number> = {};
    modelSelects.forEach(e => {
      const model = e.data.modelUsed as string;
      modelUsage[model] = (modelUsage[model] || 0) + 1;
    });
    
    return {
      totalEnhancements: completed.length,
      successRate: completed.length > 0 ? successes.length / completed.length : 0,
      avgRetries: attempts.length / Math.max(completed.length, 1),
      modelUsage,
    };
  }
}

export const enhancementObserver = new EnhancementObserver();

// ============================================================
// RATE LIMIT & COST CONTROL
// ============================================================

export interface BudgetConstraints {
  maxRetries: number;
  maxCost?: number;
  maxLatencyMs?: number;
}

export function shouldAbortEnhancement(
  attempts: number,
  constraints: BudgetConstraints,
  currentLatencyMs?: number
): boolean {
  if (attempts >= constraints.maxRetries) {
    return true;
  }
  
  if (currentLatencyMs && constraints.maxLatencyMs && currentLatencyMs > constraints.maxLatencyMs) {
    return true;
  }
  
  return false;
}

// ============================================================
// PARTIAL RECOVERY
// ============================================================

export function recoverPartialOutput(
  rawOutput: string,
  fallbackPrompt: string
): StructuredPrompt {
  const parsed = parseStructuredOutput(rawOutput);
  
  if (parsed.userStated.length > 0) {
    return {
      userStated: parsed.userStated,
      inferred: parsed.inferred.length > 0 ? parsed.inferred : ['<inferred from recovery>'],
      expanded: parsed.expanded || fallbackPrompt,
    };
  }
  
  return {
    userStated: [fallbackPrompt],
    inferred: ['<none>'],
    expanded: fallbackPrompt,
  };
}