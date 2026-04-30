import { Node, Edge } from 'reactflow';
import type { LayoutedNode, DiagramEdge, ValidatedDiagram } from './types';
import { EDGE_COLORS, EDGE_MARKER_IDS } from '../constants';

/**
 * STAGE 7 — REACT FLOW CONVERSION
 * 
 * STRICT RULES:
 * - NEVER remove nodes during conversion
 * - NEVER remove nodes because they match group names
 * - Preserve ALL nodes, ALL edges, ALL group relationships
 * - Groups render first, children follow
 * - Correct z-index layering
 * 
 * If there are naming conflicts, RENAME nodes - don't delete them
 */

/**
 * Ensure unique IDs and labels across all nodes
 * If a node's label matches a group name, rename the node (not the group)
 */
function deduplicateLabels(nodes: LayoutedNode[]): LayoutedNode[] {
  const groupNames = new Set<string>();
  
  // First pass: collect all group names
  for (const node of nodes) {
    if (node.isGroup) {
      const normalized = normalizeLabel(node.label || '');
      if (normalized) groupNames.add(normalized);
      const groupLabelNorm = normalizeLabel(node.groupLabel || '');
      if (groupLabelNorm) groupNames.add(groupLabelNorm);
    }
  }

  // Second pass: rename non-group nodes that conflict with group names
  const seenLabels = new Map<string, number>();
  
  return nodes.map(node => {
    if (node.isGroup) return node; // Never rename groups

    const label = node.label || '';
    const normalized = normalizeLabel(label);

    // If node label matches a group name, rename it
    if (normalized && groupNames.has(normalized)) {
      const newLabel = `${label} Component`;
      console.log(`[Convert] Renamed node "${label}" to "${newLabel}" to avoid group name collision`);
      return { ...node, label: newLabel };
    }

    // Handle duplicate labels among non-group nodes
    if (normalized) {
      const count = seenLabels.get(normalized) || 0;
      seenLabels.set(normalized, count + 1);
      
      if (count > 0) {
        const newLabel = `${label} (${count + 1})`;
        console.log(`[Convert] Renamed duplicate node "${label}" to "${newLabel}"`);
        return { ...node, label: newLabel };
      }
    }

    return node;
  });
}

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

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Sanitize parent relationships - fix broken references without removing nodes
 */
function sanitizeParentRelationships(
  nodes: LayoutedNode[]
): LayoutedNode[] {
  const groupIds = new Set(
    nodes.filter(n => n.isGroup).map(n => n.id)
  );

  return nodes.map(node => {
    if (!node.parentId) return node;

    // If parent doesn't exist, try to find or create appropriate group
    if (!groupIds.has(node.parentId)) {
      console.warn(`[Convert] Node ${node.id} has non-existent parentId ${node.parentId}`);
      
      // Try to find group by layer
      if (node.layer) {
        const expectedGroupId = `${node.layer}-group`;
        if (groupIds.has(expectedGroupId)) {
          console.log(`[Convert] Fixed parentId: ${node.parentId} → ${expectedGroupId}`);
          return { ...node, parentId: expectedGroupId };
        }
      }

      // If all else fails, keep the node but remove parentId
      // (Better to have a root node than to delete it)
      console.log(`[Convert] Could not fix parentId for ${node.id}, making it a root node`);
      return { ...node, parentId: undefined };
    }

    return node;
  });
}

/**
 * Sort nodes: groups first → root nodes second → children last
 * This ensures correct rendering order in React Flow
 */
function sortNodesForRendering(nodes: LayoutedNode[], groupIds: Set<string>): LayoutedNode[] {
  return [...nodes].sort((a, b) => {
    // Groups first
    if (a.isGroup && !b.isGroup) return -1;
    if (!a.isGroup && b.isGroup) return 1;

    // Among non-groups, parented nodes come after their parents
    if (a.parentId && !b.parentId) return 1;
    if (!a.parentId && b.parentId) return -1;

    // Maintain layer order for visual hierarchy
    const layerOrder = ['presentation', 'gateway', 'application', 'async', 'data', 'observability', 'external'];
    const aLayerIdx = layerOrder.indexOf(a.layer || '');
    const bLayerIdx = layerOrder.indexOf(b.layer || '');
    if (aLayerIdx !== bLayerIdx) return aLayerIdx - bLayerIdx;

    return 0;
  });
}

export function convertToReactFlow(
  layouted: LayoutedNode[],
  validated: ValidatedDiagram
): { nodes: Node[]; edges: Edge[] } {
  const { edges: diagramEdges } = validated;

  console.log(`[Convert] Starting conversion: ${layouted.length} nodes, ${diagramEdges.length} edges`);

  // STEP 1: Fix duplicate IDs (rename, don't delete)
  let processedNodes = deduplicateIds(layouted);

  // STEP 2: Fix label collisions with groups (rename, don't delete)
  processedNodes = deduplicateLabels(processedNodes);

  // STEP 3: Sanitize parent relationships
  processedNodes = sanitizeParentRelationships(processedNodes);

  // STEP 4: Get valid group IDs after processing
  const groupIds = new Set(processedNodes.filter(n => n.isGroup).map(n => n.id));

  // STEP 5: Sort nodes for correct rendering order
  const sortedNodes = sortNodesForRendering(processedNodes, groupIds);

  console.log(`[Convert] Final node count after processing: ${sortedNodes.length} (preserved all nodes)`);

  // STEP 6: Convert to React Flow nodes
  const rfNodes: Node[] = sortedNodes.map(node => {
    const isGroup = node.isGroup;
    const hasVerifiedParent = Boolean(node.parentId) && groupIds.has(node.parentId!);

    const result: Node = {
      id: node.id,
      type: isGroup ? 'groupNode' : 'architectureNode',
      position: { x: node.x, y: node.y },
      parentNode: node.parentId || undefined,
      data: {
        label: node.label,
        subtitle: node.subtitle || '',
        layer: node.layer,
        icon: node.icon || 'box',
        serviceType: node.serviceType || '',
        isGroup: node.isGroup || false,
        groupLabel: node.groupLabel || '',
        groupColor: node.groupColor || '',
      },
      width: node.width,
      height: node.height,
      zIndex: isGroup ? 1 : 1000, // Groups render below children
      extent: hasVerifiedParent ? 'parent' : undefined,
      style: isGroup ? { width: node.width, height: node.height } : undefined,
    };
    return result;
  });

  // STEP 7: Build ID mapping in case any nodes were renamed
  const idMapping = new Map<string, string>();
  for (const node of layouted) {
    const processed = processedNodes.find(p => p.id === node.id);
    if (processed && processed.id !== node.id) {
      idMapping.set(node.id, processed.id);
    }
  }

  // STEP 8: Map edges through ID mapping
  const mappedEdges = diagramEdges.map(edge => {
    const sourceId = idMapping.get(edge.source) || edge.source;
    const targetId = idMapping.get(edge.target) || edge.target;
    return { ...edge, source: sourceId, target: targetId };
  });

  // STEP 9: Filter out edges with invalid node references (but log them)
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
      const style = '#94a3b8';
      const strokeDash = connectionType === 'async' ? '8 6' : '';
      const markerId = EDGE_MARKER_IDS[connectionType] || EDGE_MARKER_IDS.sync;
      const edgeLabel = edge.label?.trim();

      return {
        id: edge.id || `rf-${idx}`,
        source: edge.source,
        target: edge.target,
        type: 'simpleFloating',
        animated: edge.async,
        style: { stroke: style, strokeWidth: 2, strokeDasharray: strokeDash },
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
