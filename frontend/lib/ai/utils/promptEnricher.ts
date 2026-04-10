import { extractUserPreferences, formatUserPreferencesForPrompt } from './userInputExtractor';
import { apiKeyManager } from './apiKeyManager';

/**
 * Minimum word count before a prompt is considered "short" and needs enhancement.
 * 
 * Rationale: Prompts under 100 words typically lack the detail needed for a comprehensive
 * architecture diagram. They often omit implicit requirements like monitoring, caching,
 * security layers, and data persistence. Above this threshold, the user has usually
 * provided enough context for the diagram model to work effectively.
 * 
 * This threshold is NOT a hard limit — it's a signal to trigger enhancement. The
 * enhancement process itself preserves user intent and only adds domain-appropriate
 * infrastructure that would be expected in any production system of that type.
 */
const SHORT_PROMPT_THRESHOLD_WORDS = 100;

/**
 * OpenRouter model configuration with provider detection.
 * 
 * Provider detection: OpenRouter models contain a slash (e.g., "google/gemma-4-26b-a4b-it")
 * while Groq models do not (e.g., "llama-3.3-70b-versatile").
 * 
 * Model selection strategy:
 * - Primary: Fast/cheap models for enhancement (lower latency)
 * - Fallback: Stronger models if primary fails
 */
const PROMPT_ENHANCEMENT_MODELS: Array<{ id: string; provider: 'groq' | 'openrouter'; reason: string }> = [
  // Fast models for quick enhancement - use these first
  { id: 'google/gemma-4-26b-a4b-it', provider: 'openrouter', reason: 'Fast free model, good for quick prompt expansion' },
  { id: 'nvidia/nemotron-3-super-120b-a12b', provider: 'openrouter', reason: 'Strong free model, better quality if fast model fails' },
  
  // Groq backup models (no slash in ID = Groq provider)
  { id: 'llama-3.3-70b-versatile', provider: 'groq', reason: 'Groq fast fallback - no slash means Groq provider' },
  { id: 'mixtral-8x7b-32768', provider: 'groq', reason: 'Groq quality fallback' },
];

/**
 * Determines the API provider based on model ID format.
 * 
 * OpenRouter model IDs contain a slash (e.g., "google/gemma-4-26b-a4b-it")
 * Groq model IDs do not contain a slash (e.g., "llama-3.3-70b-versatile")
 */
function getProviderForModel(modelId: string): 'groq' | 'openrouter' {
  return modelId.includes('/') ? 'openrouter' : 'groq';
}

/**
 * Result type for prompt enhancement operations.
 * 
 * @example
 * ```typescript
 * const result = await enhanceShortPrompt("e-commerce site");
 * if (result.enhancementFailed) {
 *   console.warn("Enhancement failed, using original prompt");
 * }
 * const prompt = result.wasEnhanced ? result.prompt : originalPrompt;
 * ```
 */
interface EnhancementResult {
  /** The enhanced or original prompt text */
  prompt: string;
  /** Whether enhancement was applied (true if prompt was short and enhancement succeeded) */
  wasEnhanced: boolean;
  /** Whether enhancement was attempted but failed */
  enhancementFailed: boolean;
  /** Error message if enhancementFailed is true */
  error?: string;
}

/**
 * Enhances short prompts by inferring domain-appropriate components and expanding descriptions.
 * 
 * IMPORTANT: This function does NOT fabricate components. Instead, it:
 * 1. Infers reasonable domain-specific infrastructure (auth for e-commerce, etc.)
 * 2. Expands short phrases into full sentences
 * 3. Clarifies ambiguous terms
 * 4. Preserves user's exact words
 * 
 * The output is structured so the diagram model can distinguish between:
 * - USER_STATED: Components the user explicitly mentioned
 * - INFERRED: Domain-appropriate additions marked as inferences
 * - EXPANDED: Full natural language combining both
 * 
 * @param userPrompt - The original user prompt
 * @returns EnhancementResult with the enhanced prompt and status flags
 */
export async function enhanceShortPrompt(userPrompt: string): Promise<EnhancementResult> {
  const wordCount = userPrompt.trim().split(/\s+/).filter(w => w.length > 0).length;
  
  if (wordCount >= SHORT_PROMPT_THRESHOLD_WORDS) {
    return {
      prompt: userPrompt,
      wasEnhanced: false,
      enhancementFailed: false,
    };
  }
  
  let lastError: string = '';
  
  // Try each model in order until one succeeds
  for (const modelConfig of PROMPT_ENHANCEMENT_MODELS) {
    try {
      const enhancedPrompt = await apiKeyManager.executeWithRetry(
        async (groq) => {
          const completion = await groq.chat.completions.create({
            model: modelConfig.id,
            messages: [
              {
                role: 'system',
                content: `You are a cloud architecture expert helping users describe their systems more completely.

IMPORTANT RULES:
1. NEVER fabricate components the user didn't mention
2. You may INFER domain-appropriate infrastructure based on what they described
3. You must PRESERVE the user's exact words
4. Only expand abbreviations or clarify ambiguous terms

For example:
- User: "e-commerce site" → You can infer: users, products, cart, checkout, payments (standard e-commerce needs)
- User: "real-time chat app" → You can infer: WebSocket connections, message persistence, user presence (standard chat needs)
- User: "fast database" → Clarify: "low-latency read-heavy database with caching layer"

You MUST output in this exact format:

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

Output ONLY the three sections above. Do not add explanations or comments.`,
              },
              {
                role: 'user',
                content: `Enhance this prompt (${wordCount} words). The user said:\n\n${userPrompt}\n\nAdd domain-appropriate infrastructure as INFERRED, preserve their exact words as USER_STATED.`,
              },
            ],
            temperature: 0.3,
            max_tokens: 2048,
          });

          return completion.choices[0]?.message?.content ?? '';
        },
        { provider: modelConfig.provider }
      );

      if (enhancedPrompt && enhancedPrompt.includes('USER_STATED:')) {
        return {
          prompt: enhancedPrompt.trim(),
          wasEnhanced: true,
          enhancementFailed: false,
        };
      }
      
      // If response doesn't have expected format, try next model
      lastError = `Model ${modelConfig.id} returned invalid format`;
      
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(`[PromptEnricher] Model ${modelConfig.id} failed: ${lastError}`);
    }
  }
  
  // All models failed
  console.error(`[PromptEnricher] All enhancement models exhausted. Last error: ${lastError}`);
  return {
    prompt: userPrompt,
    wasEnhanced: false,
    enhancementFailed: true,
    error: `Enhancement failed: ${lastError}`,
  };
}

/**
 * Enriches the user prompt for the diagram generation model.
 * 
 * When the input contains the structured USER_STATED / INFERRED / EXPANDED sections
 * from enhanceShortPrompt:
 * - USER_STATED components are treated as MANDATORY (model must include them)
 * - INFERRED components are treated as SUGGESTED (model should include unless conflicting)
 * - EXPANDED section is used as the primary description
 * 
 * When the input is already a long prompt (not enhanced), the entire input
 * is treated as USER_STATED (all mandatory).
 * 
 * @param userPrompt - Either raw user input or structured output from enhanceShortPrompt
 * @returns Formatted prompt for the diagram generation model
 */
export function enrichPrompt(userPrompt: string): string {
  const userPreferences = extractUserPreferences(userPrompt);
  const userPrefPrompt = formatUserPreferencesForPrompt(userPreferences);
  
  // Check if this is structured output from enhanceShortPrompt
  const hasStructuredFormat = userPrompt.includes('USER_STATED:') && 
                            userPrompt.includes('INFERRED:') && 
                            userPrompt.includes('EXPANDED:');
  
  if (hasStructuredFormat) {
    return enrichStructuredPrompt(userPrompt, userPreferences, userPrefPrompt);
  }
  
  // Original/long prompt - treat everything as user-stated
  return enrichRawPrompt(userPrompt, userPreferences, userPrefPrompt);
}

/**
 * Enriches a prompt that already contains USER_STATED/INFERRED/EXPANDED structure.
 */
function enrichStructuredPrompt(userPrompt: string, userPreferences: ReturnType<typeof extractUserPreferences>, userPrefPrompt: string): string {
  // Extract the three sections
  const sections = parseStructuredSections(userPrompt);
  
  return `
════════════════════════════════════════════════════════════════════════════════════════════════════════
SYSTEM DESCRIPTION WITH COMPONENT AUTHORITY
════════════════════════════════════════════════════════════════════════════════════════════════════════

${sections.userStated}

${sections.inferred}

${sections.expanded}

════════════════════════════════════════════════════════════════════════════════════════════════════════
COMPONENT GENERATION RULES
════════════════════════════════════════════════════════════════════════════════════════════════════════

1. MANDATORY COMPONENTS (from USER_STATED):
   These are explicitly mentioned by the user. You MUST include ALL of them.
   
2. SUGGESTED COMPONENTS (from INFERRED):
   These are domain-appropriate additions. Include them UNLESS they conflict
   with the mandatory components or the user's stated requirements.
   
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

════════════════════════════════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
════════════════════════════════════════════════════════════════════════════════════════════════════════

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

/**
 * Parses the structured USER_STATED/INFERRED/EXPANDED sections from the prompt.
 */
function parseStructuredSections(prompt: string): { userStated: string; inferred: string; expanded: string } {
  let userStated = '';
  let inferred = '';
  let expanded = '';
  
  const lines = prompt.split('\n');
  let currentSection: 'userStated' | 'inferred' | 'expanded' | null = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine === 'USER_STATED:') {
      currentSection = 'userStated';
      continue;
    } else if (trimmedLine === 'INFERRED:') {
      currentSection = 'inferred';
      continue;
    } else if (trimmedLine === 'EXPANDED:') {
      currentSection = 'expanded';
      continue;
    }
    
    if (currentSection === 'userStated') {
      userStated += line + '\n';
    } else if (currentSection === 'inferred') {
      inferred += line + '\n';
    } else if (currentSection === 'expanded') {
      expanded += line + '\n';
    }
  }
  
  // If parsing failed, treat entire prompt as user-stated
  if (!userStated.trim()) {
    return {
      userStated: prompt,
      inferred: 'INFERRED:\n<none specified>',
      expanded: prompt,
    };
  }
  
  return {
    userStated: userStated.trim(),
    inferred: inferred.trim() || 'INFERRED:\n<none specified>',
    expanded: expanded.trim() || userStated.trim(),
  };
}

/**
 * Enriches a raw/long prompt where the entire input is treated as user-stated.
 */
function enrichRawPrompt(userPrompt: string, userPreferences: ReturnType<typeof extractUserPreferences>, userPrefPrompt: string): string {
  return `
════════════════════════════════════════════════════════════════════════════════════════════════════════
USER'S SYSTEM DESCRIPTION (ALL COMPONENTS ARE MANDATORY)
════════════════════════════════════════════════════════════════════════════════════════════════════════
"${userPrompt}"

${userPrefPrompt}

════════════════════════════════════════════════════════════════════════════════════════════════════════
AWS SERVICE REQUIREMENTS
════════════════════════════════════════════════════════════════════════════════════════════════════════

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

════════════════════════════════════════════════════════════════════════════════════════════════════════
MINIMUM DIAGRAM REQUIREMENTS
════════════════════════════════════════════════════════════════════════════════════════════════════════

- Minimum 12 nodes
- Include VPC group (groupColor: "#FF9900") wrapping backend services
- Include CloudWatch for monitoring
- Include at least one load balancer or CDN
- Include database + cache layer
- Include message queue if async processing needed

════════════════════════════════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
════════════════════════════════════════════════════════════════════════════════════════════════════════

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
