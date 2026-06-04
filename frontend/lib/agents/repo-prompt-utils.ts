import type { FileEntry } from '@/lib/types/repo-diagram';

const MAX_FILE_CHARS = 600;
const MAX_FILES_IN_PROMPT = 6;

/** Format repo files for LLM context without trailing raw code that invites completion. */
export function formatSourceFilesForPrompt(files: FileEntry[]): string {
  const prioritized = [...files].sort((a, b) => {
    const score = (p: string) => {
      if (/main\.py|app\.py|route|router|api/i.test(p)) return 0;
      if (/readme|lock|\.md$/i.test(p)) return 3;
      return 1;
    };
    return score(a.path) - score(b.path);
  });

  const slice = prioritized.slice(0, MAX_FILES_IN_PROMPT);
  if (slice.length === 0) return '(no source files ingested)';

  return slice
    .map((file) => {
      const content =
        file.content.length > MAX_FILE_CHARS
          ? `${file.content.slice(0, MAX_FILE_CHARS)}\n... [truncated]`
          : file.content;
      return `### ${file.path}\n${content}`;
    })
    .join('\n\n');
}

export const JSON_OUTPUT_REMINDER =
  'Respond with a single JSON object only. Do not repeat or quote the source files. Do not use markdown fences.';
