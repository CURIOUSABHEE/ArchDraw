import type { RawNode, RawFlow, DiagramEdge, ValidatedDiagram } from './types';

const LAYER_ORDER = ['presentation', 'gateway', 'application', 'data', 'async', 'observability', 'external'];

function getLayerIndex(layer: string): number {
  return LAYER_ORDER.indexOf(layer);
}

function stringsEqual(a: string, b: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalize(a) === normalize(b);
}

export function validateAndRepair(parsed: { nodes: RawNode[]; flows: RawFlow[] }): ValidatedDiagram {
  const nodes = [...parsed.nodes];
  const flows = [...parsed.flows];

  // CHECK 1: Duplicate IDs
  const nodeMap = new Map<string, RawNode>();
  const toRemove = new Set<string>();

  for (const node of nodes) {
    const existing = nodeMap.get(node.id);
    if (existing) {
      // Keep the one with more fields
      const existingFields = Object.keys(existing).filter(k => existing[k as keyof RawNode]).length;
      const newFields = Object.keys(node).filter(k => node[k as keyof RawNode]).length;
      if (newFields > existingFields) {
        nodeMap.set(node.id, node);
      }
      toRemove.add(node.id);
      console.log(`[Validate] Duplicate node ID ${node.id} removed`);
    } else {
      nodeMap.set(node.id, node);
    }
  }

  const deduplicated = nodes.filter(n => !toRemove.has(n.id));

  // CHECK 2: Group integrity
  const groupIds = new Set(deduplicated.filter(n => n.isGroup).map(n => n.id));

  for (const node of deduplicated) {
    if (node.parentId && !groupIds.has(node.parentId)) {
      console.log(`[Validate] Node ${node.id} has parentId ${node.parentId} but group not found — removing parentId`);
      node.parentId = undefined;
    }
  }

  // Remove empty groups
  const groupNodeIds = new Set(deduplicated.filter(n => n.isGroup).map(n => n.id));
  const validNodes = deduplicated.filter(n => {
    if (n.isGroup) {
      const hasChildren = deduplicated.some(c => c.parentId === n.id);
      if (!hasChildren) {
        console.log(`[Validate] Empty group ${n.id} removed`);
        return false;
      }
    }
    return true;
  });

  // FIX 1: Remove single-child groups
  const finalNodes: RawNode[] = [];
  const groupsToRemove = new Set<string>();
  
  for (const node of validNodes) {
    if (node.isGroup) {
      const children = validNodes.filter(c => c.parentId === node.id);
      if (children.length === 1) {
        console.log(`[Validate] Group ${node.id} has only 1 child — ungrouping`);
        groupsToRemove.add(node.id);
        const child = children[0];
        finalNodes.push({ ...child, parentId: undefined });
      } else {
        finalNodes.push(node);
      }
    }
  }
  
  // Add non-group nodes that weren't already added (single children were added above)
  for (const node of validNodes) {
    if (!node.isGroup && !finalNodes.find(n => n.id === node.id)) {
      finalNodes.push(node);
    }
  }

  // CHECK 3: Flow ID validity
  const validNodeIds = new Set(finalNodes.map(n => n.id));
  const validFlows: RawFlow[] = [];

  for (const flow of flows) {
    // Filter out invalid and group IDs
    const validPath = flow.path.filter(id => {
      const isValid = validNodeIds.has(id);
      const isGroup = groupsToRemove.has(id);
      if (!isValid) {
        console.log(`[Validate] Flow path token ${id} not found in nodes — removing`);
      }
      if (isGroup) {
        console.log(`[Validate] Flow contains group node ${id} — removing from path`);
      }
      return isValid && !isGroup;
    });

    if (validPath.length >= 2) {
      validFlows.push({ ...flow, path: validPath });
    }
  }

  // CHECK 4: Build edges from flows
  const edgeMap = new Map<string, DiagramEdge>();
  const addedEdgeIds = new Set<string>();

  for (const flow of validFlows) {
    for (let i = 0; i < flow.path.length - 1; i++) {
      const source = flow.path[i];
      const target = flow.path[i + 1];

      // Skip if either is a group
      if (groupsToRemove.has(source) || groupsToRemove.has(target)) continue;

      const edgeId = `${source}-${target}`;
      if (!addedEdgeIds.has(edgeId)) {
        addedEdgeIds.add(edgeId);
        edgeMap.set(edgeId, {
          id: edgeId,
          source,
          target,
          label: flow.label,
          async: flow.async,
        });
      }
    }
  }

  const edges = Array.from(edgeMap.values());

  // CHECK 5: Orphan detection
  const connectedNodes = new Set<string>();
  for (const edge of edges) {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  }

  for (const node of finalNodes) {
    if (node.isGroup) continue;
    if (!connectedNodes.has(node.id)) {
      // Find nearest node by layer order
      const nodeLayerIdx = getLayerIndex(node.layer);
      let nearest: RawNode | null = null;
      let nearestIdx = Infinity;

      for (const other of finalNodes) {
        if (other.id === node.id || other.isGroup) continue;
        if (connectedNodes.has(other.id)) continue;

        const otherLayerIdx = getLayerIndex(other.layer);
        const dist = Math.abs(otherLayerIdx - nodeLayerIdx);
        if (dist < nearestIdx) {
          nearestIdx = dist;
          nearest = other;
        }
      }

      if (nearest) {
        const edgeId = `${node.id}-${nearest.id}`;
        edges.push({
          id: edgeId,
          source: node.id,
          target: nearest.id,
          label: 'synthetic',
          async: false,
        });
        connectedNodes.add(node.id);
        console.log(`[Validate] Orphan node ${node.id} connected to ${nearest.id}`);
      }
    }
  }

  // CHECK 6: Minimum counts warning
  if (finalNodes.length < 12) {
    console.log(`[Validate] WARNING: only ${finalNodes.length} nodes generated — diagram may be sparse`);
  }
  if (edges.length < 8) {
    console.log(`[Validate] WARNING: only ${edges.length} edges generated — diagram may be disconnected`);
  }

  return { nodes: finalNodes, edges };
}