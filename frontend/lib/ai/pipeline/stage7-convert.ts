import { Node, Edge } from 'reactflow';
import type { LayoutedNode, ValidatedDiagram } from './types';
import { EDGE_STYLES } from '@/lib/theme/stylingConstants';

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

  console.log(`[Convert] Starting conversion: ${layouted.length} nodes, ${diagramEdges.length} edges`);

  // STEP 1: Sort nodes for correct rendering order
  const sortedNodes = sortNodesForRendering(layouted);

  console.log(`[Convert] Final node count after processing: ${sortedNodes.length} (preserved all nodes)`);

  // STEP 3: Convert to React Flow nodes
  const rfNodes: Node[] = sortedNodes.map(node => {
    const isGroup = node.isGroup === true;

    return {
      id: node.id,
      type: isGroup ? 'groupNode' : 'architectureNode',
      position: { x: node.x, y: node.y },
      parentNode: node.parentId,
      data: {
        label: node.label,
        subtitle: node.subtitle || '',
        layer: node.layer,
        icon: node.icon || 'box',
        serviceType: node.serviceType || '',
        isGroup,
        groupLabel: node.groupLabel,
        groupColor: node.groupColor,
        nodeWidth: node.width,
        nodeHeight: node.height,
      },
      width: node.width,
      height: node.height,
      zIndex: isGroup ? 0 : 1000,
    };
  });



  // STEP 3: Filter out edges with invalid node references (but log them)
  const validNodeIds = new Set(layouted.map(n => n.id));
  const rfEdges: Edge[] = diagramEdges
    .filter(edge => {
      const valid = validNodeIds.has(edge.source) && validNodeIds.has(edge.target);
      if (!valid) {
        console.log(`[Convert] Filtered out edge with invalid refs: ${edge.source}->${edge.target}`);
      }
      return valid;
    })
    .map((edge, idx) => {
      const connectionType = edge.async ? 'async' : 'sync';
      const edgeStyle = EDGE_STYLES[connectionType as keyof typeof EDGE_STYLES] || EDGE_STYLES.sync;
      const strokeDash = edgeStyle.dash || '';
      const edgeLabel = edge.label?.trim();

      return {
        id: edge.id || `rf-${idx}`,
        source: edge.source,
        target: edge.target,
        type: 'simpleFloating' as const,
        animated: edge.async,
        style: { stroke: edgeStyle.color, strokeWidth: 2, strokeDasharray: strokeDash },
        markerEnd: {
          type: 'arrowclosed' as any,
          color: edgeStyle.color,
          width: 20,
          height: 20,
        },
        data: {
          connectionType,
          pathType: 'smooth' as const,
          label: edgeLabel && edgeLabel.length > 0 ? edgeLabel : undefined,
        },
      };
    });

  // STEP 4: Detect bidirectional edge pairs and apply curvature offsets
  const edgePairMap = new Map<string, Edge[]>();
  for (const edge of rfEdges) {
    const pairKey = [edge.source, edge.target].sort().join('--');
    if (!edgePairMap.has(pairKey)) {
      edgePairMap.set(pairKey, []);
    }
    edgePairMap.get(pairKey)!.push(edge);
  }

  for (const pairs of edgePairMap.values()) {
    if (pairs.length === 2) {
      pairs[0].data = { ...pairs[0].data, pathType: 'bezier', curvature: 0.25 };
      pairs[1].data = { ...pairs[1].data, pathType: 'bezier', curvature: -0.25 };
    }
  }

  console.log(`[Convert] Final output: ${rfNodes.length} nodes, ${rfEdges.length} edges (all nodes preserved)`);

  return { nodes: rfNodes, edges: rfEdges };
}
