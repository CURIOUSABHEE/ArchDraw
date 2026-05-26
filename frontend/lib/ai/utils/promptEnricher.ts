import { extractUserPreferences, formatUserPreferencesForPrompt } from './userInputExtractor';
import { apiKeyManager } from './apiKeyManager';
import logger from '@/lib/logger';

/**
 * Minimum word count before a prompt is considered "short" and needs enhancement
 */
const SHORT_PROMPT_THRESHOLD = 25;

/**
 * System prompts for enhancement based on intent
 */
const ENHANCEMENT_PROMPTS = {
  'system-architecture': `You are a cloud architect. Expand this system description into a comprehensive architectural specification. 
Focus on:
- Core services and their responsibilities
- Data storage and caching strategies
- Entry points (gateways, CDNs)
- Async processing (queues, workers)
- Reliability and scalability components
Output a detailed, structured technical description (200-300 words).`,

  'microservices': `You are a microservices expert. Decompose this system into a clean set of decoupled services.
Focus on:
- Service boundaries and bounded contexts
- Inter-service communication (REST, gRPC, Events)
- Data isolation (database per service)
- Cross-cutting concerns (Auth, Discovery, Config)
Output a detailed service map and communication plan (200-300 words).`,

  'event-driven': `You are an event-driven systems specialist. Transform this system into a reactive, event-based architecture.
Focus on:
- Event producers and consumers
- Message brokers and event streaming (Kafka, RabbitMQ)
- Event schemas and payloads
- Dead letter handling and eventual consistency
Output a detailed event flow and reactive strategy (200-300 words).`,

  'data-pipeline': `You are a data engineer. Design a robust data processing pipeline for this system.
Focus on:
- Ingestion (batch vs stream)
- Transformation and ETL stages
- Data lake and warehouse structure
- Analytics and serving layers
Output a detailed data lineage and processing specification (200-300 words).`,

  'mvc': `You are a software architect specializing in layered MVC architecture. Expand this description into a clean Model-View-Controller structure.
Focus on:
- Model layer: data models, ORM entities, database access, validation logic
- View layer: UI templates, screens, API response formatters, presentation components
- Controller layer: request handlers, routing, business logic orchestration, session management
- Strict layer separation: controllers depend on models, views are passive, no circular dependencies
Output a detailed layered specification (200-300 words). NO microservices. NO message queues. NO cloud infrastructure.`,
};

interface ModelConfig {
  id: string;
  provider: 'groq' | 'openrouter';
}

const ENHANCEMENT_MODELS: ModelConfig[] = [
  { id: 'llama-3.3-70b-versatile', provider: 'groq' },
  { id: 'meta-llama/llama-3.3-70b-instruct', provider: 'openrouter' },
];

/**
 * Uses a large LLM to expand a brief user prompt into a high-signal 
 * architectural specification. This significantly improves diagram quality.
 */
export async function enhancePrompt(
  prompt: string, 
  intent: string = 'system-architecture'
): Promise<string> {
  // 1. Skip enhancement if prompt is already detailed or too short to enhance
  const wordCount = prompt.trim().split(/\s+/).length;
  if (wordCount > SHORT_PROMPT_THRESHOLD || wordCount < 3) {
    logger.log(`[PromptEnricher] Skipping enhancement (word count: ${wordCount})`);
    return prompt;
  }

  logger.log(`[PromptEnricher] Enhancing short prompt: "${prompt.slice(0, 50)}..."`);

  // 2. Extract any specific user preferences (AWS, specific DBs, etc.)
  const preferences = extractUserPreferences(prompt);
  const preferencesContext = formatUserPreferencesForPrompt(preferences);

  // 3. Select system prompt based on intent
  const systemPrompt = ENHANCEMENT_PROMPTS[intent as keyof typeof ENHANCEMENT_PROMPTS] || ENHANCEMENT_PROMPTS['system-architecture'];
  
  const userPrompt = `ORIGINAL PROMPT: ${prompt}
${preferencesContext}
Please expand this into a production-grade architectural specification.`;

  let lastError: Error | null = null;

  // 4. Try models in order
  for (const modelConfig of ENHANCEMENT_MODELS) {
    try {
      const enhanced = await apiKeyManager.executeWithRetry(async (client) => {
        const completion = await client.chat.completions.create({
          model: modelConfig.id,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.5,
          max_tokens: 1024,
        });
        return completion.choices[0]?.message?.content ?? '';
      });

      if (enhanced && enhanced.length > prompt.length) {
        logger.log(`[PromptEnricher] Enhancement successful using ${modelConfig.id}`);
        // Prepend the enhanced part to give context but keep the original user intent
        return `TECHNICAL SPECIFICATION:\n${enhanced}\n\nUSER INTENT: ${prompt}`;
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      logger.warn(`[PromptEnricher] Model ${modelConfig.id} failed: ${lastError.message}`);
    }
  }

  logger.error(`[PromptEnricher] All enhancement models exhausted. Last error: ${lastError?.message}`);
  return prompt; // Return original prompt as final fallback
}

/**
 * Injects architectural best practices into the diagram generation prompt
 * based on common system patterns.
 */
export function getArchitectureGuidance(systemType: string): string {
  const commonGuidance = `
Always include:
- A clear entry point (API Gateway or Load Balancer)
- Observability (Monitoring, Logging)
- Security (Auth Service)
- Health check endpoints
- High availability via redundancy (where appropriate)
`.trim();

  const specifics: Record<string, string> = {
    'video streaming': `- Use CDNs for edge content delivery
- Include transcoding workers and object storage
- Decouple upload from playback paths`,
    'ecommerce': `- Ensure payment processing is isolated
- Include robust inventory management and order state machines
- Use caching for product catalogs`,
    'chat': `- Use WebSockets or long polling for real-time delivery
- Include presence detection and typing indicators
- Scale using Pub/Sub mechanisms like Redis or NATS`,
  };

  return `${commonGuidance}\n${specifics[systemType.toLowerCase()] || ''}`.trim();
}

/**
 * Formats the final prompt for the diagram generator LLM.
 */
export function buildGeneratorPrompt(spec: string): string {
  return `
Create a production-ready architecture diagram for the following specification:

${spec}

OUTPUT FORMAT:
Provide an NDJSON (Newline Delimited JSON) sequence of components and their connections.
Each line must be exactly one JSON object.

OBJECT TYPES:
1. Component: {"id": "unique-id", "label": "Service Name", "layer": "presentation|gateway|application|async|data|observability|external", "type": "client|gateway|service|queue|database|cache|worker|auth|api|cdn|loadbalancer", "subtitle": "Tech Stack"}
2. Connection: {"type": "flow", "path": ["source-id", "target-id"], "label": "action/explanation (e.g. 'fetches data', 'authenticates')", "async": true|false}

CONSTRAINTS:
- Use 10-15 components for a rich architecture.
- EVERY component must have at least one connection (no orphans).
- Organize logically from left to right across layers.
- Do NOT use markdown code blocks. Start output directly with JSON.
`.trim();
}
