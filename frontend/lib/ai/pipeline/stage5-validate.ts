import type { RawNode, RawFlow, DiagramEdge, ValidatedDiagram } from './types';

const LAYER_ORDER = ['presentation', 'gateway', 'application', 'async', 'data', 'observability', 'external'];

// Abstract layer patterns to filter out
const ABSTRACT_LAYER_PATTERNS = [
  /layer$/i,           // "Application Layer", "Data Layer"
  /^layer/i,            // "Layer Gateway"
  /tier$/i,             // "Application Tier", "Data Tier"
  /services$/i,         // "Backend Services", "API Services"
  /infrastructure/i,   // "Infrastructure"
  /system$/i,           // "System", "System Architecture"
  /architecture/i,     // "Architecture" (too abstract alone)
  /framework/i,         // "Framework"
  /platform$/i,         // "Platform" (unless specific like "AWS Platform")
];

const ABSTRACT_GENERIC_TERMS = [
  'backend', 'frontend', 'infrastructure', 'system',
  'platform', 'framework', 'application', 'data',
  'logic', 'tier', 'layer', 'services', 'mesh'
];

const LAYER_GROUP_META: Record<string, { label: string; groupLabel: string; color: string }> = {
  presentation: { label: 'Clients', groupLabel: 'CLIENTS', color: '#dbeafe' },
  gateway: { label: 'Gateway', groupLabel: 'GATEWAY', color: '#dcfce7' },
  application: { label: 'Services', groupLabel: 'SERVICES', color: '#fef3c7' },
  async: { label: 'Workers', groupLabel: 'WORKERS', color: '#fde68a' },
  data: { label: 'Storage', groupLabel: 'STORAGE', color: '#fce7f3' },
  observability: { label: 'Monitoring', groupLabel: 'MONITORING', color: '#e5e7eb' },
  external: { label: 'External', groupLabel: 'EXTERNAL', color: '#e2e8f0' },
};

const ZONE_LABEL_EXACT: Record<string, string[]> = {
  presentation: ['client', 'clients', 'frontend', 'presentation'],
  gateway: ['gateway', 'edge'],
  application: ['service', 'services', 'application', 'backend', 'compute'],
  async: ['async', 'workers', 'events'],
  data: ['data', 'storage'],
  observability: ['observability', 'monitoring'],
  external: ['external'],
};

const CONCRETE_COMPONENT_HINTS = [
  'api', 'app', 'service', 'server', 'gateway', 'load balancer', 'load-balancer', 'lb',
  'queue', 'worker', 'database', 'db', 'cache', 'redis', 'kafka', 'rabbitmq', 'cdn',
  'storage', 'bucket', 'postgres', 'mysql', 'mongo', 's3', 'drm', 'transcod', 'stream',
];

function isConcreteComponentLabel(label: string): boolean {
  const normalized = label.toLowerCase().trim();
  return CONCRETE_COMPONENT_HINTS.some((hint) => normalized.includes(hint));
}

function inferLayerFromZoneLabel(label: string): RawNode['layer'] | null {
  const normalized = label.toLowerCase().trim();
  
  // Only match VERY specific abstract zone names (exact matches only, no substrings)
  const exactZoneLabels: Record<string, string> = {
    'clients': 'presentation',
    'client': 'presentation',
    'gateway': 'gateway',
    'services': 'application',
    'service': 'application',
    'workers': 'async',
    'storage': 'data',
    'monitoring': 'observability',
    'external': 'external',
  };
  
  if (exactZoneLabels[normalized]) {
    return exactZoneLabels[normalized] as RawNode['layer'];
  }
  return null;
}

function asGroupId(id: string): string {
  return id.endsWith('-group') ? id : `${id}-group`;
}

function promoteAbstractZoneNodesToGroups(nodes: RawNode[]): RawNode[] {
  return nodes.map((node) => {
    if (node.isGroup || node.parentId) return node;
    if (isConcreteComponentLabel(node.label || '')) return node;

    const inferredLayer = inferLayerFromZoneLabel(node.label || '');
    if (!inferredLayer) return node;

    const meta = LAYER_GROUP_META[inferredLayer] || {
      label: node.label,
      groupLabel: node.label.toUpperCase(),
      color: '#e2e8f0',
    };

    return {
      ...node,
      id: asGroupId(node.id),
      label: meta.label,
      layer: inferredLayer,
      isGroup: true,
      groupLabel: meta.groupLabel,
      groupColor: meta.color,
      parentId: undefined,
    };
  });
}

function synthesizeMissingLayerGroups(nodes: RawNode[]): RawNode[] {
  const byLayer = new Map<RawNode['layer'], RawNode[]>();
  for (const node of nodes) {
    if (node.isGroup) continue;
    if (!byLayer.has(node.layer)) byLayer.set(node.layer, []);
    byLayer.get(node.layer)!.push(node);
  }

  const existingGroupLayers = new Set(nodes.filter((n) => n.isGroup).map((n) => n.layer));
  const syntheticGroups: RawNode[] = [];

  for (const [layer, members] of byLayer.entries()) {
    if (existingGroupLayers.has(layer)) continue;
    if (members.length < 2) continue;

    const meta = LAYER_GROUP_META[layer];
    if (!meta) continue;

    syntheticGroups.push({
      id: `${layer}-group`,
      label: meta.label,
      layer: layer as RawNode['layer'],
      isGroup: true,
      groupLabel: meta.groupLabel,
      groupColor: meta.color,
    });
  }

  if (syntheticGroups.length === 0) return nodes;
  return [...syntheticGroups, ...nodes];
}

function attachUngroupedNodesToLayerGroups(nodes: RawNode[]): RawNode[] {
  const groupsByLayer = new Map<RawNode['layer'], RawNode>();
  for (const group of nodes.filter((n) => n.isGroup)) {
    if (!groupsByLayer.has(group.layer)) {
      groupsByLayer.set(group.layer, group);
    }
  }

  return nodes.map((node) => {
    if (node.isGroup || node.parentId) return node;
    const group = groupsByLayer.get(node.layer);
    if (!group) return node;
    return { ...node, parentId: group.id };
  });
}

function isAbstractLayerNode(node: RawNode): boolean {
  if (node.isGroup) return false;
  const label = node.label?.trim() || '';
  const lowerLabel = label.toLowerCase();
  
  // Check against patterns
  for (const pattern of ABSTRACT_LAYER_PATTERNS) {
    if (pattern.test(label)) {
      return true;
    }
  }
  
  // Check for generic single terms
  if (ABSTRACT_GENERIC_TERMS.includes(lowerLabel)) {
    return true;
  }
  
  // Check for "X Services" without specific name (e.g., "Backend Services" but not "User Service")
  if (/^\w+\s+services$/i.test(label)) {
    return true;
  }
  
  return false;
}

function getLayerIndex(layer: string): number {
  const idx = LAYER_ORDER.indexOf(layer);
  return idx >= 0 ? idx : 3; // default to 'application' position
}

export function validateAndRepair(parsed: { nodes: RawNode[]; flows: RawFlow[] }): ValidatedDiagram {
  const flows = [...parsed.flows];
  
  // Build edges FIRST so we know what's connected
  const validEdges: DiagramEdge[] = [];
  const flowEdgeMap = new Map<string, DiagramEdge>();
  
  for (const flow of flows) {
    if (flow.path.length < 2) continue;
    for (let i = 0; i < flow.path.length - 1; i++) {
      const src = flow.path[i];
      const tgt = flow.path[i + 1];
      if (!src || !tgt || src === tgt) continue;
      const key = `${src}->${tgt}`;
      if (!flowEdgeMap.has(key)) {
        flowEdgeMap.set(key, {
          id: key,
          source: src,
          target: tgt,
          label: flow.label,
          async: flow.async,
        });
      }
    }
  }
  validEdges.push(...flowEdgeMap.values());

  // Build edges FIRST so we know what's connected
  const validNodeIds = new Set<string>();
  for (const edge of validEdges) {
    validNodeIds.add(edge.source);
    validNodeIds.add(edge.target);
  }

  // Keep only nodes that appear in flows - ignore orphans
  let workingNodes = parsed.nodes.filter(n => validNodeIds.has(n.id));

  // REMOVED: promoteAbstractZoneNodesToGroups - don't transform nodes, causes ID mismatches with flows
  // REMOVED: synthesizeMissingLayerGroups - creates empty groups that get removed
  // SIMPLIFIED: Just keep the nodes the LLM generated, attach to existing groups if any

  // Promote abstract zone nodes into real groups before abstract filtering.
  workingNodes = promoteAbstractZoneNodesToGroups(workingNodes);
  workingNodes = synthesizeMissingLayerGroups(workingNodes);
  workingNodes = attachUngroupedNodesToLayerGroups(workingNodes);

  // ── CHECK-ABSTRACT-LAYERS: filter out abstract layer/tier nodes ──
  let abstractFiltered: RawNode[] = [];
  for (const node of workingNodes) {
    if (isAbstractLayerNode(node)) {
      console.log(`[Validate] Abstract layer node "${node.label}" removed`);
    } else {
      abstractFiltered.push(node);
    }
  }
  workingNodes = abstractFiltered;

  // ── CHECK-ORPHAN-CHILDREN: strip parentId if parent group does not exist ──
  const groupIdsAfterDedup = new Set(workingNodes.filter(n => n.isGroup === true).map(n => n.id));
  workingNodes = workingNodes.map(node => {
    if (node.parentId && !groupIdsAfterDedup.has(node.parentId)) {
      console.log(`[Validate] Node ${node.id} has missing parent group ${node.parentId} — removing parentId`);
      return { ...node, parentId: undefined };
    }
    return node;
  });

  // ── CHECK-EMPTY-GROUPS: remove groups with 0 children ──
  const nonEmptyNodes = workingNodes.filter(node => {
    if (node.isGroup !== true) return true;
    const childCount = workingNodes.filter(n => n.parentId === node.id).length;
    if (childCount === 0) {
      console.log(`[Validate] Empty group ${node.id} removed`);
      return false;
    }
    return true;
  });

  // ── CHECK-SINGLE-CHILD-GROUPS: keep single-child groups (important for small diagrams) ──
  // Disabled - prefer keeping small groups over breaking structure
  const groupsWithOneChild = new Set<string>();

  const finalNodes = nonEmptyNodes
    .filter(node => !groupsWithOneChild.has(node.id))
    .map(node => {
      if (node.parentId && groupsWithOneChild.has(node.parentId)) {
        return { ...node, parentId: undefined };
      }
      return node;
    });

  // ── CHECK-LAYER-DUPLICATE-CHILD: remove child nodes whose label matches parent group label ──
  const groupMap = new Map<string, RawNode>();
  for (const node of finalNodes) {
    if (node.isGroup === true) {
      groupMap.set(node.id, node);
    }
  }

  // Build set of all group names (normalized) for broad matching
  const allGroupNames = new Set<string>();
  for (const group of groupMap.values()) {
    for (const raw of [group.label, group.groupLabel || '']) {
      const norm = (raw || '').toLowerCase().replace(/layer|zone|group/g, '').trim();
      if (norm) allGroupNames.add(norm);
    }
  }

  const cleanedNodes: RawNode[] = [];
  for (const node of finalNodes) {
    // Always keep group nodes
    if (node.isGroup === true) {
      cleanedNodes.push(node);
      continue;
    }

    const nodeLabel = (node.label || '')
      .toLowerCase()
      .replace(/layer|zone|group/g, '')
      .trim();

    if (!nodeLabel) {
      cleanedNodes.push(node);
      continue;
    }

    // Check 1: Child whose label matches its own parent group
    if (node.parentId) {
      const parentGroup = groupMap.get(node.parentId);
      if (parentGroup) {
        const parentLabel = ((parentGroup.groupLabel || parentGroup.label) || '')
          .toLowerCase()
          .replace(/layer|zone|group/g, '')
          .trim();
        if (parentLabel && nodeLabel === parentLabel) {
          console.log(`[Validate] Removed label-duplicate child ${node.id} matching group ${parentGroup.id} ("${node.label}" matches "${parentGroup.groupLabel || parentGroup.label}")`);
          continue;
        }
      }
    }

    // Check 2: ANY non-group node whose label matches any group name
    if (allGroupNames.has(nodeLabel)) {
      console.log(`[Validate] Removed node ${node.id} — label "${node.label}" duplicates a group name`);
      continue;
    }

    cleanedNodes.push(node);
  }

  // ── CHECK-FLOW-TOKENS: drop group IDs from paths, drop invalid tokens ──
  const finalNodeIds = new Set(cleanedNodes.map(n => n.id));
  const finalGroupIds = new Set(cleanedNodes.filter(n => n.isGroup === true).map(n => n.id));
  const validFlows: RawFlow[] = [];
  for (const flow of flows) {
    const filteredPath = flow.path.filter(token => {
      if (finalGroupIds.has(token)) {
        console.log(`[Validate] Flow contains group token ${token} — removed token`);
        return false;
      }
      if (!finalNodeIds.has(token)) {
        console.log(`[Validate] Flow token ${token} not found in nodes — removed token`);
        return false;
      }
      return true;
    });

    if (filteredPath.length >= 2) {
      validFlows.push({ ...flow, path: filteredPath });
    } else {
      console.log('[Validate] Flow dropped after token cleanup (path < 2)');
    }
  }

  // ── Build edges from flows ──
  const builtEdges: DiagramEdge[] = [];
  for (const flow of validFlows) {
    for (let i = 0; i < flow.path.length - 1; i++) {
      const source = flow.path[i];
      const target = flow.path[i + 1];
      if (!source || !target || source === target) continue;
      builtEdges.push({
        id: `${source}-${target}`,
        source,
        target,
        label: flow.label,
        async: flow.async,
      });
    }
  }

  // ── CHECK-EDGE-DEDUP: one edge per source→target pair ──
  const seenEdges = new Map<string, DiagramEdge>();
  for (const edge of builtEdges) {
    const key = `${edge.source}->${edge.target}`;
    if (seenEdges.has(key)) {
      console.log(`[Validate] Duplicate edge ${edge.source}->${edge.target} removed`);
      continue;
    }
    seenEdges.set(key, edge);
  }
  const edges = Array.from(seenEdges.values());

  // ── CHECK-ORPHANS: every non-group node must be in at least one edge ──
  // Connect orphans to the nearest CONNECTED node (not to other orphans)
  const connectedNodes = new Set<string>();
  for (const edge of edges) {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  }

  const leafNodes = cleanedNodes.filter(n => !n.isGroup);
  for (const node of leafNodes) {
    if (connectedNodes.has(node.id)) continue;

    // Find nearest already-connected node by layer proximity
    const nodeLayerIdx = getLayerIndex(node.layer);
    let nearest: RawNode | null = null;
    let nearestDist = Infinity;

    for (const other of leafNodes) {
      if (other.id === node.id) continue;
      if (!connectedNodes.has(other.id)) continue; // MUST connect to an already-connected node

      const otherLayerIdx = getLayerIndex(other.layer);
      const dist = Math.abs(otherLayerIdx - nodeLayerIdx);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = other;
      }
    }

    // If no connected node found (all nodes are orphans), connect to any other node
    if (!nearest) {
      for (const other of leafNodes) {
        if (other.id === node.id) continue;
        nearest = other;
        break;
      }
    }

    if (nearest) {
      // Determine direction: orphan → nearest if orphan is in an earlier layer
      const orphanIdx = getLayerIndex(node.layer);
      const nearIdx = getLayerIndex(nearest.layer);
      const [src, tgt] = orphanIdx <= nearIdx 
        ? [node.id, nearest.id] 
        : [nearest.id, node.id];
      
      const edgeKey = `${src}->${tgt}`;
      if (!edges.some(e => e.source === src && e.target === tgt)) {
        const edgeId = `${src}-${tgt}`;
        edges.push({
          id: edgeId,
          source: src,
          target: tgt,
          label: undefined,
          async: false,
        });
        connectedNodes.add(node.id);
        console.log(`[Validate] Orphan node ${node.id} connected to ${nearest.id}`);
      }
    }
  }

  // ── Final safety: drop any edges that reference nodes not in cleanedNodes ──
  const finalEdges = edges.filter(edge => {
    if (!finalNodeIds.has(edge.source) || !finalNodeIds.has(edge.target)) {
      console.log(`[Validate] Dropping dangling edge ${edge.source}->${edge.target}`);
      return false;
    }
    // Never include edges where source or target is a group
    if (finalGroupIds.has(edge.source) || finalGroupIds.has(edge.target)) {
      console.log(`[Validate] Dropping group edge ${edge.source}->${edge.target}`);
      return false;
    }
    return true;
  });

  // ── Warnings ──
  if (cleanedNodes.length < 12) {
    console.log(`[Validate] WARNING: only ${cleanedNodes.length} nodes generated — diagram may be sparse`);
  }
  if (finalEdges.length < 8) {
    console.log(`[Validate] WARNING: only ${finalEdges.length} edges generated — diagram may be disconnected`);
  }

  return { nodes: cleanedNodes, edges: finalEdges };
}
