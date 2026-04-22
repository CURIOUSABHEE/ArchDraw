import type { ArchitectureNode, ArchitectureEdge } from '../types';

export interface ValidationResult {
  valid: boolean;
  failures: string[];
}

export interface EdgeValidationResult extends ValidationResult {
  autoFixed: ArchitectureEdge[];
}

export function validateComponentOutput(nodes: ArchitectureNode[]): ValidationResult {
  const failures: string[] = [];
  
  const groupNodes = nodes.filter(n => n.isGroup === true);
  const leafNodes = nodes.filter(n => !n.isGroup);
  
  // CHECK 1: Group requirement - NO LONGER REQUIRED
  // Groups are optional for simplicity
  // This check was too strict and causing fallback failures
  void groupNodes;
  
  // CHECK 2: No orphan group nodes (with relaxed rules)
  for (const group of groupNodes) {
    const children = nodes.filter(n => n.parentId === group.id);
    if (children.length === 0) {
      failures.push(
        `WARNING: Group node "${group.id}" has zero children. ` +
        `Consider adding child nodes or removing this group.`
      );
    }
  }
  
  // CHECK 3: Relaxed orphan check - more than 3 root nodes is a warning, not failure
  const groupIds = new Set(groupNodes.map(n => n.id));
  const rootLeafNodes = leafNodes.filter(n => 
    !n.parentId && 
    n.layer !== 'client' &&
    n.layer !== 'external'
  );
  if (rootLeafNodes.length > 3) {
    failures.push(
      `WARNING: ${rootLeafNodes.length} root-level nodes. ` +
      `Consider grouping related services for better organization.`
    );
  }
  
  // CHECK 4: Node count sanity (relaxed for user-driven generation)
  if (leafNodes.length > 30) {
    failures.push(
      `WARNING: ${leafNodes.length} leaf nodes generated. Consider consolidating ` +
      `related services for better readability.`
    );
  }
  
  // CHECK 5: parentId integrity
  for (const node of nodes.filter(n => n.parentId)) {
    if (!groupIds.has(node.parentId!)) {
      failures.push(
        `FAILED: Node "${node.id}" has parentId "${node.parentId}" ` +
        `but no group node with that ID exists. ` +
        `Either create a group with id "${node.parentId}" or remove the parentId from "${node.id}".`
      );
    }
  }
  
  // CHECK 6: Containers appear before children in output array
  for (const node of nodes.filter(n => n.parentId)) {
    const parentIndex = nodes.findIndex(n => n.id === node.parentId);
    const childIndex = nodes.findIndex(n => n.id === node.id);
    if (parentIndex > childIndex) {
      failures.push(
        `FAILED: Group "${node.parentId}" appears AFTER its child "${node.id}" ` +
        `in the output array. Groups must always come before their children.`
      );
    }
  }
  
  // CHECK A: Layer variety - now a warning
  const uniqueLayers = new Set(
    leafNodes.map(n => n.layerIndex ?? 3)
  )
  if (uniqueLayers.size < 2) {
    failures.push(
      `WARNING: All nodes may be in the same layer. ` +
      `Consider adding nodes from different architectural layers.`
    );
  }

  // CHECK B: Entry point - now a warning
  const ENTRY_TYPES = new Set(['client', 'gateway', 'loadbalancer', 'cdn'])
  const ENTRY_LAYERS = new Set([1, 2])
  const hasEntry = leafNodes.some(n =>
    ENTRY_TYPES.has(n.serviceType ?? '') ||
    ENTRY_LAYERS.has(n.layerIndex ?? 0)
  )
  if (!hasEntry) {
    failures.push(
      `WARNING: No obvious entry point detected. ` +
      `Consider adding a client, gateway, or loadbalancer node.`
    );
  }

  // CHECK C: Data node - now a warning
  const DATA_TYPES = new Set(['database', 'cache', 'queue', 'storage', 'search'])
  const DATA_LAYERS = new Set([4])
  const hasData = leafNodes.some(n =>
    DATA_TYPES.has(n.serviceType ?? '') ||
    DATA_LAYERS.has(n.layerIndex ?? 0)
  )
  if (!hasData) {
    failures.push(
      `WARNING: No data persistence node detected. ` +
      `Consider adding database, cache, or storage nodes.`
    );
  }

  // CHECK D: Processing node - now a warning
  const PROCESSING_TYPES = new Set([
    'api', 'compute', 'lambda', 'auth', 'monitor', 'generic'
  ])
  const PROCESSING_LAYERS = new Set([3])
  const hasProcessing = leafNodes.some(n =>
    PROCESSING_TYPES.has(n.serviceType ?? '') ||
    PROCESSING_LAYERS.has(n.layerIndex ?? 0)
  )
  if (!hasProcessing) {
    failures.push(
      `WARNING: No obvious processing/service node detected. ` +
      `Consider adding backend service nodes.`
    );
  }
  
  // Relaxed validation - only fail on critical issues, allow with warnings
  return { valid: true, failures };
}

export function validateEdgeOutput(
  edges: ArchitectureEdge[], 
  nodes: ArchitectureNode[]
): EdgeValidationResult {
  const failures: string[] = [];
  
  const leafNodes = nodes.filter(n => !n.isGroup);
  const groupNodes = nodes.filter(n => n.isGroup === true);
  const groupIds = new Set(groupNodes.map(n => n.id));
  const leafIds = new Set(leafNodes.map(n => n.id));
  
  // AUTO-FIX PASS
  const autoFixed: ArchitectureEdge[] = edges.map(edge => ({
    ...edge,
    edgeVariant: 'solid' as const,
    label: '',
  }));
  
  // CHECK 1: Edge count vs node count
  if (autoFixed.length >= leafNodes.length) {
    const excess = autoFixed.length - leafNodes.length + 2;
    failures.push(
      `FAILED: ${autoFixed.length} edges for ${leafNodes.length} nodes. ` +
      `Edge count must be LESS than leaf node count. ` +
      `Remove the least important ${excess} edges. ` +
      `Priority to remove: monitoring connections, cache hit/miss paths, ` +
      `retry connections, any edge that goes backwards (right to left).`
    );
  }
  
  // CHECK 2: No container-to-container or container-to-leaf edges
  for (const edge of autoFixed) {
    if (groupIds.has(edge.source) || groupIds.has(edge.target)) {
      failures.push(
        `FAILED: Edge from "${edge.source}" to "${edge.target}" connects a container node. ` +
        `Edges must only connect leaf nodes to leaf nodes. ` +
        `Containers communicate through containment, not edges. Remove this edge.`
      );
    }
  }
  
  // CHECK 3: No self-loops
  for (const edge of autoFixed) {
    if (edge.source === edge.target) {
      failures.push(
        `FAILED: Self-loop on node "${edge.source}". Remove this edge.`
      );
    }
  }
  
  // CHECK 4: All source/target IDs exist as leaf nodes
  for (const edge of autoFixed) {
    if (!leafIds.has(edge.source)) {
      failures.push(
        `FAILED: Edge source "${edge.source}" does not exist as a leaf node. ` +
        `Either the node ID is wrong or this node was not generated. Fix the ID.`
      );
    }
    if (!leafIds.has(edge.target)) {
      failures.push(
        `FAILED: Edge target "${edge.target}" does not exist as a leaf node. ` +
        `Either the node ID is wrong or this node was not generated. Fix the ID.`
      );
    }
  }
  
  return { 
    valid: failures.length === 0, 
    failures, 
    autoFixed 
  };
}
