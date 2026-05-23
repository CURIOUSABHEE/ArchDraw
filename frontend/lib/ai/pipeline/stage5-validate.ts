import type { RawNode, RawFlow, DiagramEdge, ValidatedDiagram, PipelineLayer } from './types';
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
export function validateAndRepair(parsed: { nodes: RawNode[]; flows: RawFlow[] }, prompt?: string): ValidatedDiagram {
  let nodes = ensurePromptRequiredNodes(prunePromptIrrelevantNodes([...parsed.nodes], prompt), prompt);
  const flows = [...parsed.flows];

  console.log(`[Validate] Starting with ${nodes.length} nodes and ${flows.length} flows`);

  // STEP 1: Parse flows into edges
  const edges = flowsToEdges(flows);
  console.log(`[Validate] Parsed ${edges.length} edges from flows`);

  // STEP 2: Fix nodes with missing data
  nodes = repairNodeData(nodes);

  // STEP 3: Ensure all nodes have valid IDs and labels
  nodes = ensureNodeIdentity(nodes);

  // STEP 4: Remove duplicate edges
  const repairedEdges = repairStoryEdges(nodes, repairEdges(edges, nodes), prompt);

  // STEP 5: Connect orphaned nodes (ensure no orphans)
  const connectedEdges = connectOrphans(nodes, repairedEdges);

  // STEP 6: Ensure minimum structure
  const { nodes: enrichedNodes, edges: enrichedEdges } = enrichDiagram(nodes, connectedEdges);

  // STEP 7: Enforce granular layer structure
  const finalNodes = enforceHierarchy(enrichedNodes);

  console.log(`[Validate] Final: ${finalNodes.length} nodes and ${enrichedEdges.length} edges`);

  return { nodes: finalNodes, edges: enrichedEdges };
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

    return repaired;
  });
}

/**
 * Ensure all nodes have valid IDs and labels
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
 * Remove duplicate edges
 */
function repairEdges(edges: DiagramEdge[], nodes: RawNode[]): DiagramEdge[] {
  const nodeIds = new Set(nodes.map(n => n.id));
  
  const validEdges: DiagramEdge[] = [];
  const seen = new Set<string>();

  for (const edge of edges) {
    // Remove edges pointing to non-existent nodes
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
 * Connect orphaned nodes (ensure no orphans) using a semantic best-effort heuristic
 */
function connectOrphans(nodes: RawNode[], edges: DiagramEdge[]): DiagramEdge[] {
  const connectedEdges = [...edges];
  
  // 1. Collect all node IDs (excluding groups)
  const leafNodeIds = new Set(nodes.filter(n => !n.isGroup).map(n => n.id));
  
  // 2. Collect all node IDs referenced in edges (source + target)
  const referencedNodeIds = new Set<string>();
  connectedEdges.forEach(e => {
    referencedNodeIds.add(e.source);
    referencedNodeIds.add(e.target);
  });
  
  // 3. Find the difference — these are orphans
  const orphans = nodes.filter(n => !n.isGroup && !referencedNodeIds.has(n.id));
  
  if (orphans.length === 0) return connectedEdges;
  
  console.warn(`[Validate] WARNING: Found ${orphans.length} orphan nodes: ${orphans.map(o => o.id).join(', ')}`);
  
  // 4. Connect orphan nodes to the most semantically relevant existing node using best-effort heuristic
  orphans.forEach(orphan => {
    const orphanLayer = orphan.layer || 'application';
    let partnerNode: RawNode | undefined;
    let isOrphanSource = true; // True if orphan should be source, false if target
    let edgeLabel = 'connects to';
    
    // Heuristic: map layers semantically
    if (orphanLayer === 'client' || orphanLayer === 'presentation') {
      partnerNode = nodes.find(n => !n.isGroup && n.id !== orphan.id && ['gateway', 'edge', 'application', 'compute'].includes(n.layer));
      isOrphanSource = true;
      edgeLabel = 'requests';
    } else if (orphanLayer === 'edge' || orphanLayer === 'gateway') {
      partnerNode = nodes.find(n => !n.isGroup && n.id !== orphan.id && ['application', 'compute'].includes(n.layer));
      isOrphanSource = true;
      edgeLabel = 'routes to';
    } else if (orphanLayer === 'data') {
      partnerNode = nodes.find(n => !n.isGroup && n.id !== orphan.id && ['application', 'compute', 'queue', 'async'].includes(n.layer));
      isOrphanSource = false; // Application -> Data
      edgeLabel = 'queries';
    } else if (orphanLayer === 'queue' || orphanLayer === 'async') {
      partnerNode = nodes.find(n => !n.isGroup && n.id !== orphan.id && ['application', 'compute'].includes(n.layer));
      isOrphanSource = false; // Application -> Queue
      edgeLabel = 'publishes to';
    } else if (orphanLayer === 'observability' || orphanLayer === 'observe') {
      partnerNode = nodes.find(n => !n.isGroup && n.id !== orphan.id && ['application', 'compute'].includes(n.layer));
      isOrphanSource = false; // Application -> Observability
      edgeLabel = 'emits logs to';
    } else if (orphanLayer === 'infrastructure') {
      partnerNode = nodes.find(n => !n.isGroup && n.id !== orphan.id && ['application', 'compute'].includes(n.layer));
      isOrphanSource = false; // Application -> Infrastructure
      edgeLabel = 'deployed on';
    } else if (orphanLayer === 'external') {
      partnerNode = nodes.find(n => !n.isGroup && n.id !== orphan.id && ['application', 'compute'].includes(n.layer));
      isOrphanSource = false; // Application -> External
      edgeLabel = 'calls API';
    }
    
    // Fallback: connect to the closest directional neighbor, not an arbitrary client hub.
    if (!partnerNode) {
      partnerNode = findDirectionalPartner(orphan, nodes);
      if (partnerNode) {
        isOrphanSource = getLayerRank(orphan.layer) <= getLayerRank(partnerNode.layer);
      }
    }
    
    if (partnerNode) {
      const source = isOrphanSource ? orphan.id : partnerNode.id;
      const target = isOrphanSource ? partnerNode.id : orphan.id;
      
      const newEdgeId = `auto-orphan-${source}-${target}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      connectedEdges.push({
        id: newEdgeId,
        source,
        target,
        label: edgeLabel,
        async: orphanLayer === 'queue' || orphanLayer === 'async',
      });
      
      referencedNodeIds.add(orphan.id);
      referencedNodeIds.add(partnerNode.id);
      console.log(`[Validate] Connected orphan "${orphan.id}" to "${partnerNode.id}" as ${isOrphanSource ? 'source' : 'target'}`);
    } else {
      console.warn(`[Validate] WARNING: No partner node found to connect orphan "${orphan.id}"`);
    }
  });
  
  return connectedEdges;
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
function enforceHierarchy(nodes: RawNode[]): RawNode[] {
  return nodes.map(node => {
    if (node.layer) return node;

    const inferredLayer = inferLayerFromLabel(node.label);
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
