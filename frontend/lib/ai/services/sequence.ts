import { apiKeyManager } from '../utils/apiKeyManager';
import logger from '@/lib/logger';

export interface SequenceResult {
  mermaidSyntax: string;
  actors: string[];
  title: string;
}

const SEQUENCE_PROMPT = `Generate a Mermaid sequenceDiagram for the following description.
Rules:
- Use sequenceDiagram as the diagram type
- Forward messages use ->> (solid arrow)  
- Return/response messages use -->> (dashed arrow)
- Use loop blocks for repeated processes: loop [condition] ... end
- Use note blocks sparingly if clarification is needed
- Keep actor names short (1-2 words max)
- Keep message labels short (2-4 words max)
- Maximum 6 actors, maximum 20 messages
Return ONLY the raw Mermaid syntax, no markdown code fences, no explanation.`;

export async function runSequenceAgent(userPrompt: string): Promise<SequenceResult> {
  const prompt = `${SEQUENCE_PROMPT}

User description: "${userPrompt}"

Generate the Mermaid sequence diagram.`;

  try {
    const result = await apiKeyManager.executeWithRetry(async (groq: unknown) => {
      const groqClient = groq as { chat: { completions: { create: (opts: unknown) => Promise<{ choices: Array<{ message: { content: string | null } }> }> } } };
      const completion = await groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a Mermaid diagram generator. Always respond with raw Mermaid syntax only. No markdown, no explanation.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      });

      const content = completion.choices[0]?.message?.content ?? '';
      return content;
    });

    const cleanedResult = result.replace(/```mermaid\s*/gi, '').replace(/```\s*/gi, '').trim();

    let mermaidSyntax = cleanedResult;
    if (!mermaidSyntax.startsWith('sequenceDiagram')) {
      mermaidSyntax = `sequenceDiagram\n${cleanedResult}`;
    }

    const actors = extractActors(mermaidSyntax);
    const title = extractTitle(userPrompt);

    return {
      mermaidSyntax,
      actors,
      title,
    };
  } catch (error) {
    logger.error('SequenceAgent error:', error);
    return createFallbackSequenceDiagram(userPrompt);
  }
}

function extractActors(mermaidSyntax: string): string[] {
  const actors: string[] = [];
  const participantRegex = /participant\s+(\w+)/g;
  let match;
  
  while ((match = participantRegex.exec(mermaidSyntax)) !== null) {
    if (!actors.includes(match[1])) {
      actors.push(match[1]);
    }
  }

  return actors;
}

function extractTitle(userPrompt: string): string {
  const words = userPrompt.split(/\s+/);
  if (words.length <= 6) {
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }
  
  const titleWords = words.slice(0, 6);
  return titleWords.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') + '...';
}

function createFallbackSequenceDiagram(userPrompt: string): SequenceResult {
  const title = extractTitle(userPrompt);
  const actors = ['Actor1', 'Actor2'];
  
  const mermaidSyntax = `sequenceDiagram
    participant ${actors[0]}
    participant ${actors[1]}
    ${actors[0]}->>${actors[1]}: Process
    ${actors[1]}-->>${actors[0]}: Response`;

  return {
    mermaidSyntax,
    actors,
    title,
  };
}
