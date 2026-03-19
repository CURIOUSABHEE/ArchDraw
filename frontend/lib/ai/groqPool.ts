const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// All available keys in a flat pool
const ALL_KEYS = [
  process.env.GROQ_API_KEY_FOR_DESC_1!,
  process.env.GROQ_API_KEY_FOR_DESC_2!,
  process.env.GROQ_API_KEY_FOR_DESC_3!,
  process.env.GROQ_API_KEY_FOR_DESC_4!,
  process.env.GROQ_API_KEY_FOR_DESC_5!,
  process.env.GROQ_API_KEY_FOR_DESC_6!,
  process.env.GROQ_API_KEY_FOR_DESC_7!,
  process.env.GROQ_API_KEY_FOR_DESC_8!,
].filter(Boolean);

// Primary key assignments — each role gets dedicated keys first, then falls back to the full pool
const KEY_ASSIGNMENTS: Record<string, string[]> = {
  orchestrator: [
    process.env.GROQ_API_KEY_FOR_DESC_1!,
    process.env.GROQ_API_KEY_FOR_DESC_8!,
  ],
  subagent_a: [
    process.env.GROQ_API_KEY_FOR_DESC_2!,
    process.env.GROQ_API_KEY_FOR_DESC_1!,
  ],
  subagent_b: [
    process.env.GROQ_API_KEY_FOR_DESC_3!,
    process.env.GROQ_API_KEY_FOR_DESC_2!,
  ],
  subagent_c: [
    process.env.GROQ_API_KEY_FOR_DESC_4!,
    process.env.GROQ_API_KEY_FOR_DESC_3!,
  ],
  subagent_d: [
    process.env.GROQ_API_KEY_FOR_DESC_5!,
    process.env.GROQ_API_KEY_FOR_DESC_4!,
  ],
  // Synthesiser gets ALL keys as fallback — it's the heaviest call in the pipeline
  synthesiser: [
    process.env.GROQ_API_KEY_FOR_DESC_6!,
    process.env.GROQ_API_KEY_FOR_DESC_7!,
    process.env.GROQ_API_KEY_FOR_DESC_8!,
    process.env.GROQ_API_KEY_FOR_DESC_5!,
    process.env.GROQ_API_KEY_FOR_DESC_1!,
    process.env.GROQ_API_KEY_FOR_DESC_2!,
    process.env.GROQ_API_KEY_FOR_DESC_3!,
    process.env.GROQ_API_KEY_FOR_DESC_4!,
  ],
  critic: [
    process.env.GROQ_API_KEY_FOR_DESC_7!,
    process.env.GROQ_API_KEY_FOR_DESC_6!,
    process.env.GROQ_API_KEY_FOR_DESC_8!,
  ],
};

console.log(
  '[GroqPool] Keys loaded:',
  Object.keys(KEY_ASSIGNMENTS).reduce((acc, role) => {
    acc[role] = KEY_ASSIGNMENTS[role].filter(Boolean).length + ' keys';
    return acc;
  }, {} as Record<string, string>)
);

const keyCooldowns = new Map<string, number>();

function isKeyCooled(key: string): boolean {
  return Date.now() > (keyCooldowns.get(key) ?? 0);
}

function coolKey(key: string, ms = 62_000): void {
  keyCooldowns.set(key, Date.now() + ms);
  console.warn(`[GroqPool] Key ${key.slice(0, 8)}... cooled for ${ms / 1000}s`);
}

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqCallOptions {
  agentRole: keyof typeof KEY_ASSIGNMENTS;
  model: 'llama-3.3-70b-versatile' | 'llama-3.1-8b-instant';
  messages: GroqMessage[];
  maxTokens?: number;
  temperature?: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callGroq(options: GroqCallOptions): Promise<string> {
  const { agentRole, model, messages, maxTokens = 4096, temperature = 0.15 } = options;
  const assignedKeys = (KEY_ASSIGNMENTS[agentRole] ?? []).filter(Boolean);

  if (assignedKeys.length === 0) {
    throw new Error(`[GroqPool] No valid keys for role: ${agentRole}. Check your .env file.`);
  }

  // Build candidate list: assigned keys first, then any remaining pool keys not already included
  const seen = new Set(assignedKeys);
  const candidateKeys = [...assignedKeys, ...ALL_KEYS.filter((k) => !seen.has(k))];

  for (const key of candidateKeys) {
    if (!isKeyCooled(key)) {
      console.log(`[GroqPool] Key ${key.slice(0, 8)}... cooling, skipping for ${agentRole}`);
      continue;
    }

    try {
      console.log(`[GroqPool] Role: ${agentRole}, Key: ${key.slice(0, 8)}...`);
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const coolMs = retryAfter ? parseInt(retryAfter) * 1000 + 2000 : 62_000;
        coolKey(key, coolMs);
        continue; // immediately try next key
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error(`[GroqPool] Empty response for ${agentRole}`);

      console.log(`[GroqPool] Success for ${agentRole} using key ${key.slice(0, 8)}...`);
      return content;

    } catch (err) {
      const msg = (err as Error).message ?? '';
      if (msg.includes('429')) { coolKey(key); continue; }
      throw err;
    }
  }

  // All keys exhausted — wait for the soonest cooldown to expire, then retry once
  const now = Date.now();
  const soonestCool = Math.min(...candidateKeys.map((k) => keyCooldowns.get(k) ?? now));
  const waitMs = Math.max(0, soonestCool - now) + 1000;

  console.warn(`[GroqPool] All keys rate-limited for ${agentRole}. Waiting ${Math.ceil(waitMs / 1000)}s...`);
  await sleep(waitMs);

  for (const key of candidateKeys) {
    if (!isKeyCooled(key)) continue;
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
      });
      if (response.status === 429) { coolKey(key); continue; }
      if (!response.ok) throw new Error(`Groq API ${response.status}`);
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return content;
    } catch { continue; }
  }

  throw new Error(`[GroqPool] All keys for "${agentRole}" are rate-limited. Please try again in a moment.`);
}

export function parseJSON<T>(raw: string, context: string): T {
  try {
    const stripped = raw
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/\s*```\s*$/im, '')
      .trim();

    const jsonMatch = stripped.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as T;

    return JSON.parse(stripped) as T;
  } catch {
    throw new Error(`[${context}] Failed to parse JSON. Raw (first 500 chars): ${raw.slice(0, 500)}`);
  }
}
