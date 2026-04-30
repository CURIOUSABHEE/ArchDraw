import type { RawNode, RawFlow, DiagramEdge, ValidatedDiagram, PipelineLayer } from './types';

/**
 * STAGE 4/5 — NON-DESTRUCTIVE VALIDATION (REPAIR NOT REMOVE)
 * 
 * STRICT RULES:
 * 1. DO NOT DELETE NODES - Preserve all architectural components
 * 2. DO NOT DELETE GROUPS - If missing, CREATE them
 * 3. DO NOT DELETE EDGES BLINDLY - Only remove if same source+target+label
 * 4. PRESERVE HIERARCHY - Maintain parent-child relationships
 * 5. HANDLE NODE/GROUP NAME COLLISIONS - Keep BOTH
 * 6. REPAIR INSTEAD OF STRIP - Fix missing data, don't remove
 * 7. ENSURE MINIMUM STRUCTURE - Enrich, not shrink
 */

const LAYER_ORDER: PipelineLayer[] = ['presentation', 'gateway', 'application', 'async', 'data', 'observability', 'external'];

const LAYER_GROUP_META: Record<string, { label: string; groupLabel: string; color: string }> = {
  presentation: { label: 'Clients', groupLabel: 'CLIENTS', color: '#dbeafe' },
  gateway: { label: 'Gateway', groupLabel: 'GATEWAY', color: '#dcfce7' },
  application: { label: 'Services', groupLabel: 'SERVICES', color: '#fef3c7' },
  async: { label: 'Async', groupLabel: 'ASYNC', color: '#fde68a' },
  data: { label: 'Data', groupLabel: 'DATA', color: '#fce7f3' },
  observability: { label: 'Monitoring', groupLabel: 'MONITORING', color: '#e5e7eb' },
  external: { label: 'External', groupLabel: 'EXTERNAL', color: '#e2e8f0' },
};

/**
 * Main validation function - REPAIRS, never destructively removes
 */
export function validateAndRepair(parsed: { nodes: RawNode[]; flows: RawFlow[] }): ValidatedDiagram {
  let nodes = [...parsed.nodes];
  let flows = [...parsed.flows];

  console.log(`[Validate] Starting with ${nodes.length} nodes (${nodes.filter(n=>!n.isGroup).length} non-group) and ${flows.length} flows`);

  // STAGE 4: Parse flows into edges
  const edges = flowsToEdges(flows);
  console.log(`[Validate] Parsed ${edges.length} edges from flows`);

  // REPAIR 1: Fix nodes with missing data (don't remove them)
  nodes = repairNodeData(nodes);

  // REPAIR 2: Ensure all nodes have valid IDs and labels
  nodes = ensureNodeIdentity(nodes);

  // REPAIR 3: Handle missing groups - CREATE them, don't strip parentId
  nodes = ensureGroupsExist(nodes);

  // REPAIR 4: Fix parentId references (point to valid groups)
  nodes = repairParentReferences(nodes);

  // REPAIR 5: Handle node/group name collisions - KEEP BOTH
  // (No removal - this was removing valid nodes before)

  // REPAIR 6: Remove duplicate edges only if same source+target+label
  const repairedEdges = repairEdges(edges, nodes);

  // REPAIR 7: Connect orphaned nodes (don't remove them)
  const connectedEdges = connectOrphans(nodes, repairedEdges);

  // REPAIR 8: Ensure minimum structure
  const { nodes: enrichedNodes, edges: enrichedEdges } = enrichDiagram(nodes, connectedEdges);

  // REPAIR 9: Enforce structural hierarchy (left-to-right flow)
  const finalNodes = enforceHierarchy(enrichedNodes);

  console.log(`[Validate] Final: ${finalNodes.length} nodes (${finalNodes.filter(n=>!n.isGroup).length} non-group) and ${enrichedEdges.length} edges`);

  return { nodes: finalNodes, edges: enrichedEdges };
}

/**
 * Convert flows to edges
 */
function flowsToEdges(flows: RawFlow[]): DiagramEdge[] {
  const edges: DiagramEdge[] = [];
  const seen = new Map<string, DiagramEdge>();

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
          id: `edge-${source}-${target}-${i}`,
          source,
          target,
          label: flow.label || '',
          async: flow.async || false,
        };
        seen.set(key, edge);
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * REPAIR: Fix nodes with missing data instead of removing them
 */
function repairNodeData(nodes: RawNode[]): RawNode[] {
  return nodes.map(node => {
    const repaired = { ...node };

    // Fix missing layer
    if (!repaired.layer) {
      repaired.layer = inferLayerFromLabel(repaired.label) as PipelineLayer;
      console.log(`[Validate] Repaired missing layer for "${repaired.label}" → ${repaired.layer}`);
    }

    // Fix missing label
    if (!repaired.label || repaired.label.trim() === '') {
      repaired.label = generateLabelFromId(repaired.id);
      console.log(`[Validate] Repaired missing label for "${repaired.id}" → "${repaired.label}"`);
    }

    // Fix missing icon
    if (!repaired.icon) {
      repaired.icon = getIconForType(repaired.serviceType || repaired.layer);
    }

    // Ensure isGroup is boolean
    if (repaired.isGroup === undefined) {
      repaired.isGroup = false;
    }

    return repaired;
  });
}

/**
 * REPAIR: Ensure all nodes have valid IDs and labels
 */
function ensureNodeIdentity(nodes: RawNode[]): RawNode[] {
  return nodes.map((node, idx) => {
    if (!node.id || node.id.trim() === '') {
      const newId = `node-${idx}-${Date.now()}`;
      console.log(`[Validate] Generated ID for node ${idx}: "${newId}"`);
      return { ...node, id: newId };
    }
    return node;
  });
}

/**
 * REPAIR: Ensure groups exist for all layers that have children
 */
function ensureGroupsExist(nodes: RawNode[]): RawNode[] {
  const existingGroups = new Map<string, RawNode>();
  const nodesNeedingGroups: RawNode[] = [];

  // Find existing groups
  for (const node of nodes) {
    if (node.isGroup) {
      existingGroups.set(node.id, node);
      // Also index by layer
      if (node.layer) {
        existingGroups.set(`${node.layer}-group`, node);
      }
    }
  }

  // Find nodes that need groups (have parentId pointing to non-existent group, or have layer but no parent)
  const updatedNodes: RawNode[] = [];

  for (const node of nodes) {
    if (node.isGroup) {
      updatedNodes.push(node);
      continue;
    }

    // If node has parentId but group doesn't exist, we'll fix it later in repairParentReferences
    // If node has no parentId but has a layer, consider adding to a group
    if (!node.parentId && node.layer && !node.isGroup) {
      const expectedGroupId = `${node.layer}-group`;
      if (!existingGroups.has(expectedGroupId)) {
        // Create the missing group
        const meta = LAYER_GROUP_META[node.layer] || { label: node.layer, groupLabel: node.layer.toUpperCase(), color: '#e2e8f0' };
        const newGroup: RawNode = {
          id: expectedGroupId,
          label: meta.label,
          layer: node.layer as PipelineLayer,
          isGroup: true,
          groupLabel: meta.groupLabel,
          groupColor: meta.color,
        };
        updatedNodes.push(newGroup);
        existingGroups.set(expectedGroupId, newGroup);
        console.log(`[Validate] Created missing group: ${expectedGroupId} for layer ${node.layer}`);
      }
      // Assign node to group
      updatedNodes.push({ ...node, parentId: expectedGroupId });
    } else {
      updatedNodes.push(node);
    }
  }

  return updatedNodes;
}

/**
 * REPAIR: Fix parentId references to point to valid groups
 */
function repairParentReferences(nodes: RawNode[]): RawNode[] {
  const groupIds = new Set<string>();
  for (const node of nodes) {
    if (node.isGroup) {
      groupIds.add(node.id);
    }
  }

  return nodes.map(node => {
    if (!node.parentId) return node;

    // If parentId doesn't exist, try to find or create the group
    if (!groupIds.has(node.parentId)) {
      // Try to infer group from layer
      if (node.layer) {
        const expectedGroupId = `${node.layer}-group`;
        if (groupIds.has(expectedGroupId)) {
          console.log(`[Validate] Fixed parentId for ${node.id}: ${node.parentId} → ${expectedGroupId}`);
          return { ...node, parentId: expectedGroupId };
        }
        
        // Create the missing group
        const meta = LAYER_GROUP_META[node.layer] || { label: node.layer, groupLabel: node.layer.toUpperCase(), color: '#e2e8f0' };
        const newGroup: RawNode = {
          id: expectedGroupId,
          label: meta.label,
          layer: node.layer as PipelineLayer,
          isGroup: true,
          groupLabel: meta.groupLabel,
          groupColor: meta.color,
        };
        // We can't add to nodes array here, but we can change parentId
        // The group will be created in ensureGroupsExist
        console.log(`[Validate] Will create group ${expectedGroupId} for orphaned parentId ${node.parentId}`);
        return { ...node, parentId: expectedGroupId };
      }

      // Remove invalid parentId as last resort (not ideal, but prevents crashes)
      console.log(`[Validate] Stripping invalid parentId ${node.parentId} from node ${node.id}`);
      return { ...node, parentId: undefined };
    }

    return node;
  });
}

/**
 * REPAIR: Handle edges - only remove if same source+target+label
 */
function repairEdges(edges: DiagramEdge[], nodes: RawNode[]): DiagramEdge[] {
  const nodeIds = new Set(nodes.map(n => n.id));
  
  const validEdges: DiagramEdge[] = [];
  const seen = new Set<string>();

  for (const edge of edges) {
    // Remove edges pointing to non-existent nodes (but log them for debugging)
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
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
 * REPAIR: Connect orphaned nodes instead of removing them
 */
function connectOrphans(nodes: RawNode[], edges: DiagramEdge[]): DiagramEdge[] {
  const connectedNodes = new Set<string>();
  for (const edge of edges) {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  }

  const nonGroupNodes = nodes.filter(n => !n.isGroup);
  const newEdges = [...edges];

  for (const node of nonGroupNodes) {
    if (connectedNodes.has(node.id)) continue;

    // Find a node in the same or adjacent layer
    const nodeLayerIdx = LAYER_ORDER.indexOf(node.layer);
    let nearest: RawNode | null = null;
    let nearestDist = Infinity;

    for (const other of nonGroupNodes) {
      if (other.id === node.id) continue;
      if (!connectedNodes.has(other.id) && other.id !== node.id) continue;

      const otherLayerIdx = LAYER_ORDER.indexOf(other.layer);
      const dist = Math.abs(otherLayerIdx - nodeLayerIdx);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = other;
      }
    }

    if (!nearest) {
      // Connect to any other node as last resort
      for (const other of nonGroupNodes) {
        if (other.id !== node.id) {
          nearest = other;
          break;
        }
      }
    }

    if (nearest) {
      const sourceIdx = LAYER_ORDER.indexOf(node.layer);
      const targetIdx = LAYER_ORDER.indexOf(nearest.layer);
      const [src, tgt] = sourceIdx <= targetIdx ? [node.id, nearest.id] : [nearest.id, node.id];

      const edgeKey = `${src}->${tgt}`;
      if (!newEdges.some(e => `${e.source}->${e.target}` === edgeKey)) {
        newEdges.push({
          id: `auto-${src}-${tgt}`,
          source: src,
          target: tgt,
          label: '',
          async: false,
        });
        connectedNodes.add(node.id);
        console.log(`[Validate] Connected orphan ${node.id} to ${nearest.id}`);
      }
    }
  }

  return newEdges;
}

/**
 * REPAIR: Ensure minimum diagram structure
 */
function enrichDiagram(nodes: RawNode[], edges: DiagramEdge[]): { nodes: RawNode[]; edges: DiagramEdge[] } {
  let enrichedNodes = [...nodes];
  let enrichedEdges = [...edges];

  // Count non-group nodes
  const nonGroupNodes = enrichedNodes.filter(n => !n.isGroup);
  const nodeCount = nonGroupNodes.length;
  const edgeCount = enrichedEdges.length;

  console.log(`[Validate] Enrichment check: ${nodeCount} nodes, ${edgeCount} edges`);

  // Ensure minimum 10 nodes
  if (nodeCount < 10) {
    console.log(`[Validate] Adding nodes to reach minimum (currently ${nodeCount})`);
    enrichedNodes = addMissingNodes(enrichedNodes);
  }

  // Ensure minimum 10 edges
  if (enrichedEdges.length < 10) {
    console.log(`[Validate] Adding edges to reach minimum (currently ${enrichedEdges.length})`);
    enrichedEdges = addMissingEdges(enrichedNodes, enrichedEdges);
  }

  // Ensure entry layer exists
  const hasGateway = enrichedNodes.some(n => !n.isGroup && (n.layer === 'gateway' || n.serviceType === 'gateway'));
  if (!hasGateway) {
    const gatewayGroupId = ensureGroupExists(enrichedNodes, 'gateway');
    enrichedNodes.push({
      id: 'api-gateway',
      label: 'API Gateway',
      layer: 'gateway',
      icon: 'webhook',
      serviceType: 'gateway',
      parentId: gatewayGroupId,
    });
    console.log('[Validate] Added missing gateway node');
  }

  // Ensure at least 2 services
  const serviceCount = enrichedNodes.filter(n => !n.isGroup && (n.layer === 'application' || n.serviceType === 'service')).length;
  if (serviceCount < 2) {
    const servicesGroupId = ensureGroupExists(enrichedNodes, 'application');
    if (serviceCount === 0) {
      enrichedNodes.push({
        id: 'main-service',
        label: 'Main Service',
        layer: 'application',
        icon: 'server',
        serviceType: 'service',
        parentId: servicesGroupId,
      });
    }
    if (serviceCount < 2) {
      enrichedNodes.push({
        id: 'auth-service',
        label: 'Auth Service',
        layer: 'application',
        icon: 'lock',
        serviceType: 'service',
        parentId: servicesGroupId,
      });
    }
    console.log('[Validate] Added missing service nodes');
  }

  // Ensure async component
  const hasAsync = enrichedNodes.some(n => !n.isGroup && (n.layer === 'async' || n.serviceType === 'queue'));
  if (!hasAsync) {
    const asyncGroupId = ensureGroupExists(enrichedNodes, 'async');
    enrichedNodes.push({
      id: 'message-queue',
      label: 'Message Queue',
      layer: 'async',
      icon: 'message-square',
      serviceType: 'queue',
      parentId: asyncGroupId,
    });
    console.log('[Validate] Added missing async node');
  }

  // Ensure cache
  const hasCache = enrichedNodes.some(n => !n.isGroup && n.serviceType === 'cache');
  if (!hasCache) {
    const dataGroupId = ensureGroupExists(enrichedNodes, 'data');
    enrichedNodes.push({
      id: 'cache',
      label: 'Cache',
      layer: 'data',
      icon: 'gauge',
      serviceType: 'cache',
      parentId: dataGroupId,
    });
    console.log('[Validate] Added missing cache node');
  }

  // Ensure database
  const hasDatabase = enrichedNodes.some(n => !n.isGroup && n.serviceType === 'database');
  if (!hasDatabase) {
    const dataGroupId = ensureGroupExists(enrichedNodes, 'data');
    enrichedNodes.push({
      id: 'database',
      label: 'Database',
      layer: 'data',
      icon: 'database',
      serviceType: 'database',
      parentId: dataGroupId,
    });
    console.log('[Validate] Added missing database node');
  }

  return { nodes: enrichedNodes, edges: enrichedEdges };
}

/**
 * Enforce hierarchy - ensure nodes follow left-to-right flow
 */
function enforceHierarchy(nodes: RawNode[]): RawNode[] {
  // Ensure all non-group nodes have a valid layer
  return nodes.map(node => {
    if (node.isGroup || node.layer) return node;

    const inferredLayer = inferLayerFromLabel(node.label);
    console.log(`[Validate] Enforcing hierarchy: assigned "${node.label}" to layer "${inferredLayer}"`);
    return { ...node, layer: inferredLayer as PipelineLayer };
  });
}

// Helper functions

function inferLayerFromLabel(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('client') || l.includes('web') || l.includes('mobile') || l.includes('browser')) return 'presentation';
  if (l.includes('gateway') || l.includes('cdn') || l.includes('lb') || l.includes('load balancer')) return 'gateway';
  if (l.includes('queue') || l.includes('worker') || l.includes('kafka') || l.includes('sqs') || l.includes('event')) return 'async';
  if (l.includes('database') || l.includes('db') || l.includes('cache') || l.includes('redis') || l.includes('storage')) return 'data';
  if (l.includes('monitor') || l.includes('log') || l.includes('metrics') || l.includes('trace')) return 'observability';
  return 'application';
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
    'gateway': 'webhook',
    'service': 'server',
    'queue': 'message-square',
    'cache': 'gauge',
    'database': 'database',
    'worker': 'hammer',
    'cdn': 'globe',
    'loadbalancer': 'sliders',
  };
  return iconMap[type.toLowerCase()] || 'box';
}

function addMissingNodes(nodes: RawNode[]): RawNode[] {
  const result = [...nodes];
  const nonGroup = result.filter(n => !n.isGroup);
  
  const layers: PipelineLayer[] = ['presentation', 'gateway', 'application', 'async', 'data'];
  
  for (const layer of layers) {
    const count = nonGroup.filter(n => n.layer === layer).length;
    if (count === 0) {
      const groupId = ensureGroupExists(result, layer);
      const newNode: RawNode = {
        id: `${layer}-${Date.now()}`,
        label: `${layer.charAt(0).toUpperCase() + layer.slice(1)} Component`,
        layer,
        icon: getIconForType(layer),
        serviceType: layer === 'application' ? 'service' : layer,
        parentId: groupId,
      };
      result.push(newNode);
      nonGroup.push(newNode);
      console.log(`[Validate] Added missing node for layer: ${layer}`);
    }
  }

  return result;
}

function addMissingEdges(nodes: RawNode[], edges: DiagramEdge[]): DiagramEdge[] {
  const result = [...edges];
  const nonGroup = nodes.filter(n => !n.isGroup);
  
  // Connect layers in order
  for (let i = 0; i < LAYER_ORDER.length - 1; i++) {
    const srcLayer = LAYER_ORDER[i];
    const tgtLayer = LAYER_ORDER[i + 1];
    
    const sources = nonGroup.filter(n => n.layer === srcLayer);
    const targets = nonGroup.filter(n => n.layer === tgtLayer);
    
    if (sources.length > 0 && targets.length > 0) {
      for (const src of sources) {
        for (const tgt of targets) {
          const exists = result.some(e => e.source === src.id && e.target === tgt.id);
          if (!exists) {
            result.push({
              id: `auto-${src.id}-${tgt.id}`,
              source: src.id,
              target: tgt.id,
              label: '',
              async: srcLayer === 'async' || tgtLayer === 'async',
            });
          }
        }
      }
    }
  }

  return result;
}

function ensureGroupExists(nodes: RawNode[], layer: string): string {
  const groupId = `${layer}-group`;
  const exists = nodes.some(n => n.id === groupId && n.isGroup);
  
  if (!exists) {
    const meta = LAYER_GROUP_META[layer] || { label: layer, groupLabel: layer.toUpperCase(), color: '#e2e8f0' };
    nodes.push({
      id: groupId,
      label: meta.label,
      layer: layer as PipelineLayer,
      isGroup: true,
      groupLabel: meta.groupLabel,
      groupColor: meta.color,
    });
    console.log(`[Validate] Created group: ${groupId}`);
  }

  return groupId;
}

export function getLayerIndex(layer: string): number {
  const idx = LAYER_ORDER.indexOf(layer as PipelineLayer);
  return idx >= 0 ? idx : 2; // default to 'application'
}
