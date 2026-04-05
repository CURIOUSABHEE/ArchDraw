import { apiKeyManager } from '../utils/apiKeyManager';
import logger from '@/lib/logger';

export type DiagramType = 'architecture' | 'sequence';

const ROUTER_PROMPT = `Classify this request as either 'architecture' (system design, infrastructure, services, components, how a system is structured) or 'sequence' (how a process flows over time, interactions between actors, steps in a workflow, agent loops, API call sequences). Reply with only one word: architecture or sequence.`;

export async function detectDiagramType(userPrompt: string): Promise<DiagramType> {
  const prompt = `${ROUTER_PROMPT}

User request: "${userPrompt}"

Reply with only one word.`;

  try {
    const result = await apiKeyManager.executeWithRetry(async (groq: unknown) => {
      const groqClient = groq as { chat: { completions: { create: (opts: unknown) => Promise<{ choices: Array<{ message: { content: string | null } }> }> } } };
      const completion = await groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a JSON-only output system. Always respond with valid JSON or a single word. Do NOT wrap in markdown code blocks.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 20,
      });

      const content = completion.choices[0]?.message?.content ?? '';
      return content.trim().toLowerCase();
    });

    const cleanedResult = result.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

    if (cleanedResult === 'sequence') {
      return 'sequence';
    }
    
    return 'architecture';
  } catch (error) {
    logger.error('DiagramTypeRouter error:', error);
    return 'architecture';
  }
}
