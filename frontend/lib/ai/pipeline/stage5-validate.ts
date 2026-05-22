import type { RawNode, RawFlow, DiagramEdge, ValidatedDiagram, PipelineLayer } from './types';

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

const LAYER_ORDER: PipelineLayer[] = ['client', 'edge', 'gateway', 'application', 'queue', 'data'];

/**
 * Main validation function - ensures connectivity and proper layer structure
 */
export function validateAndRepair(parsed: { nodes: RawNode[]; flows: RawFlow[] }): ValidatedDiagram {
  let nodes = [...parsed.nodes];
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
  const repairedEdges = repairEdges(edges, nodes);

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
 * Connect orphaned nodes (ensure no orphans)
 */
function connectOrphans(nodes: RawNode[], edges: DiagramEdge[]): DiagramEdge[] {
  const connectedNodes = new Set<string>();
  for (const edge of edges) {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  }

  const newEdges = [...edges];

  for (const node of nodes) {
    if (connectedNodes.has(node.id)) continue;

    // Find a node in the same or adjacent layer
    const nodeLayerIdx = LAYER_ORDER.indexOf(node.layer);
    let nearest: RawNode | null = null;
    let nearestDist = Infinity;

    for (const other of nodes) {
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
      for (const other of nodes) {
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
          label: 'connects to',
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
 * Ensure minimum diagram structure
 */
function enrichDiagram(nodes: RawNode[], edges: DiagramEdge[]): { nodes: RawNode[]; edges: DiagramEdge[] } {
  let enrichedNodes = [...nodes];
  let enrichedEdges = [...edges];

  const nodeCount = enrichedNodes.length;
  const edgeCount = enrichedEdges.length;

  console.log(`[Validate] Enrichment check: ${nodeCount} nodes, ${edgeCount} edges`);

  // Ensure minimum 6 nodes
  if (nodeCount < 6) {
    console.log(`[Validate] Adding nodes to reach minimum (currently ${nodeCount})`);
    enrichedNodes = addMissingNodes(enrichedNodes);
  }

  // Ensure minimum 5 edges
  if (enrichedEdges.length < 5) {
    console.log(`[Validate] Adding edges to reach minimum (currently ${enrichedEdges.length})`);
    enrichedEdges = addMissingEdges(enrichedNodes, enrichedEdges);
  }

  // Ensure gateway exists
  const hasGateway = enrichedNodes.some(n => n.serviceType === 'gateway');
  if (!hasGateway) {
    enrichedNodes.push({
      id: 'api-gateway',
      label: 'API Gateway',
      layer: 'application',
      icon: 'webhook',
      serviceType: 'gateway',
      subtitle: 'REST API',
    });
    console.log('[Validate] Added missing gateway node');
  }

  // Ensure at least 1 service
  const serviceCount = enrichedNodes.filter(n => n.layer === 'application' || n.serviceType === 'service').length;
  if (serviceCount < 1) {
    enrichedNodes.push({
      id: 'main-service',
      label: 'Main Service',
      layer: 'application',
      icon: 'server',
      serviceType: 'service',
      subtitle: 'Business logic',
    });
    console.log('[Validate] Added missing service node');
  }

  // Ensure database exists
  const hasDatabase = enrichedNodes.some(n => n.serviceType === 'database');
  if (!hasDatabase) {
    enrichedNodes.push({
      id: 'database',
      label: 'Database',
      layer: 'data',
      icon: 'database',
      serviceType: 'database',
      subtitle: 'PostgreSQL',
    });
    console.log('[Validate] Added missing database node');
  }

  return { nodes: enrichedNodes, edges: enrichedEdges };
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
