import logger from '@/lib/logger';
import ELK from 'elkjs/lib/elk.bundled.js';
import type { LayoutedNode, ValidatedDiagram, RawNode } from './types';
import { calculateNodeDimensions } from '@/lib/utils/nodeSizing';
import { ELK_CONFIG, ELK_DIRECTION_OVERRIDE } from '@/lib/config';

export interface LayoutDiagnostics {
  elkFailed: boolean;
  collisionCountBefore: number;
  collisionCountAfter: number;
  snappedColumns: number;
  unrecognizedLayers: string[];
  groupLayoutApplied: boolean;
}

export interface LayoutResult {
  nodes: LayoutedNode[];
  diagnostics: LayoutDiagnostics;
}

const CANONICAL_TIERS = [
  'client',        // 0
  'edge',          // 1
  'gateway',       // 2
  'application',   // 3
  'queue',         // 4
  'data',          // 5
  'observability', // 6
  'external'       // 7
];

const TIER_LAYER: Record<string, number> = {
  client: 0,
  edge: 1,
  infrastructure: 1,
  gateway: 2,
  application: 3,
  compute: 3,
  queue: 4,
  async: 4,
  data: 5,
  cache: 5,
  storage: 5,
  observability: 6,
  monitoring: 6,
  external: 7,
  thirdparty: 7,
};

// Patterns are tightened to avoid false matches on common words (non-greedy, word boundaries)
const LAYER_HINTS: { pattern: RegExp; layer: number }[] = [
  { pattern: /^(web app|mobile app|browser|spa|frontend|client)$/i, layer: 0 },
  { pattern: /^(cdn|dns|route\s*53|cloudfront)$/i, layer: 1 },
  { pattern: /^(load\s*balancer|api gateway|nginx|traefik|ingress)$/i, layer: 2 },
  { pattern: /\b(queue|kafka|rabbitmq|amqp|pub.?sub|sqs)\b/i, layer: 4 },
  { pattern: /\b(database|postgres|mysql|mongo|dynamodb|redis|cache|s3|blob\s*storage|object\s*storage)\b/i, layer: 5 },
  { pattern: /\b(prometheus|grafana|datadog|newrelic|jaeger|zipkin)\b/i, layer: 6 },
  { pattern: /\b(stripe|twilio|sendgrid|paypal|sns)\b/i, layer: 7 },
];

export function normalizeLayer(layer?: string): string {
  if (!layer) return 'application';
  const clean = layer.toLowerCase().trim().replace(/[\s-]/g, '');

  if (clean === 'presentation' || clean === 'client' || clean === 'frontend') return 'client';
  if (clean === 'edge' || clean === 'infrastructure') return 'edge';
  if (clean === 'gateway') return 'gateway';
  if (clean === 'compute' || clean === 'application' || clean === 'compute/application') return 'application';
  if (clean === 'async' || clean === 'queue') return 'queue';
  if (clean === 'data' || clean === 'cache' || clean === 'storage') return 'data';
  if (clean === 'observe' || clean === 'observability' || clean === 'monitoring') return 'observability';
  if (clean === 'thirdparty' || clean === 'external') return 'external';

  // Substring matches as a fallback
  if (clean.includes('client') || clean.includes('present') || clean.includes('frontend')) return 'client';
  if (clean.includes('edge') || clean.includes('infra')) return 'edge';
  if (clean.includes('gate')) return 'gateway';
  if (clean.includes('compute') || (clean.includes('app') && !clean.includes('frontend'))) return 'application';
  if (clean.includes('async') || clean.includes('queue') || clean.includes('bus') || clean.includes('stream')) return 'queue';
  if (clean.includes('data') || clean.includes('db') || clean.includes('cache') || clean.includes('store') || clean.includes('sql') || clean.includes('mongo')) return 'data';
  if (clean.includes('observe') || clean.includes('monitor') || clean.includes('log') || clean.includes('trace') || clean.includes('alert')) return 'observability';
  if (clean.includes('third') || clean.includes('ext') || clean.includes('api') || clean.includes('vendor')) return 'external';

  return 'application';
}

export function getLayerHint(node: RawNode): number {
  // 1. TRUST the AI-assigned layer field first
  if (node.layer) {
    const norm = normalizeLayer(node.layer);
    const index = CANONICAL_TIERS.indexOf(norm);
    if (index !== -1) return index;
  }

  // 2. Only fall back to label pattern matching if layer is missing or unrecognized
  const label = node.label || '';
  for (const hint of LAYER_HINTS) {
    if (hint.pattern.test(label)) return hint.layer;
  }

  // 3. Default to application tier
  return 3;
}

// Bounding box interface for collision detection
interface CollisionBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function getNodeBox(node: LayoutedNode, margin: number): CollisionBox {
  return {
    x1: node.x - margin,
    y1: node.y - margin,
    x2: node.x + node.width + margin,
    y2: node.y + node.height + margin,
  };
}

function checkOverlap(boxA: CollisionBox, boxB: CollisionBox): { x: number; y: number } | null {
  const overlapX = Math.min(boxA.x2, boxB.x2) - Math.max(boxA.x1, boxB.x1);
  const overlapY = Math.min(boxA.y2, boxB.y2) - Math.max(boxA.y1, boxB.y1);
  if (overlapX > 0 && overlapY > 0) {
    return { x: overlapX, y: overlapY };
  }
  return null;
}

/**
 * Resolves node overlaps using a basic iterative layout adjustment.
 * Shifting group nodes will also shift all of their child nodes.
 */
function resolveCollisions(nodes: LayoutedNode[], margin: number = 40): { nodes: LayoutedNode[], before: number, after: number } {
  const result = nodes.map(n => ({ ...n }));
  
  let beforeCount = 0;
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      if (result[i].parentId === result[j].id || result[j].parentId === result[i].id) continue;
      const boxA = getNodeBox(result[i], margin);
      const boxB = getNodeBox(result[j], margin);
      if (checkOverlap(boxA, boxB)) {
        beforeCount++;
      }
    }
  }

  const maxIterations = 50;
  for (let iter = 0; iter < maxIterations; iter++) {
    let moved = false;
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i];
        const b = result[j];
        
        if (a.parentId === b.id || b.parentId === a.id) continue;
        
        const boxA = getNodeBox(a, margin);
        const boxB = getNodeBox(b, margin);
        const overlap = checkOverlap(boxA, boxB);
        
        if (overlap) {
          let dx = 0;
          let dy = 0;
          const shiftAmount = margin + 5;
          if (overlap.x < overlap.y) {
            dx = a.x < b.x ? -shiftAmount : shiftAmount;
          } else {
            dy = a.y < b.y ? -shiftAmount : shiftAmount;
          }
          
          a.x += dx / 2;
          a.y += dy / 2;
          if (a.isGroup) {
            for (const child of result) {
              if (child.parentId === a.id) {
                child.x += dx / 2;
                child.y += dy / 2;
              }
            }
          }
          
          b.x -= dx / 2;
          b.y -= dy / 2;
          if (b.isGroup) {
            for (const child of result) {
              if (child.parentId === b.id) {
                child.x -= dx / 2;
                child.y -= dy / 2;
              }
            }
          }
          
          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  let afterCount = 0;
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      if (result[i].parentId === result[j].id || result[j].parentId === result[i].id) continue;
      const boxA = getNodeBox(result[i], margin);
      const boxB = getNodeBox(result[j], margin);
      if (checkOverlap(boxA, boxB)) {
        afterCount++;
      }
    }
  }

  return { nodes: result, before: beforeCount, after: afterCount };
}

function positionGroupsAbsolute(
  layoutedLeafNodes: LayoutedNode[],
  groupNodes: RawNode[]
): LayoutedNode[] {
  const resultNodes = [...layoutedLeafNodes];
  // Generous padding so groups feel spacious and boundaries are clearly visible
  const padding = 100;
  const topPadding = 120; // extra headroom above children for the group label tag

  for (const group of groupNodes) {
    const children = resultNodes.filter(n => n.parentId === group.id);
    if (children.length > 0) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const child of children) {
        minX = Math.min(minX, child.x);
        minY = Math.min(minY, child.y);
        maxX = Math.max(maxX, child.x + child.width);
        maxY = Math.max(maxY, child.y + child.height);
      }

      resultNodes.push({
        ...group,
        x: minX - padding,
        y: minY - topPadding,
        width: (maxX - minX) + 2 * padding,
        height: (maxY - minY) + topPadding + padding
      });
    } else {
      resultNodes.push({
        ...group,
        x: 100,
        y: 100,
        width: 300,
        height: 200
      });
    }
  }

  return resultNodes;
}

/**
 * After collision resolution moves children, group positions may be stale.
 * This recomputes each group's bounding box from the current (post-collision)
 * positions of its children, ensuring parent-relative conversion is correct.
 */
function recomputeGroupBounds(nodes: LayoutedNode[]): LayoutedNode[] {
  const result = nodes.map(n => ({ ...n }));
  // Match the generous padding used in positionGroupsAbsolute
  const padding = 100;
  const topPadding = 120;

  for (const group of result) {
    if (!group.isGroup) continue;
    const children = result.filter(n => n.parentId === group.id);
    if (children.length === 0) continue;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const child of children) {
      minX = Math.min(minX, child.x);
      minY = Math.min(minY, child.y);
      maxX = Math.max(maxX, child.x + child.width);
      maxY = Math.max(maxY, child.y + child.height);
    }

    group.x = minX - padding;
    group.y = minY - topPadding;
    group.width = (maxX - minX) + 2 * padding;
    group.height = (maxY - minY) + topPadding + padding;
  }

  return result;
}

function convertChildrenToParentRelative(nodes: LayoutedNode[]): LayoutedNode[] {
  return nodes.map(node => {
    if (node.parentId) {
      const parent = nodes.find(p => p.id === node.parentId);
      if (parent) {
        return {
          ...node,
          x: node.x - parent.x,
          y: node.y - parent.y
        };
      }
    }
    return node;
  });
}

function fallbackLayoutLeafs(nonGroupNodes: RawNode[]): LayoutedNode[] {
  const layerGroups: Record<number, RawNode[]> = {};
  for (const node of nonGroupNodes) {
    const layerIdx = getLayerHint(node);
    layerGroups[layerIdx] ||= [];
    layerGroups[layerIdx].push(node);
  }

  const layoutedLeafNodes: LayoutedNode[] = [];
  let currentX = 160;
  const paddingX = 280; // generous horizontal column gap
  const spacingY = 160; // generous vertical node gap

  for (let layerIdx = 0; layerIdx < 8; layerIdx++) {
    const layerNodes = layerGroups[layerIdx];
    if (!layerNodes || layerNodes.length === 0) continue;

    let currentY = 160;
    let maxColumnWidth = 0;

    for (const node of layerNodes) {
      const { width, height } = calculateNodeDimensions(node.label, node.subtitle);
      layoutedLeafNodes.push({
        ...node,
        x: currentX,
        y: currentY,
        width,
        height
      });
      currentY += height + spacingY;
      maxColumnWidth = Math.max(maxColumnWidth, width);
    }

    currentX += maxColumnWidth + paddingX;
  }

  return layoutedLeafNodes;
}

export async function applyLayout(
  validated: ValidatedDiagram,
  diagramSize: 'small' | 'medium' | 'large' = 'medium',
  diagramType?: string
): Promise<LayoutResult> {
  const { nodes, edges } = validated;
  logger.info(`[Layout] Processing ${nodes.length} nodes, ${edges.length} edges using ELK with partitioning (size: ${diagramSize})`);

  // Track diagnostics
  const unrecognizedLayers: string[] = [];
  for (const node of nodes) {
    if (node.layer) {
      const normalized = node.layer.toLowerCase().replace(/[\s-]/g, '');
      if (TIER_LAYER[normalized] === undefined) {
        unrecognizedLayers.push(node.layer);
      }
    }
  }

  const nonGroupNodes = nodes.filter(n => !n.isGroup);
  const groupNodes = nodes.filter(n => n.isGroup);
  const nonGroupIds = new Set(nonGroupNodes.map(n => n.id));

  // Determine dynamic ELK spacing options
  // 1. Spacing base adjustments by size — values are deliberately large for an airy, spacious layout
  let sizeNodeSpacing = 240;
  let sizeLayerSpacing = 360;
  if (diagramSize === 'small') {
    sizeNodeSpacing = 180;
    sizeLayerSpacing = 260;
  } else if (diagramSize === 'large') {
    sizeNodeSpacing = 320;
    sizeLayerSpacing = 480;
  }

  // 2. Adjustments based on edge pressure (edges - nodes)
  const edgePressure = Math.max(0, edges.length - nodes.length);
  const extraNodeSpacing = edgePressure * 12;
  const extraLayerSpacing = edgePressure * 18;

  // 3. Same-layer edge pressure
  const sameLayerEdges = edges.filter(edge => {
    const src = nodes.find(n => n.id === edge.source);
    const tgt = nodes.find(n => n.id === edge.target);
    return src && tgt && getLayerHint(src) === getLayerHint(tgt);
  }).length;
  const sameLayerSpacingExtra = sameLayerEdges * 20;

  // Combine them with bounds/clamping (raised ceilings for spacious diagrams)
  const finalNodeNode = Math.min(Math.max(sizeNodeSpacing + extraNodeSpacing + sameLayerSpacingExtra, 180), 600);
  const finalNodeLayer = Math.min(Math.max(sizeLayerSpacing + extraLayerSpacing + sameLayerSpacingExtra, 260), 800);
  const finalEdgeNode = Math.min(Math.max(140 + edgePressure * 8, 120), 300);
  const finalEdgeEdge = Math.min(Math.max(80 + edgePressure * 6, 60), 200);

  const elk = new ELK();
  const cleanEdges = edges.filter(e => e.source !== e.target);

  const elkNodes = nonGroupNodes.map(node => {
    const { width, height } = calculateNodeDimensions(node.label, node.subtitle);
    return {
      id: node.id,
      width,
      height,
      layoutOptions: {
        'elk.layered.layering.layerId': String(getLayerHint(node)),
      }
    };
  });

  const elkEdges = cleanEdges
    .filter(edge => nonGroupIds.has(edge.source) && nonGroupIds.has(edge.target))
    .map(edge => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target]
    }));

  const graph = {
    id: 'root',
    layoutOptions: {
      ...ELK_CONFIG,
      'elk.layered.layering.strategy': 'INTERACTIVE',
      'elk.spacing.nodeNode': String(finalNodeNode),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(finalNodeLayer),
      'elk.spacing.edgeNode': String(finalEdgeNode),
      'elk.spacing.edgeEdge': String(finalEdgeEdge),
      'elk.direction': diagramType && ELK_DIRECTION_OVERRIDE[diagramType] 
                       ? ELK_DIRECTION_OVERRIDE[diagramType] 
                       : ELK_CONFIG['elk.direction'],
    },
    children: elkNodes,
    edges: elkEdges
  };

  try {
    const layoutedGraph = await elk.layout(graph);
    if (!layoutedGraph.children) throw new Error("ELK returned no children");

    // Map positions back
    const layoutedLeafNodes: LayoutedNode[] = nonGroupNodes.map(node => {
      const elkNode = layoutedGraph.children!.find(n => n.id === node.id);
      if (!elkNode) throw new Error(`Node ${node.id} missing from layout`);
      const { width, height } = calculateNodeDimensions(node.label, node.subtitle);
      return {
        ...node,
        x: elkNode.x || 0,
        y: elkNode.y || 0,
        width,
        height
      };
    });

    // Column snapping: group by canonical layer first, snap only in same canonical layer
    const nodesByLayer: Record<number, LayoutedNode[]> = {};
    for (const node of layoutedLeafNodes) {
      const layerIdx = getLayerHint(node);
      nodesByLayer[layerIdx] ||= [];
      nodesByLayer[layerIdx].push(node);
    }

    const activeLayers = Object.keys(nodesByLayer).map(Number).sort((a, b) => a - b);
    const layerAvgX: Record<number, number> = {};
    for (const layerIdx of activeLayers) {
      const layerNodes = nodesByLayer[layerIdx];
      if (layerNodes.length > 0) {
        const sumX = layerNodes.reduce((sum, n) => sum + n.x, 0);
        layerAvgX[layerIdx] = sumX / layerNodes.length;
      }
    }

    for (const layerIdx of activeLayers) {
      const avgX = Math.round(layerAvgX[layerIdx]);
      let canSnap = true;
      for (const otherIdx of activeLayers) {
        if (otherIdx === layerIdx) continue;
        const otherAvg = layerAvgX[otherIdx];
        if (layerIdx > otherIdx && avgX < otherAvg + 120) {
          canSnap = false;
          break;
        }
        if (layerIdx < otherIdx && avgX > otherAvg - 120) {
          canSnap = false;
          break;
        }
      }

      if (canSnap) {
        for (const node of nodesByLayer[layerIdx]) {
          node.x = avgX;
        }
      }
    }

    // Position group nodes absolutely around their children
    const absoluteNodes = positionGroupsAbsolute(layoutedLeafNodes, groupNodes);

    // Run collision resolution on all absolute-positioned nodes (leaf nodes only,
    // then recompute groups so groups enclose their post-collision children)
    const { nodes: collisionResolvedNodes, before, after } = resolveCollisions(absoluteNodes, 60);

    // Recompute group bounds from final (post-collision) child positions
    const reboundedNodes = recomputeGroupBounds(collisionResolvedNodes);

    // Convert children to parent-relative coordinates
    const finalNodes = convertChildrenToParentRelative(reboundedNodes);

    return {
      nodes: finalNodes,
      diagnostics: {
        elkFailed: false,
        collisionCountBefore: before,
        collisionCountAfter: after,
        snappedColumns: new Set(collisionResolvedNodes.map(n => n.x)).size,
        unrecognizedLayers,
        groupLayoutApplied: groupNodes.length > 0
      }
    };

  } catch (e) {
    logger.error('[Layout] ELK failed, falling back to basic layout:', e);
    const fallbackLeafNodes = fallbackLayoutLeafs(nonGroupNodes);
    const absoluteNodes = positionGroupsAbsolute(fallbackLeafNodes, groupNodes);
    const { nodes: collisionResolvedNodes, before, after } = resolveCollisions(absoluteNodes, 60);
    const reboundedNodes = recomputeGroupBounds(collisionResolvedNodes);
    const finalNodes = convertChildrenToParentRelative(reboundedNodes);

    return {
      nodes: finalNodes,
      diagnostics: {
        elkFailed: true,
        collisionCountBefore: before,
        collisionCountAfter: after,
        snappedColumns: new Set(collisionResolvedNodes.map(n => n.x)).size,
        unrecognizedLayers,
        groupLayoutApplied: groupNodes.length > 0
      }
    };
  }
}
