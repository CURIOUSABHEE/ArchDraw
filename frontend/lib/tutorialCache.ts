// In-memory cache for tutorial AI responses
// Persists across requests within the same server process (module-level)

const TTL_MS = 4 * 60 * 60 * 1000; // 4 hours
const MAX_ENTRIES = 500;

interface CacheEntry {
  content: string;
  suggestions: string[];
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export function getCacheKey(
  tutorialId: string,
  stepNumber: number,
  type: 'opening' | 'question',
  questionHash?: string,
): string {
  return `${tutorialId}:${stepNumber}:${type}${questionHash ? `:${questionHash}` : ''}`;
}

export function hashQuestion(question: string): string {
  // Normalize: lowercase, trim, take first 6 words
  const words = question.toLowerCase().trim().split(/\s+/).slice(0, 6);
  return words.join('_').replace(/[^a-z0-9_]/g, '');
}

export function getCached(key: string): CacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry;
}

export function setCache(key: string, content: string, suggestions: string[]): void {
  // Evict oldest entries if at capacity
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { content, suggestions, expiresAt: Date.now() + TTL_MS });
}

export interface CompressedMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function compressHistory(messages: CompressedMessage[]): CompressedMessage[] {
  if (messages.length <= 10) return messages;
  const first = messages.slice(0, 2);
  const last = messages.slice(-4);
  const middle = messages.slice(2, -4);
  const summary: CompressedMessage = {
    role: 'assistant',
    content: `[Earlier conversation summary: ${middle.length} messages covering ${middle.map(m => m.content.slice(0, 30)).join(' | ')}...]`,
  };
  return [...first, summary, ...last];
}
