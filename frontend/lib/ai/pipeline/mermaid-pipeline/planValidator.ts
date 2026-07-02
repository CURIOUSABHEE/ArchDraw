import logger from '@/lib/logger';
import type { EdgeConfig, InventoryConfig, FormatConfig, StyleConfig } from './types';

interface PlanInput {
  formatConfig: FormatConfig;
  styleConfig: StyleConfig;
  inventoryConfig: InventoryConfig;
  edgeConfig: EdgeConfig;
  groupAssignments: Record<string, string>;
}

interface ValidationResult {
  plan: PlanInput;
  warnings: string[];
  fixed: string[];
}

type NodeKind = 'client' | 'gateway' | 'data' | 'queue' | 'observability' | 'service';

function classifyNode(name: string): NodeKind {
  const lower = name.toLowerCase();
  if (/(?:browser|client|mobile|web|app\s*(?:server)?)$/.test(lower) && !lower.includes('gateway') && !lower.includes('api') && !lower.includes('load')) return 'client';
  if (/(?:gateway|load\s*balancer|proxy|reverse\s*proxy|lb|balancer|router)/.test(lower)) return 'gateway';
  if (/(?:db|database|sql|postgres|mysql|mongo|redis|cache|storage|s3|warehouse|bigquery|dynamo|cosmos|aurora|elasticsearch)/.test(lower)) return 'data';
  if (/(?:queue|broker|rabbit|kafka|pubsub|sqs|sns|message|event\s*bus|stream|pulsar)/.test(lower)) return 'queue';
  if (/(?:monitor|observ|grafana|prometheus|datadog|log|trace|alert|telemetry)/.test(lower)) return 'observability';
  return 'service';
}

const MULTI_ACTION_RE = /\/(?:\s|$)|(?:\s|^)\/(?:\s|$)|\s+(?:&|and|or)\s+/i;

function splitMultiActionLabel(label: string): string[] {
  const parts = label.split(/\s*\/\s*|\s+&\s+|\s+and\s+|\s+or\s+/i).map(s => s.trim()).filter(Boolean);
  return parts.length > 1 ? parts : [label];
}

function inferActionVerb(label: string): string | null {
  const lower = label.toLowerCase().trim();
  const knownVerbs = ['sends', 'routes', 'proxies', 'queries', 'reads', 'writes', 'processes', 'delivers', 'returns', 'forwards', 'authenticates', 'creates', 'uploads', 'queues', 'publishes', 'subscribes', 'pushes', 'pulls', 'validates', 'checks', 'updates', 'deletes', 'logs', 'triggers', 'notifies', 'requests', 'responds', 'serves', 'redirects', 'caches', 'loads'];
  const firstWord = lower.split(/\s+/)[0];
  return knownVerbs.includes(firstWord) ? firstWord : null;
}

function labelMatchesRole(label: string, kind: NodeKind): boolean {
  const verb = inferActionVerb(label);
  if (!verb) return true;
  if (kind === 'client' && ['sends', 'requests', 'submits', 'uploads'].includes(verb)) return true;
  if (kind === 'gateway' && ['routes', 'proxies', 'forwards', 'redirects', 'loads', 'serves', 'authenticates'].includes(verb)) return true;
  if (kind === 'service' && ['processes', 'queries', 'reads', 'writes', 'creates', 'updates', 'deletes', 'validates', 'queues', 'publishes', 'subscribes', 'pushes', 'pulls', 'checks', 'triggers', 'notifies', 'serves', 'caches', 'loads'].includes(verb)) return true;
  if (kind === 'data' && ['reads', 'writes', 'returns', 'stores', 'caches', 'loads', 'serves'].includes(verb)) return true;
  if (kind === 'queue' && ['queues', 'publishes', 'subscribes', 'delivers', 'processes', 'pushes', 'pulls', 'notifies'].includes(verb)) return true;
  if (kind === 'observability' && ['logs', 'monitors', 'traces', 'alerts', 'tracks'].includes(verb)) return true;
  return true;
}

export function validatePlan(input: PlanInput): ValidationResult {
  const warnings: string[] = [];
  const fixed: string[] = [];
  const plan: PlanInput = {
    formatConfig: { ...input.formatConfig },
    styleConfig: { ...input.styleConfig },
    inventoryConfig: { ...input.inventoryConfig, nodes: [...input.inventoryConfig.nodes], groups: [...input.inventoryConfig.groups] },
    edgeConfig: {
      edges: input.edgeConfig.edges.map(e => ({ ...e })),
      edgeCount: input.edgeConfig.edgeCount,
    },
    groupAssignments: { ...input.groupAssignments },
  };

  const nodeSet = new Set(plan.inventoryConfig.nodes);
  const nodeKinds = new Map<string, NodeKind>();
  for (const n of plan.inventoryConfig.nodes) nodeKinds.set(n, classifyNode(n));

  // ── 1. Split multi-action labels ──
  const newEdges: Array<{ from: string; to: string; label: string; bidirectional: boolean }> = [];
  for (const edge of plan.edgeConfig.edges) {
    if (MULTI_ACTION_RE.test(edge.label)) {
      const parts = splitMultiActionLabel(edge.label);
      fixed.push(`Split multi-action label "${edge.label}" on edge "${edge.from}" → "${edge.to}" into: ${parts.join(', ')}`);
      for (const part of parts) {
        newEdges.push({ from: edge.from, to: edge.to, label: part, bidirectional: false });
      }
    } else {
      newEdges.push(edge);
    }
  }
  plan.edgeConfig.edges = newEdges;
  plan.edgeConfig.edgeCount = newEdges.length;

  // ── 2. Reject empty labels ──
  const beforeEmpty = plan.edgeConfig.edges.length;
  plan.edgeConfig.edges = plan.edgeConfig.edges.filter(e => {
    if (!e.label || e.label.trim().length === 0) {
      warnings.push(`Edge "${e.from}" → "${e.to}" has empty label — dropped`);
      return false;
    }
    return true;
  });
  plan.edgeConfig.edgeCount = plan.edgeConfig.edges.length;
  if (plan.edgeConfig.edges.length < beforeEmpty) {
    fixed.push(`Removed ${beforeEmpty - plan.edgeConfig.edges.length} edge(s) with empty labels`);
  }

  // ── 3. Check source-node label matches role ──
  for (const edge of plan.edgeConfig.edges) {
    const kind = nodeKinds.get(edge.from);
    if (kind && !labelMatchesRole(edge.label, kind)) {
      warnings.push(`Edge "${edge.from}" → "${edge.to}": label "${edge.label}" doesn't match source node role "${kind}"`);
    }
  }

  // ── 4. Ensure return paths exist ──
  const forwardSet = new Set<string>();
  for (const e of plan.edgeConfig.edges) {
    forwardSet.add(`${e.from}||${e.to}`);
  }

  const clientSet = new Set<string>();
  for (const [n, k] of nodeKinds) {
    if (k === 'client') clientSet.add(n);
    if (k === 'gateway') clientSet.add(n);
  }

  for (const e of plan.edgeConfig.edges) {
    const reverseKey = `${e.to}||${e.from}`;
    if (forwardSet.has(reverseKey)) continue;
    if (e.from === e.to) continue;
    if (clientSet.has(e.from) && clientSet.has(e.to)) continue;

    let inferredLabel = '';
    const fromKind = nodeKinds.get(e.to);
    if (fromKind === 'data') inferredLabel = 'returns data';
    else if (fromKind === 'gateway') inferredLabel = 'sends response';
    else if (fromKind === 'client') continue;
    else inferredLabel = 'sends response';

    plan.edgeConfig.edges.push({ from: e.to, to: e.from, label: inferredLabel, bidirectional: false });
    plan.edgeConfig.edgeCount++;
    fixed.push(`Added missing return edge: "${e.to}" → "${e.from}" with label "${inferredLabel}"`);
  }

  // ── 5. Enforce LB/gateway routing rules ──
  for (const e of plan.edgeConfig.edges) {
    const fromKind = nodeKinds.get(e.from);
    const toKind = nodeKinds.get(e.to);
    if (fromKind === 'gateway' && (toKind === 'data' || toKind === 'queue')) {
      warnings.push(`Gateway/LB "${e.from}" routes directly to "${e.to}" (${toKind}) — LBs should only route to services`);
    }
  }

  // ── 6. Client should never be a target ──
  for (const e of plan.edgeConfig.edges) {
    if (nodeKinds.get(e.to) === 'client') {
      warnings.push(`Client node "${e.to}" is a target of "${e.from}" — clients should be sources only`);
    }
  }

  return { plan, warnings, fixed };
}
