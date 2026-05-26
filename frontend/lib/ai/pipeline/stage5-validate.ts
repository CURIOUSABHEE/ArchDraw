import type { RawNode, RawFlow, DiagramEdge, ValidatedDiagram, PipelineLayer, ValidationFeedback, ValidationIssue, PreGenerationChecklist } from './types';
import { ensurePromptRequiredNodes, prunePromptIrrelevantNodes, repairStoryEdges } from './storyGuard';

/**
 * STAGE 5 — VALIDATION
 * 
 * RULES:
 * 1. Preserve all nodes
 * 2. Ensure all nodes are connected (no orphans)
 * 3. Maintain proper 3-column layer structure (presentation, application, data)
 * 4. Remove duplicate edges
 * 5. Fix missing node data
 */

const LAYER_ORDER: PipelineLayer[] = ['client', 'edge', 'gateway', 'application', 'queue', 'data', 'infrastructure', 'observability', 'external'];

/**
 * Main validation function - ensures connectivity and proper layer structure
 */
export function validateAndRepair(parsed: { nodes: RawNode[]; flows: RawFlow[] }, prompt?: string, preGenerationChecklist?: PreGenerationChecklist): { diagram: ValidatedDiagram; feedback: ValidationFeedback } {
  const issues: ValidationIssue[] = [];
  const injectedNodes: string[] = [];
  const prunedNodes: string[] = [];
  let orphansFixed = 0;
  const tiersRepaired: string[] = [];

  // Track pruned nodes
  const pruned = prunePromptIrrelevantNodes([...parsed.nodes], prompt);
  const prunedIds = new Set(pruned.map(n => n.id));
  parsed.nodes.forEach(n => {
    if (!prunedIds.has(n.id)) {
      prunedNodes.push(n.id);
      issues.push({ severity: 'warning', type: 'pruned_node', nodeId: n.id, message: `Node '${n.label || n.id}' was pruned because it was irrelevant to the requested architecture.` });
    }
  });

  // Track injected nodes
  let nodes = ensurePromptRequiredNodes(pruned, prompt);
  nodes.forEach(n => {
    if (!prunedIds.has(n.id)) {
      injectedNodes.push(n.id);
      issues.push({ severity: 'critical', type: 'injected_node', nodeId: n.id, message: `Required node '${n.label}' was missing and had to be injected based on the requested domain.` });
    }
  });

  console.log(`[Validate] Starting with ${nodes.length} nodes and ${parsed.flows.length} flows`);

  // STEP 1: Parse flows into edges
  const edges = flowsToEdges(parsed.flows);
  console.log(`[Validate] Parsed ${edges.length} edges from flows`);

  // STEP 2: Fix nodes with missing data
  nodes = repairNodeData(nodes, issues, tiersRepaired);

  // STEP 3: Ensure all nodes have valid IDs and labels
  nodes = ensureNodeIdentity(nodes, issues);

  // STEP 4: Remove duplicate edges
  const deduplicatedEdges = repairEdges(edges, nodes, issues);
  
  // STEP 4.1: Deduplicate Client Nodes
  nodes = deduplicateClients(nodes, deduplicatedEdges, issues);
  
  // STEP 4.1.5: Deduplicate Concept Nodes
  nodes = deduplicateConceptNodes(nodes, deduplicatedEdges, issues);
  
  // STEP 4.2: Inject API Gateway if missing
  nodes = injectGatewayIfMissing(nodes, deduplicatedEdges, issues, injectedNodes);
  
  const repairedEdges = repairStoryEdges(nodes, deduplicatedEdges, prompt);
  // Find difference to log edges removed by storyGuard
  const dedupedIds = new Set(deduplicatedEdges.map(e => e.id));
  const repairedIds = new Set(repairedEdges.map(e => e.id));
  deduplicatedEdges.forEach(e => {
    if (!repairedIds.has(e.id)) {
      issues.push({ severity: 'warning', type: 'invalid_edge', message: `Edge from '${e.source}' to '${e.target}' was removed because it violates architectural rules.` });
    }
  });

  // STEP 4.3: Edge Label Quality
  checkEdgeLabelQuality(repairedEdges, nodes, issues);

  // STEP 4.4: Checklist and Role validation
  validateChecklist(nodes, repairedEdges, preGenerationChecklist, issues);
  
  // STEP 4.5: Return path validations
  validateTerminalNodeReturnPaths(nodes, repairedEdges, issues);
  validateClientReturnFlows(nodes, repairedEdges, issues);
  validateCDNMisuse(nodes, repairedEdges, issues);

  // STEP 5: Connect orphaned nodes/clusters (ensure no disconnected sub-graphs)
  const connectedEdges = bridgeConnectedComponents(nodes, repairedEdges, issues);
  orphansFixed = connectedEdges.length - repairedEdges.length;

  // STEP 6: Ensure minimum structure
  const { nodes: enrichedNodes, edges: enrichedEdges } = enrichDiagram(nodes, connectedEdges);

  // STEP 7: Enforce granular layer structure
  const finalNodes = enforceHierarchy(enrichedNodes, issues, tiersRepaired);

  console.log(`[Validate] Final: ${finalNodes.length} nodes and ${enrichedEdges.length} edges`);

  // Calculate score
  let score = 100;
  issues.forEach(issue => {
    if (issue.severity === 'critical') score -= 15;
    if (issue.severity === 'warning') score -= 5;
  });
  score = Math.max(0, score);
  
  const isValid = issues.filter(i => i.severity === 'critical').length === 0;

  const feedback: ValidationFeedback = {
    isValid,
    score,
    issues,
    injectedNodes,
    prunedNodes,
    orphansFixed,
    tiersRepaired
  };

  return { diagram: { nodes: finalNodes, edges: enrichedEdges }, feedback };
}

/**
 * Convert flows to edges
 */
function flowsToEdges(flows: RawFlow[]): DiagramEdge[] {
  const seen = new Map<string, DiagramEdge>();
  let edgeCounter = 0;

  for (const flow of flows) {
    if (flow.path.length < 2) continue;
    
    for (let i = 0; i < flow.path.length - 1; i++) {
      const source = flow.path[i];
      const target = flow.path[i + 1];
      if (!source || !target || source === target) continue;

      // Key includes label to allow multiple edges between same nodes with different labels
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
 * Fix nodes with missing data
 */
function repairNodeData(nodes: RawNode[], issues: ValidationIssue[], tiersRepaired: string[]): RawNode[] {
  return nodes.map(node => {
    const repaired = { ...node };

    // Fix missing layer
    if (!repaired.layer) {
      repaired.layer = inferLayerFromLabel(repaired.label) as PipelineLayer;
      tiersRepaired.push(repaired.id);
      issues.push({ severity: 'warning', type: 'missing_layer', nodeId: repaired.id, message: `Node '${repaired.label || repaired.id}' lacked a layer and was automatically assigned to '${repaired.layer}'. Ensure every node specifies a correct layer.` });
      console.log(`[Validate] Repaired missing layer for "${repaired.label}" → ${repaired.layer}`);
    }

    // Fix missing label
    if (!repaired.label || repaired.label.trim() === '') {
      repaired.label = generateLabelFromId(repaired.id);
      issues.push({ severity: 'warning', type: 'missing_label', nodeId: repaired.id, message: `Node '${repaired.id}' was missing a label. It must have a descriptive label.` });
      console.log(`[Validate] Repaired missing label for "${repaired.id}" → "${repaired.label}"`);
    }

    // Fix missing icon
    if (!repaired.icon) {
      repaired.icon = getIconForType(repaired.serviceType || repaired.layer);
    }

    return repaired;
  });
}

/**
 * Ensure all nodes have valid IDs and labels
 */
function ensureNodeIdentity(nodes: RawNode[], issues: ValidationIssue[]): RawNode[] {
  const seenIds = new Map<string, number>();

  return nodes.map((node, idx) => {
    let id = node.id;
    if (!id || id.trim() === '') {
      id = `node-${idx}-${Date.now()}`;
      issues.push({ severity: 'warning', type: 'missing_id', nodeId: id, message: `A node was missing an ID and had to be assigned '${id}'. Every node must have a valid ID.` });
      console.log(`[Validate] Generated ID for node ${idx}: "${id}"`);
    }

    const count = seenIds.get(id) || 0;
    seenIds.set(id, count + 1);

    if (count > 0) {
      const newId = `${id}-${count + 1}`;
      issues.push({ severity: 'warning', type: 'duplicate_id', nodeId: newId, message: `Node had a duplicate ID '${id}' and was renamed to '${newId}'.` });
      console.log(`[Validate] Renamed duplicate ID "${id}" to "${newId}"`);
      return { ...node, id: newId };
    }

    return { ...node, id };
  });
}

/**
 * Remove duplicate edges
 */
function repairEdges(edges: DiagramEdge[], nodes: RawNode[], issues: ValidationIssue[]): DiagramEdge[] {
  const nodeIds = new Set(nodes.map(n => n.id));
  
  const validEdges: DiagramEdge[] = [];
  const seen = new Set<string>();

  for (const edge of edges) {
    // Remove edges pointing to non-existent nodes
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      issues.push({ severity: 'warning', type: 'dangling_edge', message: `Edge from '${edge.source}' to '${edge.target}' references a non-existent node and was removed.` });
      console.log(`[Validate] Edge ${edge.source}->${edge.target} references non-existent node, removing`);
      continue;
    }

    // Only deduplicate if same source, target, AND label
    const key = `${edge.source}->${edge.target}->${edge.label || ''}`;
    if (seen.has(key)) {
      console.log(`[Validate] Duplicate edge removed: ${edge.source}->${edge.target} [${edge.label}]`);
      continue;
    }

    seen.add(key);
    validEdges.push(edge);
  }

  return validEdges;
}

/**
 * Connect disconnected sub-graphs and orphaned clusters using DFS
 */
function bridgeConnectedComponents(nodes: RawNode[], edges: DiagramEdge[], issues: ValidationIssue[]): DiagramEdge[] {
  const connectedEdges = [...edges];
  const leafNodes = nodes.filter(n => !n.isGroup);
  
  const adj = new Map<string, string[]>();
  leafNodes.forEach(n => adj.set(n.id, []));
  connectedEdges.forEach(e => {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source)!.push(e.target);
      adj.get(e.target)!.push(e.source);
    }
  });
  
  const visited = new Set<string>();
  const components: string[][] = [];
  
  for (const node of leafNodes) {
    if (!visited.has(node.id)) {
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
  }
  
  if (components.length <= 1) return connectedEdges;
  
  components.sort((a, b) => b.length - a.length);
  const mainComponent = new Set(components[0]);
  
  for (let i = 1; i < components.length; i++) {
    const compNodes = components[i];
    const isCluster = compNodes.length > 1;
    
    if (isCluster) {
      issues.push({ severity: 'critical', type: 'orphan_cluster', message: `Diagram has an isolated cluster of ${compNodes.length} nodes. All flows must connect to a single entry point.` });
    } else {
      issues.push({ severity: 'critical', type: 'orphan_node', nodeId: compNodes[0], message: `Node '${compNodes[0]}' had zero connections (it was an orphan).` });
    }
    
    const compNodeObjs = compNodes.map(id => nodes.find(n => n.id === id)!).filter(Boolean);
    compNodeObjs.sort((a, b) => getLayerRank(a.layer) - getLayerRank(b.layer));
    const entryNode = compNodeObjs[0];
    
    let partnerNode: RawNode | undefined;
    let isOrphanSource = true;
    let edgeLabel = 'connects to';
    
    const orphanLayer = entryNode.layer || 'application';
    const mainNodes = Array.from(mainComponent).map(id => nodes.find(n => n.id === id)!).filter(Boolean);
    
    if (orphanLayer === 'client' || orphanLayer === 'presentation') {
      partnerNode = mainNodes.find(n => ['gateway', 'edge', 'application', 'compute'].includes(n.layer));
      isOrphanSource = true; edgeLabel = 'requests';
    } else if (orphanLayer === 'edge' || orphanLayer === 'gateway') {
      partnerNode = mainNodes.find(n => ['application', 'compute'].includes(n.layer));
      isOrphanSource = true; edgeLabel = 'routes to';
    } else {
      partnerNode = mainNodes.find(n => ['application', 'compute'].includes(n.layer));
      isOrphanSource = false; edgeLabel = 'integrates with';
    }
    
    if (!partnerNode) partnerNode = mainNodes[0];
    
    if (partnerNode) {
      const source = isOrphanSource ? entryNode.id : partnerNode.id;
      const target = isOrphanSource ? partnerNode.id : entryNode.id;
      connectedEdges.push({
        id: `auto-bridge-${source}-${target}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        source,
        target,
        label: edgeLabel,
        async: false,
      });
      compNodes.forEach(id => mainComponent.add(id));
    }
  }
  
  return connectedEdges;
}

function deduplicateClients(nodes: RawNode[], edges: DiagramEdge[], issues: ValidationIssue[]): RawNode[] {
  const clientNodes = nodes.filter(n => normalizeLayer(n.layer) === 'client');
  if (clientNodes.length <= 1) return nodes;

  // We should only deduplicate if the prompt didn't explicitly ask for multiple actors.
  // This will be handled partly by validateChecklist, but for auto-repair, we keep all clients for now 
  // UNLESS they literally have the exact same generic name.
  const uniqueLabels = new Set();
  const toMerge = new Set<string>();
  
  for (const client of clientNodes) {
    const norm = client.label.toLowerCase().trim();
    if (uniqueLabels.has(norm) || norm === 'user' || norm === 'client') {
      toMerge.add(client.id);
    } else {
      uniqueLabels.add(norm);
    }
  }

  if (toMerge.size === 0) return nodes;

  const primaryClient = clientNodes.find(n => !toMerge.has(n.id)) || clientNodes[0];
  toMerge.delete(primaryClient.id); // ensure primary isn't merged into itself

  if (toMerge.size > 0) {
    issues.push({ severity: 'warning', type: 'duplicate_client_node', message: `Found duplicate generic client nodes. Merging them into a single entry point.` });
    
    edges.forEach(e => {
      if (toMerge.has(e.source)) e.source = primaryClient.id;
      if (toMerge.has(e.target)) e.target = primaryClient.id;
    });
  }

  return nodes.filter(n => !toMerge.has(n.id));
}

function deduplicateConceptNodes(nodes: RawNode[], edges: DiagramEdge[], issues: ValidationIssue[]): RawNode[] {
  const tiers = new Map<string, RawNode[]>();
  nodes.forEach(n => {
    const t = normalizeLayer(n.layer);
    if (!tiers.has(t)) tiers.set(t, []);
    tiers.get(t)!.push(n);
  });

  const duplicateIds = new Set<string>();

  for (const [tier, tierNodes] of tiers.entries()) {
    if (tierNodes.length < 2) continue;
    
    for (let i = 0; i < tierNodes.length; i++) {
      for (let j = i + 1; j < tierNodes.length; j++) {
        const a = tierNodes[i];
        const b = tierNodes[j];
        if (duplicateIds.has(a.id) || duplicateIds.has(b.id)) continue;
        
        const aNorm = a.label.toLowerCase();
        const bNorm = b.label.toLowerCase();
        
        const keywords = ['payment', 'email', 'cdn', 'cache', 'queue', 'auth', 'notification', 'search'];
        const sharedKeyword = keywords.find(k => aNorm.includes(k) && bNorm.includes(k));
        
        if (sharedKeyword) {
          if (aNorm.includes(bNorm) || bNorm.includes(aNorm)) {
            // Auto merge
            const aEdges = edges.filter(e => e.source === a.id || e.target === a.id).length;
            const bEdges = edges.filter(e => e.source === b.id || e.target === b.id).length;
            
            const survivor = aEdges >= bEdges ? a : b;
            const duplicate = aEdges >= bEdges ? b : a;
            
            duplicateIds.add(duplicate.id);
            edges.forEach(e => {
              if (e.source === duplicate.id) e.source = survivor.id;
              if (e.target === duplicate.id) e.target = survivor.id;
            });
            
            issues.push({ severity: 'warning', type: 'duplicate_concept_node', message: `Nodes '${a.label}' and '${b.label}' represent the same concept in the ${tier} tier. Merged into '${survivor.label}'.` });
          } else {
            issues.push({ severity: 'warning', type: 'duplicate_concept_node', message: `Nodes '${a.label}' and '${b.label}' may represent the same concept. Consider merging.` });
          }
        }
      }
    }
  }

  return nodes.filter(n => !duplicateIds.has(n.id));
}

function injectGatewayIfMissing(nodes: RawNode[], edges: DiagramEdge[], issues: ValidationIssue[], injectedNodes: string[]): RawNode[] {
  const clientNodes = nodes.filter(n => normalizeLayer(n.layer) === 'client');
  const appNodes = nodes.filter(n => normalizeLayer(n.layer) === 'application' || normalizeLayer(n.layer) === 'compute');
  const appNodeIds = new Set(appNodes.map(n => n.id));
  
  const hasGateway = nodes.some(n => normalizeLayer(n.layer) === 'gateway' || normalizeLayer(n.layer) === 'edge');
  if (hasGateway) return nodes;

  let needsGateway = false;
  for (const client of clientNodes) {
    let directAppConnections = 0;
    for (const edge of edges) {
      if (edge.source === client.id && appNodeIds.has(edge.target)) {
        directAppConnections++;
      }
    }
    if (directAppConnections >= 3) {
      needsGateway = true;
      break;
    }
  }

  if (needsGateway) {
    const gatewayId = `gateway-${Date.now()}`;
    const newGateway: RawNode = {
      id: gatewayId,
      label: 'API Gateway',
      layer: 'gateway',
      subtitle: 'Routes requests',
      icon: getIconForType('gateway'),
      serviceType: 'gateway' as any,
    };
    nodes.push(newGateway);
    injectedNodes.push(gatewayId);
    issues.push({ severity: 'critical', type: 'missing_gateway', message: `Client directly connects to 3+ services with no API Gateway. An API Gateway was injected.` });

    // Reroute client -> app edges through gateway
    const clientIds = new Set(clientNodes.map(n => n.id));
    const edgesToRemove = new Set<string>();
    
    edges.forEach(edge => {
      if (clientIds.has(edge.source) && appNodeIds.has(edge.target)) {
        edgesToRemove.add(edge.id);
        edges.push({
          id: `auto-gw-${edge.source}-${gatewayId}-${Date.now()}`,
          source: edge.source,
          target: gatewayId,
          label: 'requests API',
          async: false,
        });
        edges.push({
          id: `auto-gw-${gatewayId}-${edge.target}-${Date.now()}`,
          source: gatewayId,
          target: edge.target,
          label: edge.label || 'routes to',
          async: false,
        });
      }
    });

    // We can't actually remove from the array being iterated easily without filter,
    // so let's mutate in place
    for (let i = edges.length - 1; i >= 0; i--) {
      if (edgesToRemove.has(edges[i].id)) edges.splice(i, 1);
    }
  }

  return nodes;
}

function generateLabel(sourceNode: RawNode, targetNode: RawNode): string {
  const tType = normalizeLayer(targetNode.layer);
  const sText = sourceNode.label.toLowerCase();
  const tText = targetNode.label.toLowerCase();

  if (tType === 'data') {
    if (tText.includes('cache') || tText.includes('redis')) return 'cache read/write';
    if (tText.includes('storage') || tText.includes('blob') || tText.includes('bucket')) return 'read/write object';
    return 'read/write record';
  }
  if (tType === 'queue') {
    if (tText.includes('stream') || tText.includes('kafka')) return 'publishes event stream';
    return 'enqueues job';
  }
  if (tType === 'observability') return 'sends telemetry';
  if (tType === 'external') return 'calls external API';
  if (tType === 'application' || tType === 'gateway') {
    if (sText.includes('gateway')) return 'routes request';
    if (tText.includes('auth')) return 'authenticates';
    if (tText.includes('payment')) return 'process payment';
    if (tText.includes('notification') || tText.includes('email')) return 'sends notification';
    return 'rpc call';
  }
  return 'sends request';
}

function detectAsyncEdge(edge: DiagramEdge, nodes: RawNode[]): boolean {
  const label = (edge.label || '').toLowerCase();
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  
  const sLayer = sourceNode?.layer?.toLowerCase() || '';
  const tLayer = targetNode?.layer?.toLowerCase() || '';
  const sLabel = sourceNode?.label?.toLowerCase() || '';
  const tLabel = targetNode?.label?.toLowerCase() || '';
  
  const isQueueLayer = sLayer === 'queue' || tLayer === 'queue' || sLayer === 'async' || tLayer === 'async';
  const hasQueueKeywords = [
    'queue', 'kafka', 'rabbitmq', 'pubsub', 'event', 'stream', 'broker', 'nats', 'sqs', 'sns', 'mqtt', 'amqp'
  ].some(k => sLabel.includes(k) || tLabel.includes(k) || label.includes(k));
  
  const hasAsyncKeywords = [
    'publish', 'subscribe', 'consume', 'trigger', 'background', 'telemetry', 'webhook', 'async', 'notify', 'notification'
  ].some(k => label.includes(k));

  return isQueueLayer || hasQueueKeywords || hasAsyncKeywords || edge.async === true || edge.edgeVariant === 'dashed';
}

function cleanAndNormalizeEdgeLabel(label: string, sourceLabel: string, targetLabel: string): string {
  let cleaned = label.trim();
  
  // Strip quotes if any
  cleaned = cleaned.replace(/["']/g, '');

  const upperCleaned = cleaned.toUpperCase();

  // Banned exact generic labels or words
  const bannedGenerics = [
    "INTEGRATES WITH", "CONNECTS TO", "REQUESTS", "CALLS", "USES", 
    "TALKS TO", "INTERACTS WITH", "LINKED TO", "ASSOCIATED WITH", "CONNECTS"
  ];
  
  const isGeneric = !cleaned || bannedGenerics.includes(upperCleaned) || 
                    upperCleaned === "INTEGRATES" || upperCleaned === "REQUEST" || upperCleaned === "CALL";

  if (isGeneric) {
    // Generate a default label based on nodes
    const s = sourceLabel.toLowerCase();
    const t = targetLabel.toLowerCase();
    if (t.includes('database') || t.includes('db') || t.includes('postgres') || t.includes('mysql') || t.includes('rds') || t.includes('dynamo')) {
      cleaned = 'READ/WRITE SQL';
    } else if (t.includes('cache') || t.includes('redis')) {
      cleaned = 'CACHE READ/WRITE';
    } else if (t.includes('storage') || t.includes('s3') || t.includes('blob') || t.includes('bucket')) {
      cleaned = 'WRITE OBJECT';
    } else if (t.includes('queue') || t.includes('kafka') || t.includes('rabbitmq') || t.includes('sns') || t.includes('sqs') || t.includes('pubsub') || t.includes('message')) {
      cleaned = 'PUBLISH EVENT';
    } else if (t.includes('auth')) {
      cleaned = 'AUTHENTICATE';
    } else if (t.includes('payment') || t.includes('stripe')) {
      cleaned = 'PROCESS PAYMENT';
    } else if (t.includes('notification') || t.includes('email')) {
      cleaned = 'SEND EMAIL';
    } else {
      cleaned = 'CALL API';
    }
  } else {
    // Strip banned words or replace them
    cleaned = cleaned
      .replace(/\bintegrates with\b/gi, 'interfaces with')
      .replace(/\bconnects to\b/gi, 'routes to')
      .replace(/\brequests\b/gi, 'fetches')
      .replace(/\bcalls\b/gi, 'invokes');
  }

  // Enforce uppercase
  cleaned = cleaned.toUpperCase();

  // Enforce max 4 words
  const words = cleaned.split(/\s+/);
  if (words.length > 4) {
    cleaned = words.slice(0, 4).join(' ');
  }

  return cleaned;
}

function checkEdgeLabelQuality(edges: DiagramEdge[], nodes: RawNode[], issues: ValidationIssue[]) {
  const blocklist = ['connects to', 'requests', 'emits telemetry', 'calls', 'uses', 'integrates with', 'linked to', 'associated with', 'interacts with', 'talks to'];
  for (const edge of edges) {
    const srcNode = nodes.find(n => n.id === edge.source);
    const tgtNode = nodes.find(n => n.id === edge.target);
    const srcLabel = srcNode?.label || '';
    const tgtLabel = tgtNode?.label || '';

    const label = (edge.label || '').toLowerCase().trim();
    if (blocklist.includes(label) || !label) {
      issues.push({ severity: 'warning', type: 'vague_edge_label', message: `Edge label '${edge.label}' is too generic and has been auto-repaired.` });
    }

    edge.label = cleanAndNormalizeEdgeLabel(edge.label || '', srcLabel, tgtLabel);

    // Enforce async/dashed classification
    const isAsync = detectAsyncEdge(edge, nodes);
    edge.async = isAsync;
    edge.edgeVariant = isAsync ? 'dashed' : 'solid';
    edge.communicationType = isAsync ? 'async' : 'sync';
  }
}

function validateChecklist(nodes: RawNode[], edges: DiagramEdge[], checklist: PreGenerationChecklist | undefined, issues: ValidationIssue[]) {
  if (!checklist) return;
  
  const allText = [
    ...nodes.map(n => `${n.label} ${n.subtitle || ''}`.toLowerCase()),
    ...edges.map(e => (e.label || '').toLowerCase())
  ].join(' ');

  // 1. Check human actors
  if (checklist.humanActors && checklist.humanActors.length > 0) {
    const clientNodes = nodes.filter(n => normalizeLayer(n.layer) === 'client');
    if (clientNodes.length < checklist.humanActors.length) {
      issues.push({ severity: 'critical', type: 'missing_actors', message: `Prompt describes ${checklist.humanActors.length} distinct user roles but diagram has only ${clientNodes.length} client nodes. Missing roles may include: ${checklist.humanActors.join(', ')}.` });
    }
  }

  // 2. Check features
  const checkFeature = (feature: string, category: string) => {
    const b = feature.toLowerCase().trim();
    if (!b) return;
    const words = b.split(' ');
    const hasMatch = words.some(w => w.length > 3 && allText.includes(w)) || allText.includes(b);
    if (!hasMatch) {
      issues.push({ severity: 'critical', type: 'missing_feature', message: `Feature '${feature}' was identified in pre-generation checklist (${category}) but has no corresponding node or edge.` });
    }
  };

  checklist.dataStores?.forEach(f => checkFeature(f, 'data store'));
  checklist.backgroundJobs?.forEach(f => checkFeature(f, 'background job'));
  checklist.externalIntegrations?.forEach(f => checkFeature(f, 'external integration'));
  checklist.featureRequirements?.forEach(f => checkFeature(f, 'feature requirement'));
}

function validateTerminalNodeReturnPaths(nodes: RawNode[], edges: DiagramEdge[], issues: ValidationIssue[]) {
  const terminalTypes = ['cdn', 'recommend', 'notification', 'payment', 'email', 'search'];
  
  for (const node of nodes) {
    const text = `${node.label} ${node.subtitle || ''}`.toLowerCase();
    if (terminalTypes.some(t => text.includes(t))) {
      const outgoingEdges = edges.filter(e => e.source === node.id);
      
      let hasReturnPath = false;
      for (const edge of outgoingEdges) {
        const target = nodes.find(n => n.id === edge.target);
        if (target && (normalizeLayer(target.layer) === 'client' || normalizeLayer(target.layer) === 'gateway')) {
          hasReturnPath = true;
          break;
        }
      }
      
      if (!hasReturnPath) {
        issues.push({ severity: 'critical', type: 'missing_return_path', nodeId: node.id, message: `Node '${node.label}' is a user-facing service with no return path to client. Add an edge showing delivery back to the user or gateway.` });
      }
    }
  }
}

function validateClientReturnFlows(nodes: RawNode[], edges: DiagramEdge[], issues: ValidationIssue[]) {
  const clientNodes = nodes.filter(n => normalizeLayer(n.layer) === 'client');
  
  for (const client of clientNodes) {
    const incomingEdges = edges.filter(e => e.target === client.id);
    if (incomingEdges.length === 0) {
      issues.push({ severity: 'critical', type: 'missing_client_return', nodeId: client.id, message: `Client node '${client.label}' has no return paths. No service in the diagram delivers a response back to this client.` });
    }
  }
}

function validateCDNMisuse(nodes: RawNode[], edges: DiagramEdge[], issues: ValidationIssue[]) {
  const isCdn = (text: string) => /\bcdn\b|content delivery|akamai|cloudfront/i.test(text);
  const cdnNodes = nodes.filter(n => isCdn(`${n.label} ${n.subtitle || ''}`));
  
  for (const cdn of cdnNodes) {
    const outgoingEdges = edges.filter(e => e.source === cdn.id);
    for (const edge of outgoingEdges) {
      const target = nodes.find(n => n.id === edge.target);
      if (target) {
        const layer = normalizeLayer(target.layer);
        if (layer === 'application' || layer === 'compute' || layer === 'data' || layer === 'queue') {
          issues.push({ severity: 'critical', type: 'cdn_misuse', nodeId: cdn.id, message: `CDN node '${cdn.label}' routes to backend node '${target.label}'. CDNs must not act as API Gateways or proxy to application services.` });
        }
      }
    }
  }
}

/**
 * Ensure minimum diagram structure (non-destructive)
 */
function enrichDiagram(nodes: RawNode[], edges: DiagramEdge[]): { nodes: RawNode[]; edges: DiagramEdge[] } {
  // Completely non-destructive to avoid injecting unwanted default components
  return { nodes, edges };
}

/**
 * Enforce hierarchy - ensure nodes follow left-to-right flow
 */
function enforceHierarchy(nodes: RawNode[], issues: ValidationIssue[], tiersRepaired: string[]): RawNode[] {
  return nodes.map(node => {
    if (node.layer) return node;

    const inferredLayer = inferLayerFromLabel(node.label);
    if (!tiersRepaired.includes(node.id)) {
      tiersRepaired.push(node.id);
      issues.push({ severity: 'warning', type: 'missing_layer', nodeId: node.id, message: `Node '${node.label || node.id}' lacked a valid layer hierarchy and was assigned to '${inferredLayer}'. Ensure nodes follow the left-to-right tier rule.` });
    }
    console.log(`[Validate] Enforcing hierarchy: assigned "${node.label}" to layer "${inferredLayer}"`);
    return { ...node, layer: inferredLayer as PipelineLayer };
  });
}

// Helper functions

function inferLayerFromLabel(label: string): PipelineLayer {
  const l = label.toLowerCase();
  
  // Client tier
  if (l.includes('client') || l.includes('web') || l.includes('mobile') || l.includes('browser') || l.includes('desktop') || l.includes('user') || l.includes('app')) return 'client';
  
  // Edge tier
  if (l.includes('cdn') || l.includes('load balancer') || l.includes('lb') || l.includes('waf') || l.includes('route 53') || l.includes('dns') || l.includes('cloudfront')) return 'edge';
  
  // Gateway tier
  if (l.includes('gateway') || l.includes('proxy') || l.includes('ingress') || l.includes('api gateway') || l.includes('nginx') || l.includes('kong')) return 'gateway';
  
  // Data tier
  if (l.includes('database') || l.includes('db') || l.includes('storage') || l.includes('s3') || l.includes('postgres') || l.includes('mysql') || l.includes('mongo') || l.includes('dynamo') || l.includes('rds') || l.includes('bucket')) return 'data';
  
  // Queue tier
  if (l.includes('queue') || l.includes('kafka') || l.includes('rabbitmq') || l.includes('pubsub') || l.includes('event') || l.includes('topic') || l.includes('sqs') || l.includes('sns') || l.includes('redis')) return 'queue';
  
  // Application tier (default)
  return 'application';
}

function findDirectionalPartner(orphan: RawNode, nodes: RawNode[]): RawNode | undefined {
  const candidates = nodes.filter(n => !n.isGroup && n.id !== orphan.id);
  const orphanRank = getLayerRank(orphan.layer);
  const downstream = candidates
    .filter(candidate => getLayerRank(candidate.layer) >= orphanRank)
    .sort((a, b) => getLayerRank(a.layer) - getLayerRank(b.layer));
  const upstream = candidates
    .filter(candidate => getLayerRank(candidate.layer) < orphanRank)
    .sort((a, b) => getLayerRank(b.layer) - getLayerRank(a.layer));

  if (orphanRank === 0) return downstream.find(candidate => getLayerRank(candidate.layer) > orphanRank) || downstream[0];
  if (orphanRank >= 5) return upstream[0] || downstream[0];
  return downstream.find(candidate => getLayerRank(candidate.layer) > orphanRank) || upstream[0] || downstream[0];
}

function getLayerRank(layer?: string): number {
  const normalized = normalizeLayer(layer);
  const order = ['client', 'edge', 'gateway', 'application', 'queue', 'data', 'infrastructure', 'observability', 'external'];
  const idx = order.indexOf(normalized);
  return idx >= 0 ? idx : 3;
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
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getIconForType(type: string): string {
  const iconMap: Record<string, string> = {
    'client': 'monitor',
    'edge': 'globe',
    'gateway': 'webhook',
    'service': 'server',
    'application': 'server',
    'queue': 'message-square',
    'async': 'message-square',
    'cache': 'gauge',
    'database': 'database',
    'data': 'database',
    'worker': 'hammer',
    'cdn': 'globe',
    'loadbalancer': 'sliders',
  };
  return iconMap[type.toLowerCase()] || 'box';
}

function addMissingNodes(nodes: RawNode[]): RawNode[] {
  const result = [...nodes];
  
  const essentialLayers: PipelineLayer[] = ['client', 'gateway', 'application', 'data'];
  
  for (const layer of essentialLayers) {
    const count = result.filter(n => n.layer === layer).length;
    if (count === 0) {
      const newNode: RawNode = {
        id: `${layer}-${Date.now()}`,
        label: `${layer.charAt(0).toUpperCase() + layer.slice(1)} Component`,
        layer,
        icon: getIconForType(layer),
        serviceType: layer === 'application' ? 'service' : (layer === 'data' ? 'database' : layer) as any,
        subtitle: '',
      };
      result.push(newNode);
      console.log(`[Validate] Added missing node for layer: ${layer}`);
    }
  }

  return result;
}

function addMissingEdges(nodes: RawNode[], edges: DiagramEdge[]): DiagramEdge[] {
  const result = [...edges];
  
  // Connect layers in order
  for (let i = 0; i < LAYER_ORDER.length - 1; i++) {
    const srcLayer = LAYER_ORDER[i];
    const tgtLayer = LAYER_ORDER[i + 1];
    
    const sources = nodes.filter(n => n.layer === srcLayer);
    const targets = nodes.filter(n => n.layer === tgtLayer);
    
    if (sources.length > 0 && targets.length > 0) {
      const src = sources[0];
      const tgt = targets[0];
      
      const exists = result.some(e => e.source === src.id && e.target === tgt.id);
      if (!exists) {
        result.push({
          id: `auto-${src.id}-${tgt.id}`,
          source: src.id,
          target: tgt.id,
          label: 'connects to',
          async: false,
        });
      }
    }
  }

  return result;
}

export function getLayerIndex(layer: string): number {
  const idx = LAYER_ORDER.indexOf(layer as PipelineLayer);
  return idx >= 0 ? idx : 2; // default to 'application'
}
