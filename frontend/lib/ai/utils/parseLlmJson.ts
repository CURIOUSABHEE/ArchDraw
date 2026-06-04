/**
 * Robust JSON extraction from LLM responses (markdown fences, prose prefixes, trailing commas).
 */
export function extractJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  return null;
}

export function extractJsonArray(text: string): string | null {
  const start = text.indexOf('[');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '[') depth++;
    if (ch === ']') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  return null;
}

function stripMarkdownFences(text: string): string {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

function tryParse(candidate: string): unknown | undefined {
  try {
    return JSON.parse(candidate);
  } catch {
    // Trailing commas are common in LLM JSON
    try {
      return JSON.parse(candidate.replace(/,\s*([\]}])/g, '$1'));
    } catch {
      return undefined;
    }
  }
}

export function parseLlmJson<T = unknown>(raw: string, label = 'LLM response'): T {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) {
    throw new Error(`${label}: empty response`);
  }

  const candidates = new Set<string>();
  candidates.add(trimmed);
  candidates.add(stripMarkdownFences(trimmed));

  const objectFromTrimmed = extractJsonObject(trimmed);
  if (objectFromTrimmed) candidates.add(objectFromTrimmed);

  const objectFromStripped = extractJsonObject(stripMarkdownFences(trimmed));
  if (objectFromStripped) candidates.add(objectFromStripped);

  for (const candidate of candidates) {
    const parsed = tryParse(candidate);
    if (parsed !== undefined) return parsed as T;
  }

  const preview = trimmed.slice(0, 120).replace(/\s+/g, ' ');
  throw new Error(`${label}: could not parse JSON (preview: "${preview}")`);
}
