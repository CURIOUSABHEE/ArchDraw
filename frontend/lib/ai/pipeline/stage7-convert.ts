import { Node, Edge } from 'reactflow';
import type { LayoutedNode, ValidatedDiagram } from './types';
import { EDGE_MARKER_IDS } from '../constants';
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
 * Ensure unique IDs
 */
function deduplicateIds(nodes: LayoutedNode[]): LayoutedNode[] {
  const seenIds = new Map<string, number>();
  
  return nodes.map(node => {
    const id = node.id;
    const count = seenIds.get(id) || 0;
    seenIds.set(id, count + 1);

    if (count > 0) {
      const newId = `${id}-${count + 1}`;
      console.log(`[Convert] Renamed duplicate ID "${id}" to "${newId}"`);
      return { ...node, id: newId };
    }

    return node;
  });
}

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

  // STEP 1: Fix duplicate IDs (rename, don't delete)
  const processedNodes = deduplicateIds(layouted);

  // STEP 2: Sort nodes for correct rendering order
  const sortedNodes = sortNodesForRendering(processedNodes);

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

  // STEP 4: Build ID mapping in case any nodes were renamed
  const idMapping = new Map<string, string>();
  for (const node of layouted) {
    const processed = processedNodes.find(p => p.id === node.id);
    if (processed && processed.id !== node.id) {
      idMapping.set(node.id, processed.id);
    }
  }

  // STEP 5: Map edges through ID mapping
  const mappedEdges = diagramEdges.map(edge => {
    const sourceId = idMapping.get(edge.source) || edge.source;
    const targetId = idMapping.get(edge.target) || edge.target;
    return { ...edge, source: sourceId, target: targetId };
  });

  // STEP 6: Filter out edges with invalid node references (but log them)
  const validNodeIds = new Set(processedNodes.map(n => n.id));
  const rfEdges: Edge[] = mappedEdges
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
      const markerId = EDGE_MARKER_IDS[connectionType] || EDGE_MARKER_IDS.sync;
      const edgeLabel = edge.label?.trim();

      return {
        id: edge.id || `rf-${idx}`,
        source: edge.source,
        target: edge.target,
        type: 'simpleFloating',
        animated: edge.async,
        style: { stroke: edgeStyle.color, strokeWidth: 2, strokeDasharray: strokeDash },
        markerEnd: `url(#${markerId})`,
        data: {
          connectionType,
          pathType: 'smooth',
          label: edgeLabel && edgeLabel.length > 0 ? edgeLabel : undefined,
        },
      };
    });

  console.log(`[Convert] Final output: ${rfNodes.length} nodes, ${rfEdges.length} edges (all nodes preserved)`);

  return { nodes: rfNodes, edges: rfEdges };
}
