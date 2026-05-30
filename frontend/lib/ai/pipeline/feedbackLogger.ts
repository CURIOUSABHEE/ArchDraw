import logger from '@/lib/logger';
import * as fs from 'fs';
import * as path from 'path';
import type { ValidationIssue } from './types';
import { randomUUID } from 'crypto';

export interface FeedbackLogEntry {
  id: string;                    // unique per generation
  timestamp: string;             // ISO 8601
  originalPrompt: string;        // the raw user prompt, unchanged
  finalScore: number;            // score after all retries
  totalAttempts: number;         // 1, 2, or 3
  wasRepaired: boolean;          // true if any repair was applied on final attempt
  issues: ValidationIssue[];     // from final attempt's feedback
  injectedNodes: string[];       // from final attempt's feedback
  prunedNodes: string[];         // from final attempt's feedback
  orphansFixed: number;
  tiersRepaired: string[];
  detectedDomain: string | null; // if StoryGuard identified a domain, log it
}

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'feedback.jsonl');

export function logGenerationResult(entry: Omit<FeedbackLogEntry, 'id' | 'timestamp'>): void {
  try {
    const fullEntry: FeedbackLogEntry = {
      ...entry,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };

    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    const logLine = JSON.stringify(fullEntry) + '\n';
    fs.appendFileSync(LOG_FILE, logLine, 'utf-8');
  } catch (error) {
    logger.warn('[FeedbackLogger] Failed to write feedback log:', error);
  }
}
