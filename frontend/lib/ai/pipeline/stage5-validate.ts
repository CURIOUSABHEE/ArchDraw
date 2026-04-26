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

function isAbstractLayerNode(node: RawNode): boolean {
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

  // ── CHECK-DEDUP-ID: keep first occurrence ──
  const seenIds = new Set<string>();
  let workingNodes: RawNode[] = [];
  for (const node of parsed.nodes) {
    if (seenIds.has(node.id)) {
      console.log(`[Validate] Duplicate node ID ${node.id} removed`);
      continue;
    }
    seenIds.add(node.id);
    workingNodes.push({ ...node });
  }

  // ── CHECK-DEDUP-LABEL: keep child over root ──
  const labelMap = new Map<string, RawNode>();
  for (const node of workingNodes) {
    const key = node.label.trim().toLowerCase();
    if (!key) continue;

    const existing = labelMap.get(key);
    if (!existing) {
      labelMap.set(key, node);
      continue;
    }

    const existingIsChild = Boolean(existing.parentId);
    const incomingIsChild = Boolean(node.parentId);
    const existingIsGroup = existing.isGroup === true;
    const incomingIsGroup = node.isGroup === true;

    // Keep child over root (child wins)
    if (!existingIsChild && incomingIsChild) {
      console.log(`[Validate] Label duplicate "${node.label}" — removed root ${existing.id}, kept child ${node.id}`);
      labelMap.set(key, node);
      continue;
    }

    // Keep first group if both groups
    if (existingIsGroup && incomingIsGroup) {
      console.log(`[Validate] Label duplicate "${node.label}" — kept first group ${existing.id}, removed ${node.id}`);
      continue;
    }

    console.log(`[Validate] Label duplicate "${node.label}" — kept ${existing.id}, removed ${node.id}`);
  }
  workingNodes = Array.from(labelMap.values());

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

  // ── CHECK-SINGLE-CHILD-GROUPS: remove group and ungroup child ──
  const groupsWithOneChild = new Set<string>();
  for (const group of nonEmptyNodes.filter(n => n.isGroup === true)) {
    const children = nonEmptyNodes.filter(n => n.parentId === group.id);
    if (children.length === 1) {
      groupsWithOneChild.add(group.id);
      console.log(`[Validate] Group ${group.id} has exactly 1 child — removing group and ungrouping ${children[0].id}`);
    }
  }

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
        if (parentLabel && (nodeLabel === parentLabel || nodeLabel.includes(parentLabel) || parentLabel.includes(nodeLabel))) {
          console.log(`[Validate] Removed label-duplicate child ${node.id} matching group ${parentGroup.id} ("${node.label}" matches "${parentGroup.groupLabel || parentGroup.label}")`);
          continue;
        }
      }
    }

    // Check 2: ANY non-group node whose label matches any group name
    if (allGroupNames.has(nodeLabel) || [...allGroupNames].some(gn => nodeLabel.includes(gn) || gn.includes(nodeLabel))) {
      console.log(`[Validate] Removed node ${node.id} — label "${node.label}" duplicates a group name`);
      continue;
    }

    cleanedNodes.push(node);
  }

  // ── CHECK-FLOW-TOKENS: drop group IDs from paths, drop invalid tokens ──
  const validNodeIds = new Set(cleanedNodes.map(n => n.id));
  const finalGroupIds = new Set(cleanedNodes.filter(n => n.isGroup === true).map(n => n.id));
  const validFlows: RawFlow[] = [];
  for (const flow of flows) {
    const filteredPath = flow.path.filter(token => {
      if (finalGroupIds.has(token)) {
        console.log(`[Validate] Flow contains group token ${token} — removed token`);
        return false;
      }
      if (!validNodeIds.has(token)) {
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
  const edgeMap = new Map<string, DiagramEdge>();
  for (const edge of builtEdges) {
    const key = `${edge.source}->${edge.target}`;
    if (edgeMap.has(key)) {
      console.log(`[Validate] Duplicate edge ${edge.source}->${edge.target} removed`);
      continue;
    }
    edgeMap.set(key, edge);
  }
  const edges = Array.from(edgeMap.values());

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
      if (!edgeMap.has(edgeKey)) {
        const edgeId = `${src}-${tgt}`;
        edges.push({
          id: edgeId,
          source: src,
          target: tgt,
          label: undefined,
          async: false,
        });
        edgeMap.set(edgeKey, edges[edges.length - 1]);
        connectedNodes.add(node.id);
        console.log(`[Validate] Orphan node ${node.id} connected to ${nearest.id}`);
      }
    }
  }

  // ── Final safety: drop any edges that reference nodes not in cleanedNodes ──
  const finalEdges = edges.filter(edge => {
    if (!validNodeIds.has(edge.source) || !validNodeIds.has(edge.target)) {
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
