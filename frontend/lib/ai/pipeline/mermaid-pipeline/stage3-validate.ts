import logger from '@/lib/logger';
import { parseMermaid, normalizeEdgeReferences, ParsedMermaid } from './mermaidParser';
import type { InventoryConfig, EdgeConfig } from './stage1-pregen';

export interface ValidationResult {
  isValid: boolean;
  repairInstructions?: string;
  parsed: ParsedMermaid;
  nodeIssues: string[];
  edgeIssues: string[];
  groupIssues: string[];
  bidiIssues: string[];
}

// Pre-check auto-correction for unknown edge IDs (D6)
function runMissingNodeReferencePreCheck(
  mermaidText: string,
  nodeIds: Set<string>
): { correctedText: string; warnings: string[]; errors: string[] } {
  const lines = mermaidText.split('\n');
  const warnings: string[] = [];
  const errors: string[] = [];
  
  const findClosestId = (unknownId: string) => {
    const lower = unknownId.toLowerCase();
    for (const id of nodeIds) {
      if (id.toLowerCase() === lower) return id;
      if (id.toLowerCase().includes(lower) || lower.includes(id.toLowerCase())) return id;
    }
    return null;
  };

  const correctedLines = lines.map(line => {
    const trimmed = line.trim();
    const hasArrow = /-->|<-->/.test(trimmed);
    const isDeclaration = /^subgraph\s|^graph\s|^flowchart\s|^end\s*$/.test(trimmed) || /\[/.test(trimmed);
    if (!hasArrow || isDeclaration) return line;

    // Match edge pattern: source arrow [label] target
    const match = trimmed.match(/^([a-zA-Z0-9_\-]+)\s*(<-->|-->)\s*(?:\|\"?[^\"]*\"?\|)?\s*([a-zA-Z0-9_\-]+)/i);
    if (match) {
      const source = match[1];
      const arrow = match[2];
      const target = match[3];
      let newSource = source;
      let newTarget = target;

      if (!nodeIds.has(source)) {
        const closest = findClosestId(source);
        if (closest) {
          newSource = closest;
          warnings.push(`[D6 Pre-check] Auto-correcting edge source ID "${source}" to closest match "${closest}"`);
        } else {
          errors.push(`Edge source "${source}" does not exist as a declared node ID.`);
        }
      }
      if (!nodeIds.has(target)) {
        const closest = findClosestId(target);
        if (closest) {
          newTarget = closest;
          warnings.push(`[D6 Pre-check] Auto-correcting edge target ID "${target}" to closest match "${closest}"`);
        } else {
          errors.push(`Edge target "${target}" does not exist as a declared node ID.`);
        }
      }

      if (newSource !== source || newTarget !== target) {
        return line.replace(source, newSource).replace(target, newTarget);
      }
    }
    return line;
  });

  return {
    correctedText: correctedLines.join('\n'),
    warnings,
    errors,
  };
}

export function validateMermaid(
  mermaidText: string,
  inventoryConfig: InventoryConfig,
  edgeConfig: EdgeConfig
): ValidationResult {
  const nodeIssues: string[] = [];
  const edgeIssues: string[] = [];
  const groupIssues: string[] = [];
  const bidiIssues: string[] = [];

  // Step 0: Normalize label→ID references before parsing (Fix 2 safety net)
  const initialParse = parseMermaid(mermaidText);
  const nodeIdMap = initialParse.nodes.map(n => ({ label: n.label, id: n.id }));
  let normalizedText = normalizeEdgeReferences(mermaidText, nodeIdMap);

  // Run the D6 pre-check to auto-correct edge IDs
  const nodeIds = new Set(initialParse.nodes.map(n => n.id));
  const preCheckResult = runMissingNodeReferencePreCheck(normalizedText, nodeIds);
  normalizedText = preCheckResult.correctedText;

  for (const warning of preCheckResult.warnings) {
    logger.warn(warning);
  }
  for (const error of preCheckResult.errors) {
    edgeIssues.push(error);
  }

  const parsed = parseMermaid(normalizedText);

  logger.log(`[Stage 3 Validator] Parsing Mermaid: ${parsed.nodes.length} nodes, ${parsed.subgraphs.length} subgraphs, ${parsed.edges.length} edges`);

  // Map inventory node names to parsed Mermaid node IDs using two-pass exact then loose matching
  const nameToIdMap = new Map<string, string>();
  const idToNameMap = new Map<string, string>();
  const matchedParsedNodeIds = new Set<string>();

  // Pass 1: Exact matches on label or ID
  for (const invNode of inventoryConfig.nodes) {
    const invNodeClean = invNode.toLowerCase().trim();
    const invNodeCleanId = invNodeClean.replace(/[^a-z0-9]/gi, '');
    
    const matched = parsed.nodes.find(n => {
      if (matchedParsedNodeIds.has(n.id)) return false;
      const labelClean = n.label.toLowerCase().trim();
      const idClean = n.id.toLowerCase().trim();
      return labelClean === invNodeClean || idClean === invNodeCleanId;
    });

    if (matched) {
      nameToIdMap.set(invNode, matched.id);
      idToNameMap.set(matched.id, invNode);
      matchedParsedNodeIds.add(matched.id);
    }
  }

  // Pass 2: Loose/Substring matches for remaining unmatched nodes
  for (const invNode of inventoryConfig.nodes) {
    if (nameToIdMap.has(invNode)) continue;

    const invNodeClean = invNode.toLowerCase().trim();
    const matched = parsed.nodes.find(n => {
      if (matchedParsedNodeIds.has(n.id)) return false;
      const labelClean = n.label.toLowerCase().trim();
      const subtitleClean = n.subtitle.toLowerCase().trim();
      return (
        labelClean.includes(invNodeClean) ||
        invNodeClean.includes(labelClean) ||
        subtitleClean === invNodeClean
      );
    });

    if (matched) {
      nameToIdMap.set(invNode, matched.id);
      idToNameMap.set(matched.id, invNode);
      matchedParsedNodeIds.add(matched.id);
    }
  }

  // --- CHECK C1: NODE COUNT & EXISTENCE ---
  const missingNodes: string[] = [];
  for (const invNode of inventoryConfig.nodes) {
    if (!nameToIdMap.has(invNode)) {
      missingNodes.push(invNode);
    }
  }

  if (missingNodes.length > 0) {
    const details = missingNodes.map(name => {
      const expectedId = name.replace(/[^a-zA-Z0-9]/g, '');
      return `"${name}" (expected ID: ${expectedId})`;
    }).join(', ');
    nodeIssues.push(`MISSING NODES: The following nodes from the inventory are missing in the diagram: ${details}. Please declare them inside their respective subgraphs.`);
  }

  if (parsed.nodes.length !== inventoryConfig.nodeCount) {
    nodeIssues.push(`NODE COUNT MISMATCH: Expected exactly ${inventoryConfig.nodeCount} nodes, but found ${parsed.nodes.length} nodes.`);
  }

  // --- CHECK C2: ZERO EDGES FOR MULTI-NODE ---
  if (parsed.edges.length === 0 && inventoryConfig.nodeCount > 1) {
    edgeIssues.push(`CRITICAL: Zero edges generated for multi-node diagram`);
  }

  // Check edge count matches expected edgeCount exactly (H7, A2.4)
  if (parsed.edges.length !== edgeConfig.edgeCount) {
    edgeIssues.push(`EDGE COUNT MISMATCH: Expected exactly ${edgeConfig.edgeCount} edges, but found ${parsed.edges.length} edges.`);
  }

  // --- CHECK C3: GROUP/SUBGRAPH COUNT ---
  const missingGroups: string[] = [];
  for (const invGroup of inventoryConfig.groups) {
    const groupClean = invGroup.toLowerCase().trim();
    const matched = parsed.subgraphs.some(s => {
      const idClean = s.id.toLowerCase();
      const labelClean = s.label.toLowerCase();
      return (
        idClean.includes(groupClean) ||
        groupClean.includes(idClean) ||
        labelClean.includes(groupClean) ||
        groupClean.includes(labelClean)
      );
    });

    if (!matched) {
      missingGroups.push(invGroup);
    }
  }

  if (missingGroups.length > 0) {
    groupIssues.push(`MISSING GROUPS: The following groups/subgraphs are missing: ${missingGroups.map(g => `"${g}"`).join(', ')}. Declare these subgraphs and nest the appropriate nodes within them.`);
  }

  if (parsed.subgraphs.length !== inventoryConfig.groups.length) {
    groupIssues.push(`SUBGRAPH COUNT MISMATCH: Expected ${inventoryConfig.groups.length} subgraphs/groups, but found ${parsed.subgraphs.length}.`);
  }

  // --- CHECK C3.5: EDGE COMPLETENESS ---
  const missingEdgesList: Array<{ from: string; to: string; label: string; bidirectional: boolean }> = [];
  for (const invEdge of edgeConfig.edges) {
    const fromId = nameToIdMap.get(invEdge.from);
    const toId = nameToIdMap.get(invEdge.to);

    if (fromId && toId) {
      const edgeExists = parsed.edges.some(e => 
        (e.source === fromId && e.target === toId) ||
        (e.source === toId && e.target === fromId)
      );
      if (!edgeExists) {
        missingEdgesList.push(invEdge);
      }
    } else {
      missingEdgesList.push(invEdge);
    }
  }

  if (missingEdgesList.length > 0) {
    const edgeDetails = missingEdgesList.map(e => {
      const fromId = nameToIdMap.get(e.from) || e.from.replace(/[^a-zA-Z0-9]/g, '');
      const toId = nameToIdMap.get(e.to) || e.to.replace(/[^a-zA-Z0-9]/g, '');
      return `  - ${fromId} ${e.bidirectional ? '<-->' : '-->'} ${toId} (${fromId} is the ID for "${e.from}", ${toId} is the ID for "${e.to}")`;
    }).join('\n');
    edgeIssues.push(`MISSING EDGES: The following connections are missing: \n${edgeDetails}\nPlease add these edges connecting the correct node IDs.`);
  }

  // --- CHECK C4: ORPHAN NODES ---
  const orphanIds: string[] = [];
  const connectedNodeIds = new Set<string>();
  for (const edge of parsed.edges) {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  }

  for (const node of parsed.nodes) {
    if (!connectedNodeIds.has(node.id)) {
      orphanIds.push(node.id);
    }
  }

  if (orphanIds.length > 0) {
    const orphanDetails = orphanIds.map(id => {
      const n = parsed.nodes.find(node => node.id === id);
      return `'${n?.label || id}' (id: ${id})`;
    }).join(', ');
    edgeIssues.push(`ORPHAN NODES DETECTED: The following nodes have zero connections: ${orphanDetails}. Every node must appear in at least one edge flow. Please connect them.`);
  }

  // --- CHECK C5 & C6: EDGE SOURCE/TARGET EXISTENCE ---
  const edgeRefErrors: string[] = [];
  for (const edge of parsed.edges) {
    if (!nodeIds.has(edge.source)) {
      edgeRefErrors.push(`Edge source "${edge.source}" does not exist as a declared node ID.`);
    }
    if (!nodeIds.has(edge.target)) {
      edgeRefErrors.push(`Edge target "${edge.target}" does not exist as a declared node ID.`);
    }
  }

  // Quoted labels in edges check
  const rawEdgePattern = /\s*"([^"]+)"\s*(?:-->|<-->)\s*"([^"]+)"\s*/g;
  let rawMatch: RegExpExecArray | null;
  const rawEdgeErrors: string[] = [];
  while ((rawMatch = rawEdgePattern.exec(normalizedText)) !== null) {
    const [, srcLabel, tgtLabel] = rawMatch;
    if (srcLabel && tgtLabel) {
      const srcMatch = parsed.nodes.find(n => n.label.toLowerCase() === srcLabel.toLowerCase());
      const tgtMatch = parsed.nodes.find(n => n.label.toLowerCase() === tgtLabel.toLowerCase());
      const srcHint = srcMatch ? ` (node ID: ${srcMatch.id})` : ` (no matching node found for "${srcLabel}")`;
      const tgtHint = tgtMatch ? ` (node ID: ${tgtMatch.id})` : ` (no matching node found for "${tgtLabel}")`;
      rawEdgeErrors.push(`Edge uses quoted label "${srcLabel}" instead of bare node ID. Replace with: ${srcMatch?.id || '?'} --> ${tgtMatch?.id || '?'}${srcHint}${tgtHint}`);
    }
  }

  if (edgeRefErrors.length > 0) {
    edgeIssues.push(`EDGE REFERENCE ERRORS:\n${edgeRefErrors.map(e => `  - ${e}`).join('\n')}`);
  }

  if (rawEdgeErrors.length > 0) {
    edgeIssues.push(`QUOTED LABEL IN EDGE (must use bare node IDs):\n${rawEdgeErrors.map(e => `  - ${e}`).join('\n')}`);
  }

  // --- CHECK C7: BIDIRECTIONAL EDGE SPECIFICATIONS ---
  // Deleted (bidirectional edge count mismatch check is no longer active)

  // --- CHECK C8, C9, C10, C11: ARCHITECTURAL ACCURACY ---
  const gatewayNodeIds = new Set<string>();
  const clientNodeIds = new Set<string>();
  const internalNodeIds = new Set<string>();

  const isClientName = (name: string) => /client|mobile|web.?app|browser|ios|android/i.test(name);
  const isGatewayName = (name: string) => /gateway|load.?balancer|cdn|proxy|ingress|nginx|kong/i.test(name);
  const isServerReplica = (name: string) => /server\s*[a-z0-9]|replica\s*[a-z0-9]|instance\s*[a-z0-9]/i.test(name);

  for (const node of parsed.nodes) {
    const parentGroup = parsed.subgraphs.find(s => s.id === node.parentId || s.nodeIds.includes(node.id));
    const parentLabel = parentGroup ? parentGroup.label : '';
    const parentId = parentGroup ? parentGroup.id : '';

    const isClient = isClientName(node.id) || isClientName(node.label) || isClientName(parentLabel) || isClientName(parentId);
    const isGateway = isGatewayName(node.id) || isGatewayName(node.label);

    if (isClient) {
      clientNodeIds.add(node.id);
    } else if (isGateway) {
      gatewayNodeIds.add(node.id);
    } else {
      internalNodeIds.add(node.id);
    }
  }

  for (const edge of parsed.edges) {
    // Check C8: Gateway Bypass
    if (gatewayNodeIds.size > 0 && clientNodeIds.has(edge.source) && internalNodeIds.has(edge.target)) {
      edgeIssues.push(`GATEWAY BYPASS: Client node "${edge.source}" connects directly to internal node "${edge.target}" bypassing the gateway/load balancer. Re-route this request from "${edge.source}" to the gateway/load balancer first, then to the target service.`);
    }

    // Check C9: Reverse Client Flow
    if (clientNodeIds.has(edge.target) && !clientNodeIds.has(edge.source)) {
      edgeIssues.push(`REVERSE FLOW: Internal node "${edge.source}" has an arrow pointing back to client node "${edge.target}". Clients are sources, never sinks, and cannot receive direct incoming connections. Push notification / WebSocket updates must route through a gateway or Push/WebSocket server. Delete this reverse edge.`);
    }

    // Check C11: Replica Chaining
    if (isServerReplica(edge.source) && isServerReplica(edge.target)) {
      edgeIssues.push(`REPLICA CHAINING: Server replica "${edge.source}" connects directly to another replica "${edge.target}". Server replicas in a load-balanced pool should be independent and receive traffic directly from the gateway/load balancer, not chain requests between each other. Please delete this horizontal edge.`);
    }
  }

  // Check C10: Disconnected Gateway
  for (const gwId of gatewayNodeIds) {
    const hasOutgoing = parsed.edges.some(e => e.source === gwId && (internalNodeIds.has(e.target) || gatewayNodeIds.has(e.target)));
    if (!hasOutgoing && parsed.edges.some(e => e.target === gwId)) {
      const gwNode = parsed.nodes.find(n => n.id === gwId);
      edgeIssues.push(`DISCONNECTED GATEWAY: Gateway/Load Balancer node "${gwNode?.label || gwId}" receives requests but does not route them to any backend services/servers. Add edges from "${gwId}" to the appropriate internal services.`);
    }
  }


  const allIssues = [...nodeIssues, ...edgeIssues, ...groupIssues, ...bidiIssues];
  const isValid = allIssues.length === 0;

  // PRIORITIZED SEQUENTIAL REPAIR INSTRUCTIONS (E8)
  let repairInstructions: string | undefined = undefined;
  if (!isValid) {
    if (nodeIssues.length > 0) {
      repairInstructions = nodeIssues.join('\n\n');
    } else if (groupIssues.length > 0) {
      repairInstructions = groupIssues.join('\n\n');
    } else if (edgeIssues.length > 0) {
      repairInstructions = edgeIssues.join('\n\n');
    } else if (bidiIssues.length > 0) {
      repairInstructions = bidiIssues.join('\n\n');
    }
  }

  return {
    isValid,
    repairInstructions,
    parsed,
    nodeIssues,
    edgeIssues,
    groupIssues,
    bidiIssues,
  };
}
