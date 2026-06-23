import logger from '@/lib/logger';
import type {
  RawNode,
  RawFlow,
  DiagramEdge,
  ValidatedDiagram,
  PipelineLayer,
  ValidationFeedback,
  ValidationIssue,
  PreGenerationChecklist,
  PipelineDiagnostics,
  ArchitectureStylePlan,
} from './types';
import { diagnoseStoryIssues } from './storyGuard';

export interface ValidateOptions {
  prompt?: string;
  preGenerationChecklist?: PreGenerationChecklist;
  stylePlan?: ArchitectureStylePlan;
  existingNodeIds?: string[];
}

export interface ValidateResult {
  diagram: ValidatedDiagram;
  feedback: ValidationFeedback;
  diagnostics: PipelineDiagnostics;
}

/** Semantic issue types that should trigger LLM regeneration (no auto-injection). */
export const RETRYABLE_SEMANTIC_TYPES = new Set([
  'orphan_node',
  'disconnected_components',
  'empty_edge_label',
  'vague_edge_label',
]);

export function getRetryableSemanticIssues(issues: ValidationIssue[]): ValidationIssue[] {
  return issues.filter((i) => i.severity === 'warning' && RETRYABLE_SEMANTIC_TYPES.has(i.type));
}

/** Whether to re-run diagram generation with correction feedback. */
export function shouldRetryGeneration(
  feedback: ValidationFeedback,
  diagnostics: PipelineDiagnostics
): boolean {
  if (!feedback.isValid) return true;
  return getRetryableSemanticIssues(diagnostics.semanticIssues).length > 0;
}

export function mergeFeedbackForRetry(
  feedback: ValidationFeedback,
  diagnostics: PipelineDiagnostics
): ValidationFeedback {
  const retryable = getRetryableSemanticIssues(diagnostics.semanticIssues);
  const existingKeys = new Set(feedback.issues.map((i) => `${i.type}:${i.nodeId ?? ''}:${i.message}`));
  const mergedIssues = [...feedback.issues];
  for (const issue of retryable) {
    const key = `${issue.type}:${issue.nodeId ?? ''}:${issue.message}`;
    if (!existingKeys.has(key)) {
      mergedIssues.push(issue);
      existingKeys.add(key);
    }
  }
  return {
    ...feedback,
    isValid: false,
    issues: mergedIssues,
  };
}

/**
 * STAGE 5 — VALIDATION (custom-first, validate-only semantics)
 *
 * Mechanical repairs: ID dedup, missing IDs, dangling edges removed, layer alias normalization.
 * Semantic checks: report only — no node/edge invention or auto-connection.
 */
export function validateAndRepair(
  parsed: { nodes: RawNode[]; flows: RawFlow[] },
  prompt?: string,
  preGenerationChecklist?: PreGenerationChecklist,
  options?: ValidateOptions
): ValidateResult {
  const stylePlan = options?.stylePlan;
  const mechanicalRepairs: ValidationIssue[] = [];
  const semanticIssues: ValidationIssue[] = [];
  const removedInvalidEdgeIds: string[] = [];
  const tiersRepaired: string[] = [];

  let nodes = [...parsed.nodes];

  logger.info(`[Validate] Starting with ${nodes.length} nodes and ${parsed.flows.length} flows`);

  const rawEdges = flowsToEdges(parsed.flows);
  const edges = pruneReverseEdges(rawEdges, nodes, mechanicalRepairs);

  nodes = repairNodeData(nodes, mechanicalRepairs, tiersRepaired);
  nodes = ensureNodeIdentity(nodes, mechanicalRepairs);

  const { edges: validEdges, removedIds } = repairEdgesMechanical(edges, nodes, mechanicalRepairs);
  removedInvalidEdgeIds.push(...removedIds);

  checkEdgeLabelQuality(validEdges, nodes, mechanicalRepairs, semanticIssues);

  // Last-resort mechanical cleanup:
  // If the model outputs disconnected orphan nodes, we prefer dropping those nodes
  // over shipping a diagram with floating islands (no semantic invention).
  // Retry logic should normally fix this, but this guarantees a clean result.
  nodes = dropOrphanNodesMechanical(nodes, validEdges, mechanicalRepairs);

  runSemanticValidation(nodes, validEdges, {
    prompt,
    preGenerationChecklist,
    stylePlan,
    existingNodeIds: options?.existingNodeIds,
    issues: semanticIssues,
  });

  const finalNodes = enforceHierarchy(nodes, mechanicalRepairs, tiersRepaired);

  const removedExistingNodeIds =
    options?.existingNodeIds?.filter((id) => !finalNodes.some((n) => n.id === id)) ?? [];

  if (removedExistingNodeIds.length > 0) {
    semanticIssues.push({
      severity: 'warning',
      type: 'removed_existing_node',
      message: `Model omitted ${removedExistingNodeIds.length} existing node(s): ${removedExistingNodeIds.join(', ')}`,
    });
  }

  let score = 100;
  [...mechanicalRepairs, ...semanticIssues].forEach((issue) => {
    if (issue.severity === 'critical') score -= 15;
    if (issue.severity === 'warning') score -= 5;
  });
  score = Math.max(0, score);

  const criticalCount = semanticIssues.filter((i) => i.severity === 'critical').length;
  const isValid = criticalCount === 0;

  const feedback: ValidationFeedback = {
    isValid,
    score,
    issues: [...mechanicalRepairs, ...semanticIssues],
    injectedNodes: [],
    prunedNodes: [],
    orphansFixed: 0,
    tiersRepaired,
  };

  const diagnostics: PipelineDiagnostics = {
    style: stylePlan?.style ?? 'generic',
    productionDepth: stylePlan?.productionDepth ?? 'conceptual',
    semanticIssues,
    mechanicalRepairs,
    removedInvalidEdgeIds,
    rejectedAutoInjection: true,
    removedExistingNodeIds: removedExistingNodeIds.length > 0 ? removedExistingNodeIds : undefined,
  };

  logger.info(
    `[Validate] Final: ${finalNodes.length} nodes, ${validEdges.length} edges (mechanical: ${mechanicalRepairs.length}, semantic: ${semanticIssues.length})`
  );

  return {
    diagram: { nodes: finalNodes, edges: validEdges },
    feedback,
    diagnostics,
  };
}

/** Convert LLM flows to diagram edges (source of truth — no second edge pass). */
export function flowsToEdges(flows: RawFlow[]): DiagramEdge[] {
  const seen = new Map<string, DiagramEdge>();
  let edgeCounter = 0;

  for (const flow of flows) {
    if (flow.path.length < 2) continue;

    for (let i = 0; i < flow.path.length - 1; i++) {
      const source = flow.path[i];
      const target = flow.path[i + 1];
      if (!source || !target || source === target) continue;

      const key = `${source}->${target}->${flow.label || ''}`;

      if (!seen.has(key)) {
        const edge: DiagramEdge = {
          id: `edge-${source}-${target}-${edgeCounter++}`,
          source,
          target,
          label: flow.label || '',
          async: flow.async || false,
          communicationType: flow.communicationType,
          edgeVariant: flow.edgeVariant,
        };
        seen.set(key, edge);
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Strip reverse edges (B→A) where a forward edge (A→B) already exists between
 * nodes in DIFFERENT tiers. Cross-tier return edges are always architectural
 * violations — HTTP response cycles are implicit and should not be modelled.
 * Same-tier edges (two services calling each other) are left untouched.
 */
function pruneReverseEdges(
  edges: DiagramEdge[],
  nodes: RawNode[],
  issues: ValidationIssue[]
): DiagramEdge[] {
  const nodeLayerMap = new Map<string, string>();
  for (const n of nodes) {
    nodeLayerMap.set(n.id, normalizeLayerForPrune(n.layer));
  }

  // Build set of forward directions between different-tier pairs
  const forwardPairs = new Set<string>();
  for (const edge of edges) {
    const srcLayer = nodeLayerMap.get(edge.source) ?? 'application';
    const tgtLayer = nodeLayerMap.get(edge.target) ?? 'application';
    if (srcLayer !== tgtLayer) {
      forwardPairs.add(`${edge.source}->${edge.target}`);
    }
  }

  return edges.filter(edge => {
    const srcLayer = nodeLayerMap.get(edge.source) ?? 'application';
    const tgtLayer = nodeLayerMap.get(edge.target) ?? 'application';
    // Only prune cross-tier edges; same-tier edges are fine either direction
    if (srcLayer === tgtLayer) return true;
    // If the reverse direction already exists as a forward pair, this is a return edge — drop it
    const reverseKey = `${edge.target}->${edge.source}`;
    if (forwardPairs.has(reverseKey)) {
      issues.push({
        severity: 'warning',
        type: 'pruned_reverse_edge' as any,
        message: `Removed reverse edge ${edge.source}→${edge.target} (return path — implicit in HTTP cycle).`,
      });
      return false;
    }
    return true;
  });
}

function normalizeLayerForPrune(layer?: string): string {
  if (!layer) return 'application';
  if (layer === 'presentation') return 'client';
  if (layer === 'compute') return 'application';
  if (layer === 'async') return 'queue';
  if (layer === 'observe') return 'observability';
  return layer;
}

function repairNodeData(
  nodes: RawNode[],
  issues: ValidationIssue[],
  tiersRepaired: string[]
): RawNode[] {
  return nodes.map((node) => {
    const repaired = { ...node };

    if (!repaired.layer) {
      repaired.layer = inferLayerFromLabel(repaired.label) as PipelineLayer;
      tiersRepaired.push(repaired.id);
      issues.push({
        severity: 'warning',
        type: 'missing_layer',
        nodeId: repaired.id,
        message: `Node '${repaired.label || repaired.id}' lacked a layer; assigned '${repaired.layer}' via alias normalization.`,
      });
    } else {
      repaired.layer = normalizeLayerAlias(repaired.layer) as PipelineLayer;
    }

    if (!repaired.label || repaired.label.trim() === '') {
      repaired.label = generateLabelFromId(repaired.id);
      issues.push({
        severity: 'warning',
        type: 'missing_label',
        nodeId: repaired.id,
        message: `Node '${repaired.id}' was missing a label.`,
      });
    }

    if (!repaired.icon) {
      repaired.icon = getIconForType(repaired.serviceType || repaired.layer);
    }

    return repaired;
  });
}

function ensureNodeIdentity(nodes: RawNode[], issues: ValidationIssue[]): RawNode[] {
  const seenIds = new Map<string, number>();

  return nodes.map((node, idx) => {
    let id = node.id;
    if (!id || id.trim() === '') {
      id = `node-${idx}-${Date.now()}`;
      issues.push({
        severity: 'warning',
        type: 'missing_id',
        nodeId: id,
        message: `A node was missing an ID and was assigned '${id}'.`,
      });
    }

    const count = seenIds.get(id) || 0;
    seenIds.set(id, count + 1);

    if (count > 0) {
      const newId = `${id}-${count + 1}`;
      issues.push({
        severity: 'warning',
        type: 'duplicate_id',
        nodeId: newId,
        message: `Duplicate ID '${id}' renamed to '${newId}'.`,
      });
      return { ...node, id: newId };
    }

    return { ...node, id };
  });
}

function repairEdgesMechanical(
  edges: DiagramEdge[],
  nodes: RawNode[],
  issues: ValidationIssue[]
): { edges: DiagramEdge[]; removedIds: string[] } {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const validEdges: DiagramEdge[] = [];
  const seen = new Set<string>();
  const removedIds: string[] = [];

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      removedIds.push(edge.id);
      issues.push({
        severity: 'warning',
        type: 'dangling_edge',
        message: `Edge ${edge.source}->${edge.target} referenced a missing node and was removed.`,
      });
      continue;
    }

    const key = `${edge.source}->${edge.target}->${edge.label || ''}`;
    if (seen.has(key)) continue;

    seen.add(key);
    validEdges.push(edge);
  }

  return { edges: validEdges, removedIds };
}

function checkEdgeLabelQuality(
  edges: DiagramEdge[],
  nodes: RawNode[],
  mechanical: ValidationIssue[],
  semantic: ValidationIssue[]
): void {
  const blocklist = [
    'connects to',
    'requests',
    'emits telemetry',
    'calls',
    'uses',
    'integrates with',
    'linked to',
    'associated with',
    'interacts with',
    'talks to',
  ];

  for (const edge of edges) {
    const label = (edge.label || '').toLowerCase().trim();
    if (!label) {
      semantic.push({
        severity: 'warning',
        type: 'empty_edge_label',
        message: `Edge ${edge.source}->${edge.target} has no label.`,
      });
      continue;
    }
    if (blocklist.includes(label)) {
      semantic.push({
        severity: 'warning',
        type: 'vague_edge_label',
        message: `Edge label '${edge.label}' is too generic.`,
      });
    }

    const isAsync = detectAsyncEdge(edge, nodes);
    edge.async = isAsync;
    edge.edgeVariant = isAsync ? 'dashed' : 'solid';
    edge.communicationType = isAsync ? 'async' : 'sync';
  }
}

function runSemanticValidation(
  nodes: RawNode[],
  edges: DiagramEdge[],
  ctx: {
    prompt?: string;
    preGenerationChecklist?: PreGenerationChecklist;
    stylePlan?: ArchitectureStylePlan;
    existingNodeIds?: string[];
    issues: ValidationIssue[];
  }
): void {
  const { issues } = ctx;

  reportOrphans(nodes, edges, issues);
  reportDisconnectedComponents(nodes, edges, issues);
  reportSuspiciousGenericNodes(nodes, ctx.prompt, ctx.stylePlan, issues);
  reportStyleMismatch(nodes, ctx.prompt, ctx.stylePlan, issues);

  if (ctx.prompt) {
    const storyIssues = diagnoseStoryIssues(nodes, edges, ctx.prompt);
    issues.push(...storyIssues);
  }

  validateChecklist(nodes, edges, ctx.preGenerationChecklist, issues);
  validateTerminalNodeReturnPaths(nodes, edges, issues);
  validateClientReturnFlows(nodes, edges, issues);
  validateCDNMisuse(nodes, edges, issues);
}

function reportOrphans(nodes: RawNode[], edges: DiagramEdge[], issues: ValidationIssue[]): void {
  const connected = new Set<string>();
  edges.forEach((e) => {
    connected.add(e.source);
    connected.add(e.target);
  });

  for (const node of nodes.filter((n) => !n.isGroup)) {
    if (!connected.has(node.id)) {
      issues.push({
        severity: 'warning',
        type: 'orphan_node',
        nodeId: node.id,
        message: `Node '${node.label || node.id}' has no connections (orphan).`,
      });
    }
  }
}

function reportDisconnectedComponents(
  nodes: RawNode[],
  edges: DiagramEdge[],
  issues: ValidationIssue[]
): void {
  const leafNodes = nodes.filter((n) => !n.isGroup);
  const adj = new Map<string, string[]>();
  leafNodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source)!.push(e.target);
      adj.get(e.target)!.push(e.source);
    }
  });

  const visited = new Set<string>();
  const components: string[][] = [];

  for (const node of leafNodes) {
    if (visited.has(node.id)) continue;
    const comp: string[] = [];
    const stack = [node.id];
    visited.add(node.id);
    while (stack.length > 0) {
      const curr = stack.pop()!;
      comp.push(curr);
      for (const neighbor of adj.get(curr) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          stack.push(neighbor);
        }
      }
    }
    components.push(comp);
  }

  if (components.length > 1) {
    issues.push({
      severity: 'warning',
      type: 'disconnected_components',
      message: `Diagram has ${components.length} disconnected component(s).`,
    });
  }
}

function dropOrphanNodesMechanical(
  nodes: RawNode[],
  edges: DiagramEdge[],
  issues: ValidationIssue[]
): RawNode[] {
  const connected = new Set<string>();
  edges.forEach((e) => {
    connected.add(e.source);
    connected.add(e.target);
  });

  const leafNodes = nodes.filter((n) => !n.isGroup);
  const orphanLeafIds = leafNodes.filter((n) => !connected.has(n.id)).map((n) => n.id);

  // Keep at least 1 node if the model produced a totally edge-less output;
  // higher-level quality gate / retries will handle that case.
  if (orphanLeafIds.length === leafNodes.length) return nodes;
  if (orphanLeafIds.length === 0) return nodes;

  orphanLeafIds.forEach((id) => {
    const n = nodes.find((x) => x.id === id);
    issues.push({
      severity: 'warning',
      type: 'dropped_orphan_node',
      nodeId: id,
      message: `Dropped orphan node '${n?.label || id}' because it had no flows.`,
    });
  });

  return nodes.filter((n) => n.isGroup || !orphanLeafIds.includes(n.id));
}

const GENERIC_TEMPLATE_PATTERNS = [
  /\bapi gateway\b/i,
  /\bload balancer\b/i,
  /\bcircuit breaker\b/i,
  /\bobservability\b/i,
  /\bdlq\b/i,
  /\bdead letter\b/i,
  /\bsecrets manager\b/i,
  /\bservice mesh\b/i,
];

const PRODUCTION_HARDENING = [
  'cdn',
  'load balancer',
  'api gateway',
  'circuit breaker',
  'observability',
  'dlq',
  'dead letter',
  'secrets manager',
  'service mesh',
  'ci/cd',
  'kubernetes',
];

function reportSuspiciousGenericNodes(
  nodes: RawNode[],
  prompt: string | undefined,
  stylePlan: ArchitectureStylePlan | undefined,
  issues: ValidationIssue[]
): void {
  const p = (prompt || '').toLowerCase();
  const allowProduction = stylePlan?.productionDepth === 'production';

  for (const node of nodes) {
    const text = `${node.label} ${node.subtitle || ''}`.toLowerCase();

    if (GENERIC_TEMPLATE_PATTERNS.some((rx) => rx.test(text))) {
      const mentioned = PRODUCTION_HARDENING.some((term) => p.includes(term) || text.includes(term));
      if (!allowProduction && !mentioned) {
        issues.push({
          severity: 'warning',
          type: 'generic_template_node',
          nodeId: node.id,
          message: `Node '${node.label}' looks like a generic production template component not requested in the prompt.`,
        });
      }
    }
  }
}

function reportStyleMismatch(
  nodes: RawNode[],
  prompt: string | undefined,
  stylePlan: ArchitectureStylePlan | undefined,
  issues: ValidationIssue[]
): void {
  if (!stylePlan || (stylePlan.style !== 'monolith' && stylePlan.style !== 'mvc')) return;

  const microserviceArtifacts = /\b(service mesh|per-service database|independent deploy)\b/i;
  const labels = nodes.map((n) => `${n.label} ${n.subtitle || ''}`).join(' ');

  if (microserviceArtifacts.test(labels) && !(prompt || '').match(/microservice|service mesh/i)) {
    issues.push({
      severity: 'warning',
      type: 'style_mismatch',
      message: `Diagram includes microservice-only artifacts but style is '${stylePlan.style}'.`,
    });
  }

  if (stylePlan.style === 'mvc') {
    const forbidden = ['lambda', 'sqs', 'kafka', 'api gateway', 'kubernetes', 'ecs'];
    for (const node of nodes) {
      const text = `${node.label} ${node.subtitle || ''}`.toLowerCase();
      if (forbidden.some((f) => text.includes(f))) {
        issues.push({
          severity: 'warning',
          type: 'style_mismatch',
          nodeId: node.id,
          message: `MVC diagram contains cloud/microservice node '${node.label}'.`,
        });
      }
    }
  }
}

function validateChecklist(
  nodes: RawNode[],
  edges: DiagramEdge[],
  checklist: PreGenerationChecklist | undefined,
  issues: ValidationIssue[]
): void {
  if (!checklist) return;

  const allText = [
    ...nodes.map((n) => `${n.label} ${n.subtitle || ''}`.toLowerCase()),
    ...edges.map((e) => (e.label || '').toLowerCase()),
  ].join(' ');

  if (checklist.humanActors && checklist.humanActors.length > 0) {
    const clientNodes = nodes.filter((n) => normalizeLayer(n.layer) === 'client');
    if (clientNodes.length < checklist.humanActors.length) {
      issues.push({
        severity: 'warning',
        type: 'missing_actors',
        message: `Checklist lists ${checklist.humanActors.length} human actor(s) but diagram has ${clientNodes.length} client node(s).`,
      });
    }
  }

  const checkFeature = (feature: string, category: string) => {
    const b = feature.toLowerCase().trim();
    if (!b) return;
    const words = b.split(' ');
    const hasMatch =
      words.some((w) => w.length > 3 && allText.includes(w)) || allText.includes(b);
    if (!hasMatch) {
      issues.push({
        severity: 'warning',
        type: 'missing_feature',
        message: `Feature '${feature}' (${category}) from checklist may be missing from the diagram.`,
      });
    }
  };

  checklist.dataStores?.forEach((f) => checkFeature(f, 'data store'));
  checklist.backgroundJobs?.forEach((f) => checkFeature(f, 'background job'));
  checklist.externalIntegrations?.forEach((f) => checkFeature(f, 'external integration'));
  checklist.featureRequirements?.forEach((f) => checkFeature(f, 'feature requirement'));
}

function validateTerminalNodeReturnPaths(
  nodes: RawNode[],
  edges: DiagramEdge[],
  issues: ValidationIssue[]
): void {
  const terminalTypes = ['cdn', 'recommend', 'notification', 'payment', 'email', 'search'];

  for (const node of nodes) {
    const text = `${node.label} ${node.subtitle || ''}`.toLowerCase();
    if (!terminalTypes.some((t) => text.includes(t))) continue;

    const hasReturnPath = edges.some((e) => {
      if (e.source !== node.id) return false;
      const target = nodes.find((n) => n.id === e.target);
      return target && ['client', 'gateway', 'edge'].includes(normalizeLayer(target.layer));
    });

    if (!hasReturnPath) {
      issues.push({
        severity: 'warning',
        type: 'missing_return_path',
        nodeId: node.id,
        message: `Node '${node.label}' has no return path toward client/gateway (diagnostic only).`,
      });
    }
  }
}

function validateClientReturnFlows(
  nodes: RawNode[],
  edges: DiagramEdge[],
  issues: ValidationIssue[]
): void {
  const clientNodes = nodes.filter((n) => normalizeLayer(n.layer) === 'client');

  for (const client of clientNodes) {
    const incomingEdges = edges.filter((e) => e.target === client.id);
    if (incomingEdges.length === 0) {
      issues.push({
        // 'info' not 'warning' — we intentionally do NOT model HTTP return paths.
        // Keeping this as 'warning' caused LLM retries that produced reverse edges.
        severity: 'info' as any,
        type: 'missing_client_return',
        nodeId: client.id,
        message: `Client '${client.label}' has no incoming edges (expected — return paths are implicit).`,
      });
    }
  }
}

function validateCDNMisuse(nodes: RawNode[], edges: DiagramEdge[], issues: ValidationIssue[]): void {
  const isCdn = (text: string) => /\bcdn\b|content delivery|cloudfront/i.test(text);
  const cdnNodes = nodes.filter((n) => isCdn(`${n.label} ${n.subtitle || ''}`));

  for (const cdn of cdnNodes) {
    for (const edge of edges.filter((e) => e.source === cdn.id)) {
      const target = nodes.find((n) => n.id === edge.target);
      if (!target) continue;
      const layer = normalizeLayer(target.layer);
      if (['application', 'compute', 'data', 'queue'].includes(layer)) {
        issues.push({
          severity: 'warning',
          type: 'cdn_misuse',
          nodeId: cdn.id,
          message: `CDN '${cdn.label}' routes to backend '${target.label}' (diagnostic only).`,
        });
      }
    }
  }
}

function enforceHierarchy(
  nodes: RawNode[],
  issues: ValidationIssue[],
  tiersRepaired: string[]
): RawNode[] {
  return nodes.map((node) => {
    if (node.layer) return { ...node, layer: normalizeLayerAlias(node.layer) as PipelineLayer };
    const inferredLayer = inferLayerFromLabel(node.label);
    if (!tiersRepaired.includes(node.id)) tiersRepaired.push(node.id);
    issues.push({
      severity: 'warning',
      type: 'missing_layer',
      nodeId: node.id,
      message: `Node '${node.label}' assigned layer '${inferredLayer}' via normalization.`,
    });
    return { ...node, layer: inferredLayer as PipelineLayer };
  });
}

function detectAsyncEdge(edge: DiagramEdge, nodes: RawNode[]): boolean {
  const label = (edge.label || '').toLowerCase();
  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);

  const sLayer = sourceNode?.layer?.toLowerCase() || '';
  const tLayer = targetNode?.layer?.toLowerCase() || '';
  const sLabel = sourceNode?.label?.toLowerCase() || '';
  const tLabel = targetNode?.label?.toLowerCase() || '';

  const isQueueLayer =
    sLayer === 'queue' || tLayer === 'queue' || sLayer === 'async' || tLayer === 'async';
  const hasQueueKeywords = [
    'queue',
    'kafka',
    'rabbitmq',
    'pubsub',
    'event',
    'stream',
    'broker',
    'sqs',
    'sns',
    'mqtt',
    'amqp',
  ].some((k) => sLabel.includes(k) || tLabel.includes(k) || label.includes(k));

  const hasAsyncKeywords = [
    'publish',
    'subscribe',
    'consume',
    'trigger',
    'background',
    'telemetry',
    'webhook',
    'async',
    'notify',
    'notification',
  ].some((k) => label.includes(k));

  return (
    isQueueLayer ||
    hasQueueKeywords ||
    hasAsyncKeywords ||
    edge.async === true ||
    edge.edgeVariant === 'dashed'
  );
}

function normalizeLayerAlias(layer: string): PipelineLayer {
  const normalized = normalizeLayer(layer);
  return normalized as PipelineLayer;
}

function inferLayerFromLabel(label: string): PipelineLayer {
  const l = label.toLowerCase();
  if (
    l.includes('client') ||
    l.includes('web') ||
    l.includes('mobile') ||
    l.includes('browser') ||
    l.includes('desktop') ||
    l.includes('user') ||
    l.includes('app')
  )
    return 'client';
  if (
    l.includes('cdn') ||
    l.includes('load balancer') ||
    l.includes('lb') ||
    l.includes('waf') ||
    l.includes('route 53') ||
    l.includes('dns') ||
    l.includes('cloudfront')
  )
    return 'edge';
  if (
    l.includes('gateway') ||
    l.includes('proxy') ||
    l.includes('ingress') ||
    l.includes('api gateway') ||
    l.includes('nginx') ||
    l.includes('kong')
  )
    return 'gateway';
  if (
    l.includes('database') ||
    l.includes('db') ||
    l.includes('storage') ||
    l.includes('s3') ||
    l.includes('postgres') ||
    l.includes('mysql') ||
    l.includes('mongo') ||
    l.includes('dynamo') ||
    l.includes('rds') ||
    l.includes('bucket')
  )
    return 'data';
  if (
    l.includes('queue') ||
    l.includes('kafka') ||
    l.includes('rabbitmq') ||
    l.includes('pubsub') ||
    l.includes('event') ||
    l.includes('topic') ||
    l.includes('sqs') ||
    l.includes('sns')
  )
    return 'queue';
  return 'application';
}

function normalizeLayer(layer?: string): string {
  if (!layer) return 'application';
  if (layer === 'presentation') return 'client';
  if (layer === 'compute') return 'application';
  if (layer === 'async') return 'queue';
  if (layer === 'observe') return 'observability';
  return layer;
}

function generateLabelFromId(id: string): string {
  return id
    .replace(/-/g, ' ')
    .replace(/group$/i, '')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getIconForType(type: string): string {
  const iconMap: Record<string, string> = {
    client: 'monitor',
    edge: 'globe',
    gateway: 'webhook',
    service: 'server',
    application: 'server',
    queue: 'message-square',
    async: 'message-square',
    cache: 'gauge',
    database: 'database',
    data: 'database',
    worker: 'hammer',
    cdn: 'globe',
    loadbalancer: 'sliders',
  };
  return iconMap[type.toLowerCase()] || 'box';
}

export function getLayerIndex(layer: string): number {
  const LAYER_ORDER: PipelineLayer[] = [
    'client',
    'edge',
    'gateway',
    'application',
    'queue',
    'data',
    'infrastructure',
    'observability',
    'external',
  ];
  const idx = LAYER_ORDER.indexOf(layer as PipelineLayer);
  return idx >= 0 ? idx : 2;
}
