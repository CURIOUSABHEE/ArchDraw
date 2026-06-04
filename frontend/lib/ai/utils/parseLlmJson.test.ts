import { describe, it, expect } from 'vitest';
import { parseLlmJson, extractJsonObject } from './parseLlmJson';

describe('parseLlmJson', () => {
  it('parses bare JSON object', () => {
    const result = parseLlmJson<{ repoType: string }>('{"repoType":"backend_only"}');
    expect(result.repoType).toBe('backend_only');
  });

  it('extracts JSON from markdown fences', () => {
    const raw = 'Here is the result:\n```json\n{"repoType":"library"}\n```';
    expect(parseLlmJson<{ repoType: string }>(raw).repoType).toBe('library');
  });

  it('extracts JSON after prose and bullet lists', () => {
    const raw = `- Classification complete\n\n{"repoType":"backend_only","confidence":"high"}`;
    expect(parseLlmJson<{ repoType: string }>(raw).repoType).toBe('backend_only');
  });

  it('handles trailing commas', () => {
    const raw = '{"items": [1, 2,],}';
    expect(parseLlmJson<{ items: number[] }>(raw).items).toEqual([1, 2]);
  });

  it('does not confuse leading dash with JSON', () => {
    expect(() => parseLlmJson('- not json')).toThrow(/could not parse JSON/);
    expect(extractJsonObject('- not json')).toBeNull();
  });
});
