import type { ArchitectureNode, ArchitectureEdge } from '../types';
import type { DiagramQualityReport } from '../validation/diagramQualityValidator';

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_ENTRIES = 20;

export interface CachedDiagram {
  normalizedPrompt: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  qualityReport: DiagramQualityReport;
  cachedAt: number;
}

const cache = new Map<string, CachedDiagram>();
const insertionOrder: string[] = [];

function normalizePrompt(prompt: string): string {
  return prompt
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

function isExpired(entry: CachedDiagram): boolean {
  return Date.now() - entry.cachedAt > CACHE_TTL_MS;
}

function evictOldest(): void {
  while (insertionOrder.length >= MAX_CACHE_ENTRIES && insertionOrder.length > 0) {
    const oldest = insertionOrder.shift();
    if (oldest) {
      cache.delete(oldest);
    }
  }
}

export function get(prompt: string): CachedDiagram | null {
  const normalized = normalizePrompt(prompt);
  const entry = cache.get(normalized);

  if (!entry) {
    return null;
  }

  if (isExpired(entry)) {
    cache.delete(normalized);
    const idx = insertionOrder.indexOf(normalized);
    if (idx !== -1) {
      insertionOrder.splice(idx, 1);
    }
    return null;
  }

  return entry;
}

export function set(
  prompt: string,
  diagram: {
    nodes: ArchitectureNode[];
    edges: ArchitectureEdge[];
    qualityReport: DiagramQualityReport;
  }
): void {
  const normalized = normalizePrompt(prompt);

  if (cache.size >= MAX_CACHE_ENTRIES && !cache.has(normalized)) {
    evictOldest();
  }

  const entry: CachedDiagram = {
    normalizedPrompt: normalized,
    nodes: diagram.nodes,
    edges: diagram.edges,
    qualityReport: diagram.qualityReport,
    cachedAt: Date.now(),
  };

  cache.set(normalized, entry);

  if (!insertionOrder.includes(normalized)) {
    insertionOrder.push(normalized);
  }
}

export function clear(): void {
  cache.clear();
  insertionOrder.length = 0;
}
