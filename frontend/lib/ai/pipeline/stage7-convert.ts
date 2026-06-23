import logger from '@/lib/logger';
import { createNode, createEdge } from '@/lib/factory';
import { Node, Edge } from 'reactflow';
import type { LayoutedNode, ValidatedDiagram } from './types';
import { EDGE_STYLES } from '@/lib/theme/stylingConstants';
import { EDGE_CONFIG } from '@/lib/config';

/**
 * STAGE 7 — REACT FLOW CONVERSION
 * 
 * RULES:
 * - NEVER remove nodes during conversion
 * - Preserve ALL nodes and edges
 * - Correct rendering order by layer
 */


/**
 * Sort nodes by layer order for correct rendering
 */
function sortNodesForRendering(nodes: LayoutedNode[]): LayoutedNode[] {
  // First layer sort
  const layerOrder = ['client', 'edge', 'gateway', 'application', 'queue', 'data'];
  const sorted = [...nodes].sort((a, b) => {
    const aLayerIdx = layerOrder.indexOf(a.layer || 'application');
    const bLayerIdx = layerOrder.indexOf(b.layer || 'application');
    return aLayerIdx - bLayerIdx;
  });

  // Second sort: Ensure all parents (groups) appear before their children
  // React Flow requires parent nodes to exist in the array before child nodes
  const groupsFirst = [...sorted].sort((a, b) => {
    if (a.isGroup && !b.isGroup) return -1;
    if (!a.isGroup && b.isGroup) return 1;
    return 0;
  });

  return groupsFirst;
}

export function convertToReactFlow(
  layouted: LayoutedNode[],
  validated: ValidatedDiagram
): { nodes: Node[]; edges: Edge[] } {
  const { edges: diagramEdges } = validated;

  logger.info(`[Convert] Starting conversion: ${layouted.length} nodes, ${diagramEdges.length} edges`);

  // STEP 1: Sort nodes for correct rendering order
  const sortedNodes = sortNodesForRendering(layouted);

  logger.info(`[Convert] Final node count after processing: ${sortedNodes.length} (preserved all nodes)`);

  // STEP 3: Convert to React Flow nodes
  const rfNodes: Node[] = sortedNodes.map(node => {
    const isGroup = node.isGroup === true;
    const type = isGroup ? 'groupNode' : 'architectureNode';

    return createNode(type, node.label, { x: node.x, y: node.y }, {
      id: node.id,
      type,
      ...(node.parentId
        ? { parentId: node.parentId, parentNode: node.parentId, extent: 'parent' as const }
        : {}),
      ...(isGroup ? { style: { width: node.width, height: node.height } } : {}),
      data: {
        subtitle: node.subtitle || '',
        layer: node.layer,
        icon: node.icon || 'box',
        serviceType: node.serviceType || '',
        isGroup,
        groupLabel: node.groupLabel ?? node.label,
        groupColor: node.groupColor,
        nodeWidth: node.width,
        nodeHeight: node.height,
      },
      width: node.width,
      height: node.height,
      zIndex: isGroup ? 0 : 1000,
    });
  });



  // STEP 3: Filter out edges with invalid node references (but log them)
  const validNodeIds = new Set(layouted.map(n => n.id));
  const rfEdges: Edge[] = diagramEdges
    .filter(edge => {
      const valid = validNodeIds.has(edge.source) && validNodeIds.has(edge.target);
      if (!valid) {
        logger.info(`[Convert] Filtered out edge with invalid refs: ${edge.source}->${edge.target}`);
      }
      return valid;
    })
    .map((edge, idx) => {
      const connectionType = edge.async ? 'async' : 'sync';
      const edgeStyle = EDGE_STYLES[connectionType as keyof typeof EDGE_STYLES] || EDGE_STYLES.sync;
      const strokeDash = edgeStyle.dash || '';
      const edgeLabel = edge.label?.trim();

      return createEdge(edge.source, edge.target, edgeLabel && edgeLabel.length > 0 ? edgeLabel : '', {
        id: edge.id || `rf-${idx}`,
        type: 'simpleFloating',
        animated: edge.async,
        style: { stroke: edgeStyle.color, strokeWidth: EDGE_CONFIG.strokeWidth, strokeDasharray: strokeDash },
        markerEnd: {
          type: 'arrowclosed' as any,
          color: edgeStyle.color,
          width: 20,
          height: 20,
        },
        data: {
          connectionType,
          pathType: 'smooth',
          // SimpleFloatingEdge reads data.label (not top-level edge.label)
          label: edgeLabel && edgeLabel.length > 0 ? edgeLabel : undefined,
        },
      });
    });

  // STEP 4: Detect TRUE bidirectional pairs (A→B AND B→A both exist) and apply curvature.
  // Key insight: group by unordered node-pair, but only apply curvature when the two edges
  // actually point in OPPOSITE directions. Two edges going A→B (duplicates) must NOT trigger
  // bidirectional curvature — they'll be handled by parallel-edge offset logic instead.
  const edgePairMap = new Map<string, Edge[]>();
  for (const edge of rfEdges) {
    // Canonical key: always put the lexicographically smaller id first so A--B and B--A share a bucket
    const [a, b] = edge.source < edge.target
      ? [edge.source, edge.target]
      : [edge.target, edge.source];
    const pairKey = `${a}--${b}`;
    if (!edgePairMap.has(pairKey)) {
      edgePairMap.set(pairKey, []);
    }
    edgePairMap.get(pairKey)!.push(edge);
  }

  for (const pairs of edgePairMap.values()) {
    if (pairs.length !== 2) continue;
    const [first, second] = pairs;
    // Only apply bidirectional curvature when the two edges genuinely go in opposite directions
    const isTrulyBidirectional =
      (first.source === second.target && first.target === second.source);
    if (isTrulyBidirectional) {
      first.data  = { ...first.data,  pathType: 'bezier', curvature:  0.25 };
      second.data = { ...second.data, pathType: 'bezier', curvature: -0.25 };
    }
  }

  logger.info(`[Convert] Final output: ${rfNodes.length} nodes, ${rfEdges.length} edges (all nodes preserved)`);

  return { nodes: rfNodes, edges: rfEdges };
}
