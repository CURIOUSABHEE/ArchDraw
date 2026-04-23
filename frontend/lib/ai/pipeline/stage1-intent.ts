import type { IntentResult } from './types';

const INTENT_PATTERNS: Record<string, RegExp[]> = {
  'realtime-messaging': [/\bchat\b/i, /\bmessag/i, /\bwebsocket/i, /\blive\b/i, /\bpresence\b/i],
  'async-messaging': [/\bnotif/i, /\bemail/i, /\bqueue/i, /\bworker/i, /\bjob\b/i],
  'ecommerce': [/\bcheckout\b/i, /\bcart\b/i, /\border\b/i, /\bpayment\b/i, /\bproduct\b/i],
  'data-pipeline': [/\bingestion\b/i, /\betl\b/i, /\bpipeline\b/i, /\bbatch\b/i, /\bstream\b/i],
  'auth-platform': [/\bauth\b/i, /\blogin\b/i, /\bsso\b/i, /\boauth\b/i, /\bidentity\b/i],
  'fintech': [/\bpayment\b/i, /\bwallet\b/i, /\btransaction\b/i, /\bledger\b/i, /\bsettle/i],
  'content-platform': [/\bfeed\b/i, /\bpost\b/i, /\bupload\b/i, /\bmedia\b/i, /\bcontent\b/i],
  'generic-web-app': [/\bweb\b/i, /\bapp\b/i, /\bservice\b/i, /\bsystem\b/i, /\bapi\b/i],
};

const LAYER_ORDER = ['presentation', 'gateway', 'application', 'data', 'async', 'observability', 'external'];

export function detectIntent(prompt: string): IntentResult {
  const scores: Record<string, number> = {};

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    scores[intent] = patterns.filter(p => p.test(prompt)).length;
  }

  const ranked = Object.entries(scores)
    .filter(([, s]) => s > 0)
    .sort(([, a], [, b]) => b - a);

  if (ranked.length === 0) {
    return {
      type: 'generic-web-app',
      confidence: 1.0,
      ambiguous: false,
    };
  }

  const [topIntent, topScore] = ranked[0];
  const [, secondScore] = ranked[1] ?? ['', 0];

  const confidence = Math.min(topScore / 3, 1.0);
  const ambiguous = secondScore >= topScore && topScore < 3;

  return {
    type: topIntent,
    confidence,
    ambiguous,
  };
}

export function getLayerIndex(layer: string): number {
  return LAYER_ORDER.indexOf(layer);
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
  if (label.includes('queue') || label.includes('worker') || label.includes('kafka') || label.includes('sqs')) {
    return 'async';
  }
  if (label.includes('database') || label.includes('db') || label.includes('cache') || label.includes('redis')) {
    return 'data';
  }
  if (label.includes('monitor') || label.includes('log') || label.includes('metrics') || label.includes('trace')) {
    return 'observability';
  }
  
  return 'application';
}