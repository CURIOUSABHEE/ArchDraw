import type { IntentResult } from './types';

/**
 * STAGE 1 — INTENT DETECTION
 * Improved classification with confidence scoring.
 * Distinguishes: system-architecture, microservices, event-driven, data-pipeline
 * Default to "system-architecture" if confidence < 0.6
 */

// Architecture pattern signatures with weighted keywords
interface PatternConfig {
  keywords: { term: RegExp; weight: number }[];
  negativeKeywords?: RegExp[];
}

const ARCHITECTURE_PATTERNS: Record<string, PatternConfig> = {
  'system-architecture': {
    keywords: [
      { term: /\bsystem\b/i, weight: 2 },
      { term: /\barchitecture\b/i, weight: 2 },
      { term: /\bplatform\b/i, weight: 1 },
      { term: /\bweb\s*app/i, weight: 1 },
      { term: /\bservice\b/i, weight: 1 },
      { term: /\bapi\b/i, weight: 1 },
      { term: /\bapplication\b/i, weight: 1 },
      { term: /\bdeploy\b/i, weight: 1 },
      { term: /\bserver\b/i, weight: 1 },
      { term: /\bclient\b/i, weight: 1 },
      { term: /\bdatabase\b/i, weight: 1 },
      { term: /\bcache\b/i, weight: 1 },
    ],
  },
  'microservices': {
    keywords: [
      { term: /\bmicroservice/i, weight: 3 },
      { term: /\bservice\s*mesh/i, weight: 2 },
      { term: /\bcontainer/i, weight: 1 },
      { term: /\borchestrat/i, weight: 1 },
      { term: /\bdomain\s*driven/i, weight: 2 },
      { term: /\bapi\s*gateway/i, weight: 1 },
      { term: /\bcircuit\s*break/i, weight: 1 },
      { term: /\bindependent\s*(deploy|scal)/i, weight: 2 },
    ],
  },
  'event-driven': {
    keywords: [
      { term: /\bevent\s*driven/i, weight: 3 },
      { term: /\bevent\s*bus/i, weight: 2 },
      { term: /\bmessage\s*queue/i, weight: 2 },
      { term: /\bpub\s*sub/i, weight: 2 },
      { term: /\bkafka\b/i, weight: 2 },
      { term: /\brabbitmq\b/i, weight: 1 },
      { term: /\basync/i, weight: 1 },
      { term: /\bstream\b/i, weight: 1 },
      { term: /\bevent\s*store/i, weight: 2 },
      { term: /\bproducer\b/i, weight: 1 },
      { term: /\bconsumer\b/i, weight: 1 },
    ],
  },
  'data-pipeline': {
    keywords: [
      { term: /\bdata\s*pipeline/i, weight: 3 },
      { term: /\betl\b/i, weight: 3 },
      { term: /\bingest/i, weight: 2 },
      { term: /\bbatch\s*process/i, weight: 2 },
      { term: /\btransform/i, weight: 1 },
      { term: /\bwarehouse/i, weight: 2 },
      { term: /\bdatalake/i, weight: 2 },
      { term: /\bspark\b/i, weight: 1 },
      { term: /\bflink\b/i, weight: 1 },
      { term: /\bairflow\b/i, weight: 2 },
      { term: /\bdag\b/i, weight: 1 },
    ],
    negativeKeywords: [
      /\buser\b/i, /\bclient\b/i, /\bgateway\b/i, /\bapi\b/i, /\brequest\b/i, /\bresponse\b/i
    ],
  },
};

// Negative signals that contradict a classification
const NEGATIVE_PATTERNS: Record<string, RegExp[]> = {
  'data-pipeline': [
    /\buser\b/i, /\bclient\b/i, /\bgateway\b/i, /\bapi\b/i, /\brequest\b/i, /\bresponse\b/i
  ],
  'event-driven': [
    /\bstatic\b/i, /\bcron\b/i, /\bbatch\s*only/i
  ],
};

const CONFIDENCE_THRESHOLD = 0.6;
const DEFAULT_INTENT = 'system-architecture';

export function detectIntent(prompt: string): IntentResult {
  const scores: Record<string, number> = {};
  const maxScores: Record<string, number> = {};

  // Calculate weighted scores for each architecture type
  for (const [intent, config] of Object.entries(ARCHITECTURE_PATTERNS)) {
    let score = 0;
    let maxPossible = 0;

    for (const { term, weight } of config.keywords) {
      maxPossible += weight;
      if (term.test(prompt)) {
        score += weight;
      }
    }

    // Apply negative patterns
    const negatives = config.negativeKeywords || [];
    for (const negPattern of negatives) {
      if (negPattern.test(prompt)) {
        score *= 0.5; // Penalize but don't eliminate
      }
    }

    scores[intent] = score;
    maxScores[intent] = maxPossible;
  }

  // Normalize scores to 0-1 confidence
  const confidences: Record<string, number> = {};
  for (const [intent, score] of Object.entries(scores)) {
    const maxPossible = maxScores[intent];
    confidences[intent] = maxPossible > 0 ? Math.min(score / maxPossible, 1.0) : 0;
  }

  // Rank by confidence
  const ranked = Object.entries(confidences)
    .filter(([, conf]) => conf > 0)
    .sort(([, a], [, b]) => b - a);

  if (ranked.length === 0) {
    return {
      type: DEFAULT_INTENT,
      confidence: 1.0,
      ambiguous: false,
    };
  }

  const [topIntent, topConfidence] = ranked[0];

  // Check if second-highest is too close (ambiguous)
  const [, secondConfidence] = ranked[1] ?? ['', 0];
  const ambiguous = secondConfidence > 0 && (topConfidence - secondConfidence) < 0.2;

  // If confidence < threshold, default to system-architecture
  if (topConfidence < CONFIDENCE_THRESHOLD) {
    console.log(`[Intent] Confidence ${topConfidence.toFixed(2)} < ${CONFIDENCE_THRESHOLD}, defaulting to ${DEFAULT_INTENT}`);
    return {
      type: DEFAULT_INTENT,
      confidence: CONFIDENCE_THRESHOLD,
      ambiguous: false,
    };
  }

  return {
    type: topIntent,
    confidence: topConfidence,
    ambiguous,
  };
}

export function getLayerIndex(layer: string): number {
  const LAYER_ORDER = ['presentation', 'gateway', 'application', 'async', 'data', 'observability', 'external'];
  const idx = LAYER_ORDER.indexOf(layer);
  return idx >= 0 ? idx : 2; // default to 'application'
}

export function getLayerForNode(nodeLabel: string, layerAssignment: Record<string, string>): string {
  if (layerAssignment[nodeLabel]) {
    return layerAssignment[nodeLabel];
  }
  const label = nodeLabel.toLowerCase();
  
  if (label.includes('client') || label.includes('web') || label.includes('mobile') || label.includes('browser')) {
    return 'presentation';
  }
  if (label.includes('gateway') || label.includes('cdn') || label.includes('lb') || label.includes('load balancer')) {
    return 'gateway';
  }
  if (label.includes('queue') || label.includes('worker') || label.includes('kafka') || label.includes('sqs') || label.includes('event')) {
    return 'async';
  }
  if (label.includes('database') || label.includes('db') || label.includes('cache') || label.includes('redis') || label.includes('storage')) {
    return 'data';
  }
  if (label.includes('monitor') || label.includes('log') || label.includes('metrics') || label.includes('trace')) {
    return 'observability';
  }
  
  return 'application';
}
